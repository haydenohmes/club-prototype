'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { useToast } from '@/components/Toast';
import type { TeamWithStats } from '@/lib/actions/teams';
import SendInvitationsPageClient from '@/app/teams/send-invitations/SendInvitationsPageClient';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  gender: string;
  birthYear: string;
  sport: string;
  season: string;
  rosterCount?: number;
}

interface Registration {
  id: string;
  title: string;
  price: string;
  isFree: boolean;
  startDate: string;
  endDate: string;
}

interface ProgramDetails {
  title: string;
  programType: string;
  typeLabel: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: 'private' | 'public';
  feesCoveredBy: 'registrants' | 'organization';
}

// ─── Persist created program (prototype: localStorage) ──────────────────────

function persistCreatedProgram(program: ProgramDetails | null, builtRegistrations: Registration[] = [], linkedTeamIds: string[] = []) {
  if (!program || typeof window === 'undefined') return;
  try {
    const programId = `local-${Date.now()}`;
    const created = {
      id: programId,
      title: program.title || 'Untitled Program',
      type: program.typeLabel || program.programType || 'Other',
      eventDates: { start: program.startDate || undefined, end: program.endDate || undefined },
      visibility: program.visibility || 'private',
      registrationStatus: 'open',
      status: 'published',
      registrantCount: 0,
      programValue: 0,
      createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User', avatar: null },
    };
    const rawPrograms = localStorage.getItem('createdPrograms');
    const programList = rawPrograms ? JSON.parse(rawPrograms) : [];
    programList.push(created);
    localStorage.setItem('createdPrograms', JSON.stringify(programList));

    // Persist the registration options (mapped to the shape Assign Athletes reads) so this
    // program's registrations — and generated athletes — surface there for team assignment.
    const mappedRegistrations = builtRegistrations.map(r => ({
      id: r.id,
      programId,
      title: r.title || 'Registration',
      sport: 'Volleyball',
      price: r.isFree ? 0 : (parseFloat(r.price) || 0),
      capacity: 0,
      waitlistEnabled: false,
    }));
    if (mappedRegistrations.length) {
      const rawRegs = localStorage.getItem('createdRegistrations');
      const regList = rawRegs ? JSON.parse(rawRegs) : [];
      regList.push(...mappedRegistrations);
      localStorage.setItem('createdRegistrations', JSON.stringify(regList));
    }

    // Record which teams this program's registration is connected to (via Invite Teams), so the
    // teams panel in Assign Athletes can show the connected registration underneath each team.
    if (linkedTeamIds.length) {
      const connectionLabel = mappedRegistrations[0]?.title || created.title;
      const rawConn = localStorage.getItem('teamRegistrationConnections');
      const conn = rawConn ? JSON.parse(rawConn) : {};
      linkedTeamIds.forEach(teamId => { conn[teamId] = connectionLabel; });
      localStorage.setItem('teamRegistrationConnections', JSON.stringify(conn));
    }
  } catch {
    // ignore storage failures in the prototype
  }
}

// ─── Teams from the club store ───────────────────────────────────────────────
// Teams built in the team builder (server store) are passed in and mapped to the
// shape this builder uses, so they show up in the Club Dues "Invite Teams" list.

function mapTeam(t: TeamWithStats): Team {
  return {
    id: t.id,
    name: t.title,
    gender: t.gender,
    birthYear: '',
    sport: t.sport,
    season: t.seasonId ?? '',
    rosterCount: t.rosterCount,
  };
}

// ─── Steps ─────────────────────────────────────────────────────────────────

const STEPS = ['Program Type', 'Program Details', 'Questions', 'Registrations', 'Summary', 'Next Steps'];

// ─── StepIndicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep, steps = STEPS }: { currentStep: number; steps?: string[] }) {
  return (
    <div className="steps-row">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        return (
          <React.Fragment key={label}>
            <div className="step-item">
              <div className={`step-circle${isActive ? ' step-circle--active' : isComplete ? ' step-circle--complete' : ''}`}>
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              <span className={`step-label${isActive ? ' step-label--active' : ''}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-connector${i < currentStep ? ' step-connector--complete' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
      <style jsx>{`
        .steps-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .step-circle {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          border: 2px solid var(--u-color-line-subtle, #c4c6c8);
          background: var(--u-color-background-container, #fefefe);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-circle--active {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .step-circle--complete {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .step-label {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
        }
        .step-label--active {
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .step-connector {
          flex: 1;
          height: 1px;
          background: var(--u-color-line-subtle, #c4c6c8);
          min-width: 16px;
        }
        .step-connector--complete {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }
      `}</style>
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`toggle${checked ? ' toggle--on' : ''}`}
    >
      <span className="toggle-knob" />
      <style jsx>{`
        .toggle {
          width: 32px;
          height: 20px;
          border-radius: 9999px;
          padding: 4px;
          border: 1px solid var(--u-color-line-default, #85909e);
          background: var(--u-color-background-container, #fefefe);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .toggle--on {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          justify-content: flex-end;
        }
        .toggle-knob {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--u-color-base-foreground-subtle, #607081);
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .toggle--on .toggle-knob {
          background: white;
        }
      `}</style>
    </button>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  required,
  optional,
  description,
  toggle,
  children,
}: {
  title: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  toggle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="sc-wrap">
      <div className="sc-top">
        <div className="sc-header-text">
          <div className="sc-title-row">
            <span className="sc-title">{title}</span>
            {required && <span className="sc-required">*</span>}
            {optional && <span className="sc-optional"> (Optional)</span>}
          </div>
          {description && <p className="sc-desc">{description}</p>}
        </div>
        {toggle && <div className="sc-toggle">{toggle}</div>}
      </div>
      {children && <div className="sc-body">{children}</div>}
      <style jsx>{`
        .sc-wrap {
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .sc-top {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
        }
        .sc-header-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sc-title-row {
          display: flex;
          align-items: baseline;
          gap: 3px;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
        }
        .sc-required {
          color: var(--u-color-alert-foreground, #bb1700);
          font-weight: 500;
        }
        .sc-optional {
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sc-desc {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin: 0;
          line-height: 1.4;
        }
        .sc-toggle {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .sc-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

// ─── Drawer form atoms ─────────────────────────────────────────────────────

function DLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="dl-wrap">
      <span>{label}</span>
      {required && <span className="dl-req">*</span>}
      <style jsx>{`
        .dl-wrap {
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1;
        }
        .dl-req {
          color: var(--u-color-alert-foreground, #bb1700);
        }
      `}</style>
    </div>
  );
}

function DInput({
  value,
  onChange,
  placeholder,
  maxLength,
  prefix,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  prefix?: string;
  type?: string;
}) {
  return (
    <div className="di-wrap">
      <div className="di-inner">
        {prefix && <span className="di-prefix">{prefix}</span>}
        <input
          type={type}
          className="di-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      </div>
      {maxLength !== undefined && (
        <span className="di-count">Character limit: {value.length}/{maxLength}</span>
      )}
      <style jsx>{`
        .di-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
        }
        .di-inner {
          display: flex;
          align-items: center;
          height: 40px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          overflow: hidden;
        }
        .di-inner:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
        .di-prefix {
          padding: 0 10px;
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
          border-right: 1px solid var(--u-color-line-subtle, #c4c6c8);
          height: 100%;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          background: var(--u-color-background-canvas, #f3f4f4);
        }
        .di-input {
          flex: 1;
          height: 100%;
          padding: 0 12px;
          border: none;
          outline: none;
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
          background: transparent;
          min-width: 0;
        }
        .di-input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .di-count {
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
      `}</style>
    </div>
  );
}

function DTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="dta-wrap">
      <textarea
        className="dta-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
      />
      {maxLength !== undefined && (
        <span className="dta-count">Character limit: {value.length}/{maxLength}</span>
      )}
      <style jsx>{`
        .dta-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
        }
        .dta-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
          resize: vertical;
          outline: none;
          min-height: 100px;
        }
        .dta-input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .dta-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
        .dta-count {
          font-family: var(--u-font-body);
          font-size: 12px;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
      `}</style>
    </div>
  );
}

function DDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ddate-wrap">
      <input
        type="date"
        className="ddate-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <style jsx>{`
        .ddate-wrap { width: 100%; }
        .ddate-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          cursor: pointer;
        }
        .ddate-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
      `}</style>
    </div>
  );
}

function DCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="dcb-wrap">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="dcb-input"
      />
      <span className="dcb-label">{label}</span>
      <style jsx>{`
        .dcb-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .dcb-input {
          width: 16px;
          height: 16px;
          accent-color: var(--u-color-emphasis-background-contrast, #0273e3);
          cursor: pointer;
          flex-shrink: 0;
        }
        .dcb-label {
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </label>
  );
}

// ─── Teams Modal ───────────────────────────────────────────────────────────

const GENDER_OPTIONS_TEAM = ['Male', 'Female', 'Co-ed'];
const SPORT_OPTIONS_TEAM = ['Football', 'Soccer', 'Basketball', 'Baseball', 'Softball'];

function TeamsModal({
  initialTeams,
  onTeamsDone,
  onCancel,
}: {
  initialTeams: Team[];
  onTeamsDone: (teams: Team[]) => void;
  onCancel: () => void;
}) {
  const [season, setSeason] = useState('2026-2027');
  // All teams across all seasons live here; we filter to the active season for display
  const [allTeams, setAllTeams] = useState<Team[]>(initialTeams);

  // Only the teams belonging to the currently-selected season
  const seasonTeams = allTeams.filter(t => t.season === season);

  const addTeam = () => {
    const team: Team = {
      id: `team-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: '',
      gender: 'Male',
      birthYear: '',
      sport: 'Football',
      season,
    };
    setAllTeams(prev => [...prev, team]);
  };

  const updateTeam = (id: string, field: keyof Omit<Team, 'id'>, value: string) => {
    setAllTeams(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDeleteTeam = (id: string) => {
    setAllTeams(prev => prev.filter(t => t.id !== id));
  };

  const handleDone = () => {
    // Drop empty-named teams from the active season; keep all other seasons intact
    const validTeams = allTeams.filter(t =>
      t.season !== season || t.name.trim().length > 0
    );
    onTeamsDone(validTeams);
  };

  return createPortal(
    <div className="tm-overlay">
      <div className="tm-panel">

        {/* Header */}
        <div className="tm-header">
          <span className="tm-title">Teams</span>
          <button className="tm-close" onClick={onCancel} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="tm-toolbar">
          <div className="tm-season">
            <span className="tm-season-label">Season</span>
            <div className="tm-season-select-wrap">
              <select
                className="tm-season-select"
                value={season}
                onChange={e => setSeason(e.target.value)}
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
              <svg className="tm-season-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="tm-toolbar-actions">
            <button className="tm-bulk-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Bulk Add Teams
            </button>
            <button className="tm-add-btn" onClick={addTeam}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Team
            </button>
          </div>
        </div>

        {/* Table / Empty State */}
        <div className="tm-table-wrap">
          {seasonTeams.length === 0 ? (
            <div className="tm-empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="12" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M24 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="tm-empty-heading">No teams yet</p>
              <p className="tm-empty-body">Click <strong>Add Team</strong> above to create your first team.</p>
            </div>
          ) : (
            <table className="tm-table">
              <thead>
                <tr>
                  <th>
                    Team Name
                    <svg className="tm-sort" width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </th>
                  <th>
                    Gender
                    <svg className="tm-sort" width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </th>
                  <th>
                    Birth Year
                    <svg className="tm-sort" width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </th>
                  <th>
                    Sport
                    <svg className="tm-sort" width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </th>
                  <th className="tm-th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {seasonTeams.map((team, idx) => (
                  <tr key={team.id}>
                    <td>
                      <input
                        className="tm-row-input"
                        value={team.name}
                        onChange={e => updateTeam(team.id, 'name', e.target.value)}
                        placeholder="Team name"
                        autoFocus={idx === seasonTeams.length - 1}
                      />
                    </td>
                    <td>
                      <select
                        className="tm-row-select"
                        value={team.gender}
                        onChange={e => updateTeam(team.id, 'gender', e.target.value)}
                      >
                        {GENDER_OPTIONS_TEAM.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        className="tm-row-input"
                        value={team.birthYear}
                        onChange={e => updateTeam(team.id, 'birthYear', e.target.value)}
                        placeholder="e.g. 2012"
                        maxLength={4}
                      />
                    </td>
                    <td>
                      <select
                        className="tm-row-select"
                        value={team.sport}
                        onChange={e => updateTeam(team.id, 'sport', e.target.value)}
                      >
                        {SPORT_OPTIONS_TEAM.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="tm-row-actions">
                        <button className="tm-action-btn tm-action-btn--delete" aria-label="Delete" onClick={() => handleDeleteTeam(team.id)}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2.5 4.5h11M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M12.5 4.5l-.8 8a1 1 0 0 1-1 .9H5.3a1 1 0 0 1-1-.9l-.8-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="tm-footer">
          <button className="tm-done-btn" onClick={handleDone}>Done</button>
        </div>

      </div>

      <style jsx>{`
        .tm-overlay {
          position: fixed;
          inset: 0;
          background: var(--u-color-background-canvas, #f3f4f4);
          z-index: 300;
          display: flex;
          flex-direction: column;
          animation: tm-fade-in 0.18s ease-out;
        }

        @keyframes tm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .tm-panel {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Header */
        .tm-header {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .tm-title {
          flex: 1;
          font-family: var(--u-font-body);
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .tm-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 2px;
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
          flex-shrink: 0;
          transition: background 0.15s ease;
        }

        .tm-close:hover {
          background: var(--u-color-background-canvas, #eff0f0);
        }

        /* Toolbar */
        .tm-toolbar {
          background: var(--u-color-background-container, #fefefe);
          padding: 12px 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-shrink: 0;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }

        .tm-season {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tm-season-label {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
        }

        .tm-season-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 200px;
        }

        .tm-season-select {
          appearance: none;
          width: 100%;
          height: 40px;
          padding: 0 36px 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          cursor: pointer;
        }

        .tm-season-select:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }

        .tm-season-arrow {
          position: absolute;
          right: 10px;
          color: var(--u-color-base-foreground-subtle, #607081);
          pointer-events: none;
          flex-shrink: 0;
        }

        .tm-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tm-bulk-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          background: var(--u-color-background-canvas, #e0e1e1);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .tm-bulk-btn:hover {
          background: #d0d1d2;
        }

        .tm-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          background: var(--u-color-base-background-contrast, #607081);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: #fefefe;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .tm-add-btn:hover {
          background: #4e5c6a;
        }

        /* Add Team inline form */
        .tm-add-form {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }

        .tm-add-form-title {
          font-family: var(--u-font-body);
          font-size: 15px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .tm-add-form-fields {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tm-add-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 150px;
        }

        .tm-add-label {
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
        }

        .tm-add-input,
        .tm-add-select {
          height: 36px;
          padding: 0 10px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          appearance: none;
        }

        .tm-add-input:focus,
        .tm-add-select:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }

        .tm-add-form-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tm-cancel-btn {
          height: 36px;
          padding: 0 14px;
          background: none;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
        }

        .tm-cancel-btn:hover { background: var(--u-color-background-canvas, #f3f4f4); }

        .tm-save-btn {
          height: 36px;
          padding: 0 14px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: #fefefe;
          transition: background 0.15s ease;
        }

        .tm-save-btn:hover { background: #005bbf; }
        .tm-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Empty state */
        .tm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          color: var(--u-color-base-foreground-subtle, #85909e);
          text-align: center;
        }

        .tm-empty-heading {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
        }

        .tm-empty-body {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          max-width: 320px;
          line-height: 1.5;
        }

        /* Table */
        .tm-table-wrap {
          flex: 1;
          overflow-y: auto;
        }

        .tm-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .tm-table thead tr {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 2px solid var(--u-color-line-default, #85909e);
        }

        .tm-table th {
          padding: 8px 16px;
          text-align: left;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
          user-select: none;
          cursor: default;
        }

        .tm-table th:nth-child(1) { width: 28%; }
        .tm-table th:nth-child(2) { width: 18%; }
        .tm-table th:nth-child(3) { width: 18%; }
        .tm-table th:nth-child(4) { width: 22%; }
        .tm-table th:nth-child(5) { width: 14%; }

        .tm-th-actions { cursor: default !important; }

        .tm-sort {
          display: inline-block;
          vertical-align: middle;
          margin-left: 4px;
          color: var(--u-color-base-foreground-subtle, #85909e);
        }

        .tm-table tbody tr {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          transition: background 0.1s ease;
        }

        .tm-table tbody tr:hover {
          background: var(--u-color-background-canvas, #f3f4f4);
        }

        .tm-table td {
          padding: 8px 8px 8px 16px;
          height: 52px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          overflow: hidden;
        }

        /* Inline row inputs */
        .tm-row-input {
          width: 100%;
          height: 32px;
          padding: 0 8px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
        }

        .tm-row-input::placeholder {
          color: var(--u-color-base-foreground-subtle, #9aa5b1);
          font-weight: 400;
        }

        .tm-row-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 2px rgba(2, 115, 227, 0.15);
        }

        .tm-row-select {
          width: 100%;
          height: 32px;
          padding: 0 8px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .tm-row-select:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 2px rgba(2, 115, 227, 0.15);
        }

        .tm-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .tm-action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 2px;
          cursor: pointer;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: background 0.15s ease, color 0.15s ease;
        }

        .tm-action-btn:hover {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .tm-action-btn--delete:hover {
          background: rgba(187, 23, 0, 0.08);
          color: var(--u-color-alert-foreground, #bb1700);
        }

        /* Footer */
        .tm-footer {
          background: var(--u-color-background-container, #fefefe);
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .tm-done-btn {
          height: 40px;
          padding: 0 20px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: #fefefe;
          transition: background 0.15s ease;
        }

        .tm-done-btn:hover {
          background: #005bbf;
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Multi Select ──────────────────────────────────────────────────────────

function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== val));
  };

  const selectedLabels = value.map(v => options.find(o => o.value === v)?.label ?? v);

  return (
    <div className="ms-wrap" ref={ref}>
      <div
        className={`ms-trigger${open ? ' ms-trigger--open' : ''}${invalid ? ' ms-trigger--invalid' : ''}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
      >
        <div className="ms-pills">
          {value.length === 0 && (
            <span className="ms-placeholder">{placeholder ?? 'Select...'}</span>
          )}
          {selectedLabels.map((label, i) => (
            <span key={value[i]} className="ms-pill">
              {label}
              <button
                className="ms-pill-remove"
                onClick={e => remove(value[i], e)}
                aria-label={`Remove ${label}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M8 2L2 8M2 2l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <svg className="ms-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div className="ms-dropdown">
          {options.length === 0 ? (
            <div className="ms-no-options">No teams available — add teams first</div>
          ) : (
            options.map(opt => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  className={`ms-option${checked ? ' ms-option--checked' : ''}`}
                  onClick={() => toggle(opt.value)}
                >
                  <span className="ms-check">
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}

      <style jsx>{`
        .ms-wrap {
          position: relative;
          width: 100%;
        }

        .ms-trigger {
          min-height: 40px;
          padding: 4px 36px 4px 8px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          background: var(--u-color-background-container, #fefefe);
          cursor: pointer;
          display: flex;
          align-items: center;
          position: relative;
          transition: border-color 0.15s ease;
        }

        .ms-trigger--open,
        .ms-trigger:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
          outline: none;
        }

        .ms-trigger--invalid,
        .ms-trigger--invalid.ms-trigger--open {
          border-color: #c0362c;
          box-shadow: 0 0 0 3px rgba(192, 54, 44, 0.15);
        }

        .ms-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .ms-placeholder {
          font-family: var(--u-font-body);
          font-size: 16px;
          color: var(--u-color-base-foreground-subtle, #607081);
          padding: 0 4px;
          line-height: 30px;
        }

        .ms-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 26px;
          padding: 0 6px 0 8px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-radius: 2px;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
        }

        .ms-pill-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          flex-shrink: 0;
          transition: color 0.1s ease;
        }

        .ms-pill-remove:hover {
          color: #fff;
        }

        .ms-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--u-color-base-foreground-subtle, #607081);
          pointer-events: none;
          flex-shrink: 0;
        }

        .ms-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 2px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 400;
          max-height: 220px;
          overflow-y: auto;
        }

        .ms-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 0 12px;
          height: 40px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.1s ease;
        }

        .ms-option:hover {
          background: var(--u-color-background-canvas, #f3f4f4);
        }

        .ms-option--checked {
          background: rgba(2, 115, 227, 0.06);
          font-weight: 600;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .ms-check {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .ms-no-options {
          padding: 12px 16px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// ─── Add Option Drawer ───────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'coed', label: 'Co-ed' },
];

const GRADE_OPTIONS = [
  { value: 'k', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
];

function AddRegistrationDrawer({
  onClose,
  onAdd,
  onAddNewTeams,
  availableTeams,
  linkedTeams,
  onLinkedTeamsChange,
  showLinkedTeams,
}: {
  onClose: () => void;
  onAdd: (reg: Registration) => void;
  onAddNewTeams: () => void;
  availableTeams: Team[];
  linkedTeams: string[];
  onLinkedTeamsChange: (v: string[]) => void;
  showLinkedTeams: boolean;
}) {
  const [sendInvitationsOpen, setSendInvitationsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [fullPaymentOn, setFullPaymentOn] = useState(true);
  const [capacityOn, setCapacityOn] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState('');
  const [waitlistOn, setWaitlistOn] = useState(false);
  const [eligibilityOn, setEligibilityOn] = useState(false);
  const [birthdateFrom, setBirthdateFrom] = useState('');
  const [birthdateTo, setBirthdateTo] = useState('');
  const [gender, setGender] = useState('');
  const [grade, setGrade] = useState('');

  const canAdd = title.trim().length > 0;

  // Can only send invitations once a linked team actually has athletes assigned
  const canSendInvitations = linkedTeams.some(
    id => (availableTeams.find(t => t.id === id)?.rosterCount ?? 0) > 0
  );

  return createPortal(
    <div className="dr-overlay" onClick={onClose}>
      <div className="dr-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dr-header">
          <span className="dr-title">Add Option</span>
          <button className="dr-close" onClick={onClose} aria-label="Close drawer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dr-body">

          {/* Card 1: Registration Details */}
          <SectionCard title="Registration Details" required>
            <div className="df">
              <DLabel label="Title" required />
              <DInput
                value={title}
                onChange={setTitle}
                placeholder=""
                maxLength={150}
              />
            </div>
            <div className="df">
              <DLabel label="Price" required />
              <DInput
                value={price}
                onChange={v => { if (!isFree) setPrice(v); }}
                placeholder="0.00"
                prefix="$"
              />
              <DCheckbox
                checked={isFree}
                onChange={v => { setIsFree(v); if (v) setPrice(''); }}
                label="This registration is FREE"
              />
            </div>
            <div className="df">
              <DLabel label="Description" />
              <DTextarea
                value={description}
                onChange={setDescription}
                placeholder="Describe this registration option..."
                maxLength={1000}
              />
            </div>
            <div className="dr-row">
              <div className="df">
                <DLabel label="Start Date" required />
                <DDateInput value={startDate} onChange={setStartDate} />
              </div>
              <div className="df">
                <DLabel label="End Date" />
                <DDateInput value={endDate} onChange={setEndDate} />
              </div>
            </div>
          </SectionCard>

          {/* Card 2: Schedule Registration */}
          <SectionCard
            title="Schedule Registration"
            optional
            description="Set a date and time to automatically open registration after publishing this program."
            toggle={<Toggle checked={scheduleOn} onChange={setScheduleOn} />}
          >
            {scheduleOn && (
              <div className="df">
                <DLabel label="Open Registration On" required />
                <DDateInput value={scheduleDate} onChange={setScheduleDate} />
              </div>
            )}
          </SectionCard>

          {/* Card 3: Payment Options */}
          <SectionCard
            title="Payment Options"
            required
            description="Enable different payment options for this registration."
          >
            <div className="pay-row">
              <span className="pay-label">Full payment</span>
              <span className="pay-amount">{price && !isFree ? `$${price}` : isFree ? 'FREE' : '—'}</span>
              <Toggle checked={fullPaymentOn} onChange={setFullPaymentOn} />
            </div>
          </SectionCard>

          {/* Card 4: Invite Teams — only for Club Dues program type */}
          {showLinkedTeams && (
            <SectionCard
              title="Invite Teams"
              optional
              description="Create new teams or link this registration to one or more teams to collect club dues."
            >
              <div className="df">
                <DLabel label="Teams" />
                <MultiSelect
                  options={availableTeams.map(t => ({ value: t.id, label: t.name }))}
                  value={linkedTeams}
                  placeholder="Select team(s)"
                  onChange={onLinkedTeamsChange}
                />
              </div>
              <div className="invite-teams-actions">
                <button className="add-teams-btn" onClick={onAddNewTeams}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add Teams
                </button>
                <span className="send-inv-wrap">
                  <button
                    className="send-invitations-btn"
                    onClick={() => setSendInvitationsOpen(true)}
                    disabled={!canSendInvitations}
                  >
                    Send Invitations
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'scaleX(-1)' }}>
                      <path d="M2 8l10-5-3 5 3 5L2 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {!canSendInvitations && (
                    <span className="send-inv-tooltip" role="tooltip">
                      Athletes must be assigned to teams to send invitations
                    </span>
                  )}
                </span>
              </div>
            </SectionCard>
          )}

          {/* Send Invitations full-screen overlay */}
          {sendInvitationsOpen && (
            <SendInvitationsPageClient
              onClose={() => setSendInvitationsOpen(false)}
              attachedRegistrationName={title.trim() || undefined}
              prefillTeams={linkedTeams
                .map(id => availableTeams.find(t => t.id === id))
                .filter((t): t is Team => !!t && (t.rosterCount ?? 0) > 0)
                .map(t => ({ name: t.name, athleteCount: t.rosterCount ?? 0 }))}
            />
          )}

          {/* Card 5: Capacity */}
          <SectionCard
            title="Capacity"
            optional
            description="Limit how many participants can register. You can also enable a waitlist."
            toggle={<Toggle checked={capacityOn} onChange={setCapacityOn} />}
          >
            {capacityOn && (
              <>
                <div className="df">
                  <DLabel label="Max Capacity" />
                  <DInput
                    value={maxCapacity}
                    onChange={setMaxCapacity}
                    placeholder="Enter max capacity"
                    type="number"
                  />
                </div>
                <DCheckbox checked={waitlistOn} onChange={setWaitlistOn} label="Enable waitlist" />
              </>
            )}
          </SectionCard>

          {/* Card 6: Eligibility */}
          <SectionCard
            title="Eligibility"
            optional
            description="Eligibility allows you to enforce limits on registrants that don't meet specific age, gender or grade guidelines."
            toggle={<Toggle checked={eligibilityOn} onChange={setEligibilityOn} />}
          >
            {eligibilityOn && (
              <>
                <div className="dr-row">
                  <div className="df">
                    <DLabel label="Birthdate From" />
                    <DDateInput value={birthdateFrom} onChange={setBirthdateFrom} />
                  </div>
                  <div className="df">
                    <DLabel label="Birthdate To" />
                    <DDateInput value={birthdateTo} onChange={setBirthdateTo} />
                  </div>
                </div>
                <div className="dr-row">
                  <div className="df">
                    <DLabel label="Gender" />
                    <Select
                      options={GENDER_OPTIONS}
                      value={gender}
                      placeholder="Select gender"
                      onChange={setGender}
                      fullWidth
                    />
                  </div>
                  <div className="df">
                    <DLabel label="Grade" />
                    <Select
                      options={GRADE_OPTIONS}
                      value={grade}
                      placeholder="Select grade"
                      onChange={setGrade}
                      fullWidth
                    />
                  </div>
                </div>
              </>
            )}
          </SectionCard>

        </div>

        {/* Footer */}
        <div className="dr-footer">
          <Button buttonStyle="minimal" buttonType="secondary" size="medium" onClick={onClose}>
            Cancel
          </Button>
          <Button
            buttonStyle="standard"
            buttonType="primary"
            size="medium"
            isInactive={!canAdd}
            onClick={() => onAdd({
              id: `reg-${Date.now()}`,
              title,
              price,
              isFree,
              startDate,
              endDate,
            })}
          >
            Add
          </Button>
        </div>

      </div>

      <style jsx>{`
        .dr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
        }

        .dr-panel {
          width: 520px;
          max-width: 100vw;
          height: 100%;
          background: var(--u-color-background-canvas, #f3f4f4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
          animation: dr-slide-in 0.22s ease-out;
        }

        @keyframes dr-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        /* Header */
        .dr-header {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .dr-title {
          flex: 1;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
        }

        .dr-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 2px;
          cursor: pointer;
          color: var(--u-color-base-foreground, #36485c);
          flex-shrink: 0;
          transition: background 0.15s ease;
        }

        .dr-close:hover {
          background: var(--u-color-background-canvas, #eff0f0);
        }

        /* Body */
        .dr-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Footer */
        .dr-footer {
          background: var(--u-color-background-container, #fefefe);
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Field layout helpers */
        .df {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .df-error {
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 500;
          color: #c0362c;
          margin-top: 2px;
        }

        .dr-row {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .dr-row > .df {
          flex: 1;
          min-width: 0;
        }

        /* Add New Teams button */
        .add-teams-btn {
          display: inline-flex;
          align-self: flex-start;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          background: var(--u-color-background-canvas, #e0e1e1);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
        }

        .add-teams-btn:hover {
          background: #d0d1d2;
        }

        .invite-teams-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .send-invitations-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          transition: background 0.15s ease;
          align-self: flex-start;
        }

        .send-invitations-btn:hover:not(:disabled) {
          background: #005bbf;
        }

        .send-invitations-btn:disabled {
          background: var(--u-color-background-canvas, #e0e1e1);
          color: var(--u-color-base-foreground-subtle, #85909e);
          cursor: not-allowed;
        }

        /* Send Invitations tooltip (shown while disabled) */
        .send-inv-wrap {
          position: relative;
          display: inline-flex;
        }

        .send-inv-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          z-index: 10;
          width: max-content;
          max-width: 240px;
          padding: 8px 10px;
          background: var(--u-color-base-foreground-contrast, #071c31);
          color: #fff;
          border-radius: 4px;
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease;
          pointer-events: none;
        }

        .send-inv-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 16px;
          border: 5px solid transparent;
          border-top-color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .send-inv-wrap:hover .send-inv-tooltip {
          opacity: 1;
          visibility: visible;
        }

        /* Payment row */
        .pay-row {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .pay-label {
          flex: 1;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
        }

        .pay-amount {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          flex-shrink: 0;
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────

function SortArrow() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4, color: 'var(--u-color-base-foreground-subtle, #85909e)', flexShrink: 0 }}>
      <path d="M5 1v10M1 4l4-3 4 3M1 8l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Registrations table ───────────────────────────────────────────────────

function RegistrationsTable({
  registrations,
  onRemove,
  readOnly,
}: {
  registrations: Registration[];
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}) {
  const formatDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatPrice = (reg: Registration) => {
    if (reg.isFree) return 'FREE';
    if (!reg.price) return '—';
    const n = parseFloat(reg.price);
    return isNaN(n) ? reg.price : `$${n.toFixed(2)}`;
  };

  return (
    <div className="rt-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th className="rt-th rt-th--left">Title <SortArrow /></th>
            <th className="rt-th rt-th--left">Price <SortArrow /></th>
            <th className="rt-th rt-th--left">Start Date <SortArrow /></th>
            <th className="rt-th rt-th--left">End Date <SortArrow /></th>
            {!readOnly && <th className="rt-th rt-th--actions" />}
          </tr>
        </thead>
        <tbody>
          {registrations.map(reg => (
            <tr key={reg.id} className="rt-row">
              <td className="rt-td rt-td--title">{reg.title}</td>
              <td className="rt-td">{formatPrice(reg)}</td>
              <td className="rt-td">{formatDate(reg.startDate)}</td>
              <td className="rt-td">{formatDate(reg.endDate)}</td>
              {!readOnly && (
                <td className="rt-td rt-td--actions">
                  <button
                    className="rt-delete-btn"
                    onClick={() => onRemove?.(reg.id)}
                    aria-label="Delete registration"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 4.5h11M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M12.5 4.5l-.8 8a1 1 0 0 1-1 .9H5.3a1 1 0 0 1-1-.9l-.8-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .rt-wrap {
          width: 100%;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          overflow: hidden;
        }

        .rt-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        /* Header */
        .rt-th {
          padding: 8px 16px;
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 2px solid var(--u-color-line-default, #85909e);
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
          user-select: none;
        }

        .rt-th--left { text-align: left; }
        .rt-th--actions { width: 48px; }

        /* Rows */
        .rt-row {
          background: var(--u-color-background-container, #fefefe);
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          transition: background 0.1s ease;
        }

        .rt-row:last-child { border-bottom: none; }

        .rt-row:hover {
          background: var(--u-color-background-canvas, #f3f4f4);
        }

        .rt-td {
          padding: 4px 16px;
          height: 48px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 400;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }

        .rt-td--title {
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .rt-td--actions {
          width: 48px;
          text-align: right;
          padding-right: 12px;
        }

        .rt-delete-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 2px;
          cursor: pointer;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: background 0.15s ease, color 0.15s ease;
        }

        .rt-delete-btn:hover {
          background: rgba(187, 23, 0, 0.08);
          color: var(--u-color-alert-foreground, #bb1700);
        }
      `}</style>
    </div>
  );
}

// ─── Summary view ──────────────────────────────────────────────────────────

function formatSummaryDate(d: string) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sr-row">
      <span className="sr-label">{label}</span>
      <span className="sr-value">{value || '—'}</span>
      <style jsx>{`
        .sr-row {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
        }
        .sr-row:last-child {
          border-bottom: none;
        }
        .sr-label {
          flex: 0 0 180px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sr-value {
          flex: 1;
          min-width: 0;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sum-card">
      <h2 className="sum-card-title">{title}</h2>
      <div className="sum-card-body">{children}</div>
      <style jsx>{`
        .sum-card {
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .sum-card-title {
          font-family: var(--u-font-body);
          font-size: 18px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0 0 4px;
        }
        .sum-card-body {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

function SummaryView({
  program,
  registrations,
  teams,
  linkedTeams,
  showLinkedTeams,
}: {
  program: ProgramDetails | null;
  registrations: Registration[];
  teams: Team[];
  linkedTeams: string[];
  showLinkedTeams: boolean;
}) {
  const eventDates = program && (program.startDate || program.endDate)
    ? `${formatSummaryDate(program.startDate)} – ${formatSummaryDate(program.endDate)}`
    : '—';
  const linkedTeamNames = teams
    .filter(t => linkedTeams.includes(t.id))
    .map(t => t.name)
    .filter(Boolean);

  return (
    <div className="sum-wrap">
      <SummaryCard title="Program">
        <SummaryRow label="Title" value={program?.title} />
        <SummaryRow label="Type" value={program?.typeLabel} />
        <SummaryRow label="Description" value={program?.description} />
        <SummaryRow label="Event Dates" value={eventDates} />
        <SummaryRow
          label="Visibility"
          value={program ? (program.visibility === 'public' ? 'Public' : 'Private') : '—'}
        />
        <SummaryRow
          label="Fees Covered By"
          value={program ? (program.feesCoveredBy === 'organization' ? 'Organization' : 'Registrants') : '—'}
        />
      </SummaryCard>

      <SummaryCard title={`Registration Options (${registrations.length})`}>
        {registrations.length > 0 ? (
          <RegistrationsTable registrations={registrations} readOnly />
        ) : (
          <p className="sum-empty">No registration options added.</p>
        )}
        {showLinkedTeams && (
          <div className="sum-teams">
            <SummaryRow
              label="Invited Teams"
              value={linkedTeamNames.length > 0 ? linkedTeamNames.join(', ') : '—'}
            />
          </div>
        )}
      </SummaryCard>

      <style jsx>{`
        .sum-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .sum-empty {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          font-style: italic;
          margin: 0;
        }
        .sum-teams {
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}

// ─── Next Steps stage (full-page) ───────────────────────────────────────────

const NEXT_STEPS = [
  { title: 'Tryout registration is live', desc: 'Your tryout is published. Athletes can now sign up and try out.', done: true },
  { title: 'Build your teams', desc: 'Once tryouts wrap up, create your teams for the season.' },
  { title: 'Assign athletes to teams', desc: 'Place athletes from your tryout pool onto each team.' },
  { title: 'Invite athletes to pay dues', desc: 'Set up a dues program and send invitations to collect.' },
];

function NextStepsView({ program }: { program: ProgramDetails | null }) {
  return (
    <div className="nsv-wrap">
      <div className="nsv-confirm">
        <div className="nsv-check">
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="nsv-title">{program?.title || 'Your program'} is published</h2>
        <p className="nsv-sub">
          Nothing to do right now — once athletes start registering, here&apos;s how you&apos;ll turn
          your tryout pool into teams.
        </p>
      </div>

      <ol className="nsv-steps">
        {NEXT_STEPS.map((step, i) => {
          const done = 'done' in step && step.done;
          return (
            <li key={i} className="nsv-step">
              <div className="nsv-marker">
                <span className={`nsv-num${done ? ' nsv-num--done' : ''}`}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                {i < NEXT_STEPS.length - 1 && <span className={`nsv-line${done ? ' nsv-line--done' : ''}`} />}
              </div>
              <div className="nsv-body">
                <span className="nsv-step-title">{step.title}</span>
                <span className="nsv-step-desc">{step.desc}</span>
                {step.title === 'Build your teams' && (
                  <div className="nsv-peek">
                    <span className="nsv-peek-cap">On the Teams page, look for “Add Teams” in the top-right.</span>
                    <div className="nsv-frame">
                      <div className="nsv-frame-header">
                        <span className="nsv-frame-title">Teams</span>
                        <span className="nsv-btn-wrap">
                          <span className="nsv-frame-btn">Add Teams</span>
                          <span className="nsv-pulse" />
                          <span className="nsv-cursor">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                              <path d="M4 3l11 6-4.5 1.4L8 15 4 3z" fill="#fff" stroke="#071c31" strokeWidth="1.2" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                      </div>
                      <div className="nsv-frame-body">
                        <span className="nsv-ph" style={{ width: '38%' }} />
                        <span className="nsv-ph" style={{ width: '64%' }} />
                        <span className="nsv-ph" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .nsv-wrap {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 0 48px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .nsv-confirm {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .nsv-check {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: var(--u-color-success-background, #edf7ed);
          color: var(--u-color-success-foreground, #2e7d32);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nsv-title {
          font-family: var(--u-font-body);
          font-size: 24px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
        }
        .nsv-sub {
          font-family: var(--u-font-body);
          font-size: 15px;
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.5;
          margin: 0;
          max-width: 440px;
        }
        .nsv-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .nsv-step {
          display: flex;
          gap: 16px;
        }
        .nsv-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .nsv-num {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: var(--u-color-background-container, #fefefe);
          border: 1.5px solid var(--u-color-emphasis-background-contrast, #0273e3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 700;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          flex-shrink: 0;
        }
        .nsv-num--done {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
        }
        .nsv-line {
          flex: 1;
          width: 2px;
          min-height: 20px;
          background: var(--u-color-line-subtle, #c4c6c8);
          margin: 4px 0;
        }
        .nsv-line--done {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        /* Animated "where to build teams" preview */
        .nsv-peek {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        .nsv-peek-cap {
          font-family: var(--u-font-body);
          font-size: 12px;
          font-style: italic;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .nsv-frame {
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 8px;
          background: var(--u-color-background-container, #fefefe);
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
          max-width: 380px;
        }
        .nsv-frame-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
        }
        .nsv-frame-title {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .nsv-btn-wrap {
          position: relative;
          display: inline-flex;
        }
        .nsv-frame-btn {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .nsv-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 7px;
          border: 2px solid var(--u-color-emphasis-background-contrast, #0273e3);
          pointer-events: none;
          animation: nsv-pulse 2.4s ease-out infinite;
        }
        @keyframes nsv-pulse {
          0% { transform: scale(1); opacity: 0.85; }
          70% { transform: scale(1.18); opacity: 0; }
          100% { opacity: 0; }
        }
        .nsv-cursor {
          position: absolute;
          right: -8px;
          bottom: -12px;
          pointer-events: none;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
          animation: nsv-tap 2.4s ease-in-out infinite;
        }
        @keyframes nsv-tap {
          0%, 100% { transform: translate(6px, 6px); }
          40% { transform: translate(0, 0); }
          52% { transform: translate(0, 0) scale(0.82); }
          64% { transform: translate(0, 0) scale(1); }
        }
        .nsv-frame-body {
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .nsv-ph {
          display: block;
          height: 9px;
          border-radius: 4px;
          background: var(--u-color-background-canvas, #e6e7e8);
        }
        .nsv-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 24px;
        }
        .nsv-step-title {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .nsv-step-desc {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function RegistrationsPageClient({ initialTeams = [] }: { initialTeams?: TeamWithStats[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const programType = typeof window !== 'undefined' ? sessionStorage.getItem('programType') ?? '' : '';
  const showLinkedTeams = programType === 'team-dues';
  const steps = STEPS;
  const [programDetails] = useState<ProgramDetails | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('programDetails');
      return raw ? (JSON.parse(raw) as ProgramDetails) : null;
    } catch {
      return null;
    }
  });
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [teams, setTeams] = useState<Team[]>(() => initialTeams.map(mapTeam));
  const [linkedTeams, setLinkedTeams] = useState<string[]>([]);

  const handleAdd = (reg: Registration) => {
    setRegistrations(prev => [...prev, reg]);
    setDrawerOpen(false);
  };

  const handleRemove = (id: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
  };

  const handleTeamsDone = (updatedTeams: Team[]) => {
    // Only auto-link teams that were just created; keep the existing selection intact
    const prevIds = new Set(teams.map(t => t.id));
    const newIds = updatedTeams.filter(t => !prevIds.has(t.id)).map(t => t.id);
    setTeams(updatedTeams);
    setLinkedTeams(prev => Array.from(new Set([...prev, ...newIds])));
    setTeamsModalOpen(false);
  };

  return (
    <div className="new-program-page">

      {/* Stepper — Club Dues has no "Next Steps" stage */}
      <div className="stepper-bar">
        <StepIndicator currentStep={showNextSteps ? 5 : showSummary ? 4 : 3} steps={steps} />
      </div>

      {/* Content */}
      <div className="page-content">
        <div className="content-inner">
          {!showNextSteps && (
            <h1 className="page-title">{showSummary ? 'Summary' : 'Registration Options'}</h1>
          )}

          <div className="form-scroll">
            {showNextSteps ? (
              <NextStepsView program={programDetails} />
            ) : showSummary ? (
              <SummaryView
                program={programDetails}
                registrations={registrations}
                teams={teams}
                linkedTeams={linkedTeams}
                showLinkedTeams={showLinkedTeams}
              />
            ) : (
              <div className="form-body">

                {/* Registrations table */}
                {registrations.length > 0 && (
                  <RegistrationsTable
                    registrations={registrations}
                    onRemove={handleRemove}
                  />
                )}

                {/* Add Option button */}
                <button className="add-reg-btn" onClick={() => setDrawerOpen(true)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add Option
                </button>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="page-footer">
        <Button
          buttonStyle="standard"
          buttonType="secondary"
          size="medium"
          onClick={() => {
            if (showNextSteps) setShowNextSteps(false);
            else if (showSummary) setShowSummary(false);
            else router.push('/programs/new');
          }}
        >
          Back
        </Button>
        <div className="footer-right">
          {showNextSteps ? (
            <Button
              buttonStyle="standard"
              buttonType="primary"
              size="medium"
              onClick={() => router.push('/programs')}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                buttonStyle="minimal"
                buttonType="secondary"
                size="medium"
                onClick={() => router.push('/programs')}
              >
                Done
              </Button>
              {showSummary ? (
                <Button
                  buttonStyle="standard"
                  buttonType="primary"
                  size="medium"
                  onClick={() => {
                    persistCreatedProgram(programDetails, registrations, linkedTeams);
                    showToast('Program published successfully', 'success');
                    setShowNextSteps(true);
                  }}
                >
                  Publish
                </Button>
              ) : (
                <Button
                  buttonStyle="standard"
                  buttonType="primary"
                  size="medium"
                  onClick={() => setShowSummary(true)}
                >
                  Continue
                </Button>
              )}
            </>
          )}
        </div>
      </footer>

      {/* Add Option drawer */}
      {drawerOpen && (
        <AddRegistrationDrawer
          onClose={() => setDrawerOpen(false)}
          onAdd={handleAdd}
          onAddNewTeams={() => setTeamsModalOpen(true)}
          availableTeams={teams}
          linkedTeams={linkedTeams}
          onLinkedTeamsChange={setLinkedTeams}
          showLinkedTeams={showLinkedTeams}
        />
      )}

      {/* Teams full-page overlay */}
      {teamsModalOpen && (
        <TeamsModal
          initialTeams={teams}
          onTeamsDone={handleTeamsDone}
          onCancel={() => setTeamsModalOpen(false)}
        />
      )}

      <style jsx>{`
        .new-program-page {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 72px);
          background: var(--u-color-background-container, #fefefe);
          margin: -32px -64px 0;
          width: calc(100% + 128px);
        }

        .stepper-bar {
          width: 100%;
          padding: 40px var(--u-space-one-and-half, 24px) 20px;
          background: var(--u-color-background-container, #fefefe);
          flex-shrink: 0;
        }

        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content-inner {
          width: 100%;
          padding: 32px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .page-title {
          font-family: var(--u-font-body);
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.25px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
          text-align: left;
          align-self: flex-start;
        }

        .form-scroll {
          width: 100%;
        }

        .form-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Add Option button — matches Figma gray style */
        .add-reg-btn {
          display: inline-flex;
          align-self: flex-start;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          background: var(--u-color-background-canvas, #e0e1e1);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          transition: background 0.15s ease;
        }

        .add-reg-btn:hover {
          background: #d0d1d2;
        }

        /* Footer */
        .page-footer {
          position: sticky;
          bottom: 0;
          background: var(--u-color-background-container, #fefefe);
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px 0;
          flex-shrink: 0;
          z-index: 10;
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
