'use client';

import React, { useState, useEffect } from 'react';
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
  subtitle?: string;
  avatar?: string | null;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  count?: number;
}

function FilterItem({ label, subtitle, avatar, isSelected, onClick, count }: FilterItemProps) {
  // Generate initials from label for fallback
  const initials = label
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      className={`filter-item ${isSelected ? 'filter-item--selected' : ''} ${subtitle ? 'filter-item--has-subtitle' : ''}`}
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
        <span className={`filter-item-label ${count === 0 ? 'filter-item-label--subtle' : ''}`}>{label}</span>
        {subtitle && <span className="filter-item-subtitle">{subtitle}</span>}
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
  const [teamConnections, setTeamConnections] = useState<Record<string, string>>({});
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
  const [athleteSearch, setAthleteSearch] = useState<string>('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [lastClickedAthleteIndex, setLastClickedAthleteIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAthleteIds, setDraggedAthleteIds] = useState<string[]>([]);
  
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
                const isTeamEmpty = (teamAssignments[team.id]?.length || 0) === 0;
                const carryoverAthletes = getPreviousSeasonAthletes(team.title);
                const canPopulate = isTeamEmpty && previousSeason && carryoverAthletes.length > 0;
                return (
                  <TeamCard
                    key={team.id}
                    teamId={team.id}
                    teamName={team.title}
                    connectedRegistration={teamConnections[team.id]}
                    avatar={team.avatar}
                    status={team.seasonId === 'season-1' ? 'archived' : team.status}
                    assignedCount={teamAssignments[team.id]?.length || 0}
                    invitedCount={0}
                    acceptedCount={0}
                    declinedCount={0}
                    populateFromSeasonName={canPopulate ? `${previousSeason.name} Season` : undefined}
                    onPopulateFromPreviousSeason={canPopulate ? () => {
                      const newIds = carryoverAthletes.map(a => a.submissionId);
                      setTeamAssignments(prev => ({
                        ...prev,
                        [team.id]: Array.from(new Set([...(prev[team.id] || []), ...newIds])),
                      }));
                      showToast(`${newIds.length} ${newIds.length === 1 ? 'athlete' : 'athletes'} added from ${previousSeason.name} Season`, 'success');
                    } : undefined}
                    assignedAthletes={(teamAssignments[team.id] || []).map(athleteId => {
                      const athlete = allAthletes.find(a => a.submissionId === athleteId);
                      return athlete ? {
                        id: athlete.submissionId,
                        name: `${athlete.firstName} ${athlete.lastName}`,
                        birthdate: athlete.birthdate,
                        avatar: null,
                      } : null;
                    }).filter((a): a is NonNullable<typeof a> => a !== null)}
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
              {filteredTeams.map((team, index) => (
                <FilterItem
                  key={team.id}
                  label={team.title}
                  subtitle={teamConnections[team.id]}
                  avatar={team.avatar}
                  isSelected={selectedTeamIds.includes(team.id)}
                  onClick={(e) => handleTeamSelect(team.id, index, e.shiftKey)}
                  count={teamAssignments[team.id]?.length || 0}
                />
              ))}
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
          gap: 1px;
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
        }

        .filter-item-subtitle {
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 400;
          color: var(--u-color-base-foreground-subtle, #607081);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .filter-item--selected .filter-item-subtitle {
          color: var(--u-color-base-foreground, #36485c);
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
      `}</style>
    </div>
  );
}
