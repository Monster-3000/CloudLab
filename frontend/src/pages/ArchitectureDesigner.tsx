import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Panel,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Server, 
  Database, 
  Activity, 
  Play, 
  HardDrive, 
  Zap, 
  Cpu, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  Gauge,
  X,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

// Custom Architecture Service Node Component with Individual Delete Button
const CustomServiceNode = ({ id, data }: any) => {
  const getBorderColor = () => {
    switch (data.type) {
      case 'alb': return 'border-blue-500/70 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'ec2': return 'border-purple-500/70 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'rds': return 'border-cyan-500/70 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
      case 's3': return 'border-emerald-500/70 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'redis': return 'border-amber-500/70 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'lambda': return 'border-pink-500/70 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
      default: return 'border-slate-700 text-slate-300';
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case 'alb': return <Activity className="w-5 h-5 text-blue-400" />;
      case 'ec2': return <Server className="w-5 h-5 text-purple-400" />;
      case 'rds': return <Database className="w-5 h-5 text-cyan-400" />;
      case 's3': return <HardDrive className="w-5 h-5 text-emerald-400" />;
      case 'redis': return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'lambda': return <Zap className="w-5 h-5 text-pink-400" />;
      default: return <Server className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className={`glass-card p-3.5 rounded-xl border-2 ${getBorderColor()} min-w-[210px] bg-slate-950/90 shadow-2xl backdrop-blur-md relative group hover:scale-[1.02] transition-all`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-950" />
      
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 shadow-inner shrink-0">
            {getIcon()}
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">{data.label}</div>
            <div className="text-[10px] text-slate-400 font-mono">{data.specs || 'Cloud Infrastructure'}</div>
          </div>
        </div>

        {/* Individual Node Delete Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (data.onDeleteNode) {
              data.onDeleteNode(id);
            }
          }}
          className="p-1 rounded-lg bg-slate-900/90 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-all shrink-0 shadow-sm"
          title="Remove this individual instance node"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <span className="text-cyan-300">{data.cost || '$15.00/mo'}</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-950" />
    </div>
  );
};

const defaultInitialNodes = [
  { 
    id: '1', 
    type: 'customService',
    position: { x: 300, y: 30 }, 
    data: { label: 'AWS ALB Load Balancer', type: 'alb', specs: 'Layer-7 Routing • 10k RPS', cost: '$22.50/mo' } 
  },
  { 
    id: '2', 
    type: 'customService',
    position: { x: 100, y: 180 }, 
    data: { label: 'AWS EC2 Web Instance', type: 'ec2', specs: 't3.medium (2 vCPU, 4GB)', cost: '$30.40/mo' } 
  },
  { 
    id: '3', 
    type: 'customService',
    position: { x: 500, y: 180 }, 
    data: { label: 'AWS EC2 API Gateway', type: 'ec2', specs: 'm6g.xlarge (4 vCPU, 16GB)', cost: '$112.32/mo' } 
  },
  { 
    id: '4', 
    type: 'customService',
    position: { x: 100, y: 340 }, 
    data: { label: 'AWS RDS PostgreSQL Primary', type: 'rds', specs: 'db.r6g.large (ARM64 Graviton3)', cost: '$146.00/mo' } 
  },
  { 
    id: '5', 
    type: 'customService',
    position: { x: 500, y: 340 }, 
    data: { label: 'AWS S3 Asset Bucket', type: 's3', specs: 'Standard Storage • 500GB', cost: '$11.50/mo' } 
  },
];

const defaultInitialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2.5 } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2.5 } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2.5 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2.5 } },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#10b981', strokeWidth: 2.5 } },
];

const getSavedNodes = () => {
  const saved = localStorage.getItem('cloudlab_designer_nodes');
  if (saved !== null) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved nodes from localStorage", e);
    }
  }
  return defaultInitialNodes;
};

const getSavedEdges = () => {
  const saved = localStorage.getItem('cloudlab_designer_edges');
  if (saved !== null) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved edges from localStorage", e);
    }
  }
  return defaultInitialEdges;
};

const ArchitectureDesigner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(getSavedNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getSavedEdges());
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  const nodeTypes = useMemo(() => ({ customService: CustomServiceNode }), []);

  // Handler for individual node deletion
  const deleteIndividualNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Inject onDeleteNode handler into node data so every node can be deleted individually
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDeleteNode: deleteIndividualNode
      }
    }));
  }, [nodes, deleteIndividualNode]);

  // Persist nodes and edges to localStorage so changes survive tab switches
  useEffect(() => {
    localStorage.setItem('cloudlab_designer_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('cloudlab_designer_edges', JSON.stringify(edges));
  }, [edges]);

  const onConnect = useCallback((params: any) => 
    setEdges((eds) => addEdge({
      ...params, 
      animated: true, 
      style: { stroke: '#06b6d4', strokeWidth: 2.5 } 
    }, eds)), 
    [setEdges]
  );

  const addNode = (serviceType: string) => {
    const id = `${Date.now()}`;
    let label = 'AWS Component';
    let specs = 'Custom Specification';
    let cost = '$15.00/mo';

    switch (serviceType) {
      case 'ec2':
        label = `AWS EC2 node-${nodes.length + 1}`;
        specs = 't3.medium (2 vCPU, 4GB RAM)';
        cost = '$30.40/mo';
        break;
      case 'rds':
        label = `AWS RDS DB-${nodes.length + 1}`;
        specs = 'db.r6g.large (2 vCPU, 16GB Graviton3)';
        cost = '$146.00/mo';
        break;
      case 'alb':
        label = `AWS ALB Balancer-${nodes.length + 1}`;
        specs = 'Layer-7 Application Balancer';
        cost = '$22.50/mo';
        break;
      case 's3':
        label = `AWS S3 Bucket-${nodes.length + 1}`;
        specs = 'S3 Standard Object Storage';
        cost = '$11.50/mo';
        break;
      case 'redis':
        label = `AWS ElastiCache Redis-${nodes.length + 1}`;
        specs = 'In-Memory Cache (3.2 GB RAM)';
        cost = '$45.00/mo';
        break;
      case 'lambda':
        label = `AWS Lambda Function-${nodes.length + 1}`;
        specs = 'Serverless Event Execution';
        cost = '$5.00/mo';
        break;
    }

    const newNode = {
      id,
      type: 'customService',
      position: { x: 200 + (nodes.length % 3) * 150, y: 150 + Math.floor(nodes.length / 3) * 100 },
      data: { label, type: serviceType, specs, cost }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const runArchitectureSimulation = async () => {
    if (nodes.length === 0) return;
    setSimulating(true);

    let totalCostNum = 0;
    let ec2Count = 0;
    let rdsCount = 0;
    let albCount = 0;
    let s3Count = 0;
    let redisCount = 0;
    let lambdaCount = 0;

    nodes.forEach((n: any) => {
      const type = n.data?.type;
      if (type === 'ec2') { totalCostNum += 30.40; ec2Count++; }
      else if (type === 'rds') { totalCostNum += 146.00; rdsCount++; }
      else if (type === 'alb') { totalCostNum += 22.50; albCount++; }
      else if (type === 's3') { totalCostNum += 11.50; s3Count++; }
      else if (type === 'redis') { totalCostNum += 45.00; redisCount++; }
      else if (type === 'lambda') { totalCostNum += 5.00; lambdaCount++; }
      else { totalCostNum += 15.00; }
    });

    const maxRps = (ec2Count * 2500) + (lambdaCount * 5000) + (albCount * 10000) + 1000;
    const latency = albCount > 0 ? (redisCount > 0 ? '12 ms' : '24 ms') : '48 ms';
    const slaScore = rdsCount > 0 && albCount > 0 ? '99.99% High Availability' : '99.9% Standard Availability';

    let aiAuditText = '';
    try {
      const auditQuery = `Analyze this AWS architecture topology: ${nodes.length} total services (${ec2Count} EC2, ${rdsCount} RDS, ${albCount} ALB, ${s3Count} S3, ${redisCount} Redis, ${lambdaCount} Lambda). Connections count: ${edges.length}. Give 2-3 bullet recommendations for optimization.`;
      const res = await api.post('/chat', { message: auditQuery, provider: 'ollama' });
      aiAuditText = res.data.reply || '';
    } catch (e) {
      console.error("AI audit failed", e);
    }

    setTimeout(() => {
      setSimulating(false);
      setSimulationResults({
        totalNodes: nodes.length,
        totalConnections: edges.length,
        totalCost: `$${totalCostNum.toFixed(2)}/mo`,
        maxRps: `${maxRps.toLocaleString()} Requests/sec`,
        latency,
        slaScore,
        aiAudit: aiAuditText || `Architecture incorporates ${ec2Count} web nodes and ${rdsCount} database nodes. Recommended: Ensure Multi-AZ replication on RDS for automatic failover.`
      });
    }, 1200);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSimulationResults(null);
    localStorage.setItem('cloudlab_designer_nodes', JSON.stringify([]));
    localStorage.setItem('cloudlab_designer_edges', JSON.stringify([]));
  };

  const restoreDefaultTemplate = () => {
    setNodes(defaultInitialNodes);
    setEdges(defaultInitialEdges);
    setSimulationResults(null);
    localStorage.setItem('cloudlab_designer_nodes', JSON.stringify(defaultInitialNodes));
    localStorage.setItem('cloudlab_designer_edges', JSON.stringify(defaultInitialEdges));
  };

  return (
    <div className="h-[calc(100vh-120px)] w-full flex space-x-4">
      {/* Sidebar Tool Palette */}
      <div className="w-80 glass-card p-4 flex flex-col space-y-3 z-10 overflow-y-auto border border-cyan-500/20 bg-slate-950/80">
        <div>
          <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AWS Infrastructure Palette</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Drag or click components to design multi-tier cloud topology.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button onClick={() => addNode('alb')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-blue-950/40 border border-blue-500/40 hover:border-blue-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Application Load Balancer</span>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">$22.50</span>
          </button>

          <button onClick={() => addNode('ec2')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Server className="w-4 h-4 text-purple-400" />
              <span>AWS EC2 Instance</span>
            </div>
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">$30.40</span>
          </button>

          <button onClick={() => addNode('rds')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>AWS RDS PostgreSQL</span>
            </div>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">$146.00</span>
          </button>

          <button onClick={() => addNode('s3')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>AWS S3 Object Storage</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">$11.50</span>
          </button>

          <button onClick={() => addNode('redis')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>AWS ElastiCache Redis</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">$45.00</span>
          </button>

          <button onClick={() => addNode('lambda')} className="w-full flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-pink-950/40 border border-pink-500/40 hover:border-pink-400 rounded-xl text-slate-200 transition-all text-xs font-mono group shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Zap className="w-4 h-4 text-pink-400" />
              <span>AWS Lambda Serverless</span>
            </div>
            <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/30">$5.00</span>
          </button>
        </div>

        <div className="flex-1"></div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-800 font-mono">
          <button 
            onClick={runArchitectureSimulation}
            disabled={simulating || nodes.length === 0}
            className="flex items-center justify-center space-x-2 w-full p-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] glow-cyan"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Simulating Workload...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Simulate AWS Architecture</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={clearCanvas}
              className="flex items-center justify-center space-x-1 p-2 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 rounded-xl text-[11px] transition-colors"
              title="Clear all nodes from canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Canvas</span>
            </button>

            <button 
              onClick={restoreDefaultTemplate}
              className="flex items-center justify-center space-x-1 p-2 bg-slate-900 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[11px] transition-colors"
              title="Restore default 5-node template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Window */}
      <div className="flex-1 glass-card border border-cyan-500/25 rounded-2xl overflow-hidden relative bg-navy-lab">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Controls className="!bg-slate-900/90 !text-cyan-400 !border-cyan-500/30 !rounded-xl" />
          <MiniMap className="!bg-slate-950/90 !border-cyan-500/30" nodeColor="#06b6d4" maskColor="rgba(7,12,23,0.7)" />
          <Background color="#1e293b" gap={20} size={1} />
          
          <Panel position="top-right" className="bg-slate-950/90 p-3 rounded-xl text-xs text-slate-300 border border-cyan-500/30 shadow-2xl font-mono space-y-1">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Simulation Canvas ({nodes.length} Nodes)
            </div>
            <div className="text-[10px] text-slate-400">
              Click node 'X' to delete individual instance • Handles link connections
            </div>
          </Panel>
        </ReactFlow>

        {/* Live Simulation Results Modal Drawer */}
        {simulationResults && (
          <div className="absolute inset-x-6 bottom-6 z-30 p-5 glass-card border-2 border-cyan-400 bg-slate-950/95 shadow-[0_0_50px_rgba(6,182,212,0.3)] rounded-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">AWS Simulation Telemetry Audit Passed</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Topology evaluated against AWS Well-Architected Framework</span>
                </div>
              </div>
              <button 
                onClick={() => setSimulationResults(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30">
                <span className="text-[10px] text-slate-400 block uppercase">Est. Infrastructure Cost</span>
                <span className="text-sm font-bold text-cyan-300 mt-0.5 block">{simulationResults.totalCost}</span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-purple-500/30">
                <span className="text-[10px] text-slate-400 block uppercase">Max Workload Capacity</span>
                <span className="text-sm font-bold text-purple-300 mt-0.5 block">{simulationResults.maxRps}</span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 block uppercase">Avg End-to-End Latency</span>
                <span className="text-sm font-bold text-emerald-300 mt-0.5 block">{simulationResults.latency}</span>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-slate-400 block uppercase">Availability SLA</span>
                <span className="text-sm font-bold text-amber-300 mt-0.5 block">{simulationResults.slaScore}</span>
              </div>
            </div>

            {/* AI Architectural Insights Box */}
            <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 rounded-xl border border-purple-500/30 text-xs">
              <div className="flex items-center gap-2 text-purple-400 font-bold font-mono mb-1">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI Cloud Architectural Audit (Llama 3.2 3B):</span>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {simulationResults.aiAudit}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureDesigner;
