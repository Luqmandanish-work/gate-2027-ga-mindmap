import ELK from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from '@xyflow/react';
import { BRANCH_PALETTES } from '../data/gaSyllabus';
import type {
  FilterMode,
  GlowEdgeData,
  LayoutMode,
  MasteryStatus,
  SyllabusFlowNodeData,
  SyllabusTreeNode,
} from '../types/syllabus';
import {
  computeSubtreeStats,
  countDescendants,
  getAncestorIds,
  getDescendantIds,
} from './treeHelpers';

const elk = new ELK();

export function estimateNodeSize(node: SyllabusTreeNode): { width: number; height: number } {
  if (node.depth === 0) return { width: 256, height: 106 };
  if (node.depth === 1) return { width: 274, height: 86 };
  if (node.depth === 2) {
    const extraLine = node.label.length > 26 ? 18 : 0;
    return { width: 248, height: 64 + extraLine };
  }
  if (node.depth === 3) {
    const extraLine = node.label.length > 25 ? 16 : 0;
    return { width: 234, height: 54 + extraLine };
  }
  const width = Math.min(246, Math.max(170, 92 + node.label.length * 6.5));
  return { width: Math.round(width), height: 46 };
}

interface BuildVisibleOptions {
  root: SyllabusTreeNode;
  collapsedIds: Set<string>;
  isolatedBranchId: string | null;
  filterMode: FilterMode;
  masteryMap: Record<string, MasteryStatus>;
  byId: Map<string, SyllabusTreeNode>;
}

function nodePassesFilter(
  node: SyllabusTreeNode,
  filterMode: FilterMode,
  masteryMap: Record<string, MasteryStatus>,
): boolean {
  if (filterMode === 'all') return true;
  const stats = computeSubtreeStats(node, masteryMap);
  if (filterMode === 'mastered') return stats.masteredLeaves > 0;
  return stats.masteredLeaves < stats.totalLeaves;
}

export function collectVisibleSubtree(
  opts: BuildVisibleOptions,
): { visibleNodes: SyllabusTreeNode[]; edgePairs: Array<{ source: string; target: string }> } {
  const { root, collapsedIds, isolatedBranchId, filterMode, masteryMap, byId } = opts;
  const startNode = isolatedBranchId ? byId.get(isolatedBranchId) ?? root : root;
  const visibleNodes: SyllabusTreeNode[] = [];
  const edgePairs: Array<{ source: string; target: string }> = [];

  function walk(node: SyllabusTreeNode) {
    visibleNodes.push(node);
    if (collapsedIds.has(node.id) || !node.children) return;
    for (const child of node.children) {
      if (!nodePassesFilter(child, filterMode, masteryMap)) continue;
      edgePairs.push({ source: node.id, target: child.id });
      walk(child);
    }
  }

  walk(startNode);
  return { visibleNodes, edgePairs };
}

interface LayoutRunParams {
  root: SyllabusTreeNode;
  layoutMode: LayoutMode;
  collapsedIds: Set<string>;
  isolatedBranchId: string | null;
  filterMode: FilterMode;
  selectedId: string | null;
  hoveredId: string | null;
  searchQuery: string;
  masteryMap: Record<string, MasteryStatus>;
  byId: Map<string, SyllabusTreeNode>;
  parentById: Map<string, string | null>;
  onToggleCollapse: (id: string) => void;
  onCycleMastery: (id: string) => void;
  onHoverNode: (id: string | null) => void;
}

async function runElk(
  nodes: SyllabusTreeNode[],
  edges: Array<{ source: string; target: string }>,
  direction: 'RIGHT' | 'LEFT' | 'DOWN',
): Promise<Map<string, { x: number; y: number }>> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const filteredEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const graph = {
    id: `elk-${direction}`,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.spacing.nodeNodeBetweenLayers': direction === 'DOWN' ? '64' : '78',
      'elk.spacing.nodeNode': direction === 'DOWN' ? '28' : '20',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: nodes.map((n) => {
      const size = estimateNodeSize(n);
      return { id: n.id, width: size.width, height: size.height };
    }),
    edges: filteredEdges.map((e, idx) => ({
      id: `e-${idx}-${e.source}-${e.target}`,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const laidOut = await elk.layout(graph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of laidOut.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }
  return positions;
}

export async function computeMindmapLayout(
  params: LayoutRunParams,
): Promise<{
  nodes: Array<Node<SyllabusFlowNodeData>>;
  edges: Array<Edge<GlowEdgeData>>;
}> {
  const {
    root,
    layoutMode,
    collapsedIds,
    isolatedBranchId,
    filterMode,
    selectedId,
    hoveredId,
    searchQuery,
    masteryMap,
    byId,
    parentById,
    onToggleCollapse,
    onCycleMastery,
    onHoverNode,
  } = params;

  const { visibleNodes, edgePairs } = collectVisibleSubtree({
    root,
    collapsedIds,
    isolatedBranchId,
    filterMode,
    masteryMap,
    byId,
  });

  const positions = new Map<string, { x: number; y: number }>();
  const sides = new Map<string, 'center' | 'left' | 'right' | 'bottom'>();

  const canUseBalanced = layoutMode === 'balanced' && !isolatedBranchId && visibleNodes[0]?.id === 'GA';

  if (canUseBalanced) {
    // Left wing: Sections 1 (Verbal) & 3 (Analytical); Right wing: Sections 2 (Quant) & 4 (Spatial)
    const leftSectionIds = new Set(['1', '3']);
    const leftNodes: SyllabusTreeNode[] = [root];
    const rightNodes: SyllabusTreeNode[] = [root];

    const sectionOf = (node: SyllabusTreeNode): string => {
      if (node.depth === 0) return 'GA';
      return node.id.split('.')[0];
    };

    for (const n of visibleNodes) {
      if (n.depth === 0) continue;
      if (leftSectionIds.has(sectionOf(n))) {
        leftNodes.push(n);
        sides.set(n.id, 'left');
      } else {
        rightNodes.push(n);
        sides.set(n.id, 'right');
      }
    }
    sides.set(root.id, 'center');

    const [leftPos, rightPos] = await Promise.all([
      runElk(leftNodes, edgePairs, 'LEFT'),
      runElk(rightNodes, edgePairs, 'RIGHT'),
    ]);

    const rootLeft = leftPos.get(root.id) ?? { x: 0, y: 0 };
    const rootRight = rightPos.get(root.id) ?? { x: 0, y: 0 };

    // Anchor root at (0, 0) and translate both wings relative to root
    positions.set(root.id, { x: 0, y: 0 });

    for (const n of leftNodes) {
      if (n.id === root.id) continue;
      const p = leftPos.get(n.id) ?? { x: 0, y: 0 };
      positions.set(n.id, {
        x: p.x - rootLeft.x,
        y: p.y - rootLeft.y,
      });
    }

    for (const n of rightNodes) {
      if (n.id === root.id) continue;
      const p = rightPos.get(n.id) ?? { x: 0, y: 0 };
      positions.set(n.id, {
        x: p.x - rootRight.x,
        y: p.y - rootRight.y,
      });
    }
  } else {
    const dir = layoutMode === 'org' ? 'DOWN' : 'RIGHT';
    const singlePos = await runElk(visibleNodes, edgePairs, dir);
    for (const n of visibleNodes) {
      positions.set(n.id, singlePos.get(n.id) ?? { x: 0, y: 0 });
      sides.set(n.id, layoutMode === 'org' ? 'bottom' : 'right');
    }
  }

  // Focus highlighting (hover takes precedence over selection when hovering)
  const focusId = hoveredId ?? selectedId;
  let activeSet: Set<string> | null = null;
  if (focusId && byId.has(focusId)) {
    const ancestors = getAncestorIds(focusId, parentById);
    const descendants = getDescendantIds(byId.get(focusId)!);
    activeSet = new Set([...ancestors, ...descendants]);
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const flowNodes: Array<Node<SyllabusFlowNodeData>> = visibleNodes.map((node) => {
    const pos = positions.get(node.id) ?? { x: 0, y: 0 };
    const size = estimateNodeSize(node);
    const palette = BRANCH_PALETTES[node.branch];
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isCollapsed = collapsedIds.has(node.id);
    const hiddenDescendantCount = isCollapsed ? countDescendants(node) : 0;
    const isHighlighted = activeSet ? activeSet.has(node.id) : false;
    const isDimmed = activeSet ? !activeSet.has(node.id) : false;
    const isSearchMatch =
      normalizedQuery.length > 0 &&
      (node.label.toLowerCase().includes(normalizedQuery) ||
        node.code.toLowerCase().includes(normalizedQuery));

    return {
      id: node.id,
      type: 'glassSyllabus',
      position: pos,
      width: size.width,
      height: size.height,
      data: {
        node,
        palette,
        hasChildren,
        isCollapsed,
        hiddenDescendantCount,
        isSelected: selectedId === node.id,
        isHighlighted,
        isDimmed,
        isSearchMatch,
        mastery: masteryMap[node.id] ?? 'todo',
        stats: computeSubtreeStats(node, masteryMap),
        layoutMode,
        side: sides.get(node.id) ?? 'right',
        onToggleCollapse,
        onCycleMastery,
        onHoverNode,
      },
    };
  });

  const flowEdges: Array<Edge<GlowEdgeData>> = edgePairs.map(({ source, target }) => {
    const targetNode = byId.get(target);
    const branch = targetNode?.branch ?? 'root';
    const palette = BRANCH_PALETTES[branch];
    const targetSide = sides.get(target) ?? 'right';

    let sourceHandle = 'out-right';
    let targetHandle = 'in-left';

    if (layoutMode === 'org') {
      sourceHandle = 'out-bottom';
      targetHandle = 'in-top';
    } else if (targetSide === 'left') {
      sourceHandle = 'out-left';
      targetHandle = 'in-right';
    }

    const isHighlighted = activeSet ? activeSet.has(source) && activeSet.has(target) : false;
    const isDimmed = activeSet ? !isHighlighted : false;

    return {
      id: `edge-${source}->${target}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'glowBezier',
      data: {
        color: palette.edgeColor,
        isHighlighted,
        isDimmed,
      },
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}
