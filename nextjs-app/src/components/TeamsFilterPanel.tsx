'use client';

import React, { useEffect, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TeamsFilters {
  statuses: string[];
  seasons: string[];
  programs: string[];
  sports: string[];
  genders: string[];
}

type Option = { value: string; label: string };

export const TEAM_STATUS_OPTIONS: Option[] = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
];

export function createDefaultTeamsFilters(defaultSeason?: string): TeamsFilters {
  return { statuses: [], seasons: defaultSeason ? [defaultSeason] : [], programs: [], sports: [], genders: [] };
}

const labelFor = (opts: Option[], v: string) => opts.find(o => o.value === v)?.label ?? v;

export interface TeamsChip {
  key: keyof TeamsFilters;
  label: string;
}

interface OptionSets {
  seasonOptions: Option[];
  programOptions: Option[];
  sportOptions: Option[];
  genderOptions: Option[];
}

export function buildTeamsChips(filters: TeamsFilters, opts: OptionSets): TeamsChip[] {
  const chips: TeamsChip[] = [];
  if (filters.statuses.length)
    chips.push({ key: 'statuses', label: `Status: ${filters.statuses.map(v => labelFor(TEAM_STATUS_OPTIONS, v)).join(', ')}` });
  if (filters.seasons.length)
    chips.push({ key: 'seasons', label: `Season: ${filters.seasons.map(v => labelFor(opts.seasonOptions, v)).join(', ')}` });
  if (filters.programs.length)
    chips.push({ key: 'programs', label: `Program: ${filters.programs.map(v => labelFor(opts.programOptions, v)).join(', ')}` });
  if (filters.sports.length)
    chips.push({ key: 'sports', label: `Sport: ${filters.sports.map(v => labelFor(opts.sportOptions, v)).join(', ')}` });
  if (filters.genders.length)
    chips.push({ key: 'genders', label: `Gender: ${filters.genders.map(v => labelFor(opts.genderOptions, v)).join(', ')}` });
  return chips;
}

export const countTeamsFilters = (filters: TeamsFilters, opts: OptionSets) => buildTeamsChips(filters, opts).length;

// ─── Icons ───────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M13 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Pill group ────────────────────────────────────────────────────────────────

function PillGroup({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="tf-pills">
      {options.map(o => {
        const on = selected.includes(o.value);
        return (
          <button key={o.value} className={`tf-pill${on ? ' tf-pill--on' : ''}`} onClick={() => onToggle(o.value)}>
            {on && <span className="tf-pill-check"><CheckIcon /></span>}
            {o.label}
          </button>
        );
      })}
      <style jsx>{`
        .tf-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .tf-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tf-pill:hover { background: var(--u-color-background-canvas, #eff0f0); }
        .tf-pill--on {
          background: #e7f3fd;
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #085bb4;
        }
        .tf-pill-check { display: inline-flex; color: var(--u-color-emphasis-background-contrast, #0273e3); }
      `}</style>
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export default function TeamsFilterPanel({
  isOpen,
  filters,
  setFilters,
  seasonOptions,
  programOptions,
  sportOptions,
  genderOptions,
  onClose,
}: {
  isOpen: boolean;
  filters: TeamsFilters;
  setFilters: React.Dispatch<React.SetStateAction<TeamsFilters>>;
  seasonOptions: Option[];
  programOptions: Option[];
  sportOptions: Option[];
  genderOptions: Option[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const toggle = (group: keyof TeamsFilters, value: string) => {
    setFilters(prev => {
      const arr = prev[group];
      return {
        ...prev,
        [group]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const clearGroup = (key: keyof TeamsFilters) => {
    setFilters(prev => ({ ...prev, [key]: [] }));
  };

  const clearAll = () => setFilters({ statuses: [], seasons: [], programs: [], sports: [], genders: [] });

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const chips = buildTeamsChips(filters, { seasonOptions, programOptions, sportOptions, genderOptions });

  return (
    <aside className="tf-panel" role="region" aria-label="Filters">
      <div className="tf-header">
        <span className="tf-title">Filters</span>
        <button className="tf-close" onClick={onClose} aria-label="Close filters">
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="tf-body">
        {chips.length > 0 && (
          <div className="tf-active">
            <div className="tf-active-head">
              <span className="tf-active-count">{chips.length} Active</span>
              <button className="tf-clear" onClick={clearAll}>Clear All</button>
            </div>
            <div className="tf-chips">
              {chips.map(c => (
                <span key={c.key} className="tf-chip">
                  {c.label}
                  <button className="tf-chip-x" onClick={() => clearGroup(c.key)} aria-label={`Remove ${c.label}`}>
                    <CloseIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="tf-section">
          <button className="tf-section-head" onClick={() => toggleCollapse('statuses')} aria-expanded={!collapsed.has('statuses')}>
            <span className={`tf-chevron${collapsed.has('statuses') ? ' tf-chevron--collapsed' : ''}`}><ChevronIcon /></span>
            Status
          </button>
          {!collapsed.has('statuses') && (
            <PillGroup options={TEAM_STATUS_OPTIONS} selected={filters.statuses} onToggle={v => toggle('statuses', v)} />
          )}
        </div>

        <div className="tf-section">
          <button className="tf-section-head" onClick={() => toggleCollapse('seasons')} aria-expanded={!collapsed.has('seasons')}>
            <span className={`tf-chevron${collapsed.has('seasons') ? ' tf-chevron--collapsed' : ''}`}><ChevronIcon /></span>
            Season
          </button>
          {!collapsed.has('seasons') && (
            <PillGroup options={seasonOptions} selected={filters.seasons} onToggle={v => toggle('seasons', v)} />
          )}
        </div>

        <div className="tf-section">
          <button className="tf-section-head" onClick={() => toggleCollapse('programs')} aria-expanded={!collapsed.has('programs')}>
            <span className={`tf-chevron${collapsed.has('programs') ? ' tf-chevron--collapsed' : ''}`}><ChevronIcon /></span>
            Program
          </button>
          {!collapsed.has('programs') && (
            <PillGroup options={programOptions} selected={filters.programs} onToggle={v => toggle('programs', v)} />
          )}
        </div>

        <div className="tf-section">
          <button className="tf-section-head" onClick={() => toggleCollapse('sports')} aria-expanded={!collapsed.has('sports')}>
            <span className={`tf-chevron${collapsed.has('sports') ? ' tf-chevron--collapsed' : ''}`}><ChevronIcon /></span>
            Sport
          </button>
          {!collapsed.has('sports') && (
            <PillGroup options={sportOptions} selected={filters.sports} onToggle={v => toggle('sports', v)} />
          )}
        </div>

        <div className="tf-section">
          <button className="tf-section-head" onClick={() => toggleCollapse('genders')} aria-expanded={!collapsed.has('genders')}>
            <span className={`tf-chevron${collapsed.has('genders') ? ' tf-chevron--collapsed' : ''}`}><ChevronIcon /></span>
            Gender
          </button>
          {!collapsed.has('genders') && (
            <PillGroup options={genderOptions} selected={filters.genders} onToggle={v => toggle('genders', v)} />
          )}
        </div>
      </div>

      <style jsx>{`
        .tf-panel {
          width: 280px;
          height: 100%;
          flex-shrink: 0;
          background: var(--u-color-background-container, #fefefe);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .tf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
        }
        .tf-title {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .tf-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: none;
          border-radius: 4px;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .tf-close:hover { background: var(--u-color-background-canvas, #eff0f0); }

        .tf-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 16px;
        }

        .tf-active {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tf-active-head { display: flex; align-items: center; justify-content: space-between; }
        .tf-active-count {
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .tf-clear {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: var(--u-font-body); font-size: 13px; font-weight: 600;
          color: var(--u-color-link-foreground, #0273e3);
        }
        .tf-clear:hover { text-decoration: underline; }
        .tf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .tf-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px 4px 10px;
          border-radius: 9999px;
          background: var(--u-color-background-canvas, #eff0f0);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
        }
        .tf-chip-x {
          display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px; border: none; border-radius: 50%;
          background: none; color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer; flex-shrink: 0;
        }
        .tf-chip-x:hover { background: rgba(0,0,0,0.08); color: var(--u-color-base-foreground-contrast, #071c31); }

        .tf-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          padding-top: 18px;
        }
        .tf-section:first-child {
          border-top: none;
          padding-top: 0;
        }
        .tf-section-head {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .tf-chevron {
          display: inline-flex;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: transform 0.15s ease;
        }
        .tf-chevron--collapsed {
          transform: rotate(-90deg);
        }
      `}</style>
    </aside>
  );
}
