'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import ProgramsTable from '@/components/ProgramsTable';
import TypePickerModal from '@/components/TypePickerModal';
import { useToast } from '@/components/Toast';
import type { ProgramWithStats } from '@/lib/actions/programs';

interface ProgramsPageClientProps {
  programs: ProgramWithStats[];
}

type ProgramType = 'camps-clinics' | 'tryout' | 'team-dues' | 'misc';

export default function ProgramsPageClient({ programs }: ProgramsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [initialModalType, setInitialModalType] = useState<ProgramType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-open modal with pre-selected type when ?add=<type> is in the URL
  useEffect(() => {
    const addParam = searchParams.get('add') as ProgramType | null;
    if (addParam) {
      setInitialModalType(addParam);
      setTypePickerOpen(true);
    }
  }, [searchParams]);

  // Merge in programs created through the builder (prototype: stored in localStorage)
  const [allPrograms, setAllPrograms] = useState<ProgramWithStats[]>(programs);
  const [arcDismissed, setArcDismissed] = useState(false);
  const [arcTeamsBuilt, setArcTeamsBuilt] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('createdPrograms');
      const created = raw ? (JSON.parse(raw) as ProgramWithStats[]) : [];
      setAllPrograms(Array.isArray(created) && created.length ? [...created, ...programs] : programs);
    } catch {
      setAllPrograms(programs);
    }
  }, [programs]);

  useEffect(() => {
    try {
      setArcTeamsBuilt(localStorage.getItem('arcTeamsBuilt') === 'true');
    } catch { /* ignore */ }
  }, []);

  const handleDeleteProgram = (id: string) => {
    const target = allPrograms.find(p => p.id === id);
    setAllPrograms(prev => prev.filter(p => p.id !== id));
    // Also drop it from builder-created programs stored locally
    try {
      const raw = localStorage.getItem('createdPrograms');
      if (raw) {
        const list = (JSON.parse(raw) as ProgramWithStats[]).filter(p => p.id !== id);
        localStorage.setItem('createdPrograms', JSON.stringify(list));
      }
    } catch {
      // ignore storage failures in the prototype
    }
    showToast(`${target?.title ?? 'Program'} deleted`, 'success');
  };

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // ── Season arc detection ──────────────────────────────────────────────────
  const tryoutProgram = allPrograms.find(
    p => p.type?.toLowerCase() === 'tryout' && p.status === 'published' && p.title?.trim()
  );
  const hasDuesProgram = allPrograms.some(p =>
    ['club dues', 'team-dues', 'team dues'].includes((p.type ?? '').toLowerCase())
  );
  const arcStep = hasDuesProgram ? 4 : arcTeamsBuilt ? 4 : 3;
  const showArc = !!tryoutProgram && !arcDismissed && !hasDuesProgram;
  const arcCtaHref = arcStep === 3 ? '/teams/manage' : '/programs?add=team-dues';
  const arcCtaLabel = arcStep === 3 ? 'Build teams & assign athletes' : 'Create Club Dues';

  const ARC_STEPS = [
    { label: 'Create tryout program' },
    { label: 'Host tryouts' },
    { label: 'Build teams' },
    { label: 'Create Club Dues' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>

        {/* Title + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <h1 style={{
            fontFamily: 'var(--u-font-body)',
            fontWeight: 700,
            fontSize: '32px',
            lineHeight: '1.2',
            letterSpacing: '0.25px',
            color: 'var(--u-color-base-foreground-contrast, #071c31)',
            margin: 0,
          }}>
            Programs
          </h1>
          <p style={{
            fontFamily: 'var(--u-font-body)',
            fontSize: '14px',
            color: 'var(--u-color-base-foreground, #36485c)',
            margin: 0,
          }}>
            Manage your registration programs, seasons, and events.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Button
            buttonStyle="standard"
            buttonType="primary"
            size="medium"
            onClick={() => setTypePickerOpen(true)}
          >
            Add Program
          </Button>

          {/* Ellipsis ⋯ */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className={`prog-ellipsis ${menuOpen ? 'prog-ellipsis--open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More actions"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="13" cy="8" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <div className="prog-dropdown">
                <button
                  className="prog-dropdown-item"
                  onClick={() => { setMenuOpen(false); router.push('/programs/transfer'); }}
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

      <TypePickerModal open={typePickerOpen} onClose={() => { setTypePickerOpen(false); setInitialModalType(null); }} initialType={initialModalType} />

      {/* ── Season arc card ─────────────────────────────────────────── */}
      {showArc && (
        <div className="arc-card-container">
        <div className="arc-card">
          {/* Left label */}
          <div className="arc-card-left">
            <span className="arc-card-eyebrow">Season in progress</span>
            <span className="arc-card-title">{tryoutProgram!.title}</span>
          </div>

          {/* Steps */}
          <div className="arc-steps">
            {ARC_STEPS.map((step, i) => {
              const stepNum  = i + 1;
              const isDone   = stepNum < arcStep;
              const isActive = stepNum === arcStep;
              return (
                <div key={step.label} className="arc-step-wrap">
                  {i > 0 && <span className={`arc-connector${isDone ? ' arc-connector--done' : ''}`} />}
                  <div className={`arc-step${isDone ? ' arc-step--done' : isActive ? ' arc-step--active' : ' arc-step--pending'}`}>
                    <span className="arc-step-dot">
                      {isDone
                        ? <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M8.5 2.5L4 7.5L1.5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : null}
                    </span>
                    <span className="arc-step-label">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA + dismiss */}
          <div className="arc-card-actions">
            <button className="arc-cta" onClick={() => {
              if (arcStep === 4) {
                setInitialModalType('team-dues');
                setTypePickerOpen(true);
              } else {
                router.push(arcCtaHref);
              }
            }}>
              {arcCtaLabel} →
            </button>
            <button className="arc-dismiss" onClick={() => setArcDismissed(true)} aria-label="Dismiss">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        </div>
      )}

      <ProgramsTable programs={allPrograms} onDeleteProgram={handleDeleteProgram} onEditProgram={() => setTypePickerOpen(true)} />

      {/* Scoped only to ellipsis + dropdown — no layout class names that could collide */}
      <style jsx>{`
        .prog-ellipsis {
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
        .prog-ellipsis:hover,
        .prog-ellipsis--open {
          background: var(--u-color-background-canvas, #eff0f0);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }
        .prog-dropdown {
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
        .prog-dropdown-item {
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
        .prog-dropdown-item:hover {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        /* ── Season arc card ── */
        .arc-card-container {
          container-type: inline-size;
        }
        .arc-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 12px 16px;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-left: 3px solid var(--u-color-emphasis-background-contrast, #0273e3);
          border-radius: 8px;
        }

        .arc-card-left {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex-shrink: 0;
          min-width: 120px;
        }

        .arc-card-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .arc-card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .arc-steps {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          /* Centered when there's room; falls back to start-aligned (no clipping)
             and scrolls when the tracker is wider than the available space. */
          justify-content: safe center;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .arc-steps::-webkit-scrollbar {
          display: none;
        }

        .arc-step-wrap {
          display: flex;
          align-items: center;
        }

        .arc-connector {
          width: 40px;
          height: 2px;
          background: var(--u-color-line-subtle, #e0e1e1);
          flex-shrink: 0;
        }
        .arc-connector--done {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .arc-step {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .arc-step-dot {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          border: 2px solid var(--u-color-line-subtle, #c4c6c8);
          background: var(--u-color-background-container, #fefefe);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .arc-step--done .arc-step-dot {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }
        .arc-step--active .arc-step-dot {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
          border-width: 2.5px;
          background: #e8f2ff;
        }
        .arc-step--active .arc-step-dot::after {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .arc-step-label {
          font-size: 13px;
          font-weight: 400;
          color: var(--u-color-base-foreground-subtle, #8a96a3);
          white-space: nowrap;
        }
        .arc-step--done .arc-step-label {
          color: var(--u-color-base-foreground, #36485c);
        }
        .arc-step--active .arc-step-label {
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }

        .arc-card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .arc-cta {
          height: 30px;
          padding: 0 14px;
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          color: #fff;
          border: none;
          border-radius: 4px;
          font-family: var(--u-font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .arc-cta:hover { background: #0261c2; }

        .arc-dismiss {
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--u-color-base-foreground-subtle, #8a96a3);
          transition: background 0.1s, color 0.1s;
        }
        .arc-dismiss:hover {
          background: var(--u-color-background-canvas, #eff0f0);
          color: var(--u-color-base-foreground, #36485c);
        }

        /* ── Responsive (container-based, so it reacts to the card's own
              width rather than the viewport — the sidebar changes how much
              room the card actually has) ── */
        /* Not enough room for one row: use a two-row grid so the label and the
           CTA are always visible together on top, and give the step tracker its
           own full-width row below (scrollable if it still doesn't fit). */
        @container (max-width: 1000px) {
          .arc-card {
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "left actions"
              "steps steps";
            align-items: center;
            gap: 14px 12px;
          }
          .arc-card-left {
            grid-area: left;
            min-width: 0;
          }
          .arc-card-title {
            max-width: none;
          }
          .arc-card-actions {
            grid-area: actions;
            justify-content: flex-end;
          }
          .arc-steps {
            grid-area: steps;
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Tight: tighten the connectors so the tracker needs less scrolling */
        @container (max-width: 560px) {
          .arc-card {
            padding: 12px;
          }
          .arc-connector {
            width: 20px;
          }
          .arc-step {
            gap: 5px;
          }
          .arc-step-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
