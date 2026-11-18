export type BranchId = 'root' | 'verbal' | 'quant' | 'analytical' | 'spatial';

export type NodeOrigin =
  | 'official-root'
  | 'official-section'
  | 'official-topic'
  | 'official-item'
  | 'conceptual-group';

export type MasteryStatus = 'todo' | 'learning' | 'mastered';

export type LayoutMode = 'balanced' | 'horizontal' | 'org';

export type FilterMode = 'all' | 'remaining' | 'mastered';

export type ThemeMode = 'dark' | 'light';

export interface BranchPalette {
  id: BranchId;
  name: string;
  accent: string;
  ink: string;
  pillBg: string;
  accentSoft: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  rim: string;
  edgeColor: string;
}

export interface SyllabusTreeNode {
  id: string;
  code: string;
  label: string;
  branch: BranchId;
  depth: number;
  origin: NodeOrigin;
  auditNote?: string;
  children?: SyllabusTreeNode[];
}

export interface SubtreeStats {
  totalLeaves: number;
  masteredLeaves: number;
  learningLeaves: number;
}

export interface SyllabusFlowNodeData extends Record<string, unknown> {
  node: SyllabusTreeNode;
  palette: BranchPalette;
  hasChildren: boolean;
  isCollapsed: boolean;
  hiddenDescendantCount: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isSearchMatch: boolean;
  mastery: MasteryStatus;
  stats: SubtreeStats;
  theme: ThemeMode;
  layoutMode: LayoutMode;
  side: 'center' | 'left' | 'right' | 'bottom';
  onToggleCollapse: (id: string) => void;
  onCycleMastery: (id: string) => void;
  onHoverNode: (id: string | null) => void;
}

export interface GlowEdgeData extends Record<string, unknown> {
  color: string;
  isHighlighted: boolean;
  isDimmed: boolean;
}
