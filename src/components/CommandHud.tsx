import { useMemo, useRef, useEffect, useState } from 'react';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Columns2,
  Eye,
  EyeOff,
  GitBranch,
  Maximize2,
  Moon,
  Network,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { getBranchPalette, GA_EXAM_META } from '../data/gaSyllabus';
import type { LayoutMode, SyllabusTreeNode, ThemeMode } from '../types/syllabus';

interface CommandHudProps {
  allNodes: SyllabusTreeNode[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onJumpToNode: (id: string) => void;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFitView: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
  isolatedBranchId: string | null;
  onClearIsolation: () => void;
}

const LAYOUT_OPTIONS: Array<{ id: LayoutMode; label: string; icon: typeof Columns2 }> = [
  { id: 'balanced', label: 'Balanced', icon: Columns2 },
  { id: 'horizontal', label: 'Tree', icon: GitBranch },
  { id: 'org', label: 'Org', icon: Network },
];

export function CommandHud({
  allNodes,
  searchQuery,
  onSearchChange,
  onJumpToNode,
  layoutMode,
  onLayoutChange,
  onExpandAll,
  onCollapseAll,
  onFitView,
  theme,
  onToggleTheme,
  zenMode,
  onToggleZen,
  isolatedBranchId,
  onClearIsolation,
}: CommandHudProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allNodes
      .filter((n) => n.label.toLowerCase().includes(q) || n.code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allNodes, searchQuery]);

  if (zenMode) {
    return (
      <div className="fixed top-4 right-4 z-30">
        <button
          type="button"
          onClick={onToggleZen}
          className="glass-hud flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:scale-105"
          title="Exit Zen Mode (Z)"
        >
          <Eye className="h-3.5 w-3.5" style={{ color: 'var(--focus-color)' }} />
          <span>Show Controls</span>
        </button>
      </div>
    );
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3.5 z-30 flex flex-col items-center gap-2 px-4">
      <div className="glass-hud pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 lg:flex-nowrap">
        {/* Identity */}
        <div className="flex items-center gap-2 pr-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/25"
            style={{
              background:
                theme === 'light'
                  ? 'linear-gradient(135deg, rgba(99,66,245,0.18), rgba(0,140,224,0.18), rgba(255,194,51,0.22))'
                  : 'linear-gradient(135deg, rgba(174,148,255,0.32), rgba(77,184,255,0.26), rgba(255,208,56,0.22))',
            }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: theme === 'light' ? '#6342F5' : '#AE94FF' }}
            />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-[var(--text-primary)]">
              <span>{GA_EXAM_META.exam} · GA Mindmap</span>
              <span
                className="font-mono-code rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={
                  theme === 'light'
                    ? { backgroundColor: '#FFC233', color: '#11183C' }
                    : { backgroundColor: 'rgba(255, 208, 56, 0.2)', color: '#FFD038' }
                }
              >
                15M
              </span>
            </div>
            <div className="hidden text-[10.5px] whitespace-nowrap text-[var(--text-secondary)] xl:block">
              PDF-Verified Hierarchy · 3D Glass Canvas
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search topic or ID ( / )"
              className="w-36 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none sm:w-44 xl:w-52"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="font-mono-code hidden rounded border border-[var(--chip-border)] px-1 text-[10px] text-[var(--text-muted)] sm:inline">
                /
              </kbd>
            )}
          </div>

          {searchFocused && searchMatches.length > 0 && (
            <div className="glass-hud thin-scroll absolute top-full left-0 mt-2 max-h-64 w-72 overflow-y-auto rounded-xl p-1.5">
              {searchMatches.map((match) => {
                const pal = getBranchPalette(match.branch, theme);
                return (
                  <button
                    key={match.id}
                    type="button"
                    onMouseDown={() => onJumpToNode(match.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-[var(--chip-bg)]"
                  >
                    <span
                      className="font-mono-code shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: pal.badgeBg, color: pal.badgeText }}
                    >
                      {match.code}
                    </span>
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {match.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] p-0.5">
          {LAYOUT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = layoutMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onLayoutChange(opt.id)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                  active
                    ? 'shadow-sm ring-1'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--focus-bg)',
                        color: theme === 'light' ? '#5130DC' : '#AE94FF',
                        borderColor: 'var(--focus-color)',
                      }
                    : undefined
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Canvas Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onExpandAll}
            title="Expand All Branches"
            className="flex items-center gap-1 rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Expand</span>
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            title="Collapse to Sections"
            className="flex items-center gap-1 rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Collapse</span>
          </button>
          <button
            type="button"
            onClick={onFitView}
            title="Fit to View (F)"
            className="flex items-center gap-1 rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Glass`}
            className="flex items-center justify-center rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleZen}
            title="Zen Focus Mode (Z)"
            className="flex items-center justify-center rounded-xl border border-[var(--chip-border)] bg-[var(--chip-bg)] p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isolatedBranchId && (
        <div className="glass-hud pointer-events-auto flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium">
          <span className="text-[var(--text-secondary)]">Focused Subtree:</span>
          <span
            className="font-mono-code font-bold"
            style={{ color: theme === 'light' ? '#5130DC' : '#AE94FF' }}
          >
            {isolatedBranchId}
          </span>
          <button
            type="button"
            onClick={onClearIsolation}
            className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition"
            style={
              theme === 'light'
                ? { backgroundColor: '#FDE7EF', color: '#BE185D' }
                : { backgroundColor: 'rgba(255, 99, 161, 0.2)', color: '#FF8AB8' }
            }
          >
            Show Full Map
          </button>
        </div>
      )}
    </header>
  );
}
