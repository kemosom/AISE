import React, { useState, useEffect } from 'react';
import {
  Network,
  Puzzle,
  Box,
  Plus,
  Send,
  FilePlus,
  ArrowRight,
  Maximize2,
  Trash2,
} from 'lucide-react';
import type { LabSnippet, LabBlockDefinition, LabVisualGraph } from '../../labs/types';

interface VisualDesignPanelProps {
  snippets: LabSnippet[];
  blocks?: LabBlockDefinition[];
  visualGraph: LabVisualGraph;
  onUpdateVisualGraph: (graph: LabVisualGraph) => void;
  onInsertCodeToEditor: (code: string) => void;
  onAddDesignToReport: (summary: string) => void;
}

export const VisualDesignPanel: React.FC<VisualDesignPanelProps> = ({
  snippets,
  blocks = [],
  visualGraph,
  onUpdateVisualGraph,
  onInsertCodeToEditor,
  onAddDesignToReport,
}) => {
  const [activeTab, setActiveTab] = useState<'palette' | 'flow' | 'blockly'>('flow');
  const [nodes, setNodes] = useState(visualGraph?.nodes || []);
  const [edges, setEdges] = useState(visualGraph?.edges || []);
  const [newNodeLabel, setNewNodeLabel] = useState('');

  // Synchronize when visualGraph loads asynchronously
  useEffect(() => {
    if (visualGraph) {
      setNodes(visualGraph.nodes || []);
      setEdges(visualGraph.edges || []);
    }
  }, [visualGraph]);

  // Blockly block selection state
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);

  const handleAddNode = () => {
    if (!newNodeLabel.trim()) return;
    const newId = `node-${Date.now()}`;
    const newNodes = [
      ...nodes,
      {
        id: newId,
        type: 'default',
        data: { label: newNodeLabel },
        position: { x: 50 + (nodes.length % 3) * 150, y: 50 + (nodes.length % 4) * 80 },
      },
    ];
    setNodes(newNodes);
    onUpdateVisualGraph({ nodes: newNodes, edges });
    setNewNodeLabel('');
  };

  const handleDeleteNode = (id: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== id);
    const updatedEdges = edges.filter((e) => e.source !== id && e.target !== id);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    onUpdateVisualGraph({ nodes: updatedNodes, edges: updatedEdges });
  };

  const handleSendBlockToEditor = (block: LabBlockDefinition) => {
    onInsertCodeToEditor(block.codeGenerator);
  };

  const handleAttachDesignToReport = () => {
    const summary = `Behavioral Pipeline Topology: ${nodes.length} nodes configured (${nodes.map((n) => n.data.label).join(' -> ')})`;
    onAddDesignToReport(summary);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Tab Switcher */}
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'flow'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-blue-900" />
            <span>React Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('blockly')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'blockly'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5 text-indigo-700" />
            <span>Blockly</span>
          </button>
          <button
            onClick={() => setActiveTab('palette')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'palette'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-emerald-700" />
            <span>Function Palette</span>
          </button>
        </div>

        {activeTab === 'flow' && (
          <button
            onClick={handleAttachDesignToReport}
            className="text-[11px] font-semibold text-blue-900 hover:underline cursor-pointer"
          >
            + Add to Report
          </button>
        )}
      </div>

      {/* CONTENT: REACT FLOW PIPELINE */}
      {activeTab === 'flow' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="e.g. B-Thread: safety_guard"
              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
            />
            <button
              onClick={handleAddNode}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>
          </div>

          {/* Interactive Topology Graph Canvas */}
          <div className="flex-1 border border-slate-200 rounded-md bg-slate-50/60 p-3 overflow-y-auto space-y-2 relative">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Active Behavioral Nodes ({nodes.length})
            </div>

            {nodes.map((node, idx) => (
              <div
                key={node.id}
                className="bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between shadow-2xs hover:border-slate-400 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center text-[10px] font-mono font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{node.data.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {node.id}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Delete Node"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {nodes.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No pipeline nodes added yet. Use the field above to add your first behavioral component.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT: BLOCKLY BLOCKS */}
      {activeTab === 'blockly' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-slate-500">
            Select a pedagogical block to view its generated Python specification and insert it
            directly into your active Monaco code tab.
          </div>

          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <div
                key={block.type}
                className={`p-3 border rounded-lg transition-all ${
                  selectedBlockIdx === idx
                    ? 'border-blue-900 bg-blue-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800">{block.type}</span>
                  <button
                    onClick={() => handleSendBlockToEditor(block)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send to Editor</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 mb-2">{block.tooltip}</p>

                <div className="bg-slate-950 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                  <pre>{block.codeGenerator}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT: FUNCTION PALETTE */}
      {activeTab === 'palette' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-slate-500">
            Modular software engineering components. Click <strong>Insert Snippet</strong> to add
            the verified function to your code file.
          </div>

          <div className="space-y-3">
            {snippets.map((snip) => (
              <div
                key={snip.id}
                className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">{snip.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {snip.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-2 leading-relaxed">{snip.description}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {snip.parameters ? `Params: ${snip.parameters.join(', ')}` : 'Standard'}
                  </span>
                  <button
                    onClick={() => onInsertCodeToEditor(snip.code)}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium cursor-pointer"
                  >
                    <FilePlus className="w-3 h-3 text-slate-600" />
                    <span>Insert Snippet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
