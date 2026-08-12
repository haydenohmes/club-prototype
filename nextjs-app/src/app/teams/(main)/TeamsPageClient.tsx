'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Button from '@/components/Button';
import TeamsTable from '@/components/TeamsTable';
import TeamsGrid from '@/components/TeamsGrid';
import Toolbar from '@/components/Toolbar';
import CopyTeamsModal from '@/components/CopyTeamsModal';
import ArchiveTeamsModal from '@/components/ArchiveTeamsModal';
import UpgradeModal from '@/components/UpgradeModal';
// ActionBar removed — teams are confirmed via the draft banner, not bulk selection
import ConfirmDialog from '@/components/ConfirmDialog';
import NewSeasonModal from '@/components/NewSeasonModal';
import type { TeamWithStats, Season, StaffUser, RosterAthlete } from '@/lib/actions/teams';
import ConfirmTeamsDrawer from '@/components/ConfirmTeamsDrawer';
import { deleteTeams, archiveTeams } from '@/lib/actions/teams';
import { maryvilleTeams } from '@/lib/mockHighSchoolData';
import { type EmptyStateVariant } from '@/components/EmptyState';
import TeamsFilterPanel, { type TeamsFilters, createDefaultTeamsFilters, countTeamsFilters } from '@/components/TeamsFilterPanel';
import { useToast } from '@/components/Toast';


function getAcademicYear(seasonName: string): string {
  const match = seasonName.match(/(Fall|Spring)\s+(\d{4})/i);
  if (!match) return seasonName;
  const term = match[1].toLowerCase();
  const year = parseInt(match[2], 10);
  return term === 'fall' ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function formatGender(gender: string): string {
  const genderMap: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    girls: 'Girls',
    boys: 'Boys',
    coed: 'Coed',
  };
  return genderMap[gender.toLowerCase()] || gender;
}

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface TeamsPageClientProps {
  teams: TeamWithStats[];
  seasons: Season[];
  staff: StaffUser[];
  rosterAthletes: RosterAthlete[];
  currentUser: CurrentUser | null;
  initialSeasonId?: string;
}

export default function TeamsPageClient({ teams, seasons, initialSeasonId }: TeamsPageClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { workspaceType } = useWorkspace();
  const isHighSchool = workspaceType === 'highschool';
  const activeSeason = seasons.find(s => s.isActive) || seasons[0];
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId || activeSeason?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNewSeasonModalOpen, setIsNewSeasonModalOpen] = useState(false);
  const [isNewSeasonTransferOpen, setIsNewSeasonTransferOpen] = useState(false);
  const [teamsMenuOpen, setTeamsMenuOpen] = useState(false);
  const teamsMenuRef = useRef<HTMLDivElement>(null);
  const [isConfirmDrawerOpen, setIsConfirmDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (teamsMenuRef.current && !teamsMenuRef.current.contains(e.target as Node)) {
        setTeamsMenuOpen(false);
      }
    }
    if (teamsMenuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [teamsMenuOpen]);

  const [localTeams, setLocalTeams] = useState<TeamWithStats[]>(teams);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [teamFilters, setTeamFilters] = useState<TeamsFilters>(() =>
    createDefaultTeamsFilters(isHighSchool ? undefined : '2026-2027')
  );
  // The filter panel docks beside the content card (a sibling of .content-inner)
  const [mainContentEl, setMainContentEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMainContentEl(document.querySelector('.main-content'));
  }, []);

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  // Show all teams across all seasons so the year column and filter are meaningful
  const activeTeamPool = isHighSchool ? maryvilleTeams : localTeams;
  const seasonFilteredTeams = activeTeamPool;

  const STATUS_ORDER: Record<string, number> = { draft: 0, pending: 1, active: 2, archived: 3 };

  const preStatusFiltered = seasonFilteredTeams.filter(team => {
    if (searchQuery.trim() && !team.title.toLowerCase().includes(searchQuery.toLowerCase()) && !team.sport.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (teamFilters.genders.length && !teamFilters.genders.includes(team.gender)) return false;
    if (teamFilters.sports.length && !teamFilters.sports.includes(team.sport)) return false;
    if (teamFilters.seasons.length) {
      if (isHighSchool) {
        if (!team.grades || !teamFilters.seasons.includes(team.grades)) return false;
      } else {
        const teamSeason = seasons.find(s => s.id === team.seasonId);
        if (!teamSeason || !teamFilters.seasons.includes(getAcademicYear(teamSeason.name))) return false;
      }
    }
    if (teamFilters.programs.length && !teamFilters.programs.includes(team.programId ?? '')) return false;
    return true;
  });
  const filteredTeams = preStatusFiltered.filter(team => {
    if (teamFilters.statuses.length && !teamFilters.statuses.includes(team.status)) return false;
    return true;
  }).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));

  const uniqueSports = Array.from(new Set(seasonFilteredTeams.map((t: { sport: string }) => t.sport).filter(Boolean)));
  const uniqueGenders = Array.from(new Set(seasonFilteredTeams.map((t: { gender: string }) => t.gender).filter(Boolean)));
  const combinedSeasonOptions = isHighSchool
    ? Array.from(new Set(seasonFilteredTeams.map((t: { grades: string | null }) => t.grades).filter(Boolean)) as Set<string>)
        .map(g => ({ value: g, label: g }))
    : Array.from(new Set(seasons.map(s => getAcademicYear(s.name)).filter(Boolean)))
        .map(year => ({ value: year, label: year }));
  const sportOptions = uniqueSports.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
  const genderOptions = uniqueGenders.map(g => ({ value: g, label: formatGender(g) }));
  const programOptions = Array.from(
    new Map(
      activeTeamPool
        .filter((t: TeamWithStats) => t.programId && t.programName)
        .map((t: TeamWithStats) => [t.programId!, { value: t.programId!, label: t.programName! }])
    ).values()
  );
  const filterOptionSets = { seasonOptions: combinedSeasonOptions, programOptions, sportOptions, genderOptions };
  const activeFilterCount = countTeamsFilters(teamFilters, filterOptionSets);

  const handleClearSelection = () => {
    setSelectedTeamIds([]);
  };

  const handleDeleteTeams = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTeams(selectedTeamIds);
      if (result.success) {
        setLocalTeams(prev => prev.filter(team => !selectedTeamIds.includes(team.id)));
        handleClearSelection();
        setIsDeleteDialogOpen(false);
      }
    } catch {
      // Error handling - dialog stays open
    } finally {
      setIsDeleting(false);
    }
  };

  const getEmptyStateVariant = (): EmptyStateVariant => {
    if (searchQuery.trim() && filteredTeams.length === 0) return 'search';
    if (filteredTeams.length === 0 && teamFilters.seasons.length > 0) return 'teams-season';
    return 'teams';
  };

  const draftTeams = preStatusFiltered.filter((t: { status: string }) => t.status === 'draft');

  return (
    <div className="teams-page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontFamily: 'var(--u-font-body)',
            fontWeight: 700,
            fontSize: '32px',
            lineHeight: '1.2',
            letterSpacing: '0.25px',
            color: 'var(--u-color-base-foreground-contrast, #071c31)',
            margin: 0,
            flexShrink: 0,
          }}>
            Teams
          </h1>
          <div className="teams-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--u-color-base-foreground-subtle, #607081)' }}>
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search teams..." />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!isHighSchool && (
            <>
              <Button
                buttonStyle="standard"
                buttonType="primary"
                size="medium"
                onClick={() => router.push(`/teams/manage?season=${selectedSeasonId}`)}
              >
                Add Teams
              </Button>
              <Button
                buttonStyle="standard"
                buttonType="secondary"
                size="medium"
                onClick={() => router.push('/teams/assignments')}
              >
                Assign Athletes
              </Button>
            </>
          )}

          {/* Ellipsis ⋯ */}
          <div style={{ position: 'relative' }} ref={teamsMenuRef}>
            <button
              className={`teams-ellipsis ${teamsMenuOpen ? 'teams-ellipsis--open' : ''}`}
              onClick={() => setTeamsMenuOpen((v) => !v)}
              aria-label="More actions"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="13" cy="8" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {teamsMenuOpen && (
              <div className="teams-dropdown">
                <button
                  className="teams-dropdown-item"
                  onClick={() => { setTeamsMenuOpen(false); router.push('/programs/transfer'); }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8a4 4 0 0 1 6.6-3.1M12 8a4 4 0 0 1-6.6 3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M10.6 3.2l2 1.8-2.1 1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.4 12.8l-2-1.8 2.1-1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Transfer Teams to New Season
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <NewSeasonModal
        isOpen={isNewSeasonModalOpen}
        onClose={() => setIsNewSeasonModalOpen(false)}
        onTransfer={() => {
          setIsNewSeasonModalOpen(false);
          setIsNewSeasonTransferOpen(true);
        }}
        onCreateNew={() => {
          setIsNewSeasonModalOpen(false);
          router.push(`/teams/manage?season=${selectedSeasonId}`);
        }}
      />

      <CopyTeamsModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        selectedTeamIds={selectedTeamIds}
        sourceSeasonId={selectedSeasonId}
        seasons={seasons}
        onSuccess={(newTeams) => {
          const idsToArchive = selectedTeamIds.filter(id =>
            localTeams.find(t => t.id === id)?.status === 'active'
          );
          archiveTeams(idsToArchive);
          setLocalTeams(prev => [
            ...prev.map(t => idsToArchive.includes(t.id) ? { ...t, status: 'archived' } : t),
            ...newTeams,
          ]);
          handleClearSelection();
        }}
      />

      <CopyTeamsModal
        isOpen={isNewSeasonTransferOpen}
        onClose={() => setIsNewSeasonTransferOpen(false)}
        selectedTeamIds={localTeams.filter(t => t.seasonId === activeSeason?.id).map(t => t.id)}
        sourceSeasonId={activeSeason?.id ?? ''}
        seasons={seasons}
        defaultTargetSeasonId={selectedSeasonId}
        onSuccess={(newTeams) => {
          const idsToArchive = localTeams
            .filter(t => t.seasonId === activeSeason?.id && t.status === 'active')
            .map(t => t.id);
          archiveTeams(idsToArchive);
          setLocalTeams(prev => [
            ...prev.map(t => idsToArchive.includes(t.id) ? { ...t, status: 'archived' } : t),
            ...newTeams,
          ]);
          setIsNewSeasonTransferOpen(false);
        }}
      />

      <ArchiveTeamsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        selectedCount={selectedTeamIds.length}
        seasonName={selectedSeason?.name ?? ''}
        onConfirm={async () => {
          const ids = [...selectedTeamIds];
          await archiveTeams(ids);
          setLocalTeams(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'archived' } : t));
          showToast(`Successfully archived ${ids.length} ${ids.length === 1 ? 'team' : 'teams'}`, 'success');
          handleClearSelection();
        }}
      />

      <ConfirmTeamsDrawer
        isOpen={isConfirmDrawerOpen}
        onClose={() => setIsConfirmDrawerOpen(false)}
        onConfirm={async (ids) => {
          setLocalTeams(prev => prev.map(t => ids.includes(t.id) && t.status === 'draft' ? { ...t, status: 'active' } : t));
          setIsConfirmDrawerOpen(false);
          const seasonLabel = selectedSeason ? getAcademicYear(selectedSeason.name) : '';
          showToast(`${ids.length} ${ids.length === 1 ? 'team' : 'teams'} confirmed${seasonLabel ? ` for the ${seasonLabel} season` : ''}`, 'success');
          handleClearSelection();
        }}
        teams={activeTeamPool.filter(t => selectedTeamIds.includes(t.id))}
        seasonName={selectedSeason ? getAcademicYear(selectedSeason.name) : ''}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        message={`If you delete ${selectedTeamIds.length === 1 ? 'this team' : `these ${selectedTeamIds.length} teams`}, ${selectedTeamIds.length === 1 ? "it" : "they"} can't be recovered. Do you want to continue?`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteTeams}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <div className="teams-content">
        <div className="toolbar-wrapper">
          <Toolbar
            segments={[]}
            showExport={false}
            showSearch={false}
            filterLabel="Filters"
            filterActiveCount={activeFilterCount}
            onFilter={() => setFiltersOpen(v => !v)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewToggleAlign="right"
          />
        </div>
        {draftTeams.length > 0 && (teamFilters.statuses.length === 0 || teamFilters.statuses.includes('draft')) && (
          <div className="draft-notice">
            <div className="draft-notice-main">
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--u-color-background-canvas, #eff0f0)', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--u-color-base-foreground-subtle, #607081)' }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.75" fill="currentColor" />
                </svg>
              </span>
              <div>
                You have teams in draft status. Confirm teams to begin the season.
              </div>
            </div>
            <Button
              buttonStyle="standard"
              buttonType="primary"
              size="small"
              onClick={() => {
                setSelectedTeamIds(draftTeams.map(t => t.id));
                setIsConfirmDrawerOpen(true);
              }}
            >
              Confirm Teams
            </Button>
          </div>
        )}
        {viewMode === 'grid' ? (
          <TeamsGrid
            teams={filteredTeams}
            seasons={seasons}
            onTeamClick={(teamId) => {
              const team = filteredTeams.find(t => t.id === teamId);
              if (team?.status === 'draft') {
                setSelectedTeamIds(draftTeams.map(t => t.id));
                setIsConfirmDrawerOpen(true);
              } else {
                router.push(`/teams/${teamId}`);
              }
            }}
          />
        ) : (
          <TeamsTable
            teams={filteredTeams}
            seasons={seasons}
            emptyStateVariant={getEmptyStateVariant()}
            emptyStateSeasonName={selectedSeason?.name}
            emptyStateAction={undefined}
            searchQuery={searchQuery}
            copyMode={false}
            onTeamClick={(teamId) => {
              const team = filteredTeams.find(t => t.id === teamId);
              if (team?.status === 'draft') {
                setSelectedTeamIds(draftTeams.map(t => t.id));
                setIsConfirmDrawerOpen(true);
              } else {
                router.push(`/teams/${teamId}`);
              }
            }}
          />
        )}
        </div>
      {mainContentEl && createPortal(
        <div
          style={{
            order: -1,
            flexShrink: 0,
            overflow: 'hidden',
            width: filtersOpen ? 288 : 0,
            alignSelf: 'stretch',
            display: 'flex',
            transition: 'width 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <TeamsFilterPanel
            isOpen={filtersOpen}
            filters={teamFilters}
            setFilters={setTeamFilters}
            seasonOptions={combinedSeasonOptions}
            programOptions={programOptions}
            sportOptions={sportOptions}
            genderOptions={genderOptions}
            onClose={() => setFiltersOpen(false)}
          />
        </div>,
        mainContentEl
      )}

      <style jsx>{`
        .teams-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .teams-search {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          flex: 1;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
        }
        .teams-search:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .teams-search input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .teams-search input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }




        .status-tabs {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--u-space-half, 8px);
        }

        .status-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: none;
          background: var(--u-color-background-canvas, #eff0f0);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-text-small, 12px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .status-tab:hover {
          background: var(--u-color-background-default, #e8eaec);
        }

        .status-tab--selected {
          background: var(--u-color-base-foreground-contrast, #071c31);
          color: #ffffff;
        }

        .status-tab--selected:hover {
          background: var(--u-color-base-foreground-contrast, #071c31);
        }

        .status-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.12);
          font-size: 11px;
          font-weight: var(--u-font-weight-bold, 700);
          line-height: 1;
        }

        .status-tab--selected .status-tab-count {
          background: rgba(255, 255, 255, 0.2);
        }

        .teams-content {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          width: 100%;
        }

        .draft-notice {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.5;
          align-self: flex-start;
          max-width: 100%;
          box-sizing: border-box;
        }

        .draft-notice-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toolbar-wrapper {
          position: relative;
          width: 100%;
        }

        .filter-clear {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-150, 12px);
          color: var(--u-color-link-foreground, #0273e3);
          padding: 0 var(--u-space-quarter, 4px);
          white-space: nowrap;
        }

        .filter-clear:hover {
          text-decoration: underline;
        }

        .teams-ellipsis {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          flex-shrink: 0;
        }
        .teams-ellipsis:hover,
        .teams-ellipsis--open {
          background: var(--u-color-background-canvas, #eff0f0);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }
        .teams-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 224px;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 100;
          padding: 4px;
        }
        .teams-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          background: none;
          border: none;
          border-radius: 5px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          text-align: left;
          white-space: nowrap;
          transition: background 0.1s ease;
        }
        .teams-dropdown-item:hover {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
      `}</style>
    </div>
  );
}
