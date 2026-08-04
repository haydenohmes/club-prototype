'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { StepIndicator } from './StepIndicator';

export type ProgramTypeChoice = 'tryout' | 'team-dues';
export type InvitationChoice = 'accept-decline' | 'confirmation';

export interface StartSelection {
  programName: string;
  sport: string;
  season: string;
  programType: ProgramTypeChoice;
  invitationType: InvitationChoice | '';
}

const SPORTS = [
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
];

const SEASONS = [
  { value: 'fall-2026', label: 'Fall 2026' },
  { value: 'spring-2027', label: 'Spring 2027' },
  { value: 'fall-2027', label: 'Fall 2027' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function TryoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="5" y="4.5" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 3.4h5.6v2.4H8.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12l1.8 1.8L14 9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DuesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="6" width="15" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.2h15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.4 13.4h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M9 13l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.4 8.4L7 9.8a2.9 2.9 0 000 4.1v0a2.9 2.9 0 004.1 0l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.6 13.6L15 12.2a2.9 2.9 0 000-4.1v0a2.9 2.9 0 00-4.1 0L9.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="8.4" cy="8.2" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.6 17c0-2.7 2.1-4.4 4.8-4.4s4.8 1.7 4.8 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.4 6.2a2.6 2.6 0 010 4.2M15.2 17c0-2-.7-3.5-1.9-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10.2l2.5 2.5L14 7.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.5 9.2l3 3 8-8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Selectable card ───────────────────────────────────────────────────────────

function ChoiceCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`sp-card${selected ? ' sp-card--selected' : ''}`}
      onClick={onClick}
    >
      <span className="sp-card-icon">{icon}</span>
      <span className="sp-card-body">
        <span className="sp-card-title-row">
          <span className="sp-card-title">{title}</span>
          {selected && <span className="sp-card-check"><CardCheck /></span>}
        </span>
        <span className="sp-card-desc">{desc}</span>
      </span>
    </button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function StartStep({
  initialName = '',
  onCancel,
  onContinue,
}: {
  initialName?: string;
  onCancel: () => void;
  onContinue: (selection: StartSelection) => void;
}) {
  const [programName, setProgramName] = useState(initialName);
  const [sport, setSport] = useState('');
  const [season, setSeason] = useState('');
  const [programType, setProgramType] = useState<ProgramTypeChoice | ''>('');
  const [invitationType, setInvitationType] = useState<InvitationChoice | ''>('');

  const isTryout = programType === 'tryout';
  const isDues = programType === 'team-dues';
  const complete = isTryout || (isDues && invitationType !== '');

  const pickType = (t: ProgramTypeChoice) => {
    setProgramType(t);
    if (t === 'tryout') setInvitationType('');
  };

  const startOver = () => {
    setProgramType('');
    setInvitationType('');
  };

  const summaryTitle = isTryout
    ? 'Tryout'
    : invitationType === 'accept-decline'
      ? 'Club Dues with accept / decline invites'
      : 'Club Dues, pay-to-play';

  const summaryProgramTitle = isTryout ? 'Tryout' : 'Club Dues';

  const summaryProgramDesc = isTryout
    ? 'Collect a tryout fee and evaluate athletes. Place them onto teams later, in a Club Dues program.'
    : invitationType === 'accept-decline'
      ? 'Place athletes onto teams; each gets an accept / decline invite, then pays dues.'
      : 'Anyone in the right age group registers and pays; they get a confirmation notification.';

  return (
    <div className="sp-page">
      <div className="sp-stepper-bar">
        <StepIndicator currentStep={0} />
      </div>
      <div className="sp-content">
        <div className="sp-inner">
          <h1 className="sp-heading">Create a program</h1>

          {/* Setup */}
          <div className="sp-setup">
            <div className="sp-field">
              <label className="sp-label" htmlFor="sp-name">Program Name</label>
              <input
                id="sp-name"
                className="sp-input"
                placeholder="e.g. 2026 Spring Club Volleyball"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                maxLength={150}
              />
            </div>
            <div className="sp-field-row">
              <div className="sp-field">
                <label className="sp-label">Sport</label>
                <Select options={SPORTS} value={sport} onChange={setSport} placeholder="Select a sport" fullWidth />
              </div>
              <div className="sp-field">
                <label className="sp-label">Season</label>
                <Select options={SEASONS} value={season} onChange={setSeason} placeholder="Select a season" fullWidth />
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <div className="sp-step">
            <div className="sp-step-head">
              <span className="sp-step-num">1</span>
              <span className="sp-step-title">Which program are you creating?</span>
            </div>
            <div className="sp-cards" role="radiogroup" aria-label="Program type">
              <ChoiceCard
                icon={<TryoutIcon />}
                title="Tryout"
                desc="Collect a tryout fee and evaluate athletes. You place them onto teams later, in a Club Dues program."
                selected={isTryout}
                onClick={() => pickType('tryout')}
              />
              <ChoiceCard
                icon={<DuesIcon />}
                title="Club Dues"
                desc="Athletes pay dues. Stands on its own, or is where you place athletes from a tryout onto teams."
                selected={isDues}
                onClick={() => pickType('team-dues')}
              />
            </div>
          </div>

          {/* Step 2 — only for Club Dues */}
          {isDues && (
            <div className="sp-step">
              <div className="sp-step-head">
                <span className="sp-step-num">2</span>
                <span className="sp-step-title">What type of invitation are you sending?</span>
              </div>
              <div className="sp-cards sp-cards--stack" role="radiogroup" aria-label="Invitation type">
                <ChoiceCard
                  icon={<LinkIcon />}
                  title="Accept / decline invitation"
                  desc="You place athletes from one or more tryouts onto teams. Each gets an invite to accept or decline their spot, then pays dues."
                  selected={invitationType === 'accept-decline'}
                  onClick={() => setInvitationType('accept-decline')}
                />
                <ChoiceCard
                  icon={<PeopleIcon />}
                  title="Confirmation only (pay-to-play)"
                  desc="Anyone in the right age group registers and pays. They get a confirmation notification (e.g. “you’re on this team”) — nothing to accept or decline."
                  selected={invitationType === 'confirmation'}
                  onClick={() => setInvitationType('confirmation')}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {complete && (
            <div className="sp-summary">
              <div className="sp-summary-head">
                <span className="sp-summary-title">
                  <span className="sp-summary-check"><CheckBadge /></span>
                  {summaryTitle}
                </span>
                <button type="button" className="sp-startover" onClick={startOver}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8a5 5 0 105-5 5 5 0 00-3.8 1.8M3 3v2.2h2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Start over
                </button>
              </div>
              <div className="sp-summary-body">
                <span className="sp-summary-program-icon">{isTryout ? <TryoutIcon /> : <DuesIcon />}</span>
                <span className="sp-summary-program-body">
                  <span className="sp-summary-program-label">PROGRAM</span>
                  <span className="sp-summary-program-title">{summaryProgramTitle}</span>
                  <span className="sp-summary-program-desc">{summaryProgramDesc}</span>
                </span>
              </div>
              {isDues && invitationType === 'accept-decline' && (
                <p className="sp-summary-note">
                  Connect a tryout later on the Assign Athletes page, where you pick the program and registration to pull athletes from.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="sp-footer">
        <Button buttonStyle="minimal" buttonType="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          buttonStyle="standard"
          buttonType="primary"
          size="medium"
          disabled={!complete}
          onClick={() => complete && onContinue({ programName, sport, season, programType: programType as ProgramTypeChoice, invitationType })}
        >
          Continue
        </Button>
      </footer>

      <style jsx global>{`
        .sp-page {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 72px);
          background: var(--u-color-background-container, #fefefe);
          margin: -32px -64px -32px;
          width: calc(100% + 128px);
        }
        .sp-content { flex: 1; display: flex; flex-direction: column; }
        .sp-stepper-bar {
          width: 100%;
          padding: 40px 24px 20px;
          background: var(--u-color-background-container, #fefefe);
          flex-shrink: 0;
        }
        .sp-inner {
          width: 100%;
          padding: 8px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .sp-heading {
          font-family: var(--u-font-body);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.25px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
        }

        /* Setup */
        .sp-setup {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 10px;
          background: var(--u-color-background-container, #fefefe);
        }
        .sp-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .sp-field-row { display: flex; gap: 16px; }
        .sp-label {
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sp-input {
          height: 40px;
          padding: 0 14px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 4px;
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: 15px;
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .sp-input:focus { border-color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .sp-input::placeholder { color: var(--u-color-base-foreground-subtle, #85909e); }

        /* Steps */
        .sp-step { display: flex; flex-direction: column; gap: 14px; }
        .sp-step-head { display: flex; align-items: center; gap: 10px; }
        .sp-step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sp-step-title {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sp-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .sp-cards--stack { grid-template-columns: 1fr; }
        @media (max-width: 680px) { .sp-cards { grid-template-columns: 1fr; } }

        /* Card */
        .sp-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          text-align: left;
          padding: 16px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 10px;
          background: var(--u-color-background-container, #fefefe);
          cursor: pointer;
          font-family: var(--u-font-body);
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .sp-card:hover { border-color: var(--u-color-base-foreground-subtle, #607081); }
        .sp-card:focus-visible {
          outline: 2px solid var(--u-color-emphasis-background-contrast, #0273e3);
          outline-offset: 2px;
        }
        .sp-card--selected {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: inset 0 0 0 1px var(--u-color-emphasis-background-contrast, #0273e3);
          background: #e7f3fd;
        }
        .sp-card-icon {
          display: inline-flex;
          flex-shrink: 0;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin-top: 1px;
        }
        .sp-card--selected .sp-card-icon { color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .sp-card-body { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .sp-card-title-row { display: flex; align-items: center; gap: 7px; }
        .sp-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sp-card--selected .sp-card-title { color: #085bb4; }
        .sp-card-check { display: inline-flex; color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .sp-card-desc {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.45;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        /* Summary */
        .sp-summary {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
          border: 1px solid var(--u-color-emphasis-background-contrast, #0273e3);
          border-radius: 10px;
          background: var(--u-color-background-container, #fefefe);
        }
        .sp-summary-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sp-summary-title {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sp-summary-check { display: inline-flex; color: var(--u-color-emphasis-background-contrast, #0273e3); }
        .sp-startover {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 4px 6px;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sp-startover:hover { color: var(--u-color-base-foreground-contrast, #071c31); }
        .sp-summary-body {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .sp-summary-program-icon {
          display: inline-flex;
          flex-shrink: 0;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          margin-top: 1px;
        }
        .sp-summary-program-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .sp-summary-program-label {
          font-family: var(--u-font-body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--u-color-base-foreground-subtle, #85909e);
        }
        .sp-summary-program-title {
          font-family: var(--u-font-body);
          font-size: 15px;
          font-weight: 700;
          color: var(--u-color-emphasis-foreground, #085bb4);
        }
        .sp-summary-program-desc {
          font-family: var(--u-font-body);
          font-size: 13px;
          line-height: 1.45;
          color: var(--u-color-base-foreground, #36485c);
        }
        .sp-summary-note {
          margin: 0;
          font-family: var(--u-font-body);
          font-size: 13px;
          line-height: 1.45;
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        /* Footer */
        .sp-footer {
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 64px;
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          background: var(--u-color-background-container, #fefefe);
        }
      `}</style>
    </div>
  );
}
