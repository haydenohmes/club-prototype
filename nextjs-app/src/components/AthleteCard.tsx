'use client';

import React from 'react';

interface TeamInfo {
  id: string;
  name: string;
  avatar?: string | null;
}

interface AthleteCardProps {
  name: string;
  avatar?: string | null;
  date: string;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  status?: 'unassigned' | 'assigned' | 'invited' | 'accepted' | 'declined';
  showStatusPill?: boolean;
  showCheckbox?: boolean;
  onRemove?: () => void;
  teams?: TeamInfo[];
}

export default function AthleteCard({
  name,
  avatar,
  date,
  isSelected = false,
  onSelect,
  draggable = false,
  onDragStart,
  onDragEnd,
  status,
  showStatusPill = false,
  showCheckbox = true,
  onRemove,
  teams = [],
}: AthleteCardProps) {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div 
      className={`athlete-card ${isSelected ? 'athlete-card--selected' : ''} ${draggable ? 'athlete-card--draggable' : ''} ${status === 'assigned' ? 'athlete-card--assigned' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="athlete-card-drag">
        <img src="/icons/UI Reorder.svg" alt="" width={16} height={16} draggable={false} />
      </div>
      <div className="athlete-card-content">
        <div className="athlete-card-avatar">
          <div className={`athlete-card-avatar-inner ${avatar ? 'athlete-card-avatar-inner--has-image' : ''}`}>
            {avatar ? (
              <img src={avatar} alt={name} className="athlete-card-avatar-img" draggable={false} />
            ) : (
              <span className="athlete-card-avatar-initials">{initials}</span>
            )}
          </div>
        </div>
        <div className="athlete-card-info">
          <span className="athlete-card-name">{name}</span>
          {teams.length > 0 ? (
            <div className="athlete-card-teams">
              <div className="athlete-card-teams-avatars">
                {teams.slice(0, 3).map((team, i) => {
                  const teamInitials = team.name
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={team.id}
                      className={`athlete-card-team-avatar ${team.avatar ? 'athlete-card-team-avatar--has-image' : ''}`}
                      style={{ zIndex: 3 - i }}
                    >
                      {team.avatar ? (
                        <img src={team.avatar} alt={team.name} className="athlete-card-team-avatar-img" draggable={false} />
                      ) : (
                        <span className="athlete-card-team-avatar-initials">{teamInitials}</span>
                      )}
                    </div>
                  );
                })}
                {teams.length > 3 && (
                  <div className="athlete-card-team-avatar athlete-card-team-avatar--more" style={{ zIndex: 0 }}>
                    <span className="athlete-card-team-avatar-initials">+{teams.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="athlete-card-teams-text">
                {teams.map(t => t.name).join(', ')}
              </span>
            </div>
          ) : (
            <span className="athlete-card-date">{date}</span>
          )}
        </div>
      </div>
      {status && (status !== 'assigned' || showStatusPill) && (
        <span className={`athlete-card-status athlete-card-status--${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )}
      {showCheckbox && (
        <button
          type="button"
          className="athlete-card-checkbox-btn"
          onClick={(e) => onSelect?.(e)}
        >
          <img 
            src={isSelected ? '/icons/checkbox-filled.svg' : '/icons/checkbox-empty.svg'} 
            alt={isSelected ? 'Selected' : 'Not selected'}
            width={16} 
            height={16}
            draggable={false}
          />
        </button>
      )}
      {onRemove && (
        <button
          className="athlete-card-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove athlete"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <style jsx global>{`
        .athlete-card {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
          height: 52px;
          padding: 0 var(--u-space-half, 8px) 0 0;
          background: var(--u-color-background-callout, #f8f8f9);
          border: 1px solid transparent;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .athlete-card--selected {
          background: var(--u-color-background-canvas, #eff0f0);
        }

        .athlete-card--draggable {
          cursor: grab;
          user-select: none;
        }

        .athlete-card--draggable:active {
          cursor: grabbing;
          opacity: 0.8;
        }

        .athlete-card-drag {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 100%;
          padding: 0 var(--u-space-quarter, 4px);
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground-subtle, #607081);
          flex-shrink: 0;
          border-radius: 3px 0 0 3px;
        }

        .athlete-card-content {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
          flex: 1;
          min-width: 0;
        }

        .athlete-card-avatar {
          width: 32px;
          height: 32px;
          padding: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .athlete-card-avatar-inner {
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

        .athlete-card-avatar-inner--has-image {
          background: var(--u-color-background-container, #fefefe);
        }

        .athlete-card-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .athlete-card-avatar-initials {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: var(--u-font-weight-bold, 700);
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .athlete-card-info {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
          min-width: 0;
        }

        .athlete-card-name {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .athlete-card-status {
          display: inline-flex;
          align-items: center;
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: var(--u-font-weight-medium, 500);
          padding: 4px 8px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .athlete-card-status--assigned {
          background: #e8f3fe;
          color: #0273e3;
        }

        .athlete-card--assigned {
          background: var(--u-color-background-callout, #f8f8f9);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .athlete-card--assigned .athlete-card-drag {
          background: var(--u-color-background-canvas, #eff0f0);
        }

        .athlete-card-status--invited {
          background: #fff3e0;
          color: #e65100;
        }

        .athlete-card-status--accepted {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .athlete-card-status--declined {
          background: #ffebee;
          color: #c62828;
        }

        .athlete-card-status--unassigned {
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .athlete-card-date {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-100, 12px);
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .athlete-card-teams {
          display: flex;
          align-items: center;
          gap: var(--u-space-quarter, 4px);
          min-width: 0;
        }

        .athlete-card-teams-avatars {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .athlete-card-team-avatar {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--u-color-identity-default, #38434f);
          border: 1.5px solid var(--u-color-background-callout, #f8f8f9);
          margin-left: -6px;
          flex-shrink: 0;
        }

        .athlete-card-team-avatar:first-child {
          margin-left: 0;
        }

        .athlete-card-team-avatar--has-image {
          background: var(--u-color-background-container, #fefefe);
        }

        .athlete-card-team-avatar--more {
          background: var(--u-color-background-default, #e8eaec);
        }

        .athlete-card-team-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .athlete-card-team-avatar-initials {
          font-family: var(--u-font-body);
          font-size: 8px;
          font-weight: var(--u-font-weight-bold, 700);
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.2px;
          line-height: 1;
        }

        .athlete-card-team-avatar--more .athlete-card-team-avatar-initials {
          color: var(--u-color-base-foreground-subtle, #607081);
          font-size: 9px;
        }

        .athlete-card-teams-text {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-100, 12px);
          font-weight: var(--u-font-weight-medium, 500);
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .athlete-card-checkbox-btn {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          border-radius: var(--u-border-radius-medium, 4px);
        }

        .athlete-card-checkbox-btn:hover {
          background: transparent;
        }

        .athlete-card-remove {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--u-border-radius-medium, 4px);
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .athlete-card-remove:hover {
          background: var(--u-color-background-subtle, #e0e1e1);
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </div>
  );
}
