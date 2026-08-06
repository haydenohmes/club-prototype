'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { TeamWithStats, Season } from '@/lib/actions/teams';
import { assignAthletesToTeam, unassignAthleteFromTeam } from '@/lib/actions/teams';
import type { ProgramWithStats, Registration, RegisteredAthlete } from '@/lib/actions/programs';
import Select from '@/components/Select';
import TeamCard from '@/components/TeamCard';
import AthleteCard from '@/components/AthleteCard';
import { useToast } from '@/components/Toast';

function AssignmentsBackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Filter item component matching Figma design
interface FilterItemProps {
  label: string;
  registration?: string;
  stats?: { assigned: number; invited: number; accepted: number; declined: number };
  avatar?: string | null;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  count?: number;
}

function FilterItem({ label, registration, stats, avatar, isSelected, onClick, count }: FilterItemProps) {
  const initials = label.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      className={`filter-item ${isSelected ? 'filter-item--selected' : ''} ${(registration || stats) ? 'filter-item--has-subtitle' : ''}`}
      onClick={onClick}
    >
      <div className="filter-item-avatar">
        <div className={`filter-item-avatar-inner ${avatar ? 'filter-item-avatar-inner--has-image' : ''}`}>
          {avatar ? (
            <img src={avatar} alt="" className="filter-item-avatar-img" />
          ) : (
            <span className="filter-item-avatar-initials">{initials}</span>
          )}
        </div>
      </div>
      <div className="filter-item-text">
        <div className="filter-item-top-row">
          <span className={`filter-item-label ${count === 0 ? 'filter-item-label--subtle' : ''}`}>{label}</span>
          {registration && (
            <span className="filter-item-reg-pill">{registration}</span>
          )}
        </div>
        {stats && (
          <span className="filter-item-stats">
            <span className="filter-item-stat">Assigned {stats.assigned}</span>
            <span className="filter-item-stat-dot">·</span>
            <span className="filter-item-stat">Invited {stats.invited}</span>
            <span className="filter-item-stat-dot">·</span>
            <span className="filter-item-stat">Accepted {stats.accepted}</span>
            {stats.declined > 0 && (
              <>
                <span className="filter-item-stat-dot">·</span>
                <span className="filter-item-stat filter-item-stat--declined">Declined {stats.declined}</span>
              </>
            )}
          </span>
        )}
      </div>
      {count !== undefined && (
        <span className="filter-item-count">{count}</span>
      )}
      {isSelected && (
        <img src="/icons/confirm.svg" alt="" width={16} height={16} className="filter-item-check" />
      )}
    </button>
  );
}

// ─── Attach-registration modal data ──────────────────────────────────────────
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

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Mock registration names and status breakdowns for prototype teams
const MOCK_REG_NAMES = ['U10 Player Dues', 'U12 Player Dues', 'U10 Player Dues', 'U14 Player Dues', 'U12 Player Dues', 'U10 Player Dues', 'U14 Player Dues'];
const MOCK_STATS = [
  { assigned: 4, invited: 3, accepted: 2, declined: 0 },
  { assigned: 6, invited: 4, accepted: 3, declined: 1 },
  { assigned: 3, invited: 2, accepted: 1, declined: 0 },
  { assigned: 5, invited: 3, accepted: 2, declined: 1 },
  { assigned: 4, invited: 4, accepted: 4, declined: 0 },
  { assigned: 7, invited: 5, accepted: 3, declined: 1 },
  { assigned: 3, invited: 2, accepted: 0, declined: 0 },
];

// Generate a demo roster for a builder-created registration so its athletes can be assigned to teams
const GEN_FIRST_NAMES = ['Ava', 'Mia', 'Sofia', 'Emma', 'Olivia', 'Isabella', 'Riley', 'Zoe', 'Layla', 'Chloe', 'Harper', 'Nora'];
const GEN_LAST_NAMES = ['Bennett', 'Carter', 'Diaz', 'Flores', 'Gomez', 'Hayes', 'Iverson', 'Jenkins', 'Keller', 'Lawson', 'Meyer', 'Novak'];
function makeAthletesForRegistration(reg: Registration): RegisteredAthlete[] {
  return Array.from({ length: 12 }, (_, i) => {
    const first = GEN_FIRST_NAMES[i % GEN_FIRST_NAMES.length];
    const last = GEN_LAST_NAMES[i % GEN_LAST_NAMES.length];
    const birthYear = 2012 + (i % 4);
    const month = String((i % 12) + 1).padStart(2, '0');
    return {
      submissionId: `gen-${reg.id}-${i}`,
      registrationId: reg.id,
      programId: reg.programId,
      athleteId: `gen-a-${reg.id}-${i}`,
      firstName: first,
      lastName: last,
      gender: 'Female',
      birthdate: `${birthYear}-${month}-15`,
      grade: 6 + (i % 4),
      gradYear: birthYear + 18,
      registrationStatus: 'active',
      paymentMethod: 'card',
      assignmentStatus: 'unassigned',
      teamAssignments: [],
      previousTeamTitle: null,
      parentId: `gen-p-${reg.id}-${i}`,
      parentFirstName: 'Parent',
      parentLastName: last,
      parentEmail: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
    };
  });
}

interface AssignmentsPageClientProps {
  teams: TeamWithStats[];
  seasons: Season[];
  programs: ProgramWithStats[];
  registrations: Registration[];
  athletes: RegisteredAthlete[];
  initialSeasonId: string;
  returnTo?: string;
}

export default function AssignmentsPageClient({
  teams,
  seasons,
  programs,
  registrations,
  athletes,
  initialSeasonId,
  returnTo,
}: AssignmentsPageClientProps) {
  const router = useRouter();
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>('');
  // Merge in programs created through the builder (prototype: localStorage), matching the Programs page
  const [allPrograms, setAllPrograms] = useState<ProgramWithStats[]>(programs);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('createdPrograms');
      const created = raw ? (JSON.parse(raw) as ProgramWithStats[]) : [];
      setAllPrograms(Array.isArray(created) && created.length ? [...created, ...programs] : programs);
    } catch {
      setAllPrograms(programs);
    }
  }, [programs]);
  // Merge builder-created registrations and generate athletes for them (prototype: localStorage)
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>(registrations);
  const [generatedAthletes, setGeneratedAthletes] = useState<RegisteredAthlete[]>([]);
  const [teamConnections, setTeamConnections] = useState<Record<string, { program: string; registrations: string[] }>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem('createdRegistrations');
      const createdRegs = raw ? (JSON.parse(raw) as Registration[]) : [];
      setAllRegistrations(createdRegs.length ? [...createdRegs, ...registrations] : registrations);
      setGeneratedAthletes(createdRegs.flatMap(makeAthletesForRegistration));
      const rawConn = localStorage.getItem('teamRegistrationConnections');
      setTeamConnections(rawConn ? JSON.parse(rawConn) : {});
    } catch {
      setAllRegistrations(registrations);
      setGeneratedAthletes([]);
      setTeamConnections({});
    }
  }, [registrations]);
  const allAthletes = generatedAthletes.length ? [...athletes, ...generatedAthletes] : athletes;

  // Attach-registration modal
  const [attachModalTeamId, setAttachModalTeamId] = useState<string | null>(null);
  const [modalProgramId, setModalProgramId] = useState<string>('');
  const [modalRegistrationIds, setModalRegistrationIds] = useState<string[]>([]);
  const modalProgram = DUES_PROGRAMS.find(p => p.id === modalProgramId) ?? null;

  const openAttachModal = (teamId: string) => {
    const current = teamConnections[teamId];
    const prog = current ? DUES_PROGRAMS.find(p => p.name === current.program) : null;
    const storedNames = current?.registrations ?? [];
    const storedIds = prog ? prog.registrations.filter(r => storedNames.includes(r.name)).map(r => r.id) : [];
    setModalProgramId(prog?.id ?? '');
    setModalRegistrationIds(storedIds);
    setAttachModalTeamId(teamId);
  };

  const confirmAttach = () => {
    if (!attachModalTeamId || !modalProgram || modalRegistrationIds.length === 0) return;
    const regNames = modalRegistrationIds
      .map(id => modalProgram.registrations.find(r => r.id === id)?.name)
      .filter((n): n is string => !!n);
    const teamId = attachModalTeamId;
    const updated = { ...teamConnections, [teamId]: { program: modalProgram.name, registrations: regNames } };
    setTeamConnections(updated);
    try { localStorage.setItem('teamRegistrationConnections', JSON.stringify(updated)); } catch { /* ignore */ }
    setAttachModalTeamId(null);
  };

  const [athleteSearch, setAthleteSearch] = useState<string>('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [lastClickedAthleteIndex, setLastClickedAthleteIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAthleteIds, setDraggedAthleteIds] = useState<string[]>([]);
  const [athleteStatuses, setAthleteStatuses] = useState<Record<string, 'assigned' | 'invited' | 'accepted' | 'declined' | 'deposit' | 'paid' | 'pending'>>({});
  const [statusDropdown, setStatusDropdown] = useState<{ athleteId: string; x: number; y: number } | null>(null);
  
  // Compute initial team assignments based on the selected season
  const getSeasonAssignments = (seasonId: string): Record<string, string[]> => {
    const assignments: Record<string, string[]> = {};
    athletes.forEach(athlete => {
      // Use the new team_assignments array to support multiple team assignments
      athlete.teamAssignments.forEach(ta => {
        // Only include assignments where the team's season matches the selected season
        if (ta.teamSeasonId === seasonId) {
          if (!assignments[ta.teamId]) {
            assignments[ta.teamId] = [];
          }
          // Avoid duplicates
          if (!assignments[ta.teamId].includes(athlete.submissionId)) {
            assignments[ta.teamId].push(athlete.submissionId);
          }
        }
      });
    });
    return assignments;
  };

  // Initialize team assignments from database data for the selected season
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string[]>>(() => 
    getSeasonAssignments(selectedSeasonId)
  );

  // On mount and season change, refresh assignments and auto-open the season's teams in the middle.
  // Note: `teams` is intentionally omitted from deps — assignAthletesToTeam revalidates the route,
  // which hands us a new `teams` array; re-running here would reset teamAssignments and drop the
  // athlete that was just assigned. `teams` is stable within a page instance, so mount covers it.
  useEffect(() => {
    setTeamAssignments(getSeasonAssignments(selectedSeasonId));
    setSelectedTeamIds(teams.filter(t => t.seasonId === selectedSeasonId).map(t => t.id));
    setSelectedAthleteIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeasonId]);

  const { showToast } = useToast();

  // Filter teams by selected season
  const filteredTeams = teams.filter(team => team.seasonId === selectedSeasonId);

  // Find the previous season to offer populate-from action
  const seasonIndex = seasons.findIndex(s => s.id === selectedSeasonId);
  const previousSeason = seasonIndex > 0 ? seasons[seasonIndex - 1] : null;

  // For a given team, find athletes whose previousTeamTitle matches — these are carryover candidates
  const getPreviousSeasonAthletes = (teamTitle: string) =>
    athletes.filter(a => a.previousTeamTitle === teamTitle);

  // Filter registrations by selected program
  const filteredRegistrations = selectedProgramId
    ? allRegistrations.filter(r => r.programId === selectedProgramId)
    : [];

  const programOptions = allPrograms.map(p => ({ value: p.id, label: p.title, status: p.status }));
  const registrationOptions = filteredRegistrations.map(r => ({ value: r.id, label: r.title }));

  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedRegistrationId('');
  };

  const handleRegistrationChange = (registrationId: string) => {
    setSelectedRegistrationId(registrationId);
  };

  const handleTeamSelect = (teamId: string, index: number, shiftKey: boolean) => {
    const isCurrentlySelected = selectedTeamIds.includes(teamId);
    const willBeSelected = !isCurrentlySelected;

    if (shiftKey && lastClickedIndex !== null) {
      // Shift-click: select/deselect range
      const startIndex = Math.min(lastClickedIndex, index);
      const endIndex = Math.max(lastClickedIndex, index);
      const rangeTeamIds = filteredTeams.slice(startIndex, endIndex + 1).map(team => team.id);
      
      if (willBeSelected) {
        // Add all in range
        setSelectedTeamIds(prev => Array.from(new Set([...prev, ...rangeTeamIds])));
      } else {
        // Remove all in range
        setSelectedTeamIds(prev => prev.filter(id => !rangeTeamIds.includes(id)));
      }
    } else {
      // Normal click: toggle single item
      setSelectedTeamIds(prev => 
        prev.includes(teamId) 
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    }
    
    // Update last clicked index
    setLastClickedIndex(index);
  };

  // Season options for the selector
  const seasonOptions = seasons.map(s => ({
    value: s.id,
    label: `${s.name} Season`,
  }));

  const handleSeasonChange = (newSeasonId: string) => {
    setSelectedSeasonId(newSeasonId);
    // Reset selection state when season changes
    setSelectedTeamIds([]);
    setLastClickedIndex(null);
  };

  const handleBack = () => {
    router.push(returnTo ?? `/teams?season=${selectedSeasonId}`);
  };

  // Computed values hoisted so both rails can access them
  const allAssignedIds = Object.values(teamAssignments).flat();
  const registrationAthletes = selectedRegistrationId
    ? allAthletes.filter(a => a.registrationId === selectedRegistrationId)
    : [];
  const isSearchDisabled = registrationAthletes.length === 0;
  const filteredAthletes = registrationAthletes.filter(athlete => {
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
    return fullName.includes(athleteSearch.toLowerCase());
  });

  const handleAthleteSelect = (athleteId: string, index: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedAthleteIndex !== null) {
      const start = Math.min(lastClickedAthleteIndex, index);
      const end = Math.max(lastClickedAthleteIndex, index);
      const rangeIds = filteredAthletes.slice(start, end + 1).map(a => a.submissionId);
      const isCurrentlySelected = selectedAthleteIds.includes(athleteId);
      if (isCurrentlySelected) {
        setSelectedAthleteIds(prev => prev.filter(id => !rangeIds.includes(id)));
      } else {
        setSelectedAthleteIds(prev => Array.from(new Set([...prev, ...rangeIds])));
      }
    } else {
      setSelectedAthleteIds(prev =>
        prev.includes(athleteId)
          ? prev.filter(id => id !== athleteId)
          : [...prev, athleteId]
      );
    }
    setLastClickedAthleteIndex(index);
  };

  const renderAthleteCard = (athlete: typeof filteredAthletes[0], index: number) => {
    const isAssigned = allAssignedIds.includes(athlete.submissionId);
    const athleteTeams = athlete.teamAssignments
      .filter(ta => ta.teamSeasonId === selectedSeasonId)
      .map(ta => {
        const team = teams.find(t => t.id === ta.teamId);
        return team ? { id: team.id, name: team.title, avatar: team.avatar } : null;
      })
      .filter((t): t is { id: string; name: string; avatar: string | null } => t !== null);
    return (
      <AthleteCard
        key={athlete.submissionId}
        name={`${athlete.firstName} ${athlete.lastName}`}
        date={athlete.birthdate}
        status={isAssigned ? 'assigned' : undefined}
        isSelected={selectedAthleteIds.includes(athlete.submissionId)}
        onSelect={(e) => handleAthleteSelect(athlete.submissionId, index, e.shiftKey)}
        showCheckbox={true}
        draggable={true}
        teams={athleteTeams}
        onDragStart={() => {
          const athletesToDrag = selectedAthleteIds.includes(athlete.submissionId)
            ? selectedAthleteIds
            : [athlete.submissionId];
          setDraggedAthleteIds(athletesToDrag);
          setIsDragging(true);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setDraggedAthleteIds([]);
        }}
      />
    );
  };

  return (
    <div className="assignments-page-wrapper">
      {/* Custom header with Send Invitations + Done */}
      <div className="assignments-header">
        <button className="assignments-header-back" onClick={handleBack} aria-label="Back">
          <AssignmentsBackIcon />
        </button>
        <h2 className="assignments-header-title">Team Assignments</h2>
        <div className="assignments-header-actions">
          <button
            className="assignments-header-btn assignments-header-btn--secondary"
            onClick={() => router.push('/teams/send-invitations')}
            disabled={allAssignedIds.length === 0}
            title={allAssignedIds.length === 0 ? 'Assign at least one athlete to a team to send invitations' : undefined}
          >
            Send Invitations
          </button>
          <button
            className="assignments-header-btn assignments-header-btn--primary"
            onClick={handleBack}
          >
            Done
          </button>
        </div>
      </div>

      <div className="assignments-page">
        {/* Left Rail — program/registration filters */}
        <div className="assignments-rail assignments-rail--left">
          <h3 className="filter-section-header">Athletes</h3>
          <div className="left-rail-selects">
            <Select
              options={programOptions}
              value={selectedProgramId}
              onChange={handleProgramChange}
              placeholder="Select Program"
              fullWidth
              searchable
              searchPlaceholder="Search programs..."
            />
            <Select
              options={registrationOptions}
              value={selectedRegistrationId}
              onChange={handleRegistrationChange}
              placeholder="Select Registration"
              fullWidth
              disabled={!selectedProgramId}
              searchable
              searchPlaceholder="Search registrations..."
            />
            <div className={`search-input ${isSearchDisabled ? 'search-input--disabled' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search athletes..."
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                disabled={isSearchDisabled}
              />
            </div>
          </div>
          <hr className="left-rail-divider" />
          <div className="left-rail-athletes">
            {selectedRegistrationId && (
              <div className="athlete-list">
                {filteredAthletes.map((athlete, index) => renderAthleteCard(athlete, index))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="assignments-main">
          {selectedTeamIds.length === 0 ? (
            <div className="empty-state">
              <p>Select a team from the right to manage assignments</p>
            </div>
          ) : (
            <div className="team-cards-container">
              {selectedTeamIds.map(teamId => {
                const team = filteredTeams.find(t => t.id === teamId);
                if (!team) return null;
                const teamIndex = filteredTeams.findIndex(t => t.id === teamId);
                const mockStats = MOCK_STATS[teamIndex % MOCK_STATS.length];
                const isTeamEmpty = (teamAssignments[team.id]?.length || 0) === 0;
                const carryoverAthletes = getPreviousSeasonAthletes(team.title);
                const canPopulate = isTeamEmpty && previousSeason && carryoverAthletes.length > 0;
                return (
                  <TeamCard
                    key={team.id}
                    teamId={team.id}
                    teamName={team.title}
                    connectedRegistration={(() => {
                      const conn = teamConnections[team.id];
                      if (conn?.registrations?.length) {
                        return conn.registrations.length === 1
                          ? conn.registrations[0]
                          : `${conn.registrations[0]} +${conn.registrations.length - 1}`;
                      }
                      return MOCK_REG_NAMES[teamIndex % MOCK_REG_NAMES.length];
                    })()}
                    avatar={team.avatar}
                    status={team.seasonId === 'season-1' ? 'archived' : 'draft'}
                    assignedCount={teamAssignments[team.id]?.length || mockStats.assigned}
                    invitedCount={mockStats.invited}
                    acceptedCount={mockStats.accepted}
                    declinedCount={mockStats.declined}
                    populateFromSeasonName={canPopulate ? `${previousSeason.name} Season` : undefined}
                    onPopulateFromPreviousSeason={canPopulate ? () => {
                      const newIds = carryoverAthletes.map(a => a.submissionId);
                      setTeamAssignments(prev => ({
                        ...prev,
                        [team.id]: Array.from(new Set([...(prev[team.id] || []), ...newIds])),
                      }));
                      showToast(`${newIds.length} ${newIds.length === 1 ? 'athlete' : 'athletes'} added from ${previousSeason.name} Season`, 'success');
                    } : undefined}
                    assignedAthletes={(teamAssignments[team.id] || []).map((athleteId, athleteIdx) => {
                      const athlete = allAthletes.find(a => a.submissionId === athleteId);
                      let athleteStatus: 'assigned' | 'invited' | 'accepted' | 'declined' | 'deposit' | 'paid' | 'pending' = 'assigned';
                      if (athleteStatuses[athleteId]) {
                        athleteStatus = athleteStatuses[athleteId];
                      } else if (mockStats.accepted > 0 && athleteIdx === 0) {
                        athleteStatus = 'paid';
                      } else if (mockStats.accepted > 1 && athleteIdx === 1) {
                        athleteStatus = 'deposit';
                      } else if (athleteIdx < mockStats.accepted) {
                        athleteStatus = 'accepted';
                      } else if (athleteIdx < mockStats.invited) {
                        athleteStatus = 'invited';
                      }
                      return athlete ? {
                        id: athlete.submissionId,
                        name: `${athlete.firstName} ${athlete.lastName}`,
                        birthdate: athlete.birthdate,
                        avatar: null,
                        status: athleteStatus,
                      } : null;
                    }).filter((a): a is NonNullable<typeof a> => a !== null)}
                    onAthleteStatusClick={(athleteId, e) => {
                      if (statusDropdown?.athleteId === athleteId) { setStatusDropdown(null); return; }
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setStatusDropdown({ athleteId, x: rect.right, y: rect.bottom + 4 });
                    }}
                    isDragActive={isDragging}
                    onDrop={async (teamId) => {
                      const idsToAssign = [...draggedAthleteIds];
                      const athleteCount = idsToAssign.length;
                      setTeamAssignments(prev => {
                        const currentTeamAthletes = prev[teamId] || [];
                        const newAthletes = idsToAssign.filter(id => !currentTeamAthletes.includes(id));
                        return {
                          ...prev,
                          [teamId]: [...currentTeamAthletes, ...newAthletes],
                        };
                      });
                      setSelectedAthleteIds([]);
                      setDraggedAthleteIds([]);
                      const result = await assignAthletesToTeam({
                        teamId,
                        submissionIds: idsToAssign,
                      });
                      if (result.success) {
                        const athleteText = athleteCount === 1 ? 'athlete' : 'athletes';
                        showToast(`${athleteCount} ${athleteText} assigned to ${team.title}`, 'success');
                      } else {
                        showToast(result.error || 'Failed to assign athletes', 'error');
                      }
                    }}
                    onRemoveAthlete={selectedSeasonId === 'season-1' ? undefined : async (athleteId) => {
                      setTeamAssignments(prev => ({
                        ...prev,
                        [team.id]: (prev[team.id] || []).filter(id => id !== athleteId),
                      }));
                      const result = await unassignAthleteFromTeam(team.id, athleteId);
                      if (result.success) {
                        showToast('Athlete removed from team', 'success');
                      } else {
                        showToast(result.error || 'Failed to remove athlete', 'error');
                      }
                    }}
                    onAddAthletes={() => {
                      // TODO: Implement add athletes functionality
                    }}
                    onEditRegistration={openAttachModal}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rail — season selector + Teams section */}
        <div className="assignments-rail assignments-rail--right">
          <h3 className="filter-section-header">Teams</h3>
          <div className="rail-header">
            <Select
              options={seasonOptions}
              value={selectedSeasonId}
              onChange={handleSeasonChange}
              placeholder="Select season"
              fullWidth
            />
          </div>
          <div className="filter-section">
            <div className="filter-list">
              {filteredTeams.map((team, index) => {
                const mockStats = MOCK_STATS[index % MOCK_STATS.length];
                const regName = teamConnections[team.id]?.registration || MOCK_REG_NAMES[index % MOCK_REG_NAMES.length];
                return (
                  <FilterItem
                    key={team.id}
                    label={team.title}
                    avatar={team.avatar}
                    isSelected={selectedTeamIds.includes(team.id)}
                    onClick={(e) => handleTeamSelect(team.id, index, e.shiftKey)}
                    count={teamAssignments[team.id]?.length || 0}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ── Assignments custom header ── */
        .assignments-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--u-space-one-and-half, 24px);
          height: 48px;
          flex-shrink: 0;
        }

        .assignments-header-back {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: var(--u-border-radius-medium, 4px);
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
        }
        .assignments-header-back:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .assignments-header-title {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground, #36485c);
          margin: 0;
        }

        .assignments-header-actions {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
        }

        .assignments-header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          padding: 0 18px;
          border-radius: var(--u-border-radius-medium, 4px);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .assignments-header-btn--primary {
          border: none;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
        }
        .assignments-header-btn--primary:hover {
          background: #0261c2;
        }

        .assignments-header-btn--secondary {
          border: 1.5px solid var(--u-color-emphasis-background-contrast, #0273e3);
          background: transparent;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .assignments-header-btn--secondary:hover {
          background: rgba(2, 115, 227, 0.06);
        }

        .assignments-header-btn:disabled {
          border-color: var(--u-color-line-subtle, #c4c6c8);
          background: transparent;
          color: var(--u-color-base-foreground-subtle, #85909e);
          cursor: not-allowed;
        }
        .assignments-header-btn:disabled:hover {
          background: transparent;
        }

        /* ── Page shell ── */
        .assignments-page-wrapper {
          position: fixed;
          inset: 0;
          background: var(--u-color-background-canvas, #eff0f0);
          padding: var(--u-space-half, 8px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
        }

        .assignments-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          gap: var(--u-space-quarter, 4px);
        }

        .assignments-rail {
          width: 320px;
          flex-shrink: 0;
          background: var(--u-color-background-container, #fefefe);
          border-radius: var(--u-border-radius-large, 8px);
          padding: var(--u-space-one-and-half, 24px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .assignments-rail--left {
        }

        .assignments-rail--left {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-bottom: 0;
        }

        .assignments-rail--right {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .left-rail-selects {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
          flex-shrink: 0;
        }

        .left-rail-divider {
          border: none;
          border-top: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          margin: var(--u-space-one, 16px) 0;
          flex-shrink: 0;
        }

        .left-rail-selects .search-input {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
          height: 40px;
          padding: 0 var(--u-space-three-quarter, 12px);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          color: var(--u-color-base-foreground, #36485c);
          transition: border-color 0.15s ease;
        }

        .left-rail-selects .search-input:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .left-rail-selects .search-input input {
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          color: var(--u-color-base-foreground-contrast, #071c31);
          width: 100%;
        }

        .left-rail-selects .search-input input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .left-rail-selects .search-input--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .left-rail-selects .search-input--disabled input {
          cursor: not-allowed;
        }

        .left-rail-athletes {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding-bottom: 24px;
        }

        .athlete-list {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .athlete-group {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-quarter, 4px);
        }

        .athlete-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--u-space-quarter, 4px) var(--u-space-half, 8px);
          background: var(--u-color-background-canvas, #eff0f0);
          border-radius: var(--u-border-radius-small, 4px);
          margin-bottom: 2px;
        }

        .athlete-group-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-150, 12px);
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          letter-spacing: 0.02em;
        }

        .athlete-group-count {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-150, 12px);
          color: var(--u-color-base-foreground-subtle, #7a8fa6);
        }

        .rail-header {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          flex-shrink: 0;
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          margin-top: var(--u-space-one, 16px);
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .filter-section-header {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-100, 12px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-subtle, #607081);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 var(--u-space-half, 8px) 0;
          padding: 0 8px;
        }

        .filter-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .filter-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          height: 32px;
          padding: 0 8px;
          border: none;
          background: transparent;
          border-radius: var(--u-border-radius-medium, 4px);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.15s ease;
        }

        .filter-item--has-subtitle {
          height: auto;
          padding: 6px 8px;
        }

        .filter-item:hover {
          background: var(--u-color-background-callout, #f8f8f9);
        }

        .filter-item--selected {
          background: var(--u-color-background-subtle, #e0e1e1);
        }

        .filter-item--selected:hover {
          background: var(--u-color-background-subtle, #e0e1e1);
        }

        .filter-item-avatar {
          width: 24px;
          height: 24px;
          padding: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .filter-item-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--u-color-identity-default, #38434f);
          border: 1px solid var(--u-color-identity-white, #fafafa);
        }

        .filter-item-avatar-inner--has-image {
          background: var(--u-color-background-container, #fefefe);
        }

        .filter-item-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .filter-item-avatar-initials {
          font-family: var(--u-font-body);
          font-size: 10px;
          font-weight: var(--u-font-weight-bold, 700);
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .filter-item-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .filter-item-top-row {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .filter-item-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-medium, 14px);
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground, #36485c);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .filter-item-reg-pill {
          display: inline-flex;
          align-items: center;
          height: 20px;
          padding: 0 7px;
          border-radius: 4px;
          background: var(--u-color-background-canvas, #e0e1e1);
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          flex-shrink: 1;
        }

        .filter-item-stats {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-wrap: wrap;
        }

        .filter-item-stat {
          font-family: var(--u-font-body);
          font-size: 11px;
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
        }

        .filter-item-stat--declined {
          color: #bb1700;
        }

        .filter-item-stat-dot {
          font-size: 11px;
          color: var(--u-color-line-subtle, #c4c6c8);
        }

        .filter-item--selected .filter-item-label {
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .filter-item-label--subtle {
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .filter-item--selected .filter-item-label--subtle {
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .filter-item-count {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: var(--u-font-weight-default, 400);
          color: var(--u-color-base-foreground-subtle, #607081);
          flex-shrink: 0;
        }

        .filter-item-check {
          flex-shrink: 0;
          color: var(--u-color-base-foreground, #36485c);
        }

        .assignments-main {
          flex: 1;
          min-width: 0;
          background: var(--u-color-background-container, #fefefe);
          border-radius: var(--u-border-radius-large, 8px);
          padding: 0 var(--u-space-one-and-half, 24px) 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
        }

        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
        }

        .team-cards-container {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          padding-top: var(--u-space-one-and-half, 24px);
          padding-bottom: var(--u-space-one-and-half, 24px);
        }
        .tc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .tc-modal {
          background: var(--u-color-background-container, #fefefe);
          border-radius: 8px;
          width: 400px;
          max-width: calc(100vw - 32px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }

        .tc-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .tc-modal-title {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
        }

        .tc-modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 4px;
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
        }

        .tc-modal-close:hover { background: var(--u-color-background-canvas, #eff0f0); }

        .tc-modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tc-modal-label {
          display: block;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          margin-bottom: 4px;
        }

        .tc-modal-select-wrap { position: relative; display: flex; align-items: center; }

        .tc-modal-select {
          width: 100%;
          appearance: none;
          padding: 8px 32px 8px 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
        }

        .tc-modal-select-chevron {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .tc-modal-select:disabled { opacity: 0.5; cursor: not-allowed; }

        .tc-modal-hint {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground-subtle, #607081);
          padding: 8px 0;
        }

        .tc-modal-reg-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 4px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 6px;
          overflow: hidden;
        }

        .tc-modal-reg-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          background: var(--u-color-background-container, #fefefe);
          transition: background 0.1s ease;
        }

        .tc-modal-reg-item:not(:last-child) {
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .tc-modal-reg-item:hover {
          background: var(--u-color-background-callout, #f8f8f9);
        }

        .tc-modal-reg-checkbox {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          cursor: pointer;
          accent-color: var(--u-color-emphasis-foreground, #085bb4);
        }

        .tc-modal-reg-name {
          flex: 1;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
        }

        .tc-modal-reg-price {
          font-family: var(--u-font-body);
          font-size: 13px;
          color: var(--u-color-base-foreground-subtle, #607081);
          flex-shrink: 0;
        }

        .tc-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px 16px;
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .tc-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .tc-btn--secondary {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground, #36485c);
        }

        .tc-btn--primary {
          background: var(--u-color-emphasis-foreground, #085bb4);
          color: #fff;
        }

        .tc-btn--disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      {attachModalTeamId && createPortal(
        <div className="tc-modal-overlay" onClick={() => setAttachModalTeamId(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h3 className="tc-modal-title">Attach Registration</h3>
              <button className="tc-modal-close" onClick={() => setAttachModalTeamId(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="tc-modal-body">
              <div>
                <label className="tc-modal-label">Program</label>
                <div className="tc-modal-select-wrap">
                  <select
                    className="tc-modal-select"
                    value={modalProgramId}
                    onChange={(e) => { setModalProgramId(e.target.value); setModalRegistrationIds([]); }}
                  >
                    <option value="">Select a program…</option>
                    {DUES_PROGRAMS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="tc-modal-select-chevron"><ChevronDownIcon /></span>
                </div>
              </div>
              <div>
                <label className="tc-modal-label">Registrations</label>
                {!modalProgram ? (
                  <p className="tc-modal-hint">Select a program first</p>
                ) : (
                  <div className="tc-modal-reg-list">
                    {modalProgram.registrations.map(r => (
                      <label key={r.id} className="tc-modal-reg-item">
                        <input
                          type="checkbox"
                          className="tc-modal-reg-checkbox"
                          checked={modalRegistrationIds.includes(r.id)}
                          onChange={(e) => {
                            setModalRegistrationIds(prev =>
                              e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id)
                            );
                          }}
                        />
                        <span className="tc-modal-reg-name">{r.name}</span>
                        <span className="tc-modal-reg-price">{r.price}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="tc-modal-footer">
              <button className="tc-btn tc-btn--secondary" onClick={() => setAttachModalTeamId(null)}>Cancel</button>
              <button
                className={`tc-btn tc-btn--primary${(!modalProgramId || modalRegistrationIds.length === 0) ? ' tc-btn--disabled' : ''}`}
                onClick={confirmAttach}
                disabled={!modalProgramId || modalRegistrationIds.length === 0}
              >
                Attach
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {statusDropdown && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100 }} onClick={() => setStatusDropdown(null)} />
          <div
            style={{
              position: 'fixed',
              top: statusDropdown.y,
              right: `calc(100vw - ${statusDropdown.x}px)`,
              zIndex: 1101,
              background: 'var(--u-color-background-container, #fefefe)',
              border: '1px solid var(--u-color-line-subtle, #c4c6c8)',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 130,
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {([
              { value: 'assigned',  label: 'Assigned' },
              { value: 'invited',   label: 'Invited' },
              { value: 'accepted',  label: 'Accepted' },
              { value: 'declined',  label: 'Declined' },
              { value: 'deposit',   label: 'Paid Deposit' },
              { value: 'paid',      label: 'Paid in Full' },
              { value: 'pending',   label: 'Pending Payment' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                style={{
                  padding: '7px 14px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--u-font-body)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--u-color-base-foreground, #36485c)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--u-color-background-canvas, #eff0f0)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                onClick={(e) => {
                  e.stopPropagation();
                  setAthleteStatuses(prev => ({ ...prev, [statusDropdown.athleteId]: opt.value }));
                  setStatusDropdown(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
