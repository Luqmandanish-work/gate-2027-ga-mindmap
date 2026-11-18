import { memo, useRef } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import {
  BookOpen,
  Box,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Network,
  Sparkles,
} from 'lucide-react';
import type { BranchId, MasteryStatus, SyllabusFlowNodeData } from '../types/syllabus';

type SyllabusNodeType = Node<SyllabusFlowNodeData, 'glassSyllabus'>;

function BranchIcon({ branch, className }: { branch: BranchId; className?: string }) {
  switch (branch) {
    case 'verbal':
      return <BookOpen className={className} />;
    case 'quant':
      return <Calculator className={className} />;
    case 'analytical':
      return <Network className={className} />;
    case 'spatial':
      return <Box className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function MasteryDot({
  status,
  accent,
  onClick,
}: {
  status: MasteryStatus;
  accent: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      title={`Study status: ${status} (click to cycle)`}
      className="nodrag nopan group/dot relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-transform duration-150 hover:scale-110 active:scale-95"
      style={{
        borderColor:
          status === 'mastered'
            ? '#10b981'
            : status === 'learning'
              ? '#f59e0b'
              : 'rgba(148, 163, 184, 0.35)',
        backgroundColor:
          status === 'mastered'
            ? 'rgba(16, 185, 129, 0.22)'
            : status === 'learning'
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(148, 163, 184, 0.08)',
        boxShadow:
          status === 'mastered'
            ? '0 0 12px rgba(16, 185, 129, 0.5)'
            : status === 'learning'
              ? '0 0 10px rgba(245, 158, 11, 0.35)'
              : `0 0 0 1px ${accent}15`,
      }}
    >
      {status === 'mastered' ? (
        <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
      ) : status === 'learning' ? (
        <Clock className="h-2.5 w-2.5 text-amber-400" strokeWidth={2.5} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400/50 transition-colors group-hover/dot:bg-slate-200" />
      )}
    </button>
  );
}

const HIDDEN_HANDLE_STYLE: React.CSSProperties = {
  opacity: 0,
  width: 6,
  height: 6,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
};

export const GlassSyllabusNode = memo(function GlassSyllabusNode({
  data,
}: NodeProps<SyllabusNodeType>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const {
    node,
    palette,
    hasChildren,
    isCollapsed,
    hiddenDescendantCount,
    isSelected,
    isHighlighted,
    isDimmed,
    isSearchMatch,
    mastery,
    stats,
    onToggleCollapse,
    onCycleMastery,
    onHoverNode,
  } = data;

  const isRoot = node.depth === 0;
  const isSection = node.depth === 1;
  const isLeaf = !hasChildren;
  const pct = stats.totalLeaves > 0 ? Math.round((stats.masteredLeaves / stats.totalLeaves) * 100) : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const tiltMax = isRoot ? 8 : isSection ? 7 : 6;
    const ry = ((px - 0.5) * 2 * tiltMax).toFixed(2);
    const rx = ((0.5 - py) * 2 * tiltMax).toFixed(2);
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (el) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
    onHoverNode(null);
  };

  const borderColor = isSearchMatch
    ? '#38bdf8'
    : isSelected || isHighlighted
      ? palette.accent
      : undefined;

  const dynamicGlow = isSearchMatch
    ? '0 0 28px rgba(56, 189, 248, 0.55), var(--glass-shadow-hover)'
    : isSelected
      ? `0 0 32px ${palette.glow}, var(--glass-shadow-hover)`
      : isHighlighted
        ? `0 0 22px ${palette.glow}, var(--glass-shadow)`
        : undefined;

  return (
    <div
      className="glass-node-wrapper relative"
      onMouseEnter={() => onHoverNode(node.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        opacity: isDimmed ? 0.28 : 1,
        transition: 'opacity 220ms ease',
      }}
    >
      {/* Multi-directional invisible handles for Balanced, Horizontal & Org layouts */}
      <Handle id="in-left" type="target" position={Position.Left} style={HIDDEN_HANDLE_STYLE} />
      <Handle id="in-right" type="target" position={Position.Right} style={HIDDEN_HANDLE_STYLE} />
      <Handle id="in-top" type="target" position={Position.Top} style={HIDDEN_HANDLE_STYLE} />
      <Handle id="out-right" type="source" position={Position.Right} style={HIDDEN_HANDLE_STYLE} />
      <Handle id="out-left" type="source" position={Position.Left} style={HIDDEN_HANDLE_STYLE} />
      <Handle id="out-bottom" type="source" position={Position.Bottom} style={HIDDEN_HANDLE_STYLE} />

      <div
        ref={cardRef}
        className={`glass-node-3d cursor-pointer select-none ${
          isRoot
            ? 'w-[256px] rounded-2xl px-4 py-3.5'
            : isSection
              ? 'w-[274px] rounded-2xl px-4 py-3'
              : node.depth === 2
                ? 'w-[248px] rounded-xl px-3.5 py-2.5'
                : node.depth === 3
                  ? 'w-[234px] rounded-xl px-3 py-2'
                  : 'min-w-[170px] max-w-[246px] rounded-xl px-3 py-2'
        }`}
        style={{
          borderColor,
          boxShadow: dynamicGlow,
          backgroundImage: isRoot
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(139, 92, 246, 0.16) 55%, rgba(16, 185, 129, 0.14) 100%)'
            : isSection
              ? `linear-gradient(135deg, ${palette.accentSoft} 0%, rgba(255,255,255,0.02) 100%)`
              : undefined,
        }}
      >
        {/* Top or Left glowing accent bar */}
        <div
          className="pointer-events-none absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full"
          style={{
            backgroundColor: palette.accent,
            boxShadow: `0 0 12px ${palette.glow}`,
            opacity: isRoot ? 0.95 : isSection ? 0.9 : 0.72,
          }}
        />

        {isRoot ? (
          <div className="glass-depth-fg flex flex-col gap-2 pl-1.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-mono-code inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase"
                style={{ backgroundColor: palette.badgeBg, color: palette.accent }}
              >
                <Sparkles className="h-3 w-3" />
                GATE 2027 · GA
              </span>
              <span className="font-mono-code text-[11px] font-medium text-[var(--text-secondary)]">
                15 Marks · 10 Qs
              </span>
            </div>

            <div className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)]">
              {node.label}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-500/20">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                  }}
                />
              </div>
              <span className="font-mono-code text-[11px] font-semibold text-[var(--text-secondary)]">
                {stats.masteredLeaves}/{stats.totalLeaves}
              </span>
            </div>
          </div>
        ) : isSection ? (
          <div className="glass-depth-fg flex flex-col gap-1.5 pl-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: palette.badgeBg, color: palette.accent }}
                >
                  <BranchIcon branch={node.branch} className="h-3.5 w-3.5" />
                </span>
                <span
                  className="font-mono-code rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: palette.badgeBg, color: palette.accent }}
                >
                  SEC {node.code}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-mono-code text-[11px] text-[var(--text-secondary)]">
                  {stats.masteredLeaves}/{stats.totalLeaves}
                </span>
                {hasChildren && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollapse(node.id);
                    }}
                    title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
                    className="nodrag nopan flex h-6 items-center gap-0.5 rounded-full border border-[var(--chip-border)] bg-[var(--chip-bg)] px-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    {isCollapsed ? (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span>+{hiddenDescendantCount}</span>
                      </>
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="text-[14px] leading-snug font-bold text-[var(--text-primary)]">
              {node.label.replace(/^Section \d+:\s*/, '')}
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-500/20">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: palette.accent }}
              />
            </div>
          </div>
        ) : (
          <div className="glass-depth-fg flex items-center justify-between gap-2 pl-1.5">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span
                className="font-mono-code mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor:
                    node.origin === 'conceptual-group'
                      ? 'rgba(148, 163, 184, 0.14)'
                      : palette.badgeBg,
                  color:
                    node.origin === 'conceptual-group'
                      ? 'var(--text-secondary)'
                      : palette.accent,
                }}
              >
                {node.code}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`leading-snug ${
                    node.depth === 2
                      ? 'text-[12.5px] font-semibold text-[var(--text-primary)]'
                      : node.origin === 'conceptual-group'
                        ? 'text-[11.5px] font-semibold text-[var(--text-secondary)]'
                        : 'text-[12px] font-medium text-[var(--text-primary)]'
                  } ${isLeaf && mastery === 'mastered' ? 'line-through decoration-emerald-400/70 opacity-85' : ''}`}
                >
                  {node.label}
                </div>
                {node.origin === 'conceptual-group' && (
                  <div className="mt-0.5 flex items-center gap-1 text-[9.5px] tracking-wide text-[var(--text-muted)] uppercase">
                    <Layers className="h-2.5 w-2.5" />
                    <span>Concept Cluster</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isLeaf ? (
                <MasteryDot
                  status={mastery}
                  accent={palette.accent}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCycleMastery(node.id);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCollapse(node.id);
                  }}
                  title={isCollapsed ? 'Expand subtopics' : 'Collapse subtopics'}
                  className="nodrag nopan flex h-6 items-center gap-0.5 rounded-full border border-[var(--chip-border)] bg-[var(--chip-bg)] px-1.5 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span>+{hiddenDescendantCount}</span>
                    </>
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
