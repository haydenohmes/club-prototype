'use client';

import React, { useState } from 'react';

import AthleteCard from './AthleteCard';

interface AssignedAthlete {
  id: string;
  name: string;
  birthdate: string;
  avatar?: string | null;
  status?: 'assigned' | 'invited' | 'accepted' | 'declined' | 'deposit' | 'paid' | 'pending';
}

interface TeamCardProps {
  teamName: string;
  teamId: string;
  avatar?: string | null;
  status?: string;
  connectedRegistration?: string;
  assignedCount?: number;
  invitedCount?: number;
  acceptedCount?: number;
  declinedCount?: number;
  assignedAthletes?: AssignedAthlete[];
  onAddAthletes?: () => void;
  onDrop?: (teamId: string) => void;
  onRemoveAthlete?: (athleteId: string) => void;
  onAthleteStatusClick?: (athleteId: string, e: React.MouseEvent) => void;
  onEditRegistration?: (teamId: string) => void;
  isDragActive?: boolean;
}

export default function TeamCard({
  teamName,
  teamId,
  avatar,
  status,
  connectedRegistration,
  assignedCount = 0,
  invitedCount = 0,
  acceptedCount = 0,
  declinedCount = 0,
  assignedAthletes = [],
  onAddAthletes,
  onDrop,
  onRemoveAthlete,
  onAthleteStatusClick,
  onEditRegistration,
  isDragActive = false,
}: TeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragActive) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDragActive && onDrop) {
      onDrop(teamId);
    }
  };

  // Generate initials from team name for fallback
  const initials = teamName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div 
      className={`team-card ${isDragOver ? 'team-card--drag-over' : ''} ${isDragActive ? 'team-card--drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="team-card-header">
        <div className="team-card-avatar">
          <div className={`team-card-avatar-inner ${avatar ? 'team-card-avatar-inner--has-image' : ''}`}>
            {avatar ? (
              <img src={avatar} alt={teamName} className="team-card-avatar-img" />
            ) : (
              <span className="team-card-avatar-initials">{initials}</span>
            )}
          </div>
        </div>
        <div className="team-card-info">
          <div className="team-card-name-row">
            <h3 className="team-card-name">{teamName}</h3>
            {status === 'draft' && <span className="team-card-status-badge team-card-status-badge--draft">Draft</span>}
            {status === 'archived' && <span className="team-card-status-badge">Archived</span>}
            {connectedRegistration && (
              <button type="button" className="team-card-reg-pill" onClick={() => onEditRegistration?.(teamId)}>
                <span className="team-card-reg-pill-text">{connectedRegistration}</span>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
                  <path d="M11.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <div className="team-card-stats">
            <span className="team-card-stat">
              Assigned: <strong>{assignedCount}</strong>
            </span>
            <span className="team-card-stat">
              Invited: <strong>{invitedCount}</strong>
            </span>
            <span className="team-card-stat">
              Accepted: <strong>{acceptedCount}</strong>
            </span>
            <span className="team-card-stat">
              Declined: <strong>{declinedCount}</strong>
            </span>
          </div>
        </div>
        <button
          type="button"
          className="team-card-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`toggle-icon ${isExpanded ? 'toggle-icon--expanded' : ''}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <>
          {assignedAthletes.length > 0 ? (
            <div className="team-card-athletes">
              {assignedAthletes.map(athlete => (
                <AthleteCard
                  key={athlete.id}
                  name={athlete.name}
                  date={athlete.birthdate}
                  avatar={athlete.avatar}
                  status={status === 'archived' ? undefined : (athlete.status ?? 'assigned')}
                  showStatusPill={status !== 'archived'}
                  onStatusClick={onAthleteStatusClick ? (e) => onAthleteStatusClick(athlete.id, e) : undefined}
                  showCheckbox={false}
                  draggable={false}
                  onRemove={onRemoveAthlete ? () => onRemoveAthlete(athlete.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div
              className={`team-card-add-athletes ${isDragOver ? 'team-card-add-athletes--drag-over' : ''}`}
              onClick={onAddAthletes}
            >
              Add Athletes
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        .team-card {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          padding: var(--u-space-one, 16px);
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.25);
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .team-card--drag-over {
          background: var(--u-color-emphasis-background, #e7f3fd);
          border-color: var(--u-color-emphasis-foreground, #085bb4);
        }

        .team-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--u-space-three-quarter, 12px);
        }

        .team-card-avatar {
          width: 40px;
          height: 40px;
          padding: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .team-card-avatar-inner {
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

        .team-card-avatar-inner--has-image {
          background: var(--u-color-background-container, #fefefe);
        }

        .team-card-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-card-avatar-initials {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: var(--u-font-weight-bold, 700);
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .team-card-info {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-quarter, 4px);
          flex: 1;
          min-width: 0;
        }

        .team-card-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .team-card-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 600;
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground-subtle, #607081);
          white-space: nowrap;
        }

        .team-card-name {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
        }

        .team-card-reg-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 26px;
          padding: 0 8px;
          border: none;
          border-radius: 4px;
          background: var(--u-color-background-canvas, #e0e1e1);
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
          max-width: 160px;
          flex-shrink: 0;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .team-card-reg-pill:hover {
          background: var(--u-color-background-subtle, #d4d5d6);
        }

        .team-card-reg-pill-text {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .team-card-status-badge--draft {
          background: var(--u-color-warning-background, #fef3c7);
          color: var(--u-color-warning-foreground, #92400e);
        }

        .team-card-stats {
          display: flex;
          gap: var(--u-space-half, 8px);
          flex-wrap: nowrap;
          overflow: hidden;
        }

        .team-card-stat {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-150, 12px);
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
          white-space: nowrap;
        }

        .team-card-stat strong {
          font-weight: var(--u-font-weight-bold, 700);
          font-feature-settings: 'lnum', 'tnum';
        }

        .team-card-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          background: transparent;
          border-radius: var(--u-border-radius-medium, 4px);
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .team-card-toggle:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          color: var(--u-color-base-foreground, #36485c);
        }

        .toggle-icon {
          transition: transform 0.2s ease;
        }

        .toggle-icon--expanded {
          transform: rotate(180deg);
        }

        .team-card-add-athletes {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 var(--u-space-half, 8px);
          background: var(--u-color-background-container, #fefefe);
          border: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-small, 2px);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .team-card-add-athletes:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
          color: var(--u-color-base-foreground, #36485c);
        }

        .team-card-add-athletes--drag-over {
          background: var(--u-color-emphasis-background-hover, #c9e5f9);
          border-color: var(--u-color-emphasis-foreground, #085bb4);
          color: var(--u-color-emphasis-foreground-contrast, #0d3673);
        }

        .team-card-athletes {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
        }
      `}</style>
    </div>
  );
}
