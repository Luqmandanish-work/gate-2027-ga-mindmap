import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { CommandHud } from './components/CommandHud';
import { GlassSyllabusNode } from './components/GlassSyllabusNode';
import { GlowBezierEdge } from './components/GlowBezierEdge';
import { InspectorDrawer } from './components/InspectorDrawer';
import { ProgressHud } from './components/ProgressHud';
import { BRANCH_PALETTES, GA_SYLLABUS_TREE } from './data/gaSyllabus';
import type {
  FilterMode,
  GlowEdgeData,
  LayoutMode,
  MasteryStatus,
  SyllabusFlowNodeData,
  SyllabusTreeNode,
  ThemeMode,
} from './types/syllabus';
import { computeMindmapLayout } from './utils/elkLayout';
import {
  buildTreeIndex,
  computeSubtreeStats,
  getAncestorIds,
  getDescendantIds,
  toMarkdownOutline,
} from './utils/treeHelpers';

const nodeTypes = {
  glassSyllabus: GlassSyllabusNode,
};

const edgeTypes = {
  glowBezier: GlowBezierEdge,
};

const STORAGE_MASTERY_KEY = 'gate2027_ga_mastery_v1';
const STORAGE_NOTES_KEY = 'gate2027_ga_notes_v1';
const STORAGE_THEME_KEY = 'gate2027_ga_theme_v1';

function loadJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MindmapCanvas() {
  const treeIndex = useMemo(() => buildTreeIndex(GA_SYLLABUS_TREE), []);
  const { fitView, setCenter, getNodes } = useReactFlow();

  const [theme, setTheme] = useState<ThemeMode>(() =>
    loadJsonStorage<ThemeMode>(STORAGE_THEME_KEY, 'dark'),
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('balanced');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [isolatedBranchId, setIsolatedBranchId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zenMode, setZenMode] = useState(false);

  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryStatus>>(() =>
    loadJsonStorage<Record<string, MasteryStatus>>(STORAGE_MASTERY_KEY, {}),
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() =>
    loadJsonStorage<Record<string, string>>(STORAGE_NOTES_KEY, {}),
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SyllabusFlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<GlowEdgeData>>([]);

  // Sync theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(theme));
    } catch {
      // Ignore storage quota issues
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MASTERY_KEY, JSON.stringify(masteryMap));
    } catch {
      // Ignore storage quota issues
    }
  }, [masteryMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notesMap));
    } catch {
      // Ignore storage quota issues
    }
  }, [notesMap]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCycleMastery = useCallback((id: string) => {
    setMasteryMap((prev) => {
      const curr = prev[id] ?? 'todo';
      const nextStatus: MasteryStatus =
        curr === 'todo' ? 'learning' : curr === 'learning' ? 'mastered' : 'todo';
      return { ...prev, [id]: nextStatus };
    });
  }, []);

  const handleSetNodeMastery = useCallback((id: string, status: MasteryStatus) => {
    setMasteryMap((prev) => ({ ...prev, [id]: status }));
  }, []);

  const handleSetSubtreeMastery = useCallback((node: SyllabusTreeNode, status: MasteryStatus) => {
    const desc = getDescendantIds(node);
    setMasteryMap((prev) => {
      const next = { ...prev };
      for (const id of desc) {
        const target = treeIndex.byId.get(id);
        if (target && (!target.children || target.children.length === 0)) {
          next[id] = status;
        }
      }
      return next;
    });
  }, [treeIndex.byId]);

  const handleUpdateNote = useCallback((id: string, note: string) => {
    setNotesMap((prev) => ({ ...prev, [id]: note }));
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    const collapsible = new Set<string>();
    for (const n of treeIndex.allNodes) {
      if (n.depth >= 1 && n.children && n.children.length > 0) {
        collapsible.add(n.id);
      }
    }
    setCollapsedIds(collapsible);
  }, [treeIndex.allNodes]);

  // Ref holds latest callbacks/visual state so topology-only layout effect doesn't re-run ELK on hover
  const stateRef = useRef({
    selectedId,
    hoveredId,
    searchQuery,
    masteryMap,
  });
  stateRef.current = { selectedId, hoveredId, searchQuery, masteryMap };

  // 1. Structural ELK layout pass (only on topology/layout/filter changes)
  useEffect(() => {
    let cancelled = false;
    computeMindmapLayout({
      root: GA_SYLLABUS_TREE,
      layoutMode,
      collapsedIds,
      isolatedBranchId,
      filterMode,
      selectedId: stateRef.current.selectedId,
      hoveredId: stateRef.current.hoveredId,
      searchQuery: stateRef.current.searchQuery,
      masteryMap: stateRef.current.masteryMap,
      byId: treeIndex.byId,
      parentById: treeIndex.parentById,
      onToggleCollapse: handleToggleCollapse,
      onCycleMastery: handleCycleMastery,
      onHoverNode: setHoveredId,
    }).then(({ nodes: laidNodes, edges: laidEdges }) => {
      if (cancelled) return;
      setNodes(laidNodes);
      setEdges(laidEdges);
      requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 420 });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    layoutMode,
    collapsedIds,
    isolatedBranchId,
    filterMode,
    treeIndex,
    handleToggleCollapse,
    handleCycleMastery,
    setNodes,
    setEdges,
    fitView,
  ]);

  // 2. Lightweight reactive visual-state decoration (preserves user-dragged coordinates!)
  useEffect(() => {
    const focusId = selectedId ?? hoveredId;
    let activeSet: Set<string> | null = null;
    if (focusId && treeIndex.byId.has(focusId)) {
      const ancestors = getAncestorIds(focusId, treeIndex.parentById);
      const descendants = getDescendantIds(treeIndex.byId.get(focusId)!);
      activeSet = new Set([...ancestors, ...descendants]);
    }
    const q = searchQuery.trim().toLowerCase();

    setNodes((prev) =>
      prev.map((flowNode) => {
        const treeNode = flowNode.data.node;
        const isHighlighted = activeSet ? activeSet.has(treeNode.id) : false;
        const isDimmed = activeSet ? !activeSet.has(treeNode.id) : false;
        const isSearchMatch =
          q.length > 0 &&
          (treeNode.label.toLowerCase().includes(q) || treeNode.code.toLowerCase().includes(q));

        return {
          ...flowNode,
          data: {
            ...flowNode.data,
            isSelected: selectedId === treeNode.id,
            isHighlighted,
            isDimmed,
            isSearchMatch,
            mastery: masteryMap[treeNode.id] ?? 'todo',
            stats: computeSubtreeStats(treeNode, masteryMap),
          },
        };
      }),
    );

    setEdges((prev) =>
      prev.map((edge) => {
        const isHighlighted = activeSet
          ? activeSet.has(edge.source) && activeSet.has(edge.target)
          : false;
        const isDimmed = activeSet ? !isHighlighted : false;
        return {
          ...edge,
          data: {
            color: edge.data?.color ?? '#60a5fa',
            isHighlighted,
            isDimmed,
          },
        };
      }),
    );
  }, [selectedId, hoveredId, searchQuery, masteryMap, treeIndex, setNodes, setEdges]);

  const handleJumpToNode = useCallback(
    (id: string) => {
      // Uncollapse any collapsed ancestors so target becomes visible
      const ancestors = getAncestorIds(id, treeIndex.parentById);
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const anc of ancestors) {
          if (anc !== id && next.has(anc)) {
            next.delete(anc);
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      setSelectedId(id);
      setTimeout(() => {
        const target = getNodes().find((n) => n.id === id);
        if (target) {
          const w = target.width ?? 220;
          const h = target.height ?? 64;
          setCenter(target.position.x + w / 2, target.position.y + h / 2, {
            zoom: 1.08,
            duration: 500,
          });
        }
      }, 120);
    },
    [treeIndex.parentById, getNodes, setCenter],
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
        setSelectedId(null);
        setSearchQuery('');
        return;
      }
      if (isTyping) return;
      if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2, duration: 400 });
      } else if (e.key === 'z' || e.key === 'Z') {
        setZenMode((z) => !z);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fitView]);

  const handleExportPng = useCallback(async () => {
    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportEl) return;
    const currentNodes = getNodes();
    if (currentNodes.length === 0) return;

    const bounds = getNodesBounds(currentNodes);
    const width = Math.max(1200, Math.round(bounds.width + 240));
    const height = Math.max(800, Math.round(bounds.height + 240));
    const viewport = getViewportForBounds(bounds, width, height, 0.25, 2, 0.12);

    try {
      const dataUrl = await toPng(viewportEl, {
        backgroundColor: theme === 'dark' ? '#060811' : '#f3f5fa',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });
      const a = document.createElement('a');
      a.download = 'GATE-2027-GA-Mindmap.png';
      a.href = dataUrl;
      a.click();
    } catch {
      // Fallback silently if canvas capture fails
    }
  }, [getNodes, theme]);

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdownOutline(GA_SYLLABUS_TREE, masteryMap);
    downloadBlob('GATE-2027-GA-Syllabus.md', md, 'text/markdown;charset=utf-8');
  }, [masteryMap]);

  const handleExportJson = useCallback(() => {
    const payload = {
      exam: 'GATE 2027',
      paper: 'GA - General Aptitude',
      exportedAt: new Date().toISOString(),
      tree: GA_SYLLABUS_TREE,
      mastery: masteryMap,
      notes: notesMap,
    };
    downloadBlob('GATE-2027-GA-State.json', JSON.stringify(payload, null, 2), 'application/json');
  }, [masteryMap, notesMap]);

  const overallStats = useMemo(
    () => computeSubtreeStats(GA_SYLLABUS_TREE, masteryMap),
    [masteryMap],
  );

  const selectedTreeNode = selectedId ? treeIndex.byId.get(selectedId) ?? null : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--canvas-bg)]">
      {/* Ambient Volumetric 3D Aurora Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="ambient-orb absolute -top-36 -left-24 h-[460px] w-[460px] rounded-full opacity-35 blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45), transparent 70%)' }}
        />
        <div
          className="ambient-orb absolute top-1/4 -right-28 h-[500px] w-[500px] rounded-full opacity-30 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.42), transparent 70%)',
            animationDelay: '-5s',
          }}
        />
        <div
          className="ambient-orb absolute -bottom-32 left-1/3 h-[440px] w-[440px] rounded-full opacity-30 blur-[135px]"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.45), transparent 70%)',
            animationDelay: '-10s',
          }}
        />
      </div>

      <CommandHud
        allNodes={treeIndex.allNodes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onJumpToNode={handleJumpToNode}
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onFitView={() => fitView({ padding: 0.2, duration: 420 })}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        zenMode={zenMode}
        onToggleZen={() => setZenMode((z) => !z)}
        isolatedBranchId={isolatedBranchId}
        onClearIsolation={() => setIsolatedBranchId(null)}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedId(node.id)}
        onPaneClick={() => setSelectedId(null)}
        minZoom={0.25}
        maxZoom={2.2}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.4}
          color={theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(71, 85, 105, 0.22)'}
        />

        {!zenMode && (
          <>
            <Controls position="bottom-left" showInteractive={false} />
            {!selectedTreeNode && (
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                style={{ width: 148, height: 96 }}
                nodeColor={(n) => {
                  const branch = (n.data as SyllabusFlowNodeData | undefined)?.node.branch ?? 'root';
                  return BRANCH_PALETTES[branch].accent;
                }}
                maskColor={theme === 'dark' ? 'rgba(6, 8, 17, 0.72)' : 'rgba(243, 245, 250, 0.72)'}
              />
            )}
          </>
        )}
      </ReactFlow>

      <ProgressHud
        stats={overallStats}
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        onExportPng={handleExportPng}
        onExportMarkdown={handleExportMarkdown}
        onExportJson={handleExportJson}
        zenMode={zenMode}
      />

      {!zenMode && (
        <InspectorDrawer
          node={selectedTreeNode}
          byId={treeIndex.byId}
          parentById={treeIndex.parentById}
          masteryMap={masteryMap}
          notesMap={notesMap}
          isolatedBranchId={isolatedBranchId}
          onClose={() => setSelectedId(null)}
          onSelectNode={handleJumpToNode}
          onSetNodeMastery={handleSetNodeMastery}
          onSetSubtreeMastery={handleSetSubtreeMastery}
          onUpdateNote={handleUpdateNote}
          onToggleIsolate={(id) =>
            setIsolatedBranchId((curr) => (curr === id ? null : id))
          }
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <MindmapCanvas />
    </ReactFlowProvider>
  );
}
