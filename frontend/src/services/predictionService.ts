// Auto-Scaling Prediction Service
// Time-anchored deterministic workload forecasting with Indian Standard Time (IST) diurnal cycle:
// Daytime base ~3,250 req/min, dropping to a baseline during nighttime (IST).

export interface CloudMetrics {
  currentTraffic: number; // req/min
  cpuUtilization: number; // %
  activeInstances: number;
  responseTime: number; // ms
  timestamp: string;
}

export interface TrafficDataPoint {
  time: string; // e.g. "15:05"
  fullTime: string; // e.g. "15:05:00"
  epochMinute: number;
  minuteOffset: number; // e.g. -15 to +30
  actualTraffic?: number;
  predictedTraffic?: number;
  pastPredictedTraffic?: number; // What was predicted for this past minute
  accuracyPct?: number; // Match accuracy between predicted and actual
  cpuProjected?: number;
  isPrediction: boolean;
  tooltipLabel: string;
}

export interface InstancePredictionPoint {
  time: string;
  minuteOffset: number;
  currentInstances: number;
  requiredInstances: number;
  trafficForMinute: number;
  isPrediction: boolean;
}

export interface ScalingRecommendation {
  type: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMAL';
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeLabel: string;
  currentInstances: number;
  targetInstances: number;
  instanceDelta: number;
  predictedPeakTraffic: number;
  peakMinuteTime: string;
  predictedCpu: number;
  reason: string;
  actionSummary: string;
}

export interface PredictionConfig {
  horizonMinutes: 15 | 30 | 60;
  cpuThreshold: number; // e.g. 80 (%)
  minInstances: number; // e.g. 2
  maxInstances: number; // e.g. 10
  strategy: 'AUTOMATIC' | 'SCALE_UP' | 'SCALE_DOWN';
}

export interface ScalingHistoryEntry {
  id: string;
  time: string;
  traffic: string;
  cpu: string;
  previousInstances: number;
  newInstances: number;
  action: 'Scale Up' | 'Scale Down' | 'Evaluated - Optimal';
  status: 'Completed' | 'In Progress';
}

// Single instance capacity rating
export const INSTANCE_TRAFFIC_CAPACITY = 814;

export const getDefaultPredictionConfig = (): PredictionConfig => ({
  horizonMinutes: 30,
  cpuThreshold: 80,
  minInstances: 1,
  maxInstances: 10,
  strategy: 'AUTOMATIC'
});

export const getInitialScalingHistory = (): ScalingHistoryEntry[] => [
  {
    id: 'scale-log-1',
    time: '14:20',
    traffic: '2,450 req/min',
    cpu: '62%',
    previousInstances: 2,
    newInstances: 3,
    action: 'Scale Up',
    status: 'Completed'
  },
  {
    id: 'scale-log-2',
    time: '14:35',
    traffic: '3,120 req/min',
    cpu: '71%',
    previousInstances: 3,
    newInstances: 4,
    action: 'Scale Up',
    status: 'Completed'
  },
  {
    id: 'scale-log-3',
    time: '14:45',
    traffic: '2,180 req/min',
    cpu: '50%',
    previousInstances: 4,
    newInstances: 3,
    action: 'Scale Down',
    status: 'Completed'
  }
];

/**
 * Deterministic pseudo-random noise seeded by the epoch minute.
 * Returns 0 if base traffic is 0.
 */
function getMinuteNoise(epochMinute: number, baseTraffic: number): number {
  if (baseTraffic <= 0) return 0;
  const seed = (epochMinute * 9301 + 49297) % 233280;
  const rnd = seed / 233280; // 0 to 1
  return Math.round((rnd - 0.5) * 28); // -14 to +14 req/min jitter
}

/**
 * Workload function using Indian Standard Time (IST, UTC+5:30):
 * - Night time (23:30 to 05:00 IST): Drops to a low baseline.
 * - Early morning (05:00 to 09:30 IST): Wakes up smoothly from baseline to 3,250 req/min.
 * - Daytime peak (09:30 to 18:30 IST): Active baseline around ~3,250 req/min (peaking at ~3,800+ req/min in afternoon).
 * - Evening wind-down (18:30 to 23:30 IST): Smoothly drops from ~3,250 down to baseline.
 */
export function getDeterministicTrafficForEpochMinute(
  epochMinute: number,
  strategy: 'AUTOMATIC' | 'SCALE_UP' | 'SCALE_DOWN' = 'AUTOMATIC'
): number {
  // Convert epoch minute to IST (UTC + 5 hours 30 minutes = 330 minutes offset)
  const utcMillis = epochMinute * 60000;
  const istDate = new Date(utcMillis + (5.5 * 3600 * 1000));
  const istHour = istDate.getUTCHours();
  const istMinute = istDate.getUTCMinutes();
  const istDecimalHour = istHour + istMinute / 60; // 0.0 to 24.0 in IST
  const istMinuteOfDay = istHour * 60 + istMinute;

  let activityFactor = 0;
  const NIGHT_BASELINE = 0.15; // 15% of base traffic (~487 req/min)

  if (istDecimalHour >= 5.0 && istDecimalHour < 9.5) {
    // Morning ramp-up: 05:00 AM (NIGHT_BASELINE) -> 09:30 AM (1.0)
    const progress = (istDecimalHour - 5.0) / 4.5;
    const curve = 0.5 * (1 - Math.cos(progress * Math.PI));
    activityFactor = NIGHT_BASELINE + curve * (1.0 - NIGHT_BASELINE);
  } else if (istDecimalHour >= 9.5 && istDecimalHour < 18.5) {
    // Daytime core hours: base around 1.0 (~3,250 req/min), afternoon peak reaches ~1.16
    const afternoonPeak = Math.sin(((istDecimalHour - 9.5) / 9.0) * Math.PI) * 0.16;
    activityFactor = 1.0 + afternoonPeak;
  } else if (istDecimalHour >= 18.5 && istDecimalHour < 23.5) {
    // Evening decline: 18:30 (1.0) -> 23:30 (NIGHT_BASELINE)
    const progress = (istDecimalHour - 18.5) / 5.0;
    const curve = 0.5 * (1 + Math.cos(progress * Math.PI));
    activityFactor = NIGHT_BASELINE + curve * (1.0 - NIGHT_BASELINE);
  } else {
    // Nighttime in Indian Standard Time (23:30 to 05:00 IST): Low baseline!
    activityFactor = NIGHT_BASELINE;
  }

  if (activityFactor <= 0.001) {
    return 0;
  }

  // Micro cyclical variations during daytime active hours
  const wave40 = Math.sin((istMinuteOfDay / 40) * 2 * Math.PI) * 160;
  const wave15 = Math.cos((istMinuteOfDay / 15) * 2 * Math.PI) * 70;
  const cyclicModulation = (wave40 + wave15) * activityFactor;

  let traffic = (3250 * activityFactor) + cyclicModulation;

  if (strategy === 'SCALE_DOWN') {
    traffic *= 0.82;
  } else if (strategy === 'SCALE_UP') {
    traffic *= 1.16;
  }

  return Math.max(0, Math.round(traffic));
}

/**
 * Generates continuous minute-by-minute traffic data where:
 * 1. Future predictions follow the deterministic IST day/night curve.
 * 2. When time reaches that minute, actual measured traffic matches the prediction.
 * 3. At night (IST), traffic drops to a low baseline.
 */
export const generateMinuteByMinuteForecast = (
  config: PredictionConfig,
  currentInstances: number,
  now: Date = new Date()
): {
  trafficPoints: TrafficDataPoint[];
  instancePoints: InstancePredictionPoint[];
  currentMetrics: CloudMetrics;
  recommendation: ScalingRecommendation;
  confidenceScore: number;
} => {
  const pastMinutesCount = 15;
  const futureMinutesCount = config.horizonMinutes;

  const currentEpochMinute = Math.floor(now.getTime() / 60000);

  // Current actual traffic
  const currentBaseTraffic = getDeterministicTrafficForEpochMinute(currentEpochMinute, config.strategy);
  const currentNoise = getMinuteNoise(currentEpochMinute, currentBaseTraffic);
  const currentTraffic = Math.max(0, currentBaseTraffic + currentNoise);

  // CPU and Response time (0 CPU and minimal idle latency at 0 traffic)
  const currentCpu = currentTraffic === 0 
    ? 0 
    : Math.min(98, Math.max(4, Math.round((currentTraffic / (currentInstances * INSTANCE_TRAFFIC_CAPACITY)) * 100)));

  const currentResponseTime = currentTraffic === 0
    ? 24 // Minimal idle ping at night
    : Math.round(145 + (currentCpu > 75 ? (currentCpu - 75) * 3.6 : 0) + (Math.abs(currentNoise) * 0.4));

  const currentMetrics: CloudMetrics = {
    currentTraffic,
    cpuUtilization: currentCpu,
    activeInstances: currentInstances,
    responseTime: Math.max(20, currentResponseTime),
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  const trafficPoints: TrafficDataPoint[] = [];
  const instancePoints: InstancePredictionPoint[] = [];

  // 1. Generate Historical Minute-by-Minute Points (Minute -15 to Minute 0)
  for (let m = pastMinutesCount; m >= 0; m--) {
    const epochMin = currentEpochMinute - m;
    const pointDate = new Date(epochMin * 60000);
    const timeStr = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const baseForMin = getDeterministicTrafficForEpochMinute(epochMin, config.strategy);
    const noise = getMinuteNoise(epochMin, baseForMin);
    const actualVal = Math.max(0, baseForMin + noise);
    const pastPredVal = baseForMin;

    const accuracy = baseForMin === 0 
      ? (actualVal === 0 ? 100 : 95)
      : Math.round(100 - (Math.abs(actualVal - pastPredVal) / pastPredVal) * 100);
    const isCurrent = m === 0;

    trafficPoints.push({
      time: timeStr,
      fullTime: fullTimeStr,
      epochMinute: epochMin,
      minuteOffset: -m,
      actualTraffic: actualVal,
      predictedTraffic: isCurrent ? actualVal : undefined,
      pastPredictedTraffic: pastPredVal,
      accuracyPct: Math.min(100, Math.max(92, accuracy)),
      cpuProjected: actualVal === 0 ? 0 : Math.round((actualVal / (currentInstances * INSTANCE_TRAFFIC_CAPACITY)) * 100),
      isPrediction: false,
      tooltipLabel: isCurrent ? `${timeStr} (Current Minute)` : `${timeStr} (${m}m ago)`
    });

    const requiredForPastMin = actualVal === 0
      ? config.minInstances
      : Math.min(config.maxInstances, Math.max(config.minInstances, Math.ceil(actualVal / INSTANCE_TRAFFIC_CAPACITY)));

    instancePoints.push({
      time: timeStr,
      minuteOffset: -m,
      currentInstances,
      requiredInstances: requiredForPastMin,
      trafficForMinute: actualVal,
      isPrediction: false
    });
  }

  // 2. Generate Future Minute-by-Minute Predictions (Minute +1 to Minute +horizonMinutes)
  let peakPredicted = currentTraffic;
  let peakMinuteTime = '';

  for (let f = 1; f <= futureMinutesCount; f++) {
    const epochMin = currentEpochMinute + f;
    const futureDate = new Date(epochMin * 60000);
    const timeStr = futureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = futureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const predictedValue = getDeterministicTrafficForEpochMinute(epochMin, config.strategy);

    if (predictedValue > peakPredicted) {
      peakPredicted = predictedValue;
      peakMinuteTime = timeStr;
    }

    const cpuIfNoScale = predictedValue === 0 
      ? 0 
      : Math.min(100, Math.round((predictedValue / (currentInstances * INSTANCE_TRAFFIC_CAPACITY)) * 100));

    const rawReq = predictedValue === 0 
      ? config.minInstances 
      : Math.ceil((predictedValue / INSTANCE_TRAFFIC_CAPACITY) * (100 / config.cpuThreshold));
    const clampedReq = Math.min(config.maxInstances, Math.max(config.minInstances, rawReq));

    trafficPoints.push({
      time: timeStr,
      fullTime: fullTimeStr,
      epochMinute: epochMin,
      minuteOffset: f,
      actualTraffic: undefined,
      predictedTraffic: predictedValue,
      pastPredictedTraffic: predictedValue,
      cpuProjected: cpuIfNoScale,
      isPrediction: true,
      tooltipLabel: `${timeStr} (T+${f}m Predicted)`
    });

    instancePoints.push({
      time: timeStr,
      minuteOffset: f,
      currentInstances,
      requiredInstances: clampedReq,
      trafficForMinute: predictedValue,
      isPrediction: true
    });
  }

  // 3. Compute Recommendation
  const estimatedPeakCpu = peakPredicted === 0 
    ? 0 
    : Math.min(100, Math.round((peakPredicted / (currentInstances * INSTANCE_TRAFFIC_CAPACITY)) * 100));

  let rawTarget = peakPredicted === 0
    ? config.minInstances
    : Math.ceil((peakPredicted / INSTANCE_TRAFFIC_CAPACITY) * (100 / config.cpuThreshold));
  let targetInstances = Math.min(config.maxInstances, Math.max(config.minInstances, rawTarget));

  if (config.strategy === 'SCALE_UP' && targetInstances <= currentInstances) {
    targetInstances = Math.min(config.maxInstances, currentInstances + 1);
  } else if (config.strategy === 'SCALE_DOWN' && targetInstances >= currentInstances) {
    targetInstances = Math.max(config.minInstances, currentInstances - 1);
  }

  const delta = targetInstances - currentInstances;
  let recType: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMAL' = 'OPTIMAL';
  let badgeColor = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10';
  let badgeBorder = 'border-emerald-500/30';
  let badgeLabel = 'Capacity Optimal';
  let reason = `Traffic across all ${config.horizonMinutes} forecasted minutes remains safely within the ${config.cpuThreshold}% CPU threshold.`;
  let actionSummary = 'No scaling adjustments required';

  if (peakPredicted === 0 || peakPredicted < 500) {
    if (delta < 0) {
      recType = 'SCALE_DOWN';
      badgeColor = 'text-cyan-400';
      badgeBg = 'bg-cyan-500/10';
      badgeBorder = 'border-cyan-500/30';
      badgeLabel = 'Night Scale Down Recommended';
      reason = `Workload is at a low baseline during nighttime hours (Indian Standard Time). Scale down from ${currentInstances} to minimum ${targetInstances} instances to reduce cloud infrastructure costs.`;
      actionSummary = `Remove ${Math.abs(delta)} instances (Night baseline: ${targetInstances})`;
    } else {
      recType = 'OPTIMAL';
      badgeColor = 'text-cyan-400';
      badgeBg = 'bg-cyan-500/10';
      badgeBorder = 'border-cyan-500/30';
      badgeLabel = 'Nighttime Baseline (Low Traffic)';
      reason = `Nighttime workload is at a low baseline (IST). Minimum high-availability fleet (${currentInstances} instances) is maintained.`;
      actionSummary = 'Night minimum capacity optimal';
    }
  } else if (delta > 0) {
    recType = 'SCALE_UP';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10';
    badgeBorder = 'border-amber-500/30';
    badgeLabel = 'Scale Up Recommended';
    reason = `Minute-by-minute forecasting projects traffic reaching ${peakPredicted.toLocaleString()} req/min at ${peakMinuteTime || 'the peak horizon'}. CPU utilization is expected to approach ${estimatedPeakCpu}%, exceeding the configured ${config.cpuThreshold}% threshold.`;
    actionSummary = `Add ${delta} ${delta === 1 ? 'instance' : 'instances'} (Total: ${targetInstances})`;
  } else if (delta < 0) {
    recType = 'SCALE_DOWN';
    badgeColor = 'text-cyan-400';
    badgeBg = 'bg-cyan-500/10';
    badgeBorder = 'border-cyan-500/30';
    badgeLabel = 'Scale Down Recommended';
    reason = `Traffic settles at ${peakPredicted.toLocaleString()} req/min. Current cluster of ${currentInstances} instances provides excess unused capacity.`;
    actionSummary = `Remove ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'instance' : 'instances'} (Total: ${targetInstances})`;
  }

  const confidenceScore = config.horizonMinutes === 15 ? 97 : config.horizonMinutes === 30 ? 93 : 88;

  return {
    trafficPoints,
    instancePoints,
    currentMetrics,
    recommendation: {
      type: recType,
      badgeColor,
      badgeBg,
      badgeBorder,
      badgeLabel,
      currentInstances,
      targetInstances,
      instanceDelta: delta,
      predictedPeakTraffic: peakPredicted,
      peakMinuteTime: peakMinuteTime || 'T+20m',
      predictedCpu: estimatedPeakCpu,
      reason,
      actionSummary
    },
    confidenceScore
  };
};
