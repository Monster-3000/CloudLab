import React, { useState, useCallback } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Database, Activity, Play } from 'lucide-react';

const initialNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Load Balancer (AWS)' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' } },
  { id: '2', position: { x: 100, y: 150 }, data: { label: 'Web Server (t3.micro)' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '10px' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Web Server (t3.micro)' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '10px' } },
  { id: '4', position: { x: 250, y: 300 }, data: { label: 'Primary Database' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #06b6d4', borderRadius: '8px', padding: '10px' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#06b6d4' } },
];

const ArchitectureDesigner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({...params, animated: true, style: { stroke: '#fff' }}, eds)), [setEdges]);

  const addNode = (type) => {
      const id = `${nodes.length + 1}`;
      let label = 'New Node';
      let borderColor = '#fff';
      
      if(type === 'vm') { label = 'Virtual Machine'; borderColor = '#8b5cf6'; }
      if(type === 'db') { label = 'Database'; borderColor = '#06b6d4'; }
      if(type === 'lb') { label = 'Load Balancer'; borderColor = '#3b82f6'; }

      const newNode = {
          id,
          position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
          data: { label },
          style: { background: '#1e293b', color: '#fff', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '10px' }
      };
      setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="h-[calc(100vh-120px)] w-full flex space-x-4">
      {/* Sidebar Tool Palette */}
      <div className="w-64 glass-card p-4 flex flex-col space-y-4 z-10">
        <h3 className="text-white font-bold mb-2">Components</h3>
        
        <button onClick={() => addNode('vm')} className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 transition-colors shadow-sm">
            <Server className="w-5 h-5 text-purple-400" />
            <span>Virtual Machine</span>
        </button>
        <button onClick={() => addNode('db')} className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 transition-colors shadow-sm">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Database</span>
        </button>
        <button onClick={() => addNode('lb')} className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 transition-colors shadow-sm">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Load Balancer</span>
        </button>
        
        <div className="flex-1"></div>
        
        <button className="flex items-center justify-center space-x-2 w-full p-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium shadow-[0_0_10px_rgba(34,197,94,0.15)]">
            <Play className="w-4 h-4" />
            <span>Deploy Setup</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 glass-card border border-slate-700/50 rounded-xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          colorMode="dark"
        >
          <Controls className="bg-slate-800 text-white fill-white border-slate-600" />
          <MiniMap className="bg-slate-800" nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.2)" />
          <Background color="#334155" gap={16} />
          <Panel position="top-right" className="bg-slate-900/80 p-2 rounded text-xs text-slate-400 border border-slate-700 shadow-md">
              Drag nodes to move. Connect handles to create links.
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default ArchitectureDesigner;
