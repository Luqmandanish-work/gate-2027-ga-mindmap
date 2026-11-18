import { useState } from 'react';
import { Download, FileCode2, FileText, Image as ImageIcon } from 'lucide-react';
import type { FilterMode, SubtreeStats } from '../types/syllabus';

interface ProgressHudProps {
  stats: SubtreeStats;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  onExportPng: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  zenMode: boolean;
}

export function ProgressHud({
  stats,
  filterMode,
  onFilterChange,
  onExportPng,
  onExportMarkdown,
  onExportJson,
  zenMode,
}: ProgressHudProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  if (zenMode) return null;

  const pct = stats.totalLeaves > 0 ? Math.round((stats.masteredLeaves / stats.totalLeaves) * 100) : 0;

  return (
    <div className="fixed bottom-4 left-14 z-30 flex flex-wrap items-center gap-2">
      {/* Mastery Meter */}
      <div className="glass-hud flex items-center gap-3 rounded-2xl px-3.5 py-2">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 88} 88`}
            />
          </svg>
          <span className="font-mono-code absolute text-[9.5px] font-bold text-[var(--text-primary)]">
            {pct}%
          </span>
        </div>

        <div className="leading-tight">
          <div className="text-[11.5px] font-bold text-[var(--text-primary)]">
            {stats.masteredLeaves}/{stats.totalLeaves} Topics Mastered
          </div>
          <div className="text-[10.5px] text-[var(--text-secondary)]">
            {stats.learningLeaves} in progress · Click any leaf dot
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="glass-hud hidden items-center gap-0.5 rounded-2xl p-1 sm:flex">
        {(['all', 'remaining', 'mastered'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onFilterChange(mode)}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
              filterMode === mode
                ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-400/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Export Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="glass-hud flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-sky-400/40"
        >
          <Download className="h-3.5 w-3.5 text-sky-400" />
          <span>Export</span>
        </button>

        {menuOpen && (
          <div className="glass-hud absolute bottom-full left-0 mb-2 w-48 rounded-xl p-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onExportPng();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-[var(--text-primary)] hover:bg-[var(--chip-bg)]"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onExportMarkdown();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-[var(--text-primary)] hover:bg-[var(--chip-bg)]"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>Export Markdown (.md)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onExportJson();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-[var(--text-primary)] hover:bg-[var(--chip-bg)]"
            >
              <FileCode2 className="h-3.5 w-3.5 text-violet-400" />
              <span>Export JSON State</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
