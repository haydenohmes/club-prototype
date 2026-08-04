'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import StartStep from './StartStep';

// ─── Step indicator ────────────────────────────────────────────────────────

const STEPS = ['Program Type', 'Program Details', 'Questions', 'Registrations', 'Summary', 'Next Steps'];

function StepIndicator({ currentStep, steps = STEPS }: { currentStep: number; steps?: string[] }) {
  return (
    <div className="steps-row">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;

        return (
          <React.Fragment key={label}>
            <div className="step-item">
              <div className={`step-circle ${isActive ? 'step-circle--active' : isComplete ? 'step-circle--complete' : ''}`}>
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              <span className={`step-label ${isActive ? 'step-label--active' : ''}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-connector ${i < currentStep ? 'step-connector--complete' : ''}`} />
            )}
          </React.Fragment>
        );
      })}

      <style jsx>{`
        .steps-row {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 0;
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
          background: var(--u-color-background-container, #fefefe);
        }

        .step-circle--complete {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .step-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
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

// ─── Form field atoms ──────────────────────────────────────────────────────

function FormLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="field-label">
      {label}
      {required && <span className="field-required">*</span>}
      <style jsx>{`
        .field-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-small, 14px);
          font-weight: 600;
          color: var(--u-color-base-foreground, #36485c);
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .field-required {
          color: var(--u-color-alert-foreground, #bb1700);
        }
      `}</style>
    </label>
  );
}

function FieldHint({ text }: { text: string }) {
  return (
    <p className="field-hint">
      {text}
      <style jsx>{`
        .field-hint {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-micro, 12px);
          color: var(--u-color-base-foreground-subtle, #607081);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </p>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="text-input-wrap">
      <input
        id={id}
        type="text"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {maxLength !== undefined && (
        <span className="char-count">Character limit: {value.length}/{maxLength}</span>
      )}
      <style jsx>{`
        .text-input-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .text-input {
          height: 40px;
          width: 100%;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .text-input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .text-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
        .char-count {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-micro, 12px);
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}

function TextareaInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="textarea-wrap">
      <textarea
        id={id}
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={5}
      />
      {maxLength !== undefined && (
        <span className="char-count">Character limit: {value.length}/{maxLength}</span>
      )}
      <style jsx>{`
        .textarea-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          color: var(--u-color-base-foreground, #36485c);
          resize: vertical;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          min-height: 100px;
        }
        .textarea::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .textarea:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
        .char-count {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-micro, 12px);
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}

function DateInput({
  id,
  value,
  onChange,
  label,
  required,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="date-field">
      <FormLabel label={label} required={required} />
      <div className="date-input-wrap">
        <input
          id={id}
          type="date"
          className="date-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <style jsx>{`
        .date-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .date-input-wrap {
          position: relative;
          width: 100%;
        }
        .date-input {
          height: 40px;
          width: 100%;
          padding: 0 12px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .date-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          box-shadow: 0 0 0 3px rgba(2, 115, 227, 0.15);
        }
      `}</style>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="radio-option">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="radio-input"
      />
      <div className="radio-content">
        <span className="radio-label">{label}</span>
        {hint && <span className="radio-hint">{hint}</span>}
      </div>
      <style jsx>{`
        .radio-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          width: 100%;
        }
        .radio-input {
          width: 18px;
          height: 18px;
          accent-color: var(--u-color-emphasis-background-contrast, #0273e3);
          margin-top: 1px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .radio-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .radio-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          font-weight: 500;
          color: var(--u-color-base-foreground, #36485c);
          line-height: 1.4;
        }
        .radio-hint {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-micro, 12px);
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.4;
        }
      `}</style>
    </label>
  );
}

function SectionDivider() {
  return (
    <div className="section-divider">
      <style jsx>{`
        .section-divider {
          width: 100%;
          height: 1px;
          background: var(--u-color-line-subtle, #c4c6c8);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  linkText,
}: {
  title: React.ReactNode;
  description: string;
  linkText?: string;
}) {
  return (
    <div className="section-header">
      <h3 className="section-title">{title}</h3>
      <p className="section-desc">{description}</p>
      <style jsx>{`
        .section-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .section-title {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-250, 16px);
          font-weight: 400;
          color: var(--u-color-base-foreground-contrast, #071c31);
          line-height: 1.5;
          margin: 0;
        }
        .section-desc {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-micro, 12px);
          color: var(--u-color-base-foreground-subtle, #607081);
          line-height: 1.4;
          max-width: 600px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

const PROGRAM_TYPE_OPTIONS = [
  { value: 'tryout', label: 'Tryout' },
  { value: 'team-dues', label: 'Club Dues' },
  { value: 'one-time-registration', label: 'One-Time Registration' },
];

export default function NewProgramPageClient() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [programType, setProgramType] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [feesCoveredBy, setFeesCoveredBy] = useState<'registrants' | 'organization'>('registrants');
  const [invitationType, setInvitationType] = useState('');
  const [phase, setPhase] = useState<'select' | 'details'>('select');

  const handleCancel = () => router.push('/programs');

  // First step of the wizard: guided program-type selection
  if (phase === 'select') {
    return (
      <StartStep
        initialName={title}
        onCancel={handleCancel}
        onContinue={(sel) => {
          setTitle(sel.programName);
          setProgramType(sel.programType);
          setInvitationType(sel.invitationType);
          try {
            sessionStorage.setItem('programType', sel.programType);
            sessionStorage.setItem('invitationType', sel.invitationType);
            sessionStorage.setItem('programSport', sel.sport);
            sessionStorage.setItem('programSeason', sel.season);
          } catch {
            // ignore
          }
          setPhase('details');
        }}
      />
    );
  }

  return (
    <div className="new-program-page">

      {/* ── Stepper bar ────────────────────────────────────────────── */}
      <div className="stepper-bar">
        <StepIndicator currentStep={1} />
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="page-content">
        <div className="content-inner">

          <h1 className="page-title">Program Details</h1>

          {/* Scrollable form body */}
          <div className="form-scroll">
            <div className="form-body">

              {/* ── Section 1: Core details ──────────────────────── */}
              <div className="form-section">
                {/* Description */}
                <div className="field-group">
                  <FormLabel label="Description" />
                  <TextareaInput
                    id="program-description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe your program"
                    maxLength={1000}
                  />
                </div>

                {/* Event Dates row */}
                <div className="field-group">
                  <div className="field-row">
                    <DateInput
                      id="start-date"
                      label="Event Dates"
                      required
                      value={startDate}
                      onChange={setStartDate}
                    />
                    <DateInput
                      id="end-date"
                      label="End Date"
                      required
                      value={endDate}
                      onChange={setEndDate}
                    />
                  </div>
                  <FieldHint text="Define your program's start and end dates. This is typically the total duration of your program." />
                </div>

              </div>

              <SectionDivider />

              {/* ── Section 2: Visibility ────────────────────────── */}
              <div className="form-section">
                <SectionHeader
                  title={
                    <>
                      Is this program <strong>public</strong> or <strong>private</strong>?
                    </>
                  }
                  description="Public programs are immediately available for purchase. Private programs remain hidden until they are either made public or shared via a direct link."
                />
                <div className="radio-group">
                  <RadioOption
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(v) => setVisibility(v as 'private' | 'public')}
                    label="Private"
                  />
                  <RadioOption
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(v) => setVisibility(v as 'private' | 'public')}
                    label="Public"
                  />
                </div>
              </div>

              <SectionDivider />

              {/* ── Section 3: Fees ──────────────────────────────── */}
              <div className="form-section">
                <SectionHeader
                  title={
                    <>
                      Who do you want to cover the{' '}
                      <a
                        href="#"
                        className="inline-link"
                        onClick={(e) => e.preventDefault()}
                      >
                        fees for this program
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 3, display: 'inline' }}>
                          <path d="M6 4H4a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2M10 2h4v4M14 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      ?
                    </>
                  }
                  description="If you opt for registrants to pay the fees, they'll have an additional fee added to their total cost. If you opt for your organization to pay the fees, the cost of the fees will be deducted from the total cost."
                />
                <div className="radio-group">
                  <RadioOption
                    name="fees"
                    value="registrants"
                    checked={feesCoveredBy === 'registrants'}
                    onChange={(v) => setFeesCoveredBy(v as 'registrants' | 'organization')}
                    label="Registrants pay the fees"
                    hint="Ex. $1,000 registration, a registrant would pay $1,030 and you would receive $1,000"
                  />
                  <RadioOption
                    name="fees"
                    value="organization"
                    checked={feesCoveredBy === 'organization'}
                    onChange={(v) => setFeesCoveredBy(v as 'registrants' | 'organization')}
                    label="Organization pays the fees"
                    hint="Ex. $1,000 registration, a registrant would pay $1,000 and you would receive $970"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="page-footer">
        <div className="footer-actions">
          <Button buttonStyle="minimal" buttonType="secondary" size="medium" onClick={handleCancel}>
            Done
          </Button>
          <Button buttonStyle="standard" buttonType="primary" size="medium" onClick={() => {
            const details = {
              title,
              programType,
              invitationType,
              typeLabel: PROGRAM_TYPE_OPTIONS.find(o => o.value === programType)?.label ?? '',
              description,
              startDate,
              endDate,
              visibility,
              feesCoveredBy,
            };
            sessionStorage.setItem('programType', programType);
            sessionStorage.setItem('programDetails', JSON.stringify(details));
            router.push('/programs/new/registrations');
          }}>
            Continue
          </Button>
        </div>
      </footer>

      {/* ── Page-level styles ──────────────────────────────────────── */}
      <style jsx>{`
        .new-program-page {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 72px);
          background: var(--u-color-background-container, #fefefe);
          margin: -32px -64px 0;
          width: calc(100% + 128px);
        }

        /* Content area */
        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content-inner {
          width: 100%;
          padding: var(--u-space-two, 32px) var(--u-space-one-and-half, 24px) 0;
          display: flex;
          flex-direction: column;
          gap: var(--u-space-two, 32px);
        }

        /* Full-width stepper bar */
        .stepper-bar {
          width: 100%;
          padding: 40px var(--u-space-one-and-half, 24px) 20px;
          background: var(--u-color-background-container, #fefefe);
          flex-shrink: 0;
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

        /* Form body */
        .form-scroll {
          width: 100%;
        }

        .form-body {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-two, 32px);
          padding-bottom: var(--u-space-three, 48px);
        }

        /* Form sections */
        .form-section {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one-and-quarter, 20px);
        }

        .field-row {
          display: flex;
          gap: var(--u-space-one, 16px);
          align-items: flex-start;
          width: 100%;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: var(--u-space-one, 16px);
        }

        :global(.inline-link) {
          color: var(--u-color-emphasis-background-contrast, #0273e3);
          text-decoration: none;
          font-weight: 400;
        }

        :global(.inline-link:hover) {
          text-decoration: underline;
        }

        /* Footer */
        .page-footer {
          position: sticky;
          bottom: 0;
          background: var(--u-color-background-container, #fefefe);
          border-top: 1px solid var(--u-color-line-subtle, #c4c6c8);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 12px var(--u-space-one-and-half, 24px);
          flex-shrink: 0;
          z-index: 10;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
