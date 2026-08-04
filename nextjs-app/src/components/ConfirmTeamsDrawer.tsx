'use client';

import { useEffect, useCallback, useState } from 'react';
import type { TeamWithStats } from '@/lib/actions/teams';
import Button from './Button';
import Checkbox from './Checkbox';

// ─── Mock athlete data for prototype ──────────────────────────────────────────
const ATHLETE_POOL = [
  { name: 'Amy Moore',       dob: 'Jan 10, 2007', initials: 'AM', status: 'Accepted' },
  { name: 'James Carter',    dob: 'Mar 14, 2008', initials: 'JC', status: 'Accepted' },
  { name: 'Sofia Rodriguez', dob: 'Jul 22, 2007', initials: 'SR', status: 'Accepted' },
  { name: 'Noah Kim',        dob: 'Nov 5,  2008', initials: 'NK', status: 'Accepted' },
  { name: 'Emma Davis',      dob: 'Feb 8,  2007', initials: 'ED', status: 'Accepted' },
  { name: 'Liam Johnson',    dob: 'Sep 3,  2008', initials: 'LJ', status: 'Accepted' },
  { name: 'Olivia Brown',    dob: 'Apr 19, 2007', initials: 'OB', status: 'Accepted' },
  { name: 'Ethan Wilson',    dob: 'Dec 7,  2008', initials: 'EW', status: 'Accepted' },
];

function getAthletes(teamIdx: number, count: number) {
  const result = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    result.push(ATHLETE_POOL[(teamIdx * 3 + i) % ATHLETE_POOL.length]);
  }
  return result;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TeamAvatar({ title, avatar }: { title: string; avatar: string | null }) {
  const initials = title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatar) {
    return (
      <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#38434f',
      color: '#fff', fontFamily: 'var(--u-font-body)', fontSize: 11,
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: '0.3px',
    }}>
      {initials}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function AthletAvatar({ initials }: { initials: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#38434f',
        color: '#fff',
        fontFamily: 'var(--u-font-body)',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        letterSpacing: '0.3px',
      }}
    >
      {initials}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Assigned: { bg: '#e0e1e1', color: '#36485c' },
  Invited:  { bg: '#e7f3fd', color: '#085bb4' },
  Declined: { bg: '#fde8e8', color: '#c81e1e' },
  Accepted: { bg: '#e3f9e5', color: '#1a6831' },
};

function StatusBadge({ status }: { status: string }) {
  const { bg, color } = STATUS_COLORS[status] ?? STATUS_COLORS.Assigned;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 4,
        background: bg,
        color,
        fontFamily: 'var(--u-font-body)',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ConfirmTeamsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamIds: string[]) => Promise<void>;
  teams: TeamWithStats[];
  seasonName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConfirmTeamsDrawer({
  isOpen,
  onClose,
  onConfirm,
  teams,
  seasonName,
}: ConfirmTeamsDrawerProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  // First team expanded by default
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  // Which teams the user wants to confirm — all selected by default
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync expanded + selected state when teams change or drawer opens
  useEffect(() => {
    if (isOpen && teams.length > 0) {
      setExpandedIds([teams[0].id]);
      setSelectedIds(teams.map(t => t.id));
    }
  }, [isOpen, teams]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const toggleTeam = (id: string) =>
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`ctd-backdrop ${isOpen ? 'ctd-backdrop--open' : ''}`}
        onClick={onClose}
      />

      {/* ── Drawer (slides from left) ── */}
      <div className={`ctd-drawer ${isOpen ? 'ctd-drawer--open' : ''}`} role="dialog" aria-modal="true" aria-label="Confirm Teams">

        {/* Header */}
        <div className="ctd-header">
          <span className="ctd-title">Confirm Teams</span>
          <button className="ctd-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="ctd-body">
          <p className="ctd-description">
            Review your rosters, then confirm your teams. This notifies your Hudl account manager, who will contact you to complete team setup.
          </p>

          <div className="ctd-team-list">
            {teams.length === 0 ? (
              <p className="ctd-empty">No teams selected.</p>
            ) : (
              teams.map((team, teamIdx) => {
                const isExpanded = expandedIds.includes(team.id);
                const athletes = getAthletes(teamIdx, team.rosterCount || 5);
                // Fake stat split for prototype
                const invited  = teamIdx === 0 ? 4 : 0;
                const declined = teamIdx === 0 ? 1 : 0;
                const accepted = 0;
                const assigned = (team.rosterCount || 0) - invited - declined;

                return (
                  <div key={team.id} className="ctd-team-card">
                    {/* Team header row — checkbox to select, rest toggles expand/collapse */}
                    <div className="ctd-team-header-row">
                      <span className="ctd-team-check">
                        <Checkbox
                          checked={selectedIds.includes(team.id)}
                          onChange={() => toggleSelect(team.id)}
                        />
                      </span>
                      <button
                        className="ctd-team-header"
                        onClick={() => toggleTeam(team.id)}
                        aria-expanded={isExpanded}
                      >
                        <TeamAvatar title={team.title} avatar={team.avatar} />
                        <div className="ctd-team-info">
                          <div className="ctd-team-name-row">
                            <span className="ctd-team-name">{team.title}</span>
                            <span className={`ctd-status-pill ctd-status-pill--${team.status.toLowerCase()}`}>{team.status}</span>
                          </div>
                          <div className="ctd-team-stats">
                            <span>Assigned: <strong>{assigned}</strong></span>
                            <span>Invited: <strong>{invited}</strong></span>
                            <span>Accepted: <strong>{accepted}</strong></span>
                            <span>Declined: <strong>{declined}</strong></span>
                          </div>
                        </div>
                        <span className="ctd-chevron">
                          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </span>
                      </button>
                    </div>

                    {/* Athlete list (expanded only) */}
                    {isExpanded && (
                      <div className="ctd-athlete-list">
                        {athletes.map((athlete, i) => (
                          <div key={i} className="ctd-athlete-card">
                            <AthletAvatar initials={athlete.initials} />
                            <div className="ctd-athlete-info">
                              <span className="ctd-athlete-name">{athlete.name}</span>
                              <span className="ctd-athlete-dob">{athlete.dob}</span>
                            </div>
                            <StatusBadge status={athlete.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ctd-footer">
          <Button
            buttonStyle="standard"
            buttonType="primary"
            size="medium"
            isInactive={isConfirming || selectedIds.length === 0}
            onClick={async () => {
              setIsConfirming(true);
              await onConfirm(selectedIds);
              setIsConfirming(false);
            }}
          >
            Confirm {selectedIds.length} {selectedIds.length === 1 ? 'Team' : 'Teams'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        /* ── Backdrop ── */
        .ctd-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 28, 49, 0.4);
          z-index: 200;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .ctd-backdrop--open {
          opacity: 1;
          pointer-events: auto;
        }

        /* ── Drawer ── */
        .ctd-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 469px;
          max-width: 90vw;
          background: var(--u-color-background-callout, #f8f8f9);
          box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12), -16px 0 64px rgba(0, 0, 0, 0.08);
          z-index: 201;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .ctd-drawer--open {
          transform: translateX(0);
        }

        /* ── Header ── */
        .ctd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px;
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .ctd-title {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          line-height: 1.2;
        }
        .ctd-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .ctd-close:hover {
          background: var(--u-color-background-canvas, #eff0f0);
        }

        /* ── Body ── */
        .ctd-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ctd-description {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
          margin: 0;
        }
        .ctd-empty {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          text-align: center;
          padding: 32px 0;
          margin: 0;
        }

        /* ── Team list ── */
        .ctd-team-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ── Team card ── */
        .ctd-team-card {
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          overflow: hidden;
        }
        .ctd-team-header-row {
          display: flex;
          align-items: center;
        }
        .ctd-team-check {
          display: flex;
          align-items: center;
          padding-left: 14px;
          flex-shrink: 0;
        }
        .ctd-team-header {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          padding: 14px 16px 14px 10px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 8px;
          transition: background 0.12s ease;
        }
        .ctd-team-header:hover {
          background: var(--u-color-background-canvas, #eff0f0);
        }
        .ctd-team-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ctd-team-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .ctd-team-name {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ctd-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .ctd-status-pill--draft    { background: #fef3c7; color: #92400e; }
        .ctd-status-pill--active   { background: #e3f9e5; color: #1a6831; }
        .ctd-status-pill--pending  { background: #dbeafe; color: #1e40af; }
        .ctd-status-pill--archived { background: #e8eaec; color: #607081; }
        .ctd-team-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
        }
        .ctd-team-stats strong {
          font-weight: 700;
        }
        .ctd-chevron {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--u-color-base-foreground, #36485c);
          flex-shrink: 0;
        }

        /* ── Athlete list ── */
        .ctd-athlete-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px 16px;
        }
        .ctd-athlete-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--u-color-background-callout, #f8f8f9);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
        }
        .ctd-athlete-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .ctd-athlete-name {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ctd-athlete-dob {
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
        }

        /* ── Footer ── */
        .ctd-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 16px;
          background: var(--u-color-background-container, #fefefe);
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
