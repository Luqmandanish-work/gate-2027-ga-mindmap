import type { MasteryStatus, SubtreeStats, SyllabusTreeNode } from '../types/syllabus';

export interface IndexedTree {
  byId: Map<string, SyllabusTreeNode>;
  parentById: Map<string, string | null>;
  allNodes: SyllabusTreeNode[];
  leafIds: string[];
}

export function buildTreeIndex(root: SyllabusTreeNode): IndexedTree {
  const byId = new Map<string, SyllabusTreeNode>();
  const parentById = new Map<string, string | null>();
  const allNodes: SyllabusTreeNode[] = [];
  const leafIds: string[] = [];

  function walk(node: SyllabusTreeNode, parentId: string | null) {
    byId.set(node.id, node);
    parentById.set(node.id, parentId);
    allNodes.push(node);

    if (!node.children || node.children.length === 0) {
      leafIds.push(node.id);
    } else {
      for (const child of node.children) {
        walk(child, node.id);
      }
    }
  }

  walk(root, null);
  return { byId, parentById, allNodes, leafIds };
}

export function getAncestorIds(id: string, parentById: Map<string, string | null>): Set<string> {
  const set = new Set<string>();
  let curr: string | null | undefined = id;
  while (curr) {
    set.add(curr);
    curr = parentById.get(curr) ?? null;
  }
  return set;
}

export function getDescendantIds(node: SyllabusTreeNode): Set<string> {
  const set = new Set<string>();
  function walk(n: SyllabusTreeNode) {
    set.add(n.id);
    if (n.children) {
      for (const c of n.children) walk(c);
    }
  }
  walk(node);
  return set;
}

export function countDescendants(node: SyllabusTreeNode): number {
  if (!node.children || node.children.length === 0) return 0;
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

export function computeSubtreeStats(
  node: SyllabusTreeNode,
  masteryMap: Record<string, MasteryStatus>,
): SubtreeStats {
  if (!node.children || node.children.length === 0) {
    const status = masteryMap[node.id] ?? 'todo';
    return {
      totalLeaves: 1,
      masteredLeaves: status === 'mastered' ? 1 : 0,
      learningLeaves: status === 'learning' ? 1 : 0,
    };
  }

  let totalLeaves = 0;
  let masteredLeaves = 0;
  let learningLeaves = 0;
  for (const child of node.children) {
    const stats = computeSubtreeStats(child, masteryMap);
    totalLeaves += stats.totalLeaves;
    masteredLeaves += stats.masteredLeaves;
    learningLeaves += stats.learningLeaves;
  }
  return { totalLeaves, masteredLeaves, learningLeaves };
}

export function getBreadcrumbPath(
  id: string,
  byId: Map<string, SyllabusTreeNode>,
  parentById: Map<string, string | null>,
): SyllabusTreeNode[] {
  const path: SyllabusTreeNode[] = [];
  let curr: string | null | undefined = id;
  while (curr) {
    const node = byId.get(curr);
    if (node) path.unshift(node);
    curr = parentById.get(curr) ?? null;
  }
  return path;
}

export function toMarkdownOutline(
  root: SyllabusTreeNode,
  masteryMap: Record<string, MasteryStatus>,
): string {
  const lines: string[] = [
    '# GATE 2027 — General Aptitude (GA) Hierarchical Syllabus',
    '',
  ];

  function walk(node: SyllabusTreeNode, indent: number) {
    if (node.depth > 0) {
      const prefix = '  '.repeat(indent);
      const isLeaf = !node.children || node.children.length === 0;
      const status = masteryMap[node.id] ?? 'todo';
      const check = isLeaf ? (status === 'mastered' ? '[x] ' : status === 'learning' ? '[-] ' : '[ ] ') : '';
      lines.push(`${prefix}- ${check}**${node.code}** ${node.label}`);
    }
    if (node.children) {
      for (const c of node.children) {
        walk(c, node.depth === 0 ? 0 : indent + 1);
      }
    }
  }

  walk(root, 0);
  return lines.join('\n');
}
