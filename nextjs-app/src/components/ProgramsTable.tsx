'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { ProgramWithStats } from '@/lib/actions/programs';
import Toolbar from './Toolbar';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import type { EmptyStateVariant } from './EmptyState';

function formatDateRange(eventDates: { start?: string; end?: string }) {
  if (!eventDates.start && !eventDates.end) return '—';
  
  const startDateObj = eventDates.start ? new Date(eventDates.start) : null;
  const endDateObj = eventDates.end ? new Date(eventDates.end) : null;
  
  if (startDateObj && endDateObj) {
    const sameYear = startDateObj.getFullYear() === endDateObj.getFullYear();
    
    if (sameYear) {
      // Same year: "Sep 19 – Nov 29, 2025"
      const startFormatted = format(startDateObj, 'MMM d');
      const endFormatted = format(endDateObj, 'MMM d, yyyy');
      return `${startFormatted} – ${endFormatted}`;
    } else {
      // Different years: "Dec 15, 2025 – Jan 10, 2026"
      const startFormatted = format(startDateObj, 'MMM d, yyyy');
      const endFormatted = format(endDateObj, 'MMM d, yyyy');
      return `${startFormatted} – ${endFormatted}`;
    }
  }
  
  // Only one date available
  if (startDateObj) return format(startDateObj, 'MMM d, yyyy');
  if (endDateObj) return format(endDateObj, 'MMM d, yyyy');
  
  return '—';
}

function formatProgramType(type: string): string {
  const typeMap: Record<string, string> = {
    'tryout': 'Tryout',
    'team-dues': 'Club Dues',
    'season': 'Season',
    'one-time-registration': 'One-Time Registration',
    'camp': 'Camp',
    'clinic': 'Clinic',
    'other': 'Other'
  };
  return typeMap[type.toLowerCase()] || type;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatVisibility(visibility: string): string {
  return visibility === 'public' ? 'Public' : 'Private';
}

function formatRegistrationStatus(status: string): string {
  return status === 'open' ? 'Open' : 'Closed';
}

function MoreOptionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="3" cy="8" r="1.5" fill="var(--u-color-base-foreground, #36485c)" />
      <circle cx="8" cy="8" r="1.5" fill="var(--u-color-base-foreground, #36485c)" />
      <circle cx="13" cy="8" r="1.5" fill="var(--u-color-base-foreground, #36485c)" />
    </svg>
  );
}

function RowActions({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.right - 200 });
    setOpen(v => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        className="more-options-btn"
        aria-label="More options"
        onClick={toggle}
      >
        <MoreOptionsIcon />
      </button>
      {open && createPortal(
        <div ref={menuRef} className="row-menu" style={{ position: 'fixed', top: pos.top, left: pos.left }}>
          <button
            className="row-menu-item row-menu-item--danger"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 4.5h11M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M12.5 4.5l-.8 8a1 1 0 0 1-1 .9H5.3a1 1 0 0 1-1-.9l-.8-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Delete program
          </button>
          <style jsx>{`
            .row-menu {
              min-width: 200px;
              background: var(--u-color-background-container, #fefefe);
              border: 1px solid var(--u-color-line-subtle, #c4c6c8);
              border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
              padding: 4px;
              z-index: 3000;
            }
            .row-menu-item {
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
              font-weight: 500;
              color: var(--u-color-base-foreground, #36485c);
              cursor: pointer;
              text-align: left;
              white-space: nowrap;
              transition: background 0.1s ease;
            }
            .row-menu-item--danger {
              color: var(--u-color-alert-foreground, #bb1700);
            }
            .row-menu-item--danger:hover {
              background: rgba(187, 23, 0, 0.08);
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}

function StatusBadge({ status, type }: { status: string; type: 'visibility' | 'registration' }) {
  const isPositive = type === 'visibility' ? status === 'public' : status === 'open';
  const label = type === 'visibility' ? formatVisibility(status) : formatRegistrationStatus(status);
  
  return (
    <span className={`status-badge ${isPositive ? 'positive' : 'neutral'}`}>
      {label}
      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: var(--u-space-quarter, 4px) var(--u-space-half, 8px);
          border-radius: var(--u-border-radius-medium, 4px);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-150, 12px);
          font-weight: var(--u-font-weight-medium, 500);
          line-height: 1.4;
        }
        
        .positive {
          background: #E7F3FD;
          color: #085BB4;
        }
        
        .neutral {
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </span>
  );
}


function CreatorAvatar({ creator }: { creator: ProgramWithStats['createdBy'] }) {
  if (!creator) {
    return <span className="no-creator">—</span>;
  }

  const initials = `${creator.firstName.charAt(0)}${creator.lastName.charAt(0)}`;
  const fullName = `${creator.firstName} ${creator.lastName}`;

  return (
    <div className="creator-info">
      {creator.avatar ? (
        <img src={creator.avatar} alt={fullName} className="creator-avatar" />
      ) : (
        <div className="creator-avatar-placeholder">{initials}</div>
      )}
      <span className="creator-name">{fullName}</span>
      <style jsx>{`
        .creator-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .creator-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }
        .creator-avatar-placeholder {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--u-color-background-default, #e8eaec);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
        }
        .creator-name {
          white-space: nowrap;
        }
        .no-creator {
          color: var(--u-color-base-foreground-subtle, #607081);
        }
      `}</style>
    </div>
  );
}

function TableContent({ programs, onRequestDelete, onRowClick }: { programs: ProgramWithStats[]; onRequestDelete: (program: ProgramWithStats) => void; onRowClick: (program: ProgramWithStats) => void }) {
  return (
    <div className="programs-table">
      {/* Header Row */}
      <div className="table-row table-header">
        <div className="table-cell cell-title">
          <span className="header-label">Title</span>
        </div>
        <div className="table-cell cell-registration">
          <span className="header-label">Registration</span>
        </div>
        <div className="table-cell cell-visibility">
          <span className="header-label">Visibility</span>
        </div>
        <div className="table-cell cell-type">
          <span className="header-label">Type</span>
        </div>
        <div className="table-cell cell-dates">
          <span className="header-label">Event Dates</span>
        </div>
        <div className="table-cell cell-created-by">
          <span className="header-label">Created By</span>
        </div>
        <div className="table-cell cell-registrants align-right">
          <span className="header-label">Registrants</span>
        </div>
        <div className="table-cell cell-value align-right">
          <span className="header-label">Program Value</span>
        </div>
        <div className="table-cell cell-actions">
          {/* Empty header for actions column */}
        </div>
      </div>

      {/* Data Rows */}
      {programs.map((program) => (
        <div key={program.id} className="table-row table-data" onClick={() => onRowClick(program)}>
          <div className="table-cell cell-title emphasized">
            {program.title}
          </div>
          <div className="table-cell cell-registration">
            <StatusBadge status={program.registrationStatus} type="registration" />
          </div>
          <div className="table-cell cell-visibility">
            <StatusBadge status={program.visibility} type="visibility" />
          </div>
          <div className="table-cell cell-type">
            {formatProgramType(program.type)}
          </div>
          <div className="table-cell cell-dates">
            {formatDateRange(program.eventDates)}
          </div>
          <div className="table-cell cell-created-by">
            <CreatorAvatar creator={program.createdBy} />
          </div>
          <div className="table-cell cell-registrants align-right">
            {program.registrantCount}
          </div>
          <div className="table-cell cell-value align-right">
            {formatCurrency(program.programValue)}
          </div>
          <div className="table-cell cell-actions">
            <RowActions onDelete={() => onRequestDelete(program)} />
          </div>
        </div>
      ))}

      <style jsx>{`
        .programs-table {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 1100px;
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
          height: 52px;
          box-sizing: border-box;
        }

        .table-data:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
          cursor: pointer;
        }

        .table-data .cell-title {
          text-decoration: underline;
          text-decoration-color: transparent;
          text-decoration-style: dashed;
          text-underline-offset: 4px;
          transition: text-decoration-color 0.15s ease;
        }

        .table-data:hover .cell-title {
          text-decoration-color: var(--u-color-line-subtle, #c4c6c8);
        }

        .table-cell {
          display: flex;
          align-items: center;
          gap: var(--u-space-quarter, 4px);
          padding: var(--u-space-half, 8px) var(--u-space-one, 16px);
          font-family: var(--u-font-body);
          font-weight: var(--u-font-weight-medium, 500);
          font-size: var(--u-font-size-200, 14px);
          line-height: 1.4;
          color: var(--u-color-base-foreground, #36485c);
        }

        .table-header .table-cell {
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .cell-title {
          flex: 1;
          min-width: 180px;
        }

        .cell-created-by {
          width: 160px;
          flex-shrink: 0;
        }

        .cell-dates {
          width: 190px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .cell-type {
          width: 90px;
          flex-shrink: 0;
        }

        .cell-registrants {
          width: 100px;
          flex-shrink: 0;
        }

        .cell-value {
          width: 120px;
          flex-shrink: 0;
        }

        .cell-visibility {
          width: 100px;
          flex-shrink: 0;
        }

        .cell-registration {
          width: 110px;
          flex-shrink: 0;
        }

        .cell-actions {
          width: 48px;
          flex-shrink: 0;
          justify-content: center;
        }

        .align-right {
          justify-content: flex-end;
          text-align: right;
        }

        .emphasized {
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .header-label {
          white-space: nowrap;
        }

        .more-options-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: var(--u-border-radius-medium, 4px);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .more-options-btn:hover {
          background: var(--u-color-background-default, #e8eaec);
        }
      `}</style>
    </div>
  );
}

export default function ProgramsTable({ programs, onDeleteProgram }: { programs: ProgramWithStats[]; onDeleteProgram?: (id: string) => void }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ProgramWithStats | null>(null);

  const segments = [
    {
      placeholder: 'Status',
      value: statusFilter,
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archive', label: 'Archived' },
      ],
      onChange: (value: string) => setStatusFilter(value),
    },
  ];

  // Filter programs based on status field
  const statusFilteredPrograms = programs.filter(program => {
    if (statusFilter === 'published') return program.status === 'published';
    if (statusFilter === 'draft') return program.status === 'draft';
    if (statusFilter === 'archive') return program.status === 'archived';
    return true;
  });

  // Filter programs based on search query within the selected segment
  const filteredPrograms = searchQuery.trim()
    ? statusFilteredPrograms.filter(program => {
        const query = searchQuery.toLowerCase().trim();
        // Search across title, type, and visibility
        return (
          program.title.toLowerCase().includes(query) ||
          program.type.toLowerCase().includes(query) ||
          program.visibility.toLowerCase().includes(query)
        );
      })
    : statusFilteredPrograms;

  // Check if we have no results due to search
  const isSearchEmpty = searchQuery.trim() && statusFilteredPrograms.length > 0 && filteredPrograms.length === 0;

  // Determine which empty state variant to show
  const getEmptyStateVariant = (): EmptyStateVariant => {
    if (isSearchEmpty) return 'search';
    if (statusFilter === 'draft') return 'programs-draft';
    if (statusFilter === 'archive') return 'programs-archived';
    return 'programs';
  };

  return (
    <div className="programs-content">
      <Toolbar
        segments={segments}
        searchPlaceholder="Search programs..."
        onSearch={(query) => setSearchQuery(query)}
        onFilter={() => console.log('Filter clicked')}
        onExport={() => console.log('Export clicked')}
      />

      {filteredPrograms.length > 0 ? (
        <div className="table-scroll-container">
          <TableContent
            programs={filteredPrograms}
            onRequestDelete={setPendingDelete}
            onRowClick={(program) => router.push(`/programs/${program.id}`)}
          />
        </div>
      ) : (
        <EmptyState variant={getEmptyStateVariant()} searchQuery={searchQuery} />
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        message={pendingDelete ? `Delete “${pendingDelete.title}”? This can't be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) onDeleteProgram?.(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <style jsx>{`
        .programs-content {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
          width: 100%;
        }

        .table-scroll-container {
          width: 100%;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
