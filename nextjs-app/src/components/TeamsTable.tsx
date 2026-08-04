'use client';

import type { TeamWithStats, Season } from '@/lib/actions/teams';
import EmptyState from './EmptyState';
import type { EmptyStateVariant } from './EmptyState';
import Checkbox from './Checkbox';

function formatGrades(grades: string | null): string {
  if (!grades) return '—';
  
  const gradeValues = grades.split(',').map(g => parseInt(g.trim(), 10)).sort((a, b) => a - b);
  
  if (gradeValues.length === 0) return '—';
  
  const formatSingleGrade = (grade: number): string => {
    if (grade === -1) return 'Pre-K';
    if (grade === 0) return 'K';
    const suffix = grade === 1 ? 'st' : grade === 2 ? 'nd' : grade === 3 ? 'rd' : 'th';
    return `${grade}${suffix}`;
  };
  
  if (gradeValues.length === 1) {
    return formatSingleGrade(gradeValues[0]);
  }
  
  // Check if consecutive - show as range
  const isConsecutive = gradeValues.every((val, i) => 
    i === 0 || val === gradeValues[i - 1] + 1
  );
  
  if (isConsecutive && gradeValues.length > 2) {
    return `${formatSingleGrade(gradeValues[0])}–${formatSingleGrade(gradeValues[gradeValues.length - 1])}`;
  }
  
  return gradeValues.map(formatSingleGrade).join(', ');
}

function formatSport(sport: string): string {
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

function formatGender(gender: string): string {
  const genderMap: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    coed: 'Coed',
  };
  return genderMap[gender.toLowerCase()] || gender;
}

function getAcademicYear(seasonName: string): string {
  const match = seasonName.match(/(Fall|Spring)\s+(\d{4})/i);
  if (!match) return seasonName;
  const term = match[1].toLowerCase();
  const year = parseInt(match[2], 10);
  return term === 'fall' ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getSeasonName(seasonId: string | null, seasons: Season[]): string {
  if (!seasonId) return '—';
  const season = seasons.find(s => s.id === seasonId);
  if (!season) return '—';
  return getAcademicYear(season.name);
}

// Sport-specific SVG paths for the circular icon
const sportIconPaths: Record<string, React.ReactNode> = {
  volleyball: (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8.5" stroke="white" strokeWidth="1.25"/>
      <path d="M4.2 6.5C5.8 5.5 7.8 5.2 9.7 5.8" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M15.8 6.5C14.2 5.5 12.2 5.2 10.3 5.8" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M10 5.8C10 7.8 11.2 9.6 13 10.5" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M10 5.8C10 7.8 8.8 9.6 7 10.5" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M4.2 13.5C5.5 12 6 10 5.5 8.2" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M15.8 13.5C14.5 12 14 10 14.5 8.2" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M4.2 13.5C6.5 14.8 9.5 14.8 11.5 13.2" stroke="white" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  ),
  baseball: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5"/>
      <path d="M6 4.5C7.5 6 8 8 8 10s-.5 4-2 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M14 4.5C12.5 6 12 8 12 10s.5 4 2 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  basketball: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5"/>
      <path d="M2 10h16M10 2v16M4.5 4.5c1.5 1.5 2 3.5 2 5.5s-.5 4-2 5.5M15.5 4.5c-1.5 1.5-2 3.5-2 5.5s.5 4 2 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  football: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="10" rx="7" ry="4.5" stroke="white" strokeWidth="1.5" transform="rotate(-30 10 10)"/>
      <path d="M5.5 7.5l9 5M7 5.5l6 9" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  fieldhockey: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 4l2 8c.5 1.5 1.5 2.5 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 12c0 1.5 1.5 3 3.5 3s3.5-1.5 3.5-3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="6" r="2" stroke="white" strokeWidth="1.2"/>
    </svg>
  ),
  golf: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 3l5 2.5-5 2.5" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="10" cy="16" r="1.5" fill="white"/>
    </svg>
  ),
  gymnastics: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="5" r="1.5" fill="white"/>
      <path d="M10 7v4l-3 4M10 11l3 4M7 9h6" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  icehockey: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6 4l2 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 13c1 1.5 3 2.5 5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="13" cy="15.5" rx="2.5" ry="1" stroke="white" strokeWidth="1.2"/>
    </svg>
  ),
  lacrosse: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 15l9-9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 6c1-1 2-.5 2 .5s-1 1.5-2 1.5H12c-1 0-1.5-1-1.5-2S11 4 12 4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5.5" cy="14.5" r="1.2" fill="white"/>
    </svg>
  ),
  swimming: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 14c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="10" cy="6" r="1.5" fill="white"/>
      <path d="M10 7.5v2" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  cheer: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3l1.5 4h4l-3.5 2.5 1.5 4L10 11 6.5 13.5 8 9.5 4.5 7h4z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
};

function SportIcon({ sport }: { sport: string }) {
  const icon = sportIconPaths[sport.toLowerCase()] ?? (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5"/>
      <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  return (
    <span className="sport-circle-icon">
      {icon}
      <style jsx>{`
        .sport-circle-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1a2332;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </span>
  );
}

function TeamAvatar({ avatar, title }: { avatar: string | null; title: string }) {
  const initials = title
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="team-avatar">
      <div className={`team-avatar-inner ${avatar ? 'team-avatar-inner--has-image' : ''}`}>
        {avatar ? (
          <img src={avatar} alt={title} />
        ) : (
          <span className="team-avatar-initials">{initials}</span>
        )}
      </div>
      <style jsx>{`
        .team-avatar {
          width: 32px;
          height: 32px;
          padding: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .team-avatar-inner {
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
        .team-avatar-inner--has-image {
          background: var(--u-color-background-container, #fefefe);
        }
        .team-avatar-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .team-avatar-initials {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: var(--u-font-weight-bold, 700);
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.3px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}

function RosterBadge({ count }: { count: number; max: number | null }) {
  const displayText = `${count}`;
  
  return (
    <span className="roster-badge">
      {displayText}
      <style jsx>{`
        .roster-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          background: var(--u-color-background-default, #e8eaec);
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </span>
  );
}

function TeamColors({ primaryColor, secondaryColor }: { primaryColor: string | null; secondaryColor: string | null }) {
  if (!primaryColor && !secondaryColor) {
    return null;
  }

  return (
    <div className="team-colors">
      {primaryColor && (
        <div 
          className="team-color-block team-color-block--primary"
          style={{ 
            backgroundColor: primaryColor,
          }}
        />
      )}
      {secondaryColor && (
        <div 
          className="team-color-block team-color-block--secondary"
          style={{ 
            backgroundColor: secondaryColor,
          }}
        />
      )}
      <style jsx>{`
        .team-colors {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 16px;
          height: 24px;
          align-items: flex-start;
          padding: 2px;
          border: 1px solid var(--u-color-background-canvas, #eff0f0);
          box-sizing: border-box;
          border-radius: var(--u-border-radius-medium, 4px);
        }

        .team-color-block {
          width: 100%;
          flex: 1;
          flex-shrink: 0;
          min-height: 0;
        }

        .team-color-block--primary {
          border-radius: 2px 2px 0 0;
        }

        .team-color-block--secondary {
          border-radius: 0 0 2px 2px;
        }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDraft = status === 'draft';
  const isArchived = status === 'archived';
  const isPending = status === 'pending';
  const label = isDraft ? 'Draft' : isArchived ? 'Archived' : isPending ? 'Pending' : 'Active';
  const badgeClass = isDraft ? 'status-badge--draft' : isArchived ? 'status-badge--archived' : isPending ? 'status-badge--pending' : 'status-badge--active';

  return (
    <span className="status-badge-wrapper">
      <span className={`status-badge ${badgeClass}`}>
        {label}
      </span>
      {isDraft && (
        <span className="status-tooltip">Build your teams and confirm to make active.</span>
      )}
      <style jsx>{`
        .status-badge-wrapper {
          position: relative;
          display: inline-flex;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: var(--u-font-body, sans-serif);
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
        }

        .status-badge-icon {
          flex-shrink: 0;
        }

        .status-badge--draft {
          background: #fef3c7;
          color: #92400e;
          cursor: help;
        }

        .status-badge--active {
          background: #dcfce7;
          color: #14532d;
        }

        .status-badge--archived {
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .status-badge--pending {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #191F24;
          color: var(--u-color-background-container, #fefefe);
          padding: var(--u-space-half, 8px) var(--u-space-three-quarter, 12px);
          border-radius: var(--u-border-radius-medium, 4px);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: var(--u-font-weight-medium, 500);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          z-index: 1000;
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.15), 0px 0px 4px rgba(0, 0, 0, 0.1);
        }

        .status-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #191F24;
        }

        .status-badge-wrapper:hover .status-tooltip {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </span>
  );
}

function TierBadge({ tier }: { tier: 'free' | 'performance' | null }) {
  const label = tier === 'performance' ? 'Performance' : tier === 'free' ? 'Free' : 'None';
  const cls = tier === 'performance' ? 'tier-badge--performance' : tier === 'free' ? 'tier-badge--free' : 'tier-badge--none';
  return (
    <span className={`tier-badge ${cls}`}>
      {label}
      <style jsx>{`
        .tier-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: var(--u-font-body, sans-serif);
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
        }
        .tier-badge--performance {
          background: #fff3e0;
          color: #e65100;
        }
        .tier-badge--free {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .tier-badge--none {
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </span>
  );
}

function SortIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
      <path d="M6 2L8 4.5H4L6 2Z" fill="currentColor"/>
      <path d="M6 10L4 7.5H8L6 10Z" fill="currentColor"/>
    </svg>
  );
}

function TableContent({
  teams,
  copyMode,
  selectedTeamIds = [],
  onTeamSelectionChange,
  onSelectAllChange,
  onSelectAllChangeWithReset,
  onTeamClick,
  onDeleteTeam,
  seasons = []
}: {
  teams: TeamWithStats[];
  copyMode?: boolean;
  seasons?: Season[];
  selectedTeamIds?: string[];
  onTeamSelectionChange?: (teamId: string, checked: boolean, index: number, shiftKey: boolean) => void;
  onSelectAllChange?: (checked: boolean) => void;
  onSelectAllChangeWithReset?: () => void;
  onTeamClick?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
}) {
  const allSelected = !!(copyMode && teams.length > 0 && teams.every(team => selectedTeamIds.includes(team.id)));
  const someSelected = !!(copyMode && teams.length > 0 && selectedTeamIds.length > 0 && !allSelected);

  return (
    <div className="teams-table">
      {/* Header row */}
      <div className="table-row table-header">
        {copyMode && (
          <div className="table-cell cell-checkbox">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => {
                if (allSelected) {
                  onSelectAllChange?.(false);
                } else {
                  if (onSelectAllChangeWithReset) {
                    onSelectAllChangeWithReset();
                  } else {
                    onSelectAllChange?.(true);
                  }
                }
              }}
            />
          </div>
        )}
        <div className="table-cell cell-team-name">
          <span className="header-label">Team Name</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-status">
          <span className="header-label">Status</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-year">
          <span className="header-label">Season</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-gender">
          <span className="header-label">Gender</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-sport">
          <span className="header-label">Sport</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-coaches">
          <span className="header-label">Coaches</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-athletes">
          <span className="header-label">Athletes</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-stat">
          <span className="header-label">Assigned</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-stat">
          <span className="header-label">Invited</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-stat">
          <span className="header-label">Accepted</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-stat">
          <span className="header-label">Declined</span>
          <SortIcon />
        </div>
        <div className="table-cell cell-stat">
          <span className="header-label">Paid</span>
          <SortIcon />
        </div>
        {onDeleteTeam && <div className="table-cell cell-actions" />}
      </div>

      {/* Data rows */}
      {teams.map((team, index) => {
        const isSelected = !!(copyMode && selectedTeamIds.includes(team.id));
        const yearLabel = getSeasonName(team.seasonId, seasons);
        return (
          <div
            key={team.id}
            className={`table-row table-data ${isSelected ? 'table-data--selected' : ''} ${team.status === 'draft' ? 'table-data--draft' : ''}`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.cell-checkbox')) return;
              onTeamClick?.(team.id);
            }}
          >
            {copyMode && (
              <div className="table-cell cell-checkbox">
                <Checkbox checked={isSelected} onChange={(checked, shiftKey) => onTeamSelectionChange?.(team.id, checked, index, shiftKey)} />
              </div>
            )}
            <div className="table-cell cell-team-name" style={{ gap: '8px' }}>
              <SportIcon sport={team.sport} />
              <span className="team-name-text">{team.title}</span>
            </div>
            <div className="table-cell cell-status"><StatusBadge status={team.status} /></div>
            <div className="table-cell cell-year">{yearLabel}</div>
            <div className="table-cell cell-gender">{formatGender(team.gender)}</div>
            <div className="table-cell cell-sport">{team.sport ? formatSport(team.sport) : '—'}</div>
            <div className="table-cell cell-coaches">{team.coachCount}</div>
            <div className="table-cell cell-athletes">{team.rosterCount}</div>
            <div className="table-cell cell-stat">{team.assignedCount ?? 0}</div>
            <div className="table-cell cell-stat">{team.invitedCount ?? 0}</div>
            <div className="table-cell cell-stat">{team.acceptedCount ?? 0}</div>
            <div className="table-cell cell-stat">{team.declinedCount ?? 0}</div>
            <div className="table-cell cell-stat">{team.paidCount ?? 0}</div>
            {onDeleteTeam && (
              <div className="table-cell cell-actions">
                {team.status === 'draft' && (
                  <button
                    className="team-delete-btn"
                    aria-label={`Delete ${team.title}`}
                    onClick={(e) => { e.stopPropagation(); onDeleteTeam(team.id); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 4.5h11M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M12.5 4.5l-.8 8a1 1 0 0 1-1 .9H5.3a1 1 0 0 1-1-.9l-.8-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .teams-table {
          display: flex;
          flex-direction: column;
          min-width: 1016px;
          width: 100%;
        }

        .table-row {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .table-header {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .table-data {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          min-height: 52px;
          box-sizing: border-box;
        }

        .table-data:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          cursor: pointer;
        }

        .table-data--selected {
          background: var(--u-color-background-subtle, #f5f6f7);
        }

        .table-cell {
          display: flex;
          align-items: center;
          gap: var(--u-space-quarter, 4px);
          padding: 8px 10px;
          font-family: var(--u-font-body);
          font-weight: var(--u-font-weight-medium, 500);
          font-size: var(--u-font-size-200, 14px);
          line-height: 1.4;
          color: var(--u-color-base-foreground, #36485c);
          height: 100%;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .table-header .table-cell {
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        /* All columns fixed — team name grows but has a floor; scroll covers narrow viewports */
        .cell-team-name { flex: 1 0 200px; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .cell-status    { flex: 0 0 76px; }
        .cell-year,
        .cell-season    { flex: 0 0 90px; }
        .cell-gender    { flex: 0 0 72px; }
        .cell-sport     { flex: 0 0 90px; }
        .cell-coaches,
        .cell-athletes  { flex: 0 0 74px; padding: 8px 8px; justify-content: flex-end; }
        .cell-stat      { flex: 0 0 68px; padding: 8px 8px; justify-content: flex-end; }

        .cell-actions {
          width: 48px;
          flex: 0 0 48px;
          justify-content: center;
        }

        .team-delete-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: none;
          border-radius: 4px;
          cursor: pointer;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .team-delete-btn:hover {
          background: rgba(187, 23, 0, 0.08);
          color: var(--u-color-alert-foreground, #bb1700);
        }

        .team-name-text {
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
          text-decoration: underline;
          text-decoration-color: transparent;
          text-decoration-style: dashed;
          text-underline-offset: 4px;
          transition: text-decoration-color 0.15s ease;
          overflow: hidden;
          text-overflow: ellipsis;
        }


        .table-data:hover .team-name-text {
          text-decoration-color: var(--u-color-line-subtle, #c4c6c8);
        }

        .cell-checkbox {
          flex-shrink: 0;
          justify-content: center;
          padding-left: 16px;
          padding-right: 2px;
        }

        .header-label {
          white-space: nowrap;
        }


      `}</style>
    </div>
  );
}

interface TeamsTableProps {
  teams: TeamWithStats[];
  seasons?: Season[];
  emptyStateVariant?: EmptyStateVariant;
  emptyStateSeasonName?: string;
  emptyStateAction?: { label: string; onClick: () => void };
  searchQuery?: string;
  copyMode?: boolean;
  selectedTeamIds?: string[];
  onTeamSelectionChange?: (teamId: string, checked: boolean, index: number, shiftKey: boolean) => void;
  onSelectAllChange?: (checked: boolean) => void;
  onSelectAllChangeWithReset?: () => void;
  onTeamClick?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
}

export default function TeamsTable({
  teams,
  seasons = [],
  emptyStateVariant = 'teams',
  emptyStateSeasonName,
  emptyStateAction,
  searchQuery,
  copyMode = false,
  selectedTeamIds = [],
  onTeamSelectionChange,
  onSelectAllChange,
  onSelectAllChangeWithReset,
  onTeamClick,
  onDeleteTeam,
}: TeamsTableProps) {
  return (
    <div className="teams-content">
      {teams.length > 0 ? (
        <div className="teams-table-scroll">
          <TableContent
            teams={teams}
            seasons={seasons}
            copyMode={copyMode}
            selectedTeamIds={selectedTeamIds}
            onTeamSelectionChange={onTeamSelectionChange}
            onSelectAllChange={onSelectAllChange}
            onSelectAllChangeWithReset={onSelectAllChangeWithReset}
            onTeamClick={onTeamClick}
            onDeleteTeam={onDeleteTeam}
          />
        </div>
      ) : (
        <EmptyState
          variant={emptyStateVariant}
          seasonName={emptyStateSeasonName}
          searchQuery={searchQuery}
          action={emptyStateAction}
        />
      )}

      <style jsx>{`
        .teams-content {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          width: 100%;
        }
        .teams-table-scroll {
          overflow-x: auto;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
