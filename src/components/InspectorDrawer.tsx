import { CheckCircle2, ChevronRight, Clock, Circle, Focus, Layers, X } from 'lucide-react';
import { BRANCH_PALETTES } from '../data/gaSyllabus';
import type { MasteryStatus, NodeOrigin, SyllabusTreeNode } from '../types/syllabus';
import { computeSubtreeStats, getBreadcrumbPath } from '../utils/treeHelpers';

interface InspectorDrawerProps {
  node: SyllabusTreeNode | null;
  byId: Map<string, SyllabusTreeNode>;
  parentById: Map<string, string | null>;
  masteryMap: Record<string, MasteryStatus>;
  notesMap: Record<string, string>;
  isolatedBranchId: string | null;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onSetNodeMastery: (id: string, status: MasteryStatus) => void;
  onSetSubtreeMastery: (node: SyllabusTreeNode, status: MasteryStatus) => void;
  onUpdateNote: (id: string, note: string) => void;
  onToggleIsolate: (id: string) => void;
}

const ORIGIN_LABELS: Record<NodeOrigin, string> = {
  'official-root': 'Official Paper Root',
  'official-section': 'Official PDF Section (Blue)',
  'official-topic': 'Official PDF Topic (Red)',
  'official-item': 'Official Verbatim Item',
  'conceptual-group': 'Conceptual Hierarchy Cluster',
};

export function InspectorDrawer({
  node,
  byId,
  parentById,
  masteryMap,
  notesMap,
  isolatedBranchId,
  onClose,
  onSelectNode,
  onSetNodeMastery,
  onSetSubtreeMastery,
  onUpdateNote,
  onToggleIsolate,
}: InspectorDrawerProps) {
  if (!node) return null;

  const palette = BRANCH_PALETTES[node.branch];
  const breadcrumbs = getBreadcrumbPath(node.id, byId, parentById);
  const stats = computeSubtreeStats(node, masteryMap);
  const isLeaf = !node.children || node.children.length === 0;
  const currentMastery = masteryMap[node.id] ?? 'todo';
  const isIsolated = isolatedBranchId === node.id;

  return (
    <aside className="glass-hud thin-scroll fixed top-20 right-4 bottom-4 z-30 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] p-4"
        style={{
          background: `linear-gradient(135deg, ${palette.accentSoft} 0%, transparent 100%)`,
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="font-mono-code rounded-md px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: palette.badgeBg, color: palette.accent }}
            >
              {node.code}
            </span>
            <span className="rounded-md border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--text-secondary)]">
              {ORIGIN_LABELS[node.origin]}
            </span>
          </div>
          <h2 className="mt-2 text-base leading-snug font-bold text-[var(--text-primary)]">
            {node.label}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--chip-bg)] hover:text-[var(--text-primary)]"
          title="Close Inspector (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-4 text-xs">
        {/* Breadcrumb */}
        <div>
          <div className="mb-1.5 text-[10.5px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Hierarchy Path
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />}
                <button
                  type="button"
                  onClick={() => onSelectNode(crumb.id)}
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition ${
                    crumb.id === node.id
                      ? 'bg-[var(--chip-bg)] font-semibold text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {crumb.code}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PDF Audit Note */}
        {node.auditNote && (
          <div className="rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] p-3 leading-relaxed text-[var(--text-secondary)]">
            <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider text-[var(--text-primary)] uppercase">
              <Layers className="h-3.5 w-3.5" style={{ color: palette.accent }} />
              PDF & Structural Context
            </div>
            {node.auditNote}
          </div>
        )}

        {/* Mastery Control */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              {isLeaf ? 'Topic Mastery Status' : `Subtree Mastery (${stats.masteredLeaves}/${stats.totalLeaves})`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-400' },
                { id: 'learning', label: 'Learning', icon: Clock, color: 'text-amber-400' },
                { id: 'mastered', label: 'Mastered', icon: CheckCircle2, color: 'text-emerald-400' },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const isActive = isLeaf
                ? currentMastery === opt.id
                : opt.id === 'mastered'
                  ? stats.masteredLeaves === stats.totalLeaves && stats.totalLeaves > 0
                  : opt.id === 'todo'
                    ? stats.masteredLeaves === 0 && stats.learningLeaves === 0
                    : false;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    isLeaf
                      ? onSetNodeMastery(node.id, opt.id)
                      : onSetSubtreeMastery(node, opt.id)
                  }
                  className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11.5px] font-semibold transition ${
                    isActive
                      ? 'border-sky-400/50 bg-sky-500/15 text-[var(--text-primary)]'
                      : 'border-[var(--chip-border)] bg-[var(--chip-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Isolate Branch Action */}
        {!isLeaf && (
          <button
            type="button"
            onClick={() => onToggleIsolate(node.id)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isIsolated
                ? 'border-rose-400/40 bg-rose-500/15 text-rose-400'
                : 'border-[var(--chip-border)] bg-[var(--chip-bg)] text-[var(--text-primary)] hover:border-sky-400/40'
            }`}
          >
            <Focus className="h-3.5 w-3.5" />
            <span>{isIsolated ? 'Exit Subtree Focus' : 'Isolate This Subtree'}</span>
          </button>
        )}

        {/* Child Subtopics */}
        {node.children && node.children.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10.5px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Direct Children ({node.children.length})
            </div>
            <div className="space-y-1.5">
              {node.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onSelectNode(child.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-2 text-left transition hover:border-sky-400/40"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="font-mono-code shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: palette.badgeBg, color: palette.accent }}
                    >
                      {child.code}
                    </span>
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {child.label}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Personal Notes */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Study Notes (Auto-saved)
            </span>
          </div>
          <textarea
            rows={4}
            value={notesMap[node.id] ?? ''}
            onChange={(e) => onUpdateNote(node.id, e.target.value)}
            placeholder="Write formulas, PYQ tricks, or revision notes..."
            className="w-full resize-none rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] p-2.5 text-xs leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-sky-400/60 focus:outline-none"
          />
        </div>
      </div>
    </aside>
  );
}
