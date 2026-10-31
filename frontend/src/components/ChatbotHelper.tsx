import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Key, Settings, Sparkles, Check, Bot, User, RefreshCw, Eye, EyeOff, ShieldCheck, Activity, Cpu, Server } from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const quickPrompts = [
  "Recommend EC2 for PostgreSQL DB",
  "Compare Graviton3 vs x86_64",
  "Show Cheapest AWS Instances",
  "How to set up ALB Architecture"
];

// Clean Structured Message Formatter Component
const FormattedChatMessage: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <div className="font-sans text-xs leading-relaxed">{content}</div>;
  }

  // Parse markdown bolding (**bold**), backticks (`code`), and list items
  const parseInlineElements = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-white font-bold tracking-wide">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[11px] border border-cyan-500/40 inline-block mx-0.5 shadow-sm">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Header titles e.g., "📌 Overview:" or "⚡ Options:"
        if (trimmed.startsWith('#') || (trimmed.endsWith(':') && trimmed.length < 50)) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={idx} className="font-bold text-cyan-300 tracking-wide text-xs pt-1.5 border-b border-cyan-500/20 pb-1 flex items-center gap-1.5">
              <span>{parseInlineElements(headerText)}</span>
            </div>
          );
        }

        // Bullet point lines starting with • or - or *
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <div className="flex-1 text-slate-200">{parseInlineElements(bulletContent)}</div>
            </div>
          );
        }

        // Numbered list items e.g., "1. Option A"
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                <span className="px-1.5 py-0.2 rounded-md bg-purple-950 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/40 shrink-0 mt-0.5 shadow-sm">
                  {numMatch[1]}
                </span>
                <div className="flex-1 text-slate-200">{parseInlineElements(numMatch[2])}</div>
              </div>
            );
          }
        }

        // Standard paragraph text
        return (
          <p key={idx} className="my-1 text-slate-200">
            {parseInlineElements(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const ChatbotHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [apiProvider, setApiProvider] = useState<string>('gemini');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Chat History
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: '🌌 Welcome to the **Virtual Cloud Lab Assistant**!\n\nPowered by **Google Gemini AI**, I provide real-time cloud telemetry, AWS EC2 capacity planning, RDS recommendations, and architectural insights.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('cloudlab_ai_api_key');
    const savedProvider = localStorage.getItem('cloudlab_ai_provider');
    if (savedKey) setApiKey(savedKey);
    if (savedProvider) setApiProvider(savedProvider);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cloudlab_ai_api_key', apiKey.trim());
    localStorage.setItem('cloudlab_ai_provider', apiProvider);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('cloudlab_ai_api_key');
    localStorage.removeItem('cloudlab_ai_provider');
    setApiKey('');
    setSaveSuccess(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: query,
        api_key: apiKey,
        provider: apiProvider
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.data.reply || 'Here is your cloud recommendation.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot request failed", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ Telemetry link interrupted. Please verify backend service connectivity or API configuration.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button - Deep Navy & Cyan/Violet Instrumentation Theme */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/90 text-white rounded-2xl border border-cyan-500/40 glow-violet shadow-2xl backdrop-blur-md hover:border-cyan-400 group transition-all"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.6)]">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            {/* Pulsing Green System LED */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse glow-emerald"></span>
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold tracking-wide text-cyan-300 group-hover:text-cyan-200">
              Cloud Lab Assistant
            </span>
            <span className="block text-[10px] text-cyan-400 font-mono">
              ✨ Gemini AI • Live
            </span>
          </div>
        </motion.button>
      )}

      {/* Slide-out Chat Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-32px)] h-[600px] max-h-[88vh] glass-card border border-cyan-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.15)] rounded-2xl flex flex-col overflow-hidden bg-navy-lab"
          >
            {/* Instrumentation Header */}
            <div className="p-4 bg-slate-900/90 border-b border-cyan-500/25 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-cyan-400/20">
                    <Bot className="w-5 h-5 text-cyan-100" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                      <span>Virtual Cloud Lab Assistant</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {apiProvider === 'gemini' ? (
                        <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          System Nominal • Google Gemini Cloud AI
                        </span>
                      ) : apiKey ? (
                        <span className="text-[10px] text-green-400 font-medium flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-green-400" /> Custom Key ({apiProvider.toUpperCase()})
                        </span>
                      ) : (
                        <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                          <Sparkles className="w-3 h-3 text-cyan-400" /> Telemetry Standard
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                    className={`p-2 rounded-lg transition-colors border ${
                      activeTab === 'settings' 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : 'text-slate-400 hover:text-cyan-300 border-transparent hover:bg-slate-800/60'
                    }`}
                    title="Telemetry & Provider Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white border border-transparent hover:bg-slate-800/60 rounded-lg transition-colors"
                    title="Close Lab Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instrumentation Telemetry Status Gauge Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>Telemetry: Active</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>Engine: Gemini 2.5 Flash</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Server className="w-3 h-3 text-emerald-400" />
                  <span>Cloud API: Active</span>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'settings' ? (
              /* Settings & API Provider Control View */
              <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-950/60">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Key className="w-5 h-5 shrink-0 text-cyan-400" />
                  <div className="text-xs">
                    <div className="font-semibold text-white">AI Instrumentation & Model Provider</div>
                    <p className="text-slate-300 mt-0.5">Switch between Google Gemini Cloud AI inference and external API tokens.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveApiKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 font-mono">
                      Select Inference Engine
                    </label>
                    <select
                      value={apiProvider}
                      onChange={(e) => setApiProvider(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                    >
                      <option value="gemini">✨ Google Gemini Cloud AI (Gemini 2.5 Flash)</option>
                      <option value="openai">OpenAI (GPT-4o / GPT-3.5)</option>
                      <option value="anthropic">Anthropic Claude</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1.5 font-mono">
                      Custom API Token (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API key here..."
                        className="w-full bg-slate-900 border border-purple-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Configuration saved securely to local storage.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all glow-cyan"
                    >
                      Save Configuration
                    </button>
                    {apiKey && (
                      <button
                        type="button"
                        onClick={handleClearApiKey}
                        className="px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium transition-colors"
                      >
                        Clear Key
                      </button>
                    )}
                  </div>
                </form>

                <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="font-semibold text-cyan-300">🔒 System Telemetry Note:</div>
                  <p>Local inference stays strictly within your workstation loop on `localhost:11434`.</p>
                </div>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  Return to Chat Assistant
                </button>
              </div>
            ) : (
              /* Main Laboratory Chat View */
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950/60">
                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md border border-cyan-400/30">
                          <Bot className="w-4 h-4 text-cyan-100" />
                        </div>
                      )}
                      <div
                        className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-md border border-cyan-400/30'
                            : 'bg-slate-900/90 text-slate-200 border border-purple-500/25 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        {/* Render Clean Formatted Message */}
                        <FormattedChatMessage content={msg.text} isUser={msg.sender === 'user'} />

                        <span
                          className={`text-[9px] block mt-1.5 font-mono ${
                            msg.sender === 'user' ? 'text-cyan-200 text-right' : 'text-purple-400/80'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shrink-0 mt-0.5 border border-cyan-400/30 shadow-md">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3 items-center text-xs text-cyan-400 py-2 font-mono">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <span>✨ Gemini AI inferencing telemetry stream...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Telemetry Prompts Bar */}
                <div className="px-3 py-2 bg-slate-900/90 border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-cyan-950/60 text-[11px] text-cyan-300 hover:text-cyan-100 border border-cyan-500/30 hover:border-cyan-400 transition-all whitespace-nowrap font-mono shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="p-3.5 bg-slate-900 border-t border-cyan-500/25">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Query cloud telemetry specs, AWS instances, or architecture..."
                      className="flex-1 bg-slate-950/90 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 placeholder:text-slate-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || loading}
                      className="p-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md glow-cyan"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotHelper;
