'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Select from '@/components/Select';
import Button from '@/components/Button';
import ConfirmTeamsDrawer from '@/components/ConfirmTeamsDrawer';
import type { ProgramWithStats } from '@/lib/actions/programs';
import type { TeamWithStats } from '@/lib/actions/teams';

// ─── Mock roster (prototype) ─────────────────────────────────────────────────

interface Athlete {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  primaryContact: string;
  regOption: string;
  regDate: string;
  paidToDate: string;
  fees: string;
  discounts: string;
  refunded: string;
  outstanding: string;
  paymentStatus: 'Completed' | 'Outstanding' | 'Overdue';
  team: string;
  rosterStatus: 'Accepted' | 'Invited' | 'Declined';
}

const MOCK_ROSTER: Athlete[] = [
  { id: 'a1', name: 'Caroline Murray',  birthDate: 'Aug 19, 2006', gender: 'Female', primaryContact: 'Mary Murray',    regOption: 'Fall Tryout 2026', regDate: 'Jul 30, 2026', paidToDate: '$500.00',  fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$3,300.00', paymentStatus: 'Outstanding', team: '16 Alpine', rosterStatus: 'Accepted' },
  { id: 'a2', name: 'Shannon Dohrman',  birthDate: 'Aug 7, 2006',  gender: 'Female', primaryContact: 'Julie Dohrman',  regOption: 'Fall Tryout 2026', regDate: 'Jul 30, 2026', paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '16 Alpine', rosterStatus: 'Accepted' },
  { id: 'a3', name: 'Taylor Smith',     birthDate: 'Aug 10, 2006', gender: 'Female', primaryContact: 'Alexis Smith',   regOption: 'Fall Tryout 2026', regDate: 'Aug 1, 2026',  paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '17 Elite',  rosterStatus: 'Accepted' },
  { id: 'a4', name: 'Alexis Chen',      birthDate: 'Aug 9, 2006',  gender: 'Female', primaryContact: 'Taylor Chen',    regOption: 'Fall Tryout 2026', regDate: 'Aug 1, 2026',  paidToDate: '$500.00',  fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$3,300.00', paymentStatus: 'Outstanding', team: '17 Elite',  rosterStatus: 'Invited' },
  { id: 'a5', name: 'Kayla Johnson',    birthDate: 'Aug 23, 2006', gender: 'Female', primaryContact: 'Tammy Johnson',  regOption: 'Fall Tryout 2026', regDate: 'Aug 2, 2026',  paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '16 Blue',   rosterStatus: 'Invited' },
  { id: 'a6', name: 'Jamie Wong',       birthDate: 'Aug 4, 2006',  gender: 'Female', primaryContact: 'Chen Wong',      regOption: 'Fall Tryout 2026', regDate: 'Aug 2, 2026',  paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '16 Blue',   rosterStatus: 'Accepted' },
  { id: 'a7', name: 'Riley Thompson',   birthDate: 'Aug 10, 2006', gender: 'Female', primaryContact: 'Morgan Thompson',regOption: 'Fall Tryout 2026', regDate: 'Aug 3, 2026',  paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '16 Alpine', rosterStatus: 'Accepted' },
  { id: 'a8', name: 'Morgan Patel',     birthDate: 'Aug 6, 2006',  gender: 'Female', primaryContact: 'Jordan Patel',   regOption: 'Fall Tryout 2026', regDate: 'Aug 3, 2026',  paidToDate: '$0.00',    fees: '—',      discounts: '—', refunded: '—', outstanding: '$3,800.00', paymentStatus: 'Overdue',    team: '17 Elite',  rosterStatus: 'Declined' },
  { id: 'a9', name: 'Sydney Kim',       birthDate: 'Aug 8, 2006',  gender: 'Female', primaryContact: 'Pam Kim',        regOption: 'Fall Tryout 2026', regDate: 'Aug 4, 2026',  paidToDate: '$3,800.00', fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$0.00',      paymentStatus: 'Completed',  team: '16 Blue',   rosterStatus: 'Accepted' },
  { id: 'a10', name: 'Dakota Rivers',   birthDate: 'Aug 19, 2006', gender: 'Female', primaryContact: 'Jamie Rivers',   regOption: 'Fall Tryout 2026', regDate: 'Aug 4, 2026',  paidToDate: '$500.00',  fees: '$20.29', discounts: '—', refunded: '—', outstanding: '$3,300.00', paymentStatus: 'Outstanding', team: '16 Alpine', rosterStatus: 'Invited' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'refunded', label: 'Refunded' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateRange(eventDates: { start?: string; end?: string }) {
  const s = eventDates.start ? new Date(eventDates.start) : null;
  const e = eventDates.end ? new Date(eventDates.end) : null;
  if (s && e) return `${format(s, 'MMM d, yyyy')} - ${format(e, 'MMM d, yyyy')}`;
  if (s) return format(s, 'MMM d, yyyy');
  if (e) return format(e, 'MMM d, yyyy');
  return '—';
}

function formatType(type: string) {
  const map: Record<string, string> = {
    'tryout': 'Tryout',
    'team-dues': 'Club Dues',
    'team dues': 'Club Dues',
    'season': 'Season',
    'one-time-registration': 'One-Time Registration',
    'camp': 'Camp',
    'clinic': 'Clinic',
    'tournament': 'Tournament',
  };
  return map[type.toLowerCase()] || type;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const MOCK_FIRST = ['Jake','Tyler','Marcus','Aiden','Devon','Jordan','Caleb','Noah','Liam','Ethan','Owen','Ryan','Mason','Logan','Carter','Hunter','Chase','Brayden','Nolan','Gavin','Alex','Sam','Chris','Danny','Kyle','Blake','Cole','Dylan','Evan','Finn'];
const MOCK_LAST = ['Miller','Brown','Wilson','Clark','Lewis','Smith','Taylor','Park','Kim','Reed','Hall','Ford','Adams','Davis','Nash','Vance','Gray','Evans','Ibarra','Owen','Jones','Quinn','Upton','Young','Zhao','Baker','Cruz','Dixon','Ellis','Fox'];

function pickNames(seed: number, count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const fi = (seed + i * 7) % MOCK_FIRST.length;
    const li = (seed + i * 11 + 3) % MOCK_LAST.length;
    names.push(`${MOCK_FIRST[fi]} ${MOCK_LAST[li]}`);
  }
  return names;
}

function NameTooltip({ count, names, items }: { count: number; names?: string[]; items?: { name: string; status: string }[] }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  function handleMouseEnter() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setTipPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
  }

  const STATUS_COLOR: Record<string, string> = {
    accepted: '#22c55e',
    declined: '#ef4444',
    invited:  '#60a5fa',
    assigned: '#94a3b8',
    paid:     '#86efac',
  };

  return (
    <span ref={wrapRef} className="nt-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={() => setTipPos(null)}>
      {count}
      {tipPos && (
        <div className="nt-tip" style={{ top: tipPos.top, left: tipPos.left }}>
          {items
            ? items.map((item, i) => (
                <div key={i} className="nt-row nt-row--status">
                  <span className="nt-name">{item.name}</span>
                  <span className="nt-badge" style={{ background: STATUS_COLOR[item.status.toLowerCase()] ?? '#94a3b8' }}>{item.status}</span>
                </div>
              ))
            : (names ?? []).map((n, i) => <div key={i} className="nt-row">{n}</div>)
          }
        </div>
      )}
      <style jsx>{`
        .nt-wrap { position: relative; display: inline-block; cursor: default; }
        .nt-tip {
          position: fixed;
          transform: translateX(-50%);
          background: var(--u-color-base-foreground-contrast, #071c31);
          color: #fff;
          border-radius: 6px;
          padding: 8px 12px;
          min-width: 160px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          z-index: 9999;
          white-space: nowrap;
          pointer-events: none;
        }
        .nt-row {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.8;
          text-align: left;
        }
        .nt-row--status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .nt-name { flex: 1; }
        .nt-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #071c31;
          flex-shrink: 0;
        }
      `}</style>
    </span>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 7.25v3.25M8 5.4h.006" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SortArrow() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4, color: 'var(--u-color-base-foreground-subtle, #85909e)' }}>
      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`pd-toggle${checked ? ' pd-toggle--on' : ''}`}>
      <span className="pd-knob" />
      <style jsx>{`
        .pd-toggle {
          width: 40px;
          height: 22px;
          border-radius: 9999px;
          padding: 3px;
          border: none;
          background: var(--u-color-line-default, #85909e);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .pd-toggle--on {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          justify-content: flex-end;
        }
        .pd-knob {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #fff;
          flex-shrink: 0;
        }
      `}</style>
    </button>
  );
}

// ─── Stat group ──────────────────────────────────────────────────────────────

function StatGroup({
  label,
  value,
  labelInfo,
  rows,
}: {
  label: string;
  value: string;
  labelInfo?: boolean;
  rows: { label: string; value: string; info?: boolean }[];
}) {
  return (
    <div className="sg">
      <div className="sg-head">
        <span className="sg-label">{label}</span>
        {labelInfo && <span className="sg-info"><InfoIcon /></span>}
      </div>
      <span className="sg-value">{value}</span>
      <div className="sg-rows">
        {rows.map((r, i) => (
          <div key={i} className="sg-row">
            <span className="sg-row-label">
              {r.label}
              {r.info && <span className="sg-info"><InfoIcon /></span>}
            </span>
            <span className="sg-dots" />
            <span className="sg-row-value">{r.value}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .sg {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sg-head {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sg-label {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sg-info {
          display: inline-flex;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sg-value {
          font-family: var(--font-barlow), 'Barlow', sans-serif;
          font-size: 44px;
          font-weight: 700;
          font-style: italic;
          line-height: 1.1;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin-bottom: 8px;
        }
        .sg-rows {
          display: flex;
          flex-direction: column;
        }
        .sg-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 3px 0;
        }
        .sg-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
        }
        .sg-dots {
          flex: 1;
          border-bottom: 1px dotted var(--u-color-line-default, #c4c6c8);
          transform: translateY(-3px);
        }
        .sg-row-value {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProgramDetailPageClient({
  programId,
  programs,
}: {
  programId: string;
  programs: ProgramWithStats[];
}) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramWithStats | null>(
    () => programs.find(p => p.id === programId) ?? null
  );
  const [openRegistration, setOpenRegistration] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'teams-list' | 'teams' | 'athletes'>('overview');
  const [drawerTeam, setDrawerTeam] = useState<TeamWithStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [teamsViewMode, setTeamsViewMode] = useState<'teams' | 'athletes'>('teams');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailIncludeAcceptDecline, setEmailIncludeAcceptDecline] = useState(false);
  const [emailExpirationEnabled, setEmailExpirationEnabled] = useState(false);
  const [emailExpirationDate, setEmailExpirationDate] = useState('');
  const [emailExpirationTime, setEmailExpirationTime] = useState('5:00 PM');
  const emailEditorRef = useRef<HTMLDivElement>(null);

  // Resolve builder-created programs stored locally when not found server-side
  useEffect(() => {
    if (program) {
      setOpenRegistration(program.registrationStatus === 'open');
      return;
    }
    try {
      const raw = localStorage.getItem('createdPrograms');
      const created = raw ? (JSON.parse(raw) as ProgramWithStats[]) : [];
      const found = created.find(p => p.id === programId) ?? null;
      if (found) {
        setProgram(found);
        setOpenRegistration(found.registrationStatus === 'open');
      }
    } catch {
      // ignore
    }
  }, [program, programId]);

  const rows = MOCK_ROSTER.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return a.name.toLowerCase().includes(q) || a.primaryContact.toLowerCase().includes(q);
  });

  const allSelected = rows.length > 0 && rows.every(r => selected.includes(r.id));
  const toggleAll = () => setSelected(allSelected ? [] : rows.map(r => r.id));
  const toggleOne = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const title = program?.title ?? 'Program';
  const type = program ? formatType(program.type) : '—';
  const dateRange = program ? formatDateRange(program.eventDates) : '—';
  const registrants = program?.registrantCount ?? 0;
  const value = program ? formatCurrency(program.programValue) : '$0.00';
  const isTryout = (program?.type ?? '').toLowerCase() === 'tryout';
  const isClubDues = ['club dues', 'team-dues', 'team dues'].includes((program?.type ?? '').toLowerCase());

  const regOptions = [
    {
      id: 'r1',
      name: isTryout ? 'Tryout Registration' : 'Full Season Dues',
      price: isTryout ? 5000 : 45000,
      registered: registrants,
      status: openRegistration ? 'Open' : 'Closed',
    },
    ...(isTryout
      ? []
      : [
          {
            id: 'r2',
            name: 'Monthly Payment Plan',
            price: 9000,
            registered: 0,
            status: openRegistration ? 'Open' : 'Closed',
          },
        ]),
  ];

  const programTeams = [
    { id: 't1', name: '8U Black',  status: 'Draft',  season: 'Fall 2025–2026', gender: 'Male', sport: 'Football', athletes: 12, coaches: 2, assigned: 12, invited: 14, accepted: 12, declined: 2,  paid: 10,
      coachNames: pickNames(100, 2), athleteNames: pickNames(0, 12), assignedNames: pickNames(0, 12), invitedNames: pickNames(0, 14), acceptedNames: pickNames(0, 12), declinedNames: pickNames(12, 2), paidNames: pickNames(0, 10) },
    { id: 't2', name: '10U Gold',  status: 'Draft',  season: 'Fall 2025–2026', gender: 'Male', sport: 'Football', athletes: 12, coaches: 3, assigned: 12, invited: 15, accepted: 12, declined: 3,  paid: 11,
      coachNames: pickNames(103, 3), athleteNames: pickNames(5, 12), assignedNames: pickNames(5, 12), invitedNames: pickNames(5, 15), acceptedNames: pickNames(5, 12), declinedNames: pickNames(17, 3), paidNames: pickNames(5, 11) },
    { id: 't3', name: '12U Blue',  status: 'Draft',  season: 'Fall 2025–2026', gender: 'Coed', sport: 'Football', athletes: 10, coaches: 2, assigned: 10, invited: 12, accepted: 10, declined: 2,  paid:  8,
      coachNames: pickNames(106, 2), athleteNames: pickNames(10, 10), assignedNames: pickNames(10, 10), invitedNames: pickNames(10, 12), acceptedNames: pickNames(10, 10), declinedNames: pickNames(20, 2), paidNames: pickNames(10, 8) },
    { id: 't4', name: '14U Red',   status: 'Active', season: 'Fall 2025–2026', gender: 'Male', sport: 'Football', athletes: 11, coaches: 1, assigned: 11, invited: 13, accepted: 11, declined: 2,  paid: 11,
      coachNames: pickNames(108, 1), athleteNames: pickNames(15, 11), assignedNames: pickNames(15, 11), invitedNames: pickNames(15, 13), acceptedNames: pickNames(15, 11), declinedNames: pickNames(26, 2), paidNames: pickNames(15, 11) },
  ];

  const teamStatAthletes = programTeams.reduce((sum, t) => sum + t.athletes, 0);
  const teamStatInvited = programTeams.reduce((sum, t) => sum + t.invited, 0);
  const teamStatAccepted = programTeams.reduce((sum, t) => sum + t.accepted, 0);
  const teamStatDeclined = programTeams.reduce((sum, t) => sum + t.declined, 0);
  const teamStatPaid = programTeams.reduce((sum, t) => sum + t.paid, 0);

  const athleteRows = programTeams.flatMap((team, teamIdx) => [
    ...team.acceptedNames.map((name: string, i: number) => ({ id: `${team.id}-acc-${i}`, name, teamName: team.name, status: 'Accepted' as const, primaryContact: pickNames(teamIdx * 50 + i * 3 + 200, 1)[0] })),
    ...team.declinedNames.map((name: string, i: number) => ({ id: `${team.id}-dec-${i}`, name, teamName: team.name, status: 'Declined' as const, primaryContact: pickNames(teamIdx * 50 + i * 3 + 250, 1)[0] })),
  ]);

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <button className="pd-crumb" onClick={() => router.push('/programs')}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Programs</span>
        <span className="pd-crumb-sep">/</span>
      </button>

      {/* Header */}
      <div className="pd-header">
        <div className="pd-header-left">
          <h1 className="pd-title">{title}</h1>
          <p className="pd-subtitle">{type} · {dateRange}</p>
        </div>
        <div className="pd-header-right">
          <span className="pd-reg-info"><InfoIcon /></span>
          <span className="pd-reg-label">Open Registration</span>
          <Toggle checked={openRegistration} onChange={setOpenRegistration} />
          <Button buttonStyle="standard" buttonType="primary" size="medium" onClick={() => router.push(`/teams/assignments?returnTo=/programs/${programId}`)}>
            Assign Athletes
          </Button>
          <button className="pd-more" aria-label="More options">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="13" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="pd-tabs-row">
      <div className="pd-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`pd-tab${activeTab === 'overview' ? ' pd-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'registrations'}
          className={`pd-tab${activeTab === 'registrations' ? ' pd-tab--active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          Registration Options
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'teams-list'}
          className={`pd-tab${activeTab === 'teams-list' ? ' pd-tab--active' : ''}`}
          onClick={() => setActiveTab('teams-list')}
        >
          Teams
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'teams'}
          className={`pd-tab${activeTab === 'teams' ? ' pd-tab--active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Assignments
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'athletes'}
          className={`pd-tab${activeTab === 'athletes' ? ' pd-tab--active' : ''}`}
          onClick={() => setActiveTab('athletes')}
        >
          Athletes
        </button>
      </div>
      </div>

      {activeTab === 'overview' && (
      <>
      {/* Draft teams nudge (tryout only) */}
      {isTryout && (
        <div className="pd-banner" role="status">
          <div className="pd-banner-main">
            <span className="pd-banner-icon"><InfoIcon /></span>
            <span className="pd-banner-text">
              All done with tryouts? Create your draft teams now to assign athletes
            </span>
          </div>
          <button className="pd-banner-btn" onClick={() => router.push('/teams/manage?context=tryout')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Teams
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="pd-stats">
        <StatGroup
          label="Registrants"
          value={String(registrants)}
          rows={[
            { label: 'Overdue', value: '0' },
            { label: 'Overdue Amount', value: '$0.00' },
            { label: 'Completed', value: String(registrants), info: true },
          ]}
        />
        <StatGroup
          label="Registration Value"
          labelInfo
          value={value}
          rows={[
            { label: 'Paid to Date', value },
            { label: 'Outstanding', value: '$0.00' },
            { label: 'Refunded', value: '$0.00' },
          ]}
        />
      </div>

      {/* Toolbar */}
      <div className="pd-toolbar">
        <div className="pd-status">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <div className="pd-toolbar-right">
          <div className="pd-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="pd-search-input"
              placeholder="Search for…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="pd-download">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="pd-table-scroll">
      <div className="pd-table">
        <div className="pd-row pd-row--head">
          <div className="pd-cell pd-cell--check">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
          </div>
          <div className="pd-cell pd-cell--name">Athlete Name <SortArrow /></div>
          <div className="pd-cell pd-cell--birth">Birth Date <SortArrow /></div>
          <div className="pd-cell pd-cell--gender">Gender <SortArrow /></div>
          <div className="pd-cell pd-cell--contact">Primary Contact <SortArrow /></div>
          <div className="pd-cell pd-cell--reg-option">Registration Option <SortArrow /></div>
          <div className="pd-cell pd-cell--reg-date">Reg. Date <SortArrow /></div>
          <div className="pd-cell pd-cell--money">Paid to Date <SortArrow /></div>
          <div className="pd-cell pd-cell--money">Fees <SortArrow /></div>
          <div className="pd-cell pd-cell--money">Discounts <SortArrow /></div>
          <div className="pd-cell pd-cell--money">Refunded <SortArrow /></div>
          <div className="pd-cell pd-cell--money">Outstanding <SortArrow /></div>
          <div className="pd-cell pd-cell--team">Team <SortArrow /></div>
          <div className="pd-cell pd-cell--pstatus">Status <SortArrow /></div>
        </div>
        {rows.map(a => {
          const isSel = selected.includes(a.id);
          return (
            <div
              key={a.id}
              className={`pd-row${isSel ? ' pd-row--selected' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/programs/${programId}/registrants/${a.id}`)}
            >
              <div className="pd-cell pd-cell--check" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isSel} onChange={() => toggleOne(a.id)} aria-label={`Select ${a.name}`} />
              </div>
              <div className="pd-cell pd-cell--name pd-cell--emphasis">{a.name}</div>
              <div className="pd-cell pd-cell--birth">{a.birthDate}</div>
              <div className="pd-cell pd-cell--gender">{a.gender}</div>
              <div className="pd-cell pd-cell--contact">{a.primaryContact}</div>
              <div className="pd-cell pd-cell--reg-option">{a.regOption}</div>
              <div className="pd-cell pd-cell--reg-date">{a.regDate}</div>
              <div className="pd-cell pd-cell--money">{a.paidToDate}</div>
              <div className="pd-cell pd-cell--money">{a.fees}</div>
              <div className="pd-cell pd-cell--money">{a.discounts}</div>
              <div className="pd-cell pd-cell--money">{a.refunded}</div>
              <div className="pd-cell pd-cell--money">{a.outstanding}</div>
              <div className="pd-cell pd-cell--team">{a.team}</div>
              <div className="pd-cell pd-cell--pstatus">
                <span className={`pd-pstatus pd-pstatus--${a.paymentStatus.toLowerCase()}`}>
                  {a.paymentStatus === 'Completed' && (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {a.paymentStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
      </>
      )}

      {/* Registration Options tab */}
      {activeTab === 'registrations' && (
        <div className="pd-reg-panel">
          <div className="pd-table-scroll">
          <div className="pd-table">
            <div className="pd-row pd-row--head">
              <div className="pd-cell pd-cell--name">Name <SortArrow /></div>
              <div className="pd-cell pd-cell--pstatus">Status <SortArrow /></div>
              <div className="pd-cell pd-cell--reg-option">Date Range <SortArrow /></div>
              <div className="pd-cell pd-cell--money">Registered <SortArrow /></div>
              <div className="pd-cell pd-cell--money">Price <SortArrow /></div>
            </div>
            {regOptions.map(opt => (
              <div key={opt.id} className="pd-row">
                <div className="pd-cell pd-cell--name pd-cell--emphasis">{opt.name}</div>
                <div className="pd-cell pd-cell--pstatus">
                  <span className={`pd-reg-pill pd-reg-pill--${opt.status.toLowerCase()}`}>{opt.status}</span>
                </div>
                <div className="pd-cell pd-cell--reg-option">{dateRange}</div>
                <div className="pd-cell pd-cell--money">{opt.registered}</div>
                <div className="pd-cell pd-cell--money">{formatCurrency(opt.price)}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Teams list tab */}
      {activeTab === 'teams-list' && (
        <div className="pd-reg-panel">
          <div className="pd-teams-list">
            {['Draft', 'Active'].map(statusGroup => {
              const grouped = programTeams.filter(t => t.status === statusGroup);
              if (!grouped.length) return null;
              return (
                <div key={statusGroup} className="pd-tl-group">
                  <div className="pd-tl-group-header">
                    <span className={`pd-tl-status-badge pd-tl-status-badge--${statusGroup.toLowerCase()}`}>{statusGroup}</span>
                    <span className="pd-tl-group-count">{grouped.length}</span>
                  </div>
                  {grouped.map(team => (
                    <div key={team.id} className="pd-tl-row" role="button" tabIndex={0}
                      onClick={() => setDrawerTeam({ id: team.id, title: team.name, sport: team.sport, gender: team.gender, grades: null, avatar: null, primaryColor: null, secondaryColor: null, status: team.status, tier: null, seasonId: null, rosterCount: team.athletes, maxRosterSize: null, ageMin: null, ageMax: null, coachCount: team.coaches, birthdayFrom: null, birthdayTo: null })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerTeam({ id: team.id, title: team.name, sport: team.sport, gender: team.gender, grades: null, avatar: null, primaryColor: null, secondaryColor: null, status: team.status, tier: null, seasonId: null, rosterCount: team.athletes, maxRosterSize: null, ageMin: null, ageMax: null, coachCount: team.coaches, birthdayFrom: null, birthdayTo: null }); } }}
                    >
                      <div className="pd-tl-avatar">
                        <span className="pd-tl-avatar-initials">{team.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}</span>
                      </div>
                      <div className="pd-tl-info">
                        <span className="pd-tl-name">{team.name}</span>
                        <span className="pd-tl-meta">{team.season} · {team.gender} · {team.sport}</span>
                      </div>
                      <div className="pd-tl-stats">
                        <span className="pd-tl-stat"><strong>{team.athletes}</strong> Athletes</span>
                        <span className="pd-tl-stat"><strong>{team.coaches}</strong> Coaches</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teams tab */}
      {activeTab === 'teams' && (
        <div className="pd-reg-panel">
          <div className="pd-stats">
            <StatGroup
              label="Total Invitations"
              value="75"
              rows={[
                { label: 'Invited',  value: String(teamStatInvited) },
                { label: 'Accepted', value: String(teamStatAccepted) },
                { label: 'Declined', value: String(teamStatDeclined) },
              ]}
            />
            <StatGroup
              label="Athletes"
              value={String(teamStatAthletes)}
              rows={[
                { label: 'Invited',  value: String(teamStatInvited) },
                { label: 'Accepted', value: String(teamStatAccepted) },
                { label: 'Declined', value: String(teamStatDeclined) },
              ]}
            />
          </div>
          <div className="pd-teams-scroll"><div className="pd-teams-table">
              <div className="pd-tt-row pd-tt-header">
                <div className="pd-tt-cell pd-tt-name"><span>Team Name</span></div>
                <div className="pd-tt-cell pd-tt-flex"><span>Season</span></div>
                <div className="pd-tt-cell pd-tt-flex"><span>Gender</span></div>
                <div className="pd-tt-cell pd-tt-num"><span>Players Assigned</span></div>
              </div>
              {programTeams.map(team => (
                <div
                  key={team.id}
                  className="pd-tt-row pd-tt-data"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDrawerTeam({ id: team.id, title: team.name, sport: team.sport, gender: team.gender, grades: null, avatar: null, primaryColor: null, secondaryColor: null, status: team.status, tier: null, seasonId: null, rosterCount: team.athletes, maxRosterSize: null, ageMin: null, ageMax: null, coachCount: team.coaches, birthdayFrom: null, birthdayTo: null })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerTeam({ id: team.id, title: team.name, sport: team.sport, gender: team.gender, grades: null, avatar: null, primaryColor: null, secondaryColor: null, status: team.status, tier: null, seasonId: null, rosterCount: team.athletes, maxRosterSize: null, ageMin: null, ageMax: null, coachCount: team.coaches, birthdayFrom: null, birthdayTo: null }); } }}
                >
                  <div className="pd-tt-cell pd-tt-name pd-tt-emph">{team.name}</div>
                  <div className="pd-tt-cell pd-tt-flex">{team.season}</div>
                  <div className="pd-tt-cell pd-tt-flex">{team.gender}</div>
                  <div className="pd-tt-cell pd-tt-num"><NameTooltip count={team.athletes} items={[...team.acceptedNames.map((n: string) => ({ name: n, status: 'Accepted' })), ...team.declinedNames.map((n: string) => ({ name: n, status: 'Declined' }))]} /></div>
                </div>
              ))}
            </div></div>
        </div>
      )}

      {/* Athletes tab */}
      {activeTab === 'athletes' && (
        <div className="pd-reg-panel">
          <div className="pd-table-scroll">
          <div className="pd-teams-table">
            <div className="pd-tt-row pd-tt-header">
              <div className="pd-tt-cell pd-tt-check">
                <input
                  type="checkbox"
                  checked={athleteRows.length > 0 && selectedAthleteIds.length === athleteRows.length}
                  ref={(el) => { if (el) el.indeterminate = selectedAthleteIds.length > 0 && selectedAthleteIds.length < athleteRows.length; }}
                  onChange={() => setSelectedAthleteIds(selectedAthleteIds.length === athleteRows.length ? [] : athleteRows.map(a => a.id))}
                />
              </div>
              <div className="pd-tt-cell pd-tt-name"><span>Athlete</span></div>
              <div className="pd-tt-cell pd-tt-flex"><span>Primary Contact</span></div>
              <div className="pd-tt-cell pd-tt-flex"><span>Team</span></div>
              <div className="pd-tt-cell pd-tt-status"><span>Status</span></div>
            </div>
            {athleteRows.map((athlete) => {
              const isSel = selectedAthleteIds.includes(athlete.id);
              return (
                <div
                  key={athlete.id}
                  className={`pd-tt-row pd-tt-data${isSel ? ' pd-tt-data--sel' : ''}`}
                  onClick={() => setSelectedAthleteIds(prev => isSel ? prev.filter(id => id !== athlete.id) : [...prev, athlete.id])}
                >
                  <div className="pd-tt-cell pd-tt-check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => setSelectedAthleteIds(prev => isSel ? prev.filter(id => id !== athlete.id) : [...prev, athlete.id])}
                    />
                  </div>
                  <div className="pd-tt-cell pd-tt-name pd-tt-emph">{athlete.name}</div>
                  <div className="pd-tt-cell pd-tt-flex">{athlete.primaryContact}</div>
                  <div className="pd-tt-cell pd-tt-flex">{athlete.teamName}</div>
                  <div className="pd-tt-cell pd-tt-status">
                    <span className={`pd-roster-pill pd-roster-pill--${athlete.status.toLowerCase()}`}>{athlete.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pd-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        /* Breadcrumb */
        .pd-crumb {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
          align-self: flex-start;
        }
        .pd-crumb:hover { color: var(--u-color-base-foreground-contrast, #071c31); }
        .pd-crumb-sep { color: var(--u-color-base-foreground-subtle, #607081); font-weight: 400; }

        /* Header */
        .pd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
        }
        .pd-header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .pd-title {
          font-family: var(--u-font-body);
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.25px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
        }
        .pd-subtitle {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin: 0;
        }
        .pd-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .pd-reg-info { display: inline-flex; color: var(--u-color-base-foreground-subtle, #607081); }
        .pd-reg-label {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .pd-more {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          margin-left: 4px;
          transition: background 0.15s ease;
        }
        .pd-more:hover { background: #e0e1e1; }

        .pd-team-assignments {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground, #36485c);
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-team-assignments:hover { background: #e0e1e1; }

        /* Stats */
        .pd-stats {
          display: flex;
          gap: 48px;
          width: 100%;
        }

        /* Toolbar */
        .pd-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
        }
        .pd-status { width: 200px; flex-shrink: 0; }
        .pd-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
          padding: 12px 12px 12px 16px;
          background: rgba(2, 115, 227, 0.06);
          border: 1px solid rgba(2, 115, 227, 0.35);
          border-radius: 6px;
        }
        .pd-banner-main {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .pd-banner-icon {
          display: inline-flex;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          flex-shrink: 0;
        }
        .pd-banner-text {
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .pd-banner-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .pd-banner-btn:hover { background: #005bbf; }
        .pd-toolbar-right { display: flex; align-items: center; gap: 8px; }
        .pd-search {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          width: 260px;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .pd-search:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
        .pd-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          min-width: 0;
        }
        .pd-search-input::placeholder { color: var(--u-color-base-foreground-subtle, #607081); }
        .pd-download {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-background-canvas, #e0e1e1);
          color: var(--u-color-base-foreground, #36485c);
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-download:hover { background: #d0d1d2; }

        /* Table */
        .pd-table {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .pd-row {
          display: flex;
          align-items: center;
          width: 100%;
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
        }
        .pd-row--head {
          border-bottom: 2px solid var(--u-color-line-default, #85909e);
        }
        .pd-row:not(.pd-row--head) { height: 52px; }
        .pd-row:not(.pd-row--head):hover { background: var(--u-color-background-subtle, #f5f6f7); }
        .pd-row--selected { background: rgba(2, 115, 227, 0.04); }
        .pd-cell {
          padding: 8px 5px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          box-sizing: border-box;
        }
        .pd-row--head .pd-cell {
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
        }
        .pd-cell--emphasis {
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .pd-cell--check {
          width: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
          padding-right: 0;
        }
        .pd-cell--check input {
          width: 16px;
          height: 16px;
          accent-color: var(--u-color-emphasis-background-contrast, #0273e3);
          cursor: pointer;
        }
        .pd-table-scroll { width: 100%; }
        .pd-table { width: 100%; }
        .pd-cell--name { flex: 1; min-width: 0; }
        .pd-cell--birth { width: 70px; flex-shrink: 0; }
        .pd-cell--gender { width: 50px; flex-shrink: 0; }
        .pd-cell--contact { width: 100px; flex-shrink: 0; }
        .pd-cell--reg-option { width: 96px; flex-shrink: 0; }
        .pd-cell--reg-date { width: 62px; flex-shrink: 0; }
        .pd-cell--money { width: 68px; flex-shrink: 0; }
        .pd-cell--team { width: 65px; flex-shrink: 0; }
        .pd-cell--pstatus { width: 84px; flex-shrink: 0; }
        .pd-roster-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }
        .pd-roster-pill--accepted {
          background: rgba(23, 129, 67, 0.1);
          color: var(--u-color-success-foreground, #178143);
        }
        .pd-roster-pill--invited {
          background: rgba(2, 115, 227, 0.1);
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .pd-roster-pill--declined {
          background: rgba(187, 23, 0, 0.08);
          color: var(--u-color-alert-foreground, #bb1700);
        }
        .pd-pstatus {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
        }
        .pd-pstatus--completed { color: var(--u-color-success-foreground, #178143); }
        .pd-pstatus--outstanding { color: var(--u-color-base-foreground, #36485c); }
        .pd-pstatus--overdue { color: var(--u-color-alert-foreground, #bb1700); }

        /* Tabs */
        .pd-tabs-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .pd-tabs {
          display: flex;
          gap: 24px;
          flex: 1;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }
        .pd-tab {
          position: relative;
          background: none;
          border: none;
          padding: 4px 0 12px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .pd-tab:hover { color: var(--u-color-base-foreground-contrast, #071c31); }
        .pd-tab--active { color: var(--u-color-base-foreground-contrast, #071c31); }
        .pd-tab--active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-radius: 2px 2px 0 0;
        }

        /* Registration options */
        .pd-reg-panel { display: flex; flex-direction: column; gap: 16px; width: 100%; }
        .pd-reg-list { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .pd-reg-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
        }
        .pd-reg-card-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pd-reg-card-top { display: flex; align-items: center; gap: 10px; }
        .pd-reg-name {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .pd-reg-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 700;
        }
        .pd-reg-pill--open { background: #e3f9e5; color: #1a6831; }
        .pd-reg-pill--closed { background: var(--u-color-background-default, #e8eaec); color: var(--u-color-base-foreground-subtle, #607081); }
        .pd-reg-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .pd-reg-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--u-color-base-foreground-subtle, #607081);
          display: inline-block;
          flex-shrink: 0;
        }
        .pd-reg-price {
          font-family: var(--font-barlow), 'Barlow', sans-serif;
          font-size: 28px;
          font-weight: 700;
          font-style: italic;
          color: var(--u-color-base-foreground-contrast, #071c31);
          flex-shrink: 0;
        }

        /* Teams tab */
        .pd-teams-list { display: flex; flex-direction: column; gap: 24px; }
        .pd-tl-group { display: flex; flex-direction: column; gap: 4px; }
        .pd-tl-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 0 8px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          margin-bottom: 4px;
        }
        .pd-tl-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--u-font-body);
        }
        .pd-tl-status-badge--draft { background: #fef3c7; color: #92400e; }
        .pd-tl-status-badge--active { background: #e8f5e9; color: #2e7d32; }
        .pd-tl-group-count {
          font-size: 12px;
          font-weight: 500;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
        }
        .pd-tl-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .pd-tl-row:hover { background: var(--u-color-background-callout, #f8f8f9); }
        .pd-tl-avatar {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: var(--u-color-identity-default, #38434f);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pd-tl-avatar-initials {
          font-size: 12px;
          font-weight: 700;
          color: white;
          font-family: var(--u-font-body);
          text-transform: uppercase;
        }
        .pd-tl-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .pd-tl-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
          font-family: var(--u-font-body);
        }
        .pd-tl-meta {
          font-size: 12px;
          font-weight: 500;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
        }
        .pd-tl-stats {
          display: flex;
          gap: 16px;
          flex-shrink: 0;
        }
        .pd-tl-stat {
          font-size: 12px;
          font-weight: 500;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
        }
        .pd-tl-stat strong { font-weight: 700; color: var(--u-color-base-foreground, #36485c); }

        .pd-teams-head {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          width: 100%;
        }
        .pd-vt-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-right: auto;
        }
        .pd-vt-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 14px;
          border: 1.5px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 9999px;
          background: transparent;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .pd-vt-pill--active {
          background: #1a2332;
          border-color: #1a2332;
          color: #ffffff;
        }
        .pd-vt-pill:not(.pd-vt-pill--active):hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
          color: var(--u-color-base-foreground, #36485c);
        }
        .pd-teams-confirm-nudge {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .pd-teams-confirm-nudge .pd-banner-text {
          font-size: 14px;
          white-space: nowrap;
        }
        .pd-teams-count {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .pd-teams-manage {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-teams-manage:hover { background: #005bbf; }
        .pd-teams-manage--secondary {
          background: transparent;
          border: 1.5px solid var(--u-color-emphasis-background-contrast, #0273e3);
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .pd-teams-manage--secondary:hover { background: rgba(2, 115, 227, 0.06); }

        /* Teams list — styled like the Programs list */
        .pd-teams-scroll { overflow-x: auto; width: 100%; }
        .pd-teams-table { display: flex; flex-direction: column; min-width: max-content; }
        .pd-tt-row { display: flex; align-items: center; width: 100%; }
        .pd-tt-header { border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8); }
        .pd-tt-data {
          height: 52px;
          box-sizing: border-box;
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .pd-tt-data:hover { background: var(--u-color-background-subtle, #f5f6f7); }
        .pd-tt-cell {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          font-family: var(--u-font-body);
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
          color: var(--u-color-base-foreground, #36485c);
        }
        .pd-tt-header .pd-tt-cell {
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .pd-tt-name { flex: 1; min-width: 160px; }
        .pd-tt-flex { flex: 1; min-width: 80px; white-space: nowrap; }
        .pd-tt-emph { font-weight: 700; color: var(--u-color-base-foreground-contrast, #071c31); }
        .pd-tt-data .pd-tt-emph {
          text-decoration: underline;
          text-decoration-color: transparent;
          text-decoration-style: dashed;
          text-underline-offset: 4px;
          transition: text-decoration-color 0.15s ease;
        }
        .pd-tt-data:hover .pd-tt-emph { text-decoration-color: var(--u-color-line-subtle, #c4c6c8); }
        .pd-tt-status { width: 130px; flex-shrink: 0; }
        .pd-tt-num { width: 100px; flex-shrink: 0; justify-content: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
        .pd-tt-num-sm { width: 72px; flex-shrink: 0; justify-content: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
        .pd-tt-chev { width: 44px; flex-shrink: 0; justify-content: center; color: var(--u-color-base-foreground-subtle, #607081); }
        .pd-team-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
          padding: 16px 20px;
          text-align: left;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .pd-team-card:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }
        .pd-team-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 700;
        }
        .pd-team-pill--draft { background: #fef3c7; color: #92400e; }
        .pd-team-pill--active { background: #e3f9e5; color: #1a6831; }
        .pd-team-pill--pending { background: #dbeafe; color: #1e40af; }
        .pd-team-pill--archived { background: var(--u-color-background-default, #e8eaec); color: var(--u-color-base-foreground-subtle, #607081); }
        .pd-team-chevron {
          color: var(--u-color-base-foreground-subtle, #607081);
          flex-shrink: 0;
        }

        /* Athletes table checkbox column */
        .pd-tt-check { flex: 0 0 44px; justify-content: center; padding: 0 8px; }
        .pd-tt-data--sel { background: var(--u-color-background-subtle, #f5f6f7); }
        .pd-tt-data--sel:hover { background: var(--u-color-background-subtle, #f5f6f7); }
        .pd-tt-check input[type="checkbox"] { cursor: pointer; width: 16px; height: 16px; accent-color: #1a2332; }
      `}</style>

      <style jsx global>{`
        /* Email contacts action bar */
        .ec-action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 52px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 500;
        }
        .ec-action-label {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }
        .ec-action-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ec-email-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 34px;
          padding: 0 14px;
          border: none;
          border-radius: 4px;
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .ec-email-btn:hover { background: rgba(255,255,255,0.25); }
        .ec-dismiss-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          margin-left: 4px;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .ec-dismiss-btn:hover { background: rgba(255,255,255,0.15); color: #ffffff; }

        /* Email drawer overlay */
        .ec-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 600;
        }

        /* Email drawer */
        .ec-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 520px;
          background: var(--u-color-background-container, #fefefe);
          display: flex;
          flex-direction: column;
          z-index: 700;
          box-shadow: -4px 0 24px rgba(0,0,0,0.15);
        }
        .ec-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
        }
        .ec-drawer-header-left { display: flex; flex-direction: column; gap: 2px; }
        .ec-drawer-title {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .ec-drawer-count {
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .ec-drawer-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 4px;
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.12s ease;
        }
        .ec-drawer-close:hover { background: var(--u-color-background-subtle, #f5f6f7); color: var(--u-color-base-foreground-contrast, #071c31); }
        .ec-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ec-field { display: flex; flex-direction: column; gap: 6px; }
        .ec-label {
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .ec-req { color: var(--u-color-alert-foreground, #bb1700); }
        .ec-input {
          height: 38px;
          padding: 0 10px;
          border: 1.5px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          background: var(--u-color-background-container, #fefefe);
          outline: none;
          transition: border-color 0.12s ease;
        }
        .ec-input:focus { border-color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .ec-input[readonly] { background: var(--u-color-background-default, #e8eaec); color: var(--u-color-base-foreground-subtle, #607081); }
        .ec-field-note {
          margin: -8px 0 0;
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .ec-message-editor {
          border: 1.5px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          overflow: hidden;
        }
        .ec-message-editor:focus-within { border-color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .ec-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          background: var(--u-color-background-default, #f5f6f7);
        }
        .ec-toolbar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          transition: background 0.1s ease;
        }
        .ec-toolbar-btn:hover { background: var(--u-color-background-canvas, #e0e1e1); }
        .ec-toolbar-sep {
          width: 1px;
          height: 18px;
          background: var(--u-color-line-subtle, #c4c6c8);
          margin: 0 4px;
          flex-shrink: 0;
        }
        .ec-textarea {
          min-height: 200px;
          padding: 12px;
          font-family: var(--u-font-body);
          font-size: 14px;
          line-height: 1.6;
          color: var(--u-color-base-foreground-contrast, #071c31);
          outline: none;
        }
        .ec-textarea:empty::before {
          content: 'Write your message…';
          color: var(--u-color-base-foreground-subtle, #85909e);
          pointer-events: none;
        }
        .ec-toggle-card {
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          overflow: hidden;
        }
        .ec-toggle-card-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
        }
        .ec-toggle-card-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .ec-toggle-title { font-family: var(--u-font-body); font-size: 14px; font-weight: 700; color: var(--u-color-base-foreground-contrast, #071c31); }
        .ec-toggle-desc { font-family: var(--u-font-body); font-size: 12px; color: var(--u-color-base-foreground-subtle, #607081); }
        .ec-toggle {
          width: 40px; height: 22px; border-radius: 9999px; padding: 3px;
          border: none; background: var(--u-color-line-default, #85909e);
          display: flex; align-items: center; justify-content: flex-start;
          cursor: pointer; flex-shrink: 0; transition: background 0.15s ease;
        }
        .ec-toggle--on { background: var(--u-color-emphasis-background-contrast, #0273e3); justify-content: flex-end; }
        .ec-toggle-thumb { width: 16px; height: 16px; border-radius: 9999px; background: #fff; flex-shrink: 0; }
        .ec-expiry-row { display: flex; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--u-color-line-subtle, #c4c6c8); }
        .ec-expiry-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .ec-expiry-label { font-family: var(--u-font-body); font-size: 12px; font-weight: 700; color: var(--u-color-base-foreground, #36485c); }
        .ec-expiry-input, .ec-expiry-select {
          height: 34px; padding: 0 8px;
          border: 1.5px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          font-family: var(--u-font-body); font-size: 13px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          background: var(--u-color-background-container, #fefefe);
          outline: none;
        }
        .ec-expiry-input:focus, .ec-expiry-select:focus { border-color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .ec-drawer-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
        }
        .ec-send-btn {
          height: 38px;
          padding: 0 24px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #ffffff;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.12s ease, opacity 0.12s ease;
        }
        .ec-send-btn:hover:not(:disabled) { background: #005bbf; }
        .ec-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <ConfirmTeamsDrawer
        isOpen={drawerTeam !== null}
        onClose={() => setDrawerTeam(null)}
        onConfirm={async () => { setDrawerTeam(null); }}
        teams={drawerTeam ? [drawerTeam] : []}
      />

      {/* Action bar */}
      {selectedAthleteIds.length > 0 && createPortal(
        <div className="ec-action-bar">
          <span className="ec-action-label">{selectedAthleteIds.length} {selectedAthleteIds.length === 1 ? 'Athlete' : 'Athletes'} Selected</span>
          <div className="ec-action-right">
            <button className="ec-email-btn" onClick={() => setEmailDrawerOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 6l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Email Contacts
            </button>
            <button className="ec-dismiss-btn" onClick={() => setSelectedAthleteIds([])} aria-label="Clear selection">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Email drawer */}
      {emailDrawerOpen && createPortal(
        <>
          <div className="ec-overlay" onClick={() => setEmailDrawerOpen(false)} />
          <div className="ec-drawer">
            <div className="ec-drawer-header">
              <div className="ec-drawer-header-left">
                <h2 className="ec-drawer-title">Email Contacts</h2>
                <span className="ec-drawer-count">{selectedAthleteIds.length} recipient{selectedAthleteIds.length !== 1 ? 's' : ''}</span>
              </div>
              <button className="ec-drawer-close" onClick={() => setEmailDrawerOpen(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="ec-drawer-body">
              <div className="ec-field">
                <label className="ec-label">Sender</label>
                <input type="text" className="ec-input" value="no-reply@hudl.com" readOnly />
              </div>
              <p className="ec-field-note">Include your contact information in your message so recipients can reach you directly.</p>
              <div className="ec-field">
                <label className="ec-label">Primary Contact <span className="ec-req">*</span></label>
                <input type="text" className="ec-input" placeholder="Add a contact..." value={emailContact} onChange={e => setEmailContact(e.target.value)} />
              </div>
              <div className="ec-field">
                <label className="ec-label">Subject <span className="ec-req">*</span></label>
                <input type="text" className="ec-input" placeholder="Add a subject..." value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
              </div>
              <div className="ec-field">
                <label className="ec-label">Message <span className="ec-req">*</span></label>
                <div className="ec-message-editor">
                  <div className="ec-toolbar">
                    <button type="button" className="ec-toolbar-btn" title="Bold">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 3h5a2.5 2.5 0 0 1 0 5H4V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M4 8h5.5a3 3 0 0 1 0 6H4V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="ec-toolbar-sep" />
                    <button type="button" className="ec-toolbar-btn" title="Align left">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" className="ec-toolbar-btn" title="Align center">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M3 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </button>
                    <div className="ec-toolbar-sep" />
                    <button type="button" className="ec-toolbar-btn" title="Bullet list">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="5" r="1.2" fill="currentColor"/><path d="M6 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="3" cy="9" r="1.2" fill="currentColor"/><path d="M6 9h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="3" cy="13" r="1.2" fill="currentColor"/><path d="M6 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" className="ec-toolbar-btn" title="Insert link">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 0 0 4.95 0l2-2a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9.5 6.5a3.5 3.5 0 0 0-4.95 0l-2 2a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                  <div
                    ref={emailEditorRef}
                    className="ec-textarea"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => { if (emailEditorRef.current) setEmailMessage(emailEditorRef.current.innerText); }}
                  />
                </div>
              </div>
              <div className="ec-toggle-card">
                <div className="ec-toggle-card-body">
                  <div className="ec-toggle-card-text">
                    <span className="ec-toggle-title">Include Accept / Decline</span>
                    <span className="ec-toggle-desc">Recipients will see a link to accept or decline their team assignment.</span>
                  </div>
                  <button type="button" className={`ec-toggle${emailIncludeAcceptDecline ? ' ec-toggle--on' : ''}`} onClick={() => setEmailIncludeAcceptDecline(v => !v)}>
                    <span className="ec-toggle-thumb" />
                  </button>
                </div>
              </div>
              <div className="ec-toggle-card" style={{ marginTop: 8 }}>
                <div className="ec-toggle-card-body">
                  <div className="ec-toggle-card-text">
                    <span className="ec-toggle-title">Set Expiration Date</span>
                    <span className="ec-toggle-desc">Email link will expire at the specified date and time.</span>
                  </div>
                  <button type="button" className={`ec-toggle${emailExpirationEnabled ? ' ec-toggle--on' : ''}`} onClick={() => setEmailExpirationEnabled(v => !v)}>
                    <span className="ec-toggle-thumb" />
                  </button>
                </div>
                {emailExpirationEnabled && (
                  <div className="ec-expiry-row">
                    <div className="ec-expiry-field">
                      <label className="ec-expiry-label">Date</label>
                      <input type="date" className="ec-expiry-input" value={emailExpirationDate} onChange={e => setEmailExpirationDate(e.target.value)} />
                    </div>
                    <div className="ec-expiry-field">
                      <label className="ec-expiry-label">Time</label>
                      <select className="ec-expiry-select" value={emailExpirationTime} onChange={e => setEmailExpirationTime(e.target.value)}>
                        {['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:59 PM'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ec-drawer-footer">
              <button
                className="ec-send-btn"
                disabled={!emailSubject.trim() || !emailMessage.trim()}
                onClick={() => { setEmailDrawerOpen(false); setSelectedAthleteIds([]); }}
              >
                Send
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
