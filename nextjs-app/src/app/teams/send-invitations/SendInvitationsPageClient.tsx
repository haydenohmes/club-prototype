'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteAthlete {
  id: string;
  name: string;
  initials: string;
  primaryContact: string;
  isSelected: boolean;
  status?: 'assigned' | 'invited' | 'accepted' | 'deposit' | 'paid';
  sentAt?: string;
}

interface InviteTeam {
  id: string;
  name: string;
  athletes: InviteAthlete[];
  isExpanded: boolean;
}

interface InviteRegistration {
  id: string;
  name: string;
  teams: InviteTeam[];
  isExpanded: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Club Dues programs and their registrations, chosen when attaching a team
interface DuesRegistration { id: string; name: string; price: string; dates: string; }
interface DuesProgram { id: string; name: string; registrations: DuesRegistration[]; }

const DUES_PROGRAMS: DuesProgram[] = [
  {
    id: 'dp-1',
    name: '2026 Fall Club Dues',
    registrations: [
      { id: 'dp1-r1', name: 'U10 Player Dues', price: '$225.00', dates: 'Sep 1 – Nov 30, 2026' },
      { id: 'dp1-r2', name: 'U12 Player Dues', price: '$250.00', dates: 'Sep 1 – Nov 30, 2026' },
      { id: 'dp1-r3', name: 'U14 Player Dues', price: '$275.00', dates: 'Sep 1 – Nov 30, 2026' },
    ],
  },
  {
    id: 'dp-2',
    name: '2026 Spring Club Dues',
    registrations: [
      { id: 'dp2-r1', name: 'U12 Player Dues', price: '$240.00', dates: 'Feb 1 – Apr 30, 2026' },
      { id: 'dp2-r2', name: 'U14 Player Dues', price: '$265.00', dates: 'Feb 1 – Apr 30, 2026' },
    ],
  },
  {
    id: 'dp-3',
    name: '2025 Fall Club Dues',
    registrations: [
      { id: 'dp3-r1', name: 'U12 Player Dues', price: '$240.00', dates: 'Sep 1 – Nov 30, 2025' },
      { id: 'dp3-r2', name: 'U14 Player Dues', price: '$260.00', dates: 'Sep 1 – Nov 30, 2025' },
    ],
  },
];

const INITIAL_REGISTRATIONS: InviteRegistration[] = [
  {
    id: 'reg-1',
    name: 'Fall Classic Registration',
    isExpanded: true,
    teams: [
      {
        id: 'team-1',
        name: '8U Black',
        isExpanded: true,
        athletes: [
          { id: 'a1', name: 'Liam Thompson',  initials: 'LT', primaryContact: 'Jennifer Thompson', isSelected: false, status: 'assigned' as const },
          { id: 'a2', name: 'Mason Garcia',   initials: 'MG', primaryContact: 'Maria Garcia',       isSelected: false, status: 'assigned' as const },
          { id: 'a3', name: 'Noah Williams',  initials: 'NW', primaryContact: 'Sarah Williams',     isSelected: false, status: 'assigned' as const },
        ],
      },
      {
        id: 'team-2',
        name: '10U Gold',
        isExpanded: false,
        athletes: [
          { id: 'a4', name: 'Ethan Martinez', initials: 'EM', primaryContact: 'Carlos Martinez', isSelected: false, status: 'assigned' as const },
          { id: 'a5', name: 'Oliver Davis',   initials: 'OD', primaryContact: 'Amy Davis',       isSelected: false, status: 'assigned' as const },
        ],
      },
    ],
  },
  {
    id: 'reg-2',
    name: 'Spring League Registration',
    isExpanded: false,
    teams: [
      {
        id: 'team-3',
        name: '12U Blue',
        isExpanded: false,
        athletes: [
          { id: 'a6', name: 'Lucas Wilson',   initials: 'LW', primaryContact: 'David Wilson',   isSelected: false, status: 'assigned' as const },
          { id: 'a7', name: 'Aiden Brown',    initials: 'AB', primaryContact: 'Lisa Brown',      isSelected: false, status: 'assigned' as const },
          { id: 'a8', name: 'Jackson Taylor', initials: 'JT', primaryContact: 'Michael Taylor', isSelected: false, status: 'assigned' as const },
        ],
      },
    ],
  },
];

// Default registrations pre-attached to every team
const DEFAULT_TEAM_REGISTRATIONS: Record<string, { program: string; registration: string }> = {
  'team-1': { program: '2026 Fall Club Dues', registration: 'U10 Player Dues' },
  'team-2': { program: '2026 Fall Club Dues', registration: 'U10 Player Dues' },
  'team-3': { program: '2026 Fall Club Dues', registration: 'U12 Player Dues' },
};

// Build the invite list from teams passed in by the club dues builder (teams that
// were linked and have athletes), pre-attached to the registration being sent.
const NAME_POOL = [
  'Liam Thompson', 'Mason Garcia', 'Noah Williams', 'Ethan Martinez', 'Oliver Davis',
  'Lucas Wilson', 'Aiden Brown', 'Jackson Taylor', 'Sophia Lee', 'Emma Clark',
  'Ava Lewis', 'Mia Walker', 'Harper Young', 'Ella King', 'Jack Scott',
];

const STATUS_POOL: Array<'invited' | 'accepted' | 'declined' | 'assigned'> = ['assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned'];

function makeAthletes(teamIdx: number, count: number): InviteAthlete[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const name = NAME_POOL[(teamIdx * 5 + i) % NAME_POOL.length];
    const [first, last] = name.split(' ');
    return {
      id: `pf-${teamIdx}-${i}`,
      name,
      initials: `${first[0]}${last ? last[0] : ''}`.toUpperCase(),
      primaryContact: `${last || first} Family`,
      isSelected: false,
      status: STATUS_POOL[(teamIdx * 3 + i) % STATUS_POOL.length],
    };
  });
}

function buildRegistrations(
  prefillTeams: { name: string; athleteCount: number }[] | undefined,
  regName: string | undefined,
): InviteRegistration[] {
  if (!prefillTeams || prefillTeams.length === 0) return INITIAL_REGISTRATIONS;
  return [{
    id: 'reg-prefill',
    name: regName || 'Registration',
    isExpanded: true,
    teams: prefillTeams.map((t, ti) => ({
      id: `pf-team-${ti}`,
      name: t.name,
      isExpanded: ti === 0,
      athletes: makeAthletes(ti, t.athleteCount),
    })),
  }];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M8.5 2.5L4 7.5L1.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5H8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="6.5" stroke="#3B82F6" strokeWidth="1.25"/>
      <path d="M8 7.5V11" stroke="#3B82F6" strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="8" cy="5.5" r="0.75" fill="#3B82F6"/>
    </svg>
  );
}

// Toolbar icons
function BoldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3.5 7H8.5C9.88 7 11 5.88 11 4.5S9.88 2 8.5 2H3.5V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 7H9C10.66 7 12 8.34 12 10S10.66 13 9 13H3.5V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12M2 7H9M2 11H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12M3.5 7H10.5M2 11H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3H12M5 7H12M3 11H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="4" r="1" fill="currentColor"/>
      <circle cx="3" cy="7" r="1" fill="currentColor"/>
      <circle cx="3" cy="10" r="1" fill="currentColor"/>
      <path d="M6 4H12M6 7H12M6 10H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M6 8a3 3 0 0 0 4.24.06l1.5-1.5A3 3 0 0 0 7.5 2.26L6.75 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 6a3 3 0 0 0-4.24-.06l-1.5 1.5A3 3 0 0 0 6.5 11.74L7.25 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SendInvitationsPageClient({ onClose, attachedRegistrationName, prefillTeams }: { onClose?: () => void; attachedRegistrationName?: string; prefillTeams?: { name: string; athleteCount: number }[] } = {}) {
  const router = useRouter();

  const [registrations, setRegistrations] = useState<InviteRegistration[]>(() => buildRegistrations(prefillTeams, attachedRegistrationName));
  // Each team must be attached to a dues registration before its athletes can be
  // invited. Pre-filled when opened from the club dues builder; otherwise the
  // director attaches one per team here (the "Attach Registration" button).
  type Attachment = { program: string; registration: string };
  const [teamRegistrations, setTeamRegistrations] = useState<Record<string, Attachment>>(() => {
    if (!attachedRegistrationName) return DEFAULT_TEAM_REGISTRATIONS;
    const map: Record<string, Attachment> = {};
    // Teams passed from the dues builder (linked + have athletes) arrive attached
    if (prefillTeams && prefillTeams.length) {
      prefillTeams.forEach((_, ti) => { map[`pf-team-${ti}`] = { program: 'Club Dues', registration: attachedRegistrationName }; });
      return map;
    }
    INITIAL_REGISTRATIONS.forEach(r => r.teams.forEach(t => { map[t.id] = { program: 'Attached in Club Dues', registration: attachedRegistrationName }; }));
    return map;
  });
  // Attach-registration modal
  const [attachModalTeamId, setAttachModalTeamId] = useState<string | null>(null);
  const [modalProgramId, setModalProgramId] = useState<string>('');
  const [modalRegistrationId, setModalRegistrationId] = useState<string>('');
  const modalProgram = DUES_PROGRAMS.find(p => p.id === modalProgramId) ?? null;

  const openAttachModal = (teamId: string) => {
    // Pre-fill with the team's current attachment when editing
    const current = teamRegistrations[teamId];
    const prog = current ? DUES_PROGRAMS.find(p => p.name === current.program) : null;
    const reg = prog && current ? prog.registrations.find(r => r.name === current.registration) : null;
    setModalProgramId(prog?.id ?? '');
    setModalRegistrationId(reg?.id ?? '');
    setAttachModalTeamId(teamId);
  };

  const confirmAttach = () => {
    if (!attachModalTeamId || !modalProgram || !modalRegistrationId) return;
    const regObj = modalProgram.registrations.find(r => r.id === modalRegistrationId);
    if (!regObj) return;
    const teamId = attachModalTeamId;
    setTeamRegistrations(prev => ({ ...prev, [teamId]: { program: modalProgram.name, registration: regObj.name } }));
    setAttachModalTeamId(null);
  };
  const [primaryContact, setPrimaryContact] = useState('');
  const [subject, setSubject]         = useState("You're invited to join a team — please respond");
  const [message, setMessage]         = useState(
    `Hi,\n\nYou've been selected to join a team for the upcoming season. Please use the link below to accept or decline your spot — we need your response before the roster is finalized.\n\n👉 Respond to your invitation:\nhttps://hudl.com/roster/invite/a3f9b2c1d4e7\n\nOnce you accept, you'll receive further details about practice schedules and team communications.\n\nIf you have any questions, feel free to reply to this email or reach out directly.\n\nThank you,`
  );
  const [boldActive, setBoldActive]   = useState(false);
  const [alignMode, setAlignMode]     = useState<'left' | 'center' | 'right'>('left');
  const [listActive, setListActive]   = useState(false);
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [includeAcceptDecline, setIncludeAcceptDecline] = useState(true);
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('5:00 PM');
  const [statusDropdown, setStatusDropdown] = useState<{ id: string; regId: string; teamId: string; x: number; y: number } | null>(null);

  const setAthleteStatus = (
    regId: string, teamId: string, athleteId: string,
    status: InviteAthlete['status'],
  ) => {
    setRegistrations(prev => prev.map(r => r.id !== regId ? r : {
      ...r,
      teams: r.teams.map(t => t.id !== teamId ? t : {
        ...t,
        athletes: t.athletes.map(a => a.id !== athleteId ? a : { ...a, status }),
      }),
    }));
  };

  // ── Helpers ──

  const toggleTeamExpand = (regId: string, teamId: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== regId) return r;
      return { ...r, teams: r.teams.map(t => t.id === teamId ? { ...t, isExpanded: !t.isExpanded } : t) };
    }));
  };

  const toggleAllRegAthletes = (regId: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== regId) return r;
      const allSelected = r.teams.every(t => t.athletes.every(a => a.isSelected));
      return { ...r, teams: r.teams.map(t => ({ ...t, athletes: t.athletes.map(a => ({ ...a, isSelected: !allSelected })) })) };
    }));
  };

  const toggleAllTeamAthletes = (regId: string, teamId: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== regId) return r;
      return {
        ...r,
        teams: r.teams.map(t => {
          if (t.id !== teamId) return t;
          const allSelected = t.athletes.every(a => a.isSelected);
          return { ...t, athletes: t.athletes.map(a => ({ ...a, isSelected: !allSelected })) };
        }),
      };
    }));
  };

  const toggleAthleteSelection = (regId: string, teamId: string, athleteId: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== regId) return r;
      return {
        ...r,
        teams: r.teams.map(t => {
          if (t.id !== teamId) return t;
          return { ...t, athletes: t.athletes.map(a => a.id === athleteId ? { ...a, isSelected: !a.isSelected } : a) };
        }),
      };
    }));
  };

  const removeAthlete = (regId: string, teamId: string, athleteId: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== regId) return r;
      return {
        ...r,
        teams: r.teams.map(t => {
          if (t.id !== teamId) return t;
          return { ...t, athletes: t.athletes.filter(a => a.id !== athleteId) };
        }),
      };
    }));
  };

  // Sync primary contact field with all selected athletes' contacts
  useEffect(() => {
    const contacts = registrations
      .flatMap(r => r.teams.flatMap(t =>
        t.athletes.filter(a => a.isSelected).map(a => a.primaryContact)
      ))
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
    setPrimaryContact(contacts.join(', '));
  }, [registrations]);

  // ── Rich-text message editor ──

  const editorRef = useRef<HTMLDivElement>(null);

  function formatMessageHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(https?:\/\/[^\s]+)/g, '<span class="si-message-link">$1</span>')
      .replace(/\n/g, '<br>');
  }

  // Set initial HTML once on mount — don't re-run or cursor resets
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = formatMessageHtml(message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Counts ──

  const totalSelected = registrations.reduce((sum, r) =>
    sum + r.teams.reduce((ts, t) => ts + t.athletes.filter(a => a.isSelected).length, 0), 0);

  const canSend = totalSelected > 0 && subject.trim().length > 0 && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setSentCount(totalSelected);
    setSendConfirmed(true);
    const now = new Date();
    const sentAt = `${now.toLocaleString('en-US', { month: 'short', day: 'numeric' })}, ${now.getFullYear()}`;
    setRegistrations(prev => prev.map(r => ({
      ...r,
      teams: r.teams.map(t => ({
        ...t,
        athletes: t.athletes.map(a => a.isSelected ? { ...a, isSelected: false, status: 'invited' as const, sentAt } : a),
      })),
    })));
    setTimeout(() => setSendConfirmed(false), 2500);
  };

  const renderTeamAccordion = (reg: InviteRegistration, team: InviteTeam) => {
    const teamSelected = team.athletes.filter(a => a.isSelected).length;
    const teamTotal    = team.athletes.length;
    const teamAll      = teamSelected === teamTotal && teamTotal > 0;
    const teamSome     = teamSelected > 0 && !teamAll;
    const attached     = teamRegistrations[team.id];

    return (
      <div key={team.id} className="si-team-accordion">
        <div className="si-team-header" onClick={() => toggleTeamExpand(reg.id, team.id)}>
          <div className="si-team-left">
            <span className="si-team-name">{team.name}</span>
            <div className="si-attach-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="si-reg-pill"
                onClick={() => openAttachModal(team.id)}
                aria-label="Edit registration"
              >
                <span className="si-reg-pill-text">{attached?.registration ?? 'Select registration'}</span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M11.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="si-team-header-right">
            <span className="si-team-count">{teamSelected} of {teamTotal}</span>
            <span className={`si-chevron${team.isExpanded ? ' si-chevron--open' : ''}`}>
              <ChevronDownIcon />
            </span>
          </div>
          <button
            type="button"
            className={`si-checkbox si-checkbox--sm${teamAll ? ' si-checkbox--checked' : teamSome ? ' si-checkbox--indeterminate' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleAllTeamAthletes(reg.id, team.id); }}
            aria-label={`Select all in ${team.name}`}
          >
            {teamAll && <CheckIcon />}
            {teamSome && <MinusIcon />}
          </button>
        </div>

        {team.isExpanded && (
          <div className="si-team-athletes">
            {team.athletes.map(athlete => (
              <div
                key={athlete.id}
                className={`si-athlete-row${athlete.isSelected ? ' si-athlete-row--selected' : ''}`}
                onClick={() => toggleAthleteSelection(reg.id, team.id, athlete.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleAthleteSelection(reg.id, team.id, athlete.id)}
              >
                <div className="si-athlete-avatar">{athlete.initials}</div>
                <div className="si-athlete-info">
                  <div className="si-athlete-name">{athlete.name}</div>
                  <div className="si-athlete-contact">Primary Contact: {athlete.primaryContact}</div>
                </div>
                <div className="si-athlete-right">
                  {athlete.status && (
                    <span className="si-status-pill-group">
                      {athlete.status === 'invited' && athlete.sentAt && (
                        <span className="si-sent-date">Sent {athlete.sentAt}</span>
                      )}
                      <span className="si-status-pill-wrap">
                        <button
                          type="button"
                          className={`si-status-pill si-status-pill--${athlete.status} si-status-pill--btn`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (statusDropdown?.id === athlete.id) { setStatusDropdown(null); return; }
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setStatusDropdown({ id: athlete.id, regId: reg.id, teamId: team.id, x: rect.right, y: rect.bottom + 4 });
                          }}
                        >
                          {athlete.status === 'deposit' ? 'Paid Deposit' : athlete.status === 'paid' ? 'Paid in Full' : athlete.status.charAt(0).toUpperCase() + athlete.status.slice(1)}
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 3, flexShrink: 0 }}>
                            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </span>
                    </span>
                  )}
                  <div className={`si-checkbox si-checkbox--sm${athlete.isSelected ? ' si-checkbox--checked' : ''}`}>
                    {athlete.isSelected && <CheckIcon />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="si-page">
      {/* ── Header ── */}
      <div className="si-header">
        <button className="si-back-btn" onClick={() => onClose ? onClose() : router.push('/teams/assignments')} aria-label="Back">
          <BackIcon />
        </button>
        <h1 className="si-header-title">Send Invitations</h1>
        <div className="si-header-actions">
          <button className="si-btn si-btn--secondary">Preview</button>
          <button
            className={`si-btn si-btn--primary${!canSend ? ' si-btn--disabled' : ''}`}
            onClick={handleSend}
            disabled={!canSend}
          >
            {sendConfirmed ? 'Sent!' : 'Send'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="si-body">

        {/* ── LEFT: Step 1 ── */}
        <div className="si-panel">
          <span className="si-step-label">STEP: 1</span>
          <h2 className="si-panel-title">Select Teams &amp; Athletes</h2>
          <p className="si-panel-subtitle">Choose which athletes receive this invitation.</p>

          {/* Flat team list — each team shows its own attached registration */}
          <div className="si-team-list">
            {registrations.flatMap(reg => reg.teams.map(team => ({ reg, team })))
              .map(({ reg, team }) => renderTeamAccordion(reg, team))}
          </div>

          {/* Footer count */}
          <div className="si-selection-footer">
            <span className="si-selection-count">{totalSelected} athlete{totalSelected !== 1 ? 's' : ''} selected</span>
          </div>
        </div>

        {/* ── RIGHT: Step 2 ── */}
        <div className="si-panel">
          <span className="si-step-label">STEP: 2</span>
          <h2 className="si-panel-title">Compose Your Message</h2>
          <p className="si-panel-subtitle">Write the invitation email that will be sent to the selected athletes.</p>

          <div className="si-compose-form">
            {/* Sender */}
            <div className="si-field">
              <label className="si-field-label">Sender</label>
              <input
                type="text"
                className="si-field-input"
                value="no-reply@hudl.com"
                readOnly
              />
            </div>

            <p className="si-field-note">Include your contact information in your message so recipients can reach you directly.</p>

            {/* Primary Contact */}
            <div className="si-field">
              <label className="si-field-label">Primary Contact <span className="si-required">*</span></label>
              <input
                type="text"
                className="si-field-input"
                placeholder="Add a contact..."
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="si-field">
              <label className="si-field-label">Subject <span className="si-required">*</span></label>
              <input
                type="text"
                className="si-field-input"
                placeholder="Add a subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="si-field si-field--flex">
              <label className="si-field-label">Message <span className="si-required">*</span></label>
              <div className="si-message-editor">
                {/* Formatting toolbar */}
                <div className="si-editor-toolbar">
                  <button
                    type="button"
                    className={`si-toolbar-btn${boldActive ? ' si-toolbar-btn--active' : ''}`}
                    onClick={() => setBoldActive(b => !b)}
                    title="Bold"
                  >
                    <BoldIcon />
                  </button>

                  <div className="si-toolbar-divider" />

                  <button
                    type="button"
                    className={`si-toolbar-btn${alignMode === 'left' ? ' si-toolbar-btn--active' : ''}`}
                    onClick={() => setAlignMode('left')}
                    title="Align left"
                  >
                    <AlignLeftIcon />
                  </button>
                  <button
                    type="button"
                    className={`si-toolbar-btn${alignMode === 'center' ? ' si-toolbar-btn--active' : ''}`}
                    onClick={() => setAlignMode('center')}
                    title="Align center"
                  >
                    <AlignCenterIcon />
                  </button>
                  <button
                    type="button"
                    className={`si-toolbar-btn${alignMode === 'right' ? ' si-toolbar-btn--active' : ''}`}
                    onClick={() => setAlignMode('right')}
                    title="Align right"
                  >
                    <AlignRightIcon />
                  </button>

                  <div className="si-toolbar-divider" />

                  <button
                    type="button"
                    className={`si-toolbar-btn${listActive ? ' si-toolbar-btn--active' : ''}`}
                    onClick={() => setListActive(l => !l)}
                    title="Bullet list"
                  >
                    <ListIcon />
                  </button>
                  <button
                    type="button"
                    className="si-toolbar-btn"
                    title="Insert link"
                  >
                    <LinkIcon />
                  </button>
                </div>

                {/* Contenteditable message area */}
                <div
                  ref={editorRef}
                  className="si-message-textarea"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    if (editorRef.current) setMessage(editorRef.current.innerText);
                  }}
                  style={{
                    fontWeight: boldActive ? 700 : 400,
                    textAlign: alignMode,
                  }}
                />
              </div>
            </div>

          {/* Accept/Decline toggle card */}
          <div className="si-toggle-card">
            <div className="si-toggle-card-body">
              <div className="si-toggle-card-text">
                <span className="si-toggle-card-title">Include Accept / Decline</span>
                <span className="si-toggle-card-desc">Recipients will see a link to accept or decline their team assignment.</span>
              </div>
              <button
                type="button"
                className={`si-toggle${includeAcceptDecline ? ' si-toggle--on' : ''}`}
                onClick={() => setIncludeAcceptDecline(v => !v)}
                aria-pressed={includeAcceptDecline}
                aria-label="Include accept or decline"
              >
                <span className="si-toggle-thumb" />
              </button>
            </div>
          </div>
          <div className="si-toggle-card" style={{ marginTop: 8 }}>
            <div className="si-toggle-card-body">
              <div className="si-toggle-card-text">
                <span className="si-toggle-card-title">Set Expiration Date</span>
                <span className="si-toggle-card-desc">Invitation link will expire at the specified date and time.</span>
              </div>
              <button
                type="button"
                className={`si-toggle${expirationEnabled ? ' si-toggle--on' : ''}`}
                onClick={() => setExpirationEnabled(v => !v)}
                aria-pressed={expirationEnabled}
                aria-label="Set expiration date"
              >
                <span className="si-toggle-thumb" />
              </button>
            </div>
            {expirationEnabled && (
              <div className="si-expiry-row">
                <div className="si-expiry-field">
                  <label className="si-expiry-label">Date</label>
                  <input
                    type="date"
                    className="si-expiry-input"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                  />
                </div>
                <div className="si-expiry-field">
                  <label className="si-expiry-label">Time</label>
                  <div className="si-expiry-select-wrap">
                    <select
                      className="si-expiry-select"
                      value={expirationTime}
                      onChange={e => setExpirationTime(e.target.value)}
                    >
                      {['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
                        '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
                        '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:59 PM'
                      ].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="si-expiry-chevron"><ChevronDownIcon /></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
        </div>

      {/* Attach Registration modal */}
      {attachModalTeamId && createPortal(
        <div className="si-modal-overlay" onClick={() => setAttachModalTeamId(null)}>
          <div className="si-modal" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal-header">
              <h3 className="si-modal-title">Attach Registration</h3>
              <button className="si-modal-close" onClick={() => setAttachModalTeamId(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="si-modal-body">
              <label className="si-modal-label">Program</label>
              <div className="si-modal-select-wrap">
                <select
                  className="si-modal-select"
                  value={modalProgramId}
                  onChange={(e) => { setModalProgramId(e.target.value); setModalRegistrationId(''); }}
                >
                  <option value="">Select a program…</option>
                  {DUES_PROGRAMS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <span className="si-modal-select-chevron"><ChevronDownIcon /></span>
              </div>

              <label className="si-modal-label">Registration</label>
              <div className="si-modal-select-wrap">
                <select
                  className="si-modal-select"
                  value={modalRegistrationId}
                  onChange={(e) => setModalRegistrationId(e.target.value)}
                  disabled={!modalProgram}
                >
                  <option value="">{modalProgram ? 'Select a registration…' : 'Select a program first'}</option>
                  {modalProgram?.registrations.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <span className="si-modal-select-chevron"><ChevronDownIcon /></span>
              </div>
            </div>
            <div className="si-modal-footer">
              <button className="si-btn si-btn--secondary" onClick={() => setAttachModalTeamId(null)}>Cancel</button>
              <button
                className={`si-btn si-btn--primary${(!modalProgramId || !modalRegistrationId) ? ' si-btn--disabled' : ''}`}
                onClick={confirmAttach}
                disabled={!modalProgramId || !modalRegistrationId}
              >
                Attach
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Send confirmation overlay */}
      {statusDropdown && createPortal(
        <>
          <div className="si-status-dropdown-overlay" onClick={() => setStatusDropdown(null)} />
          <div
            className="si-status-dropdown"
            style={{ position: 'fixed', top: statusDropdown.y, right: `calc(100vw - ${statusDropdown.x}px)` }}
          >
            {([
              { label: 'Assigned',      status: 'assigned' as const },
              { label: 'Invited',       status: 'invited'  as const },
              { label: 'Accepted',      status: 'accepted' as const },
              { label: 'Paid Deposit',  status: 'deposit'  as const },
              { label: 'Paid in Full',  status: 'paid'     as const },
            ] as const).map(opt => (
              <button
                key={opt.label}
                type="button"
                className="si-status-dropdown-item"
                onClick={(e) => { e.stopPropagation(); setAthleteStatus(statusDropdown.regId, statusDropdown.teamId, statusDropdown.id, opt.status); setStatusDropdown(null); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {sendConfirmed && (
        <div className="si-send-toast">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="1.5"/>
            <path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Invitations sent to {sentCount} athlete{sentCount !== 1 ? 's' : ''}
        </div>
      )}

      <style jsx global>{`
        /* ── Page shell ── */
        .si-page {
          position: fixed;
          inset: 0;
          background: var(--u-color-background-canvas, #eff0f0);
          padding: 8px;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: var(--u-font-body, 'Inter', sans-serif);
        }

        /* ── Header ── */
        .si-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 48px;
          flex-shrink: 0;
        }

        .si-back-btn {
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
          transition: background 0.15s ease;
        }
        .si-back-btn:hover {
          background: rgba(0,0,0,0.06);
        }

        .si-header-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
        }

        .si-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .si-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          padding: 0 20px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--u-font-body, 'Inter', sans-serif);
          transition: background 0.15s ease, opacity 0.15s ease;
        }

        .si-btn--primary {
          border: none;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
        }
        .si-btn--primary:hover:not(.si-btn--disabled) {
          background: #0261c2;
        }
        .si-btn--primary.si-btn--disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .si-btn--secondary {
          border: 1.5px solid var(--u-color-emphasis-background-contrast, #0273e3);
          background: transparent;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .si-btn--secondary:hover {
          background: rgba(2,115,227,0.06);
        }

        /* ── Body ── */
        .si-body {
          display: flex;
          flex-direction: row;
          flex: 1;
          gap: 8px;
          min-height: 0;
          overflow: hidden;
        }

        /* ── Panel ── */
        .si-panel {
          flex: 1;
          background: var(--u-color-background-container, #fefefe);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .si-step-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin-bottom: 6px;
        }

        .si-panel-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0 0 4px;
        }

        .si-panel-subtitle {
          font-size: 13px;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin: 0 0 16px;
        }

        /* ── Program dropdown ── */
        .si-program-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
          flex-shrink: 0;
        }

        .si-team-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          margin-right: auto;
        }
        .si-attach-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .si-attach-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          max-width: 220px;
          padding: 0 12px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .si-attach-btn:hover {
          background: #005bbf;
        }

        /* Registration pill — always present, clickable to edit */
        .si-reg-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          max-width: 260px;
          padding: 0 8px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-background-canvas, #e0e1e1);
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
        }
        .si-reg-pill:hover {
          background: #d2d4d5;
        }
        .si-reg-pill-text {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Attach Registration modal ── */
        .si-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .si-modal {
          width: 100%;
          max-width: 440px;
          background: var(--u-color-background-container, #fff);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .si-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }
        .si-modal-title {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .si-modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          border-radius: 4px;
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
        }
        .si-modal-close:hover { background: var(--u-color-background-canvas, #eff0f0); }
        .si-modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .si-modal-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--u-color-base-foreground, #36485c);
          margin-top: 8px;
        }
        .si-modal-label:first-child { margin-top: 0; }
        .si-modal-select-wrap { position: relative; display: flex; align-items: center; }
        .si-modal-select {
          appearance: none;
          width: 100%;
          height: 40px;
          padding: 0 36px 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fff);
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
        }
        .si-modal-select-chevron {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: var(--u-color-base-foreground-subtle, #607081);
          display: flex;
        }
        .si-modal-select:disabled {
          background: var(--u-color-background-canvas, #f3f4f4);
          color: var(--u-color-base-foreground-subtle, #85909e);
          cursor: not-allowed;
        }
        .si-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .si-program-select-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--u-color-base-foreground, #36485c);
        }

        .si-program-select-inner {
          position: relative;
          display: flex;
          align-items: center;
        }

        .si-program-select {
          appearance: none;
          width: 100%;
          height: 40px;
          padding: 0 36px 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fff);
          font-size: 14px;
          font-family: var(--u-font-body, 'Inter', sans-serif);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }
        .si-program-select:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .si-program-select-chevron {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: var(--u-color-base-foreground-subtle, #607081);
          display: flex;
          align-items: center;
        }

        /* ── Registration accordion ── */
        .si-reg-accordion {
          border: 1px solid var(--u-color-line-subtle, #e0e1e1);
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .si-reg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--u-color-background-canvas, #eff0f0);
          gap: 8px;
          cursor: pointer;
        }

        .si-reg-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Teams nested inside a registration ── */
        .si-reg-teams {
          display: flex;
          flex-direction: column;
        }

        .si-reg-teams .si-team-accordion {
          border: none;
          border-top: 1px solid var(--u-color-line-subtle, #e0e1e1);
          border-radius: 0;
        }

        .si-reg-teams .si-team-header {
          padding-left: 20px;
          background: var(--u-color-background-container, #fefefe);
        }

        .si-reg-teams .si-team-athletes .si-athlete-row {
          padding-left: 28px;
        }

        /* ── Info note ── */
        .si-info-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #eff6ff;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.4;
          flex-shrink: 0;
        }

        /* ── Team list ── */
        .si-team-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          padding-bottom: 4px;
        }

        /* ── Team accordion ── */
        .si-team-accordion {
          border: 1px solid var(--u-color-line-subtle, #e0e1e1);
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .si-team-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--u-color-background-container, #fefefe);
          gap: 8px;
        }

        .si-team-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .si-team-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .si-team-name {
          flex: 0 1 auto;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .si-team-reg {
          font-size: 11px;
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .si-team-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .si-team-count {
          font-size: 12px;
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
        }

        .si-chevron {
          color: var(--u-color-base-foreground-subtle, #607081);
          display: flex;
          align-items: center;
          transition: transform 0.15s ease;
        }
        .si-chevron--open {
          transform: rotate(180deg);
        }

        /* ── Checkbox ── */
        .si-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--u-color-background-container, #fff);
          flex-shrink: 0;
          cursor: pointer;
          transition: border-color 0.1s, background 0.1s;
          padding: 0;
        }
        .si-checkbox--checked,
        .si-checkbox--indeterminate {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .si-checkbox--sm {
          width: 16px;
          height: 16px;
        }

        /* ── Athlete rows ── */
        .si-team-athletes {
          border-top: 1px solid var(--u-color-line-subtle, #e0e1e1);
        }

        .si-athlete-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          min-height: 48px;
          cursor: pointer;
          transition: background 0.1s ease;
          border-top: 1px solid transparent;
        }
        .si-athlete-row + .si-athlete-row {
          border-top-color: var(--u-color-line-subtle, #f0f1f1);
        }
        .si-athlete-row:hover {
          background: var(--u-color-background-callout, #f8f9fa);
        }
        .si-athlete-row--selected {
          background: #f0f7ff;
        }
        .si-athlete-row--selected:hover {
          background: #e8f2ff;
        }

        .si-athlete-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: var(--u-color-identity-default, #38434f);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -0.3px;
        }

        .si-athlete-info {
          flex: 1;
          min-width: 0;
        }

        .si-athlete-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .si-athlete-contact {
          font-size: 11px;
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .si-athlete-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .si-athlete-date {
          font-size: 11px;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .si-status-pill-wrap {
          position: relative;
          display: inline-flex;
        }

        .si-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .si-status-pill--btn {
          border: none;
          cursor: pointer;
          font-family: var(--u-font-body);
          transition: filter 0.1s ease;
        }

        .si-status-pill--btn:hover { filter: brightness(0.93); }

        .si-status-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
        }

        .si-status-dropdown {
          z-index: 1101;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 6px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          min-width: 130px;
          padding: 4px 0;
          display: flex;
          flex-direction: column;
        }

        .si-status-dropdown-item {
          padding: 7px 14px;
          text-align: left;
          background: none;
          border: none;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          white-space: nowrap;
        }

        .si-status-dropdown-item:hover {
          background: var(--u-color-background-canvas, #eff0f0);
        }
        .si-status-pill--invited {
          background: #fdf0d6;
          color: #6f3900;
        }
        .si-status-pill--assigned {
          background: #e0e1e1;
          color: #36485c;
        }
        .si-status-pill--accepted {
          background: rgba(23, 129, 67, 0.1);
          color: #178143;
        }
        .si-status-pill--declined {
          background: rgba(187, 23, 0, 0.08);
          color: #bb1700;
        }
        .si-status-pill--deposit {
          background: #fef3c7;
          color: #92400e;
        }
        .si-status-pill--paid {
          background: rgba(23, 129, 67, 0.12);
          color: #178143;
        }

        .si-status-pill-group {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .si-sent-date {
          font-size: 11px;
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
        }

        .si-payment-pill {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .si-payment-pill--deposit {
          background: rgba(180, 83, 9, 0.1);
          color: #92400e;
        }
        .si-payment-pill--paid {
          background: rgba(23, 129, 67, 0.1);
          color: #178143;
        }

        .si-athlete-remove {
          width: 22px;
          height: 22px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: background 0.1s, color 0.1s;
          padding: 0;
        }
        .si-athlete-remove:hover {
          background: rgba(0,0,0,0.08);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        /* ── Selection footer ── */
        .si-toggle-card {
          flex-shrink: 0;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          background: var(--u-color-background-container, #fefefe);
          margin-top: 12px;
        }

        .si-toggle-card-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
        }

        .si-toggle-card-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .si-toggle-card-title {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
        }

        .si-toggle-card-desc {
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .si-toggle {
          flex-shrink: 0;
          width: 40px;
          height: 24px;
          border-radius: 9999px;
          border: none;
          background: var(--u-color-line-subtle, #c4c6c8);
          padding: 0;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease;
        }

        .si-toggle--on {
          background: var(--u-color-emphasis-foreground, #085bb4);
        }

        .si-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .si-toggle--on .si-toggle-thumb {
          transform: translateX(16px);
        }

        .si-expiry-row {
          display: flex;
          gap: 12px;
          padding: 0 16px 14px;
          border-top: 1px solid var(--u-color-line-subtle, #e0e1e1);
          padding-top: 12px;
        }

        .si-expiry-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .si-expiry-label {
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 600;
          color: var(--u-color-base-foreground-subtle, #607081);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .si-expiry-input {
          height: 36px;
          padding: 0 10px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground, #36485c);
          width: 100%;
          box-sizing: border-box;
        }

        .si-expiry-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .si-expiry-select {
          width: 100%;
          height: 36px;
          padding: 0 28px 0 10px;
          appearance: none;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
        }

        .si-expiry-chevron {
          position: absolute;
          right: 8px;
          pointer-events: none;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .si-selection-footer {
          flex-shrink: 0;
          padding-top: 12px;
          border-top: 1px solid var(--u-color-line-subtle, #e0e1e1);
          margin-top: 8px;
        }

        .si-selection-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        /* ── Compose form ── */
        .si-compose-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .si-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .si-field--flex {
          display: flex;
          flex-direction: column;
        }

        .si-field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--u-color-base-foreground, #36485c);
        }

        .si-required {
          color: #e53e3e;
        }

        .si-field-input {
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fff);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          font-family: var(--u-font-body, 'Inter', sans-serif);
          outline: none;
          transition: border-color 0.15s;
        }
        .si-field-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .si-field-input[readonly] {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: default;
        }

        .si-field-note {
          font-size: 12px;
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.4;
          margin-top: -8px;
        }

        /* ── Message editor ── */
        .si-message-editor {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .si-message-editor:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .si-editor-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid var(--u-color-line-subtle, #e0e1e1);
          background: var(--u-color-background-canvas, #eff0f0);
          flex-shrink: 0;
        }

        .si-toolbar-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.1s;
          padding: 0;
        }
        .si-toolbar-btn:hover {
          background: rgba(0,0,0,0.08);
        }
        .si-toolbar-btn--active {
          background: rgba(2,115,227,0.12);
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .si-toolbar-divider {
          width: 1px;
          height: 18px;
          background: var(--u-color-line-subtle, #c4c6c8);
          margin: 0 4px;
          flex-shrink: 0;
        }

        .si-message-textarea {
          min-height: 260px;
          border: none;
          outline: none;
          padding: 12px;
          font-size: 14px;
          font-family: var(--u-font-body, 'Inter', sans-serif);
          color: var(--u-color-base-foreground, #36485c);
          background: var(--u-color-background-container, #fff);
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-y: auto;
        }

        .si-message-link {
          color: #0273e3;
          text-decoration: underline;
          cursor: pointer;
        }

        /* ── Send confirmation toast ── */
        .si-send-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--u-color-background-container, #fff);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.14);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground-contrast, #071c31);
          z-index: 1100;
          animation: si-toast-in 0.2s ease;
        }

        @keyframes si-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
