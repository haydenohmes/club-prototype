'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ProgramType = 'camps-clinics' | 'tryout' | 'team-dues' | 'misc';
type InvitationType = 'accept-decline' | 'confirmation';
type Visibility = 'public' | 'private';

// ─── Icons ────────────────────────────────────────────────────────────────────

function CampsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M11 3L3.5 17h15L11 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 17l2.8-5 2.8 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 8v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TryoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="5" y="4.5" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 3.4h5.6v2.4H8.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12l1.8 1.8L14 9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DuesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="6" width="15" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.2h15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.4 13.4h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MiscIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 4v2M11 16v2M4 11h2M16 11h2M6.34 6.34l1.42 1.42M14.24 14.24l1.42 1.42M6.34 15.66l1.42-1.42M14.24 7.76l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AcceptDeclineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 12l2 2 6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 18c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 10l1.5 1.5L21 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PROGRAM_TYPES: { value: ProgramType; icon: React.ReactNode; title: string; desc: string }[] = [
  { value: 'camps-clinics', icon: <CampsIcon />,  title: 'Camps / Clinics', desc: 'Registrations for events with scheduled sessions' },
  { value: 'tryout',        icon: <TryoutIcon />, title: 'Tryouts',         desc: 'Registrations for athlete evaluation events' },
  { value: 'team-dues',     icon: <DuesIcon />,   title: 'Club Dues',       desc: 'Collect fees for team membership' },
  { value: 'misc',          icon: <MiscIcon />,   title: 'Misc',            desc: 'Any other program type' },
];

// ─── Type card ────────────────────────────────────────────────────────────────

function TypeCard({
  icon, title, desc, selected, onClick,
}: {
  icon: React.ReactNode; title: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '14px',
        border: selected
          ? '2px solid var(--u-color-emphasis-background-contrast, #0273e3)'
          : '1px solid var(--u-color-line-subtle, #c4c6c8)',
        borderRadius: '10px',
        background: selected ? '#e7f3fd' : 'var(--u-color-background-container, #fefefe)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        outline: 'none',
        fontFamily: 'var(--u-font-body)',
      }}
    >
      <span style={{
        display: 'inline-flex',
        color: selected
          ? 'var(--u-color-emphasis-background-contrast, #0273e3)'
          : 'var(--u-color-base-foreground-subtle, #607081)',
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: selected ? '#085bb4' : 'var(--u-color-base-foreground-contrast, #071c31)',
      }}>
        {title}
      </span>
      <span style={{
        fontSize: '12px',
        lineHeight: 1.4,
        color: 'var(--u-color-base-foreground-subtle, #607081)',
      }}>
        {desc}
      </span>
    </button>
  );
}

// ─── Sub-type card (Club Dues only) ──────────────────────────────────────────

function SubTypeCard({
  icon, title, desc, selected, onClick,
}: {
  icon: React.ReactNode; title: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        padding: '12px 14px',
        border: selected
          ? '2px solid var(--u-color-emphasis-background-contrast, #0273e3)'
          : '1px solid var(--u-color-line-subtle, #c4c6c8)',
        borderRadius: '10px',
        background: selected ? '#e7f3fd' : 'var(--u-color-background-container, #fefefe)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        outline: 'none',
        fontFamily: 'var(--u-font-body)',
      }}
    >
      <span style={{
        display: 'inline-flex',
        color: selected
          ? 'var(--u-color-emphasis-background-contrast, #0273e3)'
          : 'var(--u-color-base-foreground-subtle, #607081)',
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: selected ? '#085bb4' : 'var(--u-color-base-foreground-contrast, #071c31)',
      }}>
        {title}
      </span>
      <span style={{
        fontSize: '12px',
        lineHeight: 1.4,
        color: 'var(--u-color-base-foreground-subtle, #607081)',
      }}>
        {desc}
      </span>
    </button>
  );
}

// ─── Visibility radio option ──────────────────────────────────────────────────

function VisibilityOption({
  value, label, desc, selected, disabled, onClick,
}: {
  value: Visibility; label: string; desc: string;
  selected: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <label
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px',
        border: selected
          ? '1px solid var(--u-color-emphasis-background-contrast, #0273e3)'
          : '1px solid var(--u-color-line-subtle, #c4c6c8)',
        borderRadius: '8px',
        cursor: disabled ? 'default' : 'pointer',
        background: selected ? '#e7f3fd' : 'var(--u-color-background-container, #fefefe)',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        fontFamily: 'var(--u-font-body)',
      }}
    >
      <input
        type="radio"
        name="visibility"
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => {}}
        style={{ marginTop: '3px', accentColor: 'var(--u-color-emphasis-background-contrast, #0273e3)', flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--u-color-base-foreground-contrast, #071c31)' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--u-color-base-foreground-subtle, #607081)', marginTop: '2px', lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
    </label>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TypePickerModal({ open, onClose, title: modalTitle, initialType }: { open: boolean; onClose: () => void; title?: string; initialType?: ProgramType | null }) {
  const router = useRouter();
  const [programType, setProgramType] = useState<ProgramType | null>(null);
  const [invitationType, setInvitationType] = useState<InvitationType | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');

  // Reset on open, pre-select initialType if provided
  useEffect(() => {
    if (open) { setProgramType(initialType ?? null); setInvitationType(null); setVisibility('public'); }
  }, [open, initialType]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const isDues = programType === 'team-dues';
  const canContinue = programType !== null && (!isDues || invitationType !== null);

  const handleSelectType = (t: ProgramType) => {
    setProgramType(t);
    setInvitationType(null);
    // Reset invite only when switching away from Club Dues
    if (t !== 'team-dues' && visibility === 'private') setVisibility('public');
  };

  const handleContinue = () => {
    if (!canContinue || !programType) return;
    const params = new URLSearchParams({ type: programType, visibility });
    if (invitationType) params.set('invitation', invitationType);
    onClose();
    router.push(`/programs/new?${params.toString()}`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'transparent',
          zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--u-color-background-container, #fefefe)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            fontFamily: 'var(--u-font-body)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--u-color-line-subtle, #c4c6c8)',
            position: 'sticky', top: 0,
            background: 'var(--u-color-background-container, #fefefe)',
            zIndex: 1,
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--u-color-base-foreground-contrast, #071c31)' }}>
              {modalTitle ?? 'Create a program'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '30px', border: 'none', background: 'none',
                borderRadius: '6px', cursor: 'pointer',
                color: 'var(--u-color-base-foreground-subtle, #607081)',
                fontSize: '20px', lineHeight: 1, flexShrink: 0,
              }}
            >×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Program type */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'var(--u-color-base-foreground-contrast, #071c31)' }}>
                What kind of program is this?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PROGRAM_TYPES.map((t) => (
                  <TypeCard
                    key={t.value}
                    icon={t.icon}
                    title={t.title}
                    desc={t.desc}
                    selected={programType === t.value}
                    onClick={() => handleSelectType(t.value)}
                  />
                ))}
              </div>
            </div>

            {/* Club Dues sub-type */}
            {isDues && (
              <div style={{ animation: 'slideDown 0.2s ease' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'var(--u-color-base-foreground-contrast, #071c31)' }}>
                  How should athletes join?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <SubTypeCard
                    icon={<AcceptDeclineIcon />}
                    title="Accept / Decline"
                    desc="Athletes receive an invitation and choose to accept or decline"
                    selected={invitationType === 'accept-decline'}
                    onClick={() => setInvitationType('accept-decline')}
                  />
                  <SubTypeCard
                    icon={<RegisterIcon />}
                    title="Register to Play"
                    desc="Athletes sign up and pay directly"
                    selected={invitationType === 'confirmation'}
                    onClick={() => setInvitationType('confirmation')}
                  />
                </div>
              </div>
            )}

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--u-color-line-subtle, #c4c6c8)', margin: 0 }} />

            {/* Visibility */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: 'var(--u-color-base-foreground-contrast, #071c31)' }}>
                Who can see this program?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <VisibilityOption
                  value="public"
                  label="Public"
                  desc="Listed on your org's page and available for purchase immediately"
                  selected={visibility === 'public'}
                  disabled={false}
                  onClick={() => setVisibility('public')}
                />
                <VisibilityOption
                  value="private"
                  label="Invite Only"
                  desc={isDues
                    ? 'You control who can register — link athletes from your Teams tab or send direct invitations'
                    : 'Coming soon — will be available once your org has a directory of athletes'}
                  selected={visibility === 'private'}
                  disabled={!isDues}
                  onClick={() => isDues && setVisibility('private')}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            padding: '16px 24px',
            borderTop: '1px solid var(--u-color-line-subtle, #c4c6c8)',
            position: 'sticky', bottom: 0,
            background: 'var(--u-color-background-container, #fefefe)',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--u-color-line-subtle, #c4c6c8)',
                borderRadius: '4px',
                background: 'var(--u-color-background-container, #fefefe)',
                color: 'var(--u-color-base-foreground, #36485c)',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--u-font-body)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '4px',
                background: canContinue
                  ? 'var(--u-color-emphasis-background-contrast, #0273e3)'
                  : 'var(--u-color-background-default, #e8eaec)',
                color: canContinue ? '#fff' : 'var(--u-color-base-foreground-subtle, #85909e)',
                fontSize: '14px', fontWeight: 500,
                cursor: canContinue ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--u-font-body)',
                transition: 'background 0.15s',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
