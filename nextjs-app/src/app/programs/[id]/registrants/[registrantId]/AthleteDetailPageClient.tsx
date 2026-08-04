'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProgramWithStats } from '@/lib/actions/programs';

// ─── Prototype registrant data ───────────────────────────────────────────────
// Mirrors the roster on the program Overview so a clicked athlete keeps identity.

interface Registrant {
  id: string;
  name: string;
  contact: string;
  team: string;
  teamStatus: string;
}

const ROSTER: Registrant[] = [
  { id: 'a1', name: 'Caroline Murray', contact: 'Mary Murray', team: '16 Alpine', teamStatus: 'Paid' },
  { id: 'a2', name: 'Shannon Dohrman', contact: 'Julie Dohrman', team: '16 Alpine', teamStatus: 'Paid' },
  { id: 'a3', name: 'Taylor Smith', contact: 'Alexis Smith', team: '17 Elite', teamStatus: 'Outstanding' },
  { id: 'a4', name: 'Alexis Chen', contact: 'Taylor Chen', team: '17 Elite', teamStatus: 'Paid' },
  { id: 'a5', name: 'Kayla Johnson', contact: 'Tammy Johnson', team: '16 Blue', teamStatus: 'Outstanding' },
  { id: 'a6', name: 'Jamie Wong', contact: 'Chen Wong', team: '16 Blue', teamStatus: 'Paid' },
  { id: 'a7', name: 'Riley Thompson', contact: 'Morgan Thompson', team: '16 Alpine', teamStatus: 'Paid' },
  { id: 'a8', name: 'Morgan Patel', contact: 'Jordan Patel', team: '17 Elite', teamStatus: 'Outstanding' },
  { id: 'a9', name: 'Sydney Kim', contact: 'Pam Kim', team: '16 Blue', teamStatus: 'Paid' },
  { id: 'a10', name: 'Dakota Rivers', contact: 'Jamie Rivers', team: '16 Alpine', teamStatus: 'Paid' },
];

const FALLBACK: Registrant = { id: '—', name: 'Lincoln Elliott', contact: 'Jennifer Elliott', team: '16 Alpine', teamStatus: 'Paid' };

function emailFor(contact: string) {
  return `${contact.split(' ')[0].toLowerCase()}@egco.us`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 7.25v3.25M8 5.4h.006" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 5.5V4a1.5 1.5 0 00-1.5-1.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreButton() {
  return (
    <button className="ad-more" aria-label="More options" onClick={(e) => e.stopPropagation()}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="3" cy="8" r="1.5" fill="currentColor" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="13" cy="8" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );
}

function StatusCell({ status }: { status: 'Current' | 'Scheduled' | 'Paid' }) {
  if (status === 'Paid') {
    return (
      <span className="ad-paid">
        <CheckIcon />
        Paid
      </span>
    );
  }
  return <span className="ad-pill">{status}</span>;
}

// ─── Stat group (same component + style as the program Overview) ───────────────

function StatGroup({
  label,
  value,
  labelInfo,
  rows,
}: {
  label: string;
  value: string;
  labelInfo?: boolean;
  rows: { label: string; value: string; info?: boolean; copy?: boolean; paid?: boolean }[];
}) {
  return (
    <div className="sg">
      <div className="sg-head">
        <span className="sg-label">{label}</span>
        {labelInfo && <span className="sg-info"><InfoIcon /></span>}
      </div>
      <span className="sg-value">{value}</span>
      <div className="sg-rows">
        {rows.map((r, i) => (
          <div key={i} className="sg-row">
            <span className="sg-row-label">
              {r.label}
              {r.info && <span className="sg-info"><InfoIcon /></span>}
            </span>
            <span className="sg-dots" />
            <span className="sg-row-value">
              {r.copy && <span className="sg-copy"><CopyIcon /></span>}
              {r.paid ? (
                <span className="sg-paid"><CheckIcon />Paid</span>
              ) : r.value}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .sg {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sg-head {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sg-label {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .sg-info {
          display: inline-flex;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sg-value {
          font-family: var(--u-font-body);
          font-size: 20px;
          font-weight: 700;
          line-height: 1.3;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin-bottom: 8px;
        }
        .sg-rows {
          display: flex;
          flex-direction: column;
        }
        .sg-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 3px 0;
        }
        .sg-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          white-space: nowrap;
        }
        .sg-dots {
          flex: 1;
          border-bottom: 1px dotted var(--u-color-line-default, #c4c6c8);
          transform: translateY(-3px);
        }
        .sg-row-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-contrast, #071c31);
          white-space: nowrap;
        }
        .sg-copy {
          display: inline-flex;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .sg-paid {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
      `}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AthleteDetailPageClient({
  programId,
  registrantId,
}: {
  programId: string;
  registrantId: string;
}) {
  const router = useRouter();
  const [programTitle, setProgramTitle] = useState('Program');

  // Resolve the program title for the breadcrumb (builder-created programs live in localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('createdPrograms');
      const created = raw ? (JSON.parse(raw) as ProgramWithStats[]) : [];
      const found = created.find((p) => p.id === programId);
      if (found?.title) setProgramTitle(found.title);
    } catch {
      // ignore
    }
  }, [programId]);

  const registrant = ROSTER.find((r) => r.id === registrantId) ?? FALLBACK;

  const paymentPlan = {
    title: 'Deposit + 2 Payments',
    nextPayment: 'Sep 1, 2026 for $1,650.00',
    frequency: 'Custom',
    autoPayment: 'On',
    status: 'Current' as const,
  };

  const payments = [
    { title: 'Deposit', due: 'Jul 30, 2026', amount: '$500.00', discounts: '—', fees: '$20.29', refunded: '—', status: 'Paid' as const },
    { title: 'Payment 1', due: 'Sep 1, 2026', amount: '$1,650.00', discounts: '—', fees: '—', refunded: '—', status: 'Scheduled' as const },
    { title: 'Payment 2', due: 'Feb 1, 2027', amount: '$1,650.00', discounts: '—', fees: '—', refunded: '—', status: 'Scheduled' as const },
  ];

  return (
    <div className="ad-page">
      {/* Breadcrumb */}
      <button className="ad-crumb" onClick={() => router.push(`/programs/${programId}`)}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{programTitle}</span>
        <span className="ad-crumb-sep">/</span>
      </button>

      {/* Header */}
      <div className="ad-header">
        <div className="ad-header-left">
          <h1 className="ad-title">Details</h1>
          <p className="ad-subtitle">Registration Date: Jul 30, 2026 at 4:03 PM CDT</p>
        </div>
      </div>

      {/* Stats — Registrant Info + Value (same StatGroup as the program Overview) */}
      <div className="ad-stats">
        <StatGroup
          label="Registrant Info"
          value={registrant.name}
          rows={[
            { label: 'Primary Contact', value: registrant.contact },
            { label: 'Primary Contact Email', value: emailFor(registrant.contact), copy: true },
            { label: 'Team', value: registrant.team },
            { label: 'Roster Status', value: registrant.teamStatus, paid: registrant.teamStatus === 'Paid' },
          ]}
        />
        <StatGroup
          label="Value"
          labelInfo
          value="$3,800.00"
          rows={[
            { label: 'Paid to Date', value: '$500.00' },
            { label: 'Outstanding', value: '$3,300.00' },
            { label: 'Refunded', value: '$0.00' },
          ]}
        />
      </div>

      {/* Payment Plan */}
      <section className="ad-section">
        <h2 className="ad-section-title">Payment Plan</h2>
        <div className="ad-table ad-table--plan">
          <div className="ad-row ad-row--head">
            <div className="ad-cell">Payment Title</div>
            <div className="ad-cell">Next Payment</div>
            <div className="ad-cell">Frequency</div>
            <div className="ad-cell">Auto Payment</div>
            <div className="ad-cell">Status</div>
            <div className="ad-cell ad-cell--more" />
          </div>
          <div className="ad-row">
            <div className="ad-cell ad-emph">{paymentPlan.title}</div>
            <div className="ad-cell">{paymentPlan.nextPayment}</div>
            <div className="ad-cell">{paymentPlan.frequency}</div>
            <div className="ad-cell">{paymentPlan.autoPayment}</div>
            <div className="ad-cell"><StatusCell status={paymentPlan.status} /></div>
            <div className="ad-cell ad-cell--more"><MoreButton /></div>
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="ad-section">
        <h2 className="ad-section-title">Payments</h2>
        <div className="ad-table ad-table--payments">
          <div className="ad-row ad-row--head">
            <div className="ad-cell">Payment Title</div>
            <div className="ad-cell">Due Date</div>
            <div className="ad-cell">Amount</div>
            <div className="ad-cell">Discounts</div>
            <div className="ad-cell ad-cell--fees">Fees <span className="ad-head-info"><InfoIcon /></span></div>
            <div className="ad-cell">Refunded</div>
            <div className="ad-cell">Status</div>
            <div className="ad-cell ad-cell--more" />
          </div>
          {payments.map((p) => (
            <div key={p.title} className="ad-row">
              <div className="ad-cell ad-emph">{p.title}</div>
              <div className="ad-cell">{p.due}</div>
              <div className="ad-cell">{p.amount}</div>
              <div className="ad-cell ad-cell--muted">{p.discounts}</div>
              <div className="ad-cell">{p.fees}</div>
              <div className="ad-cell ad-cell--muted">{p.refunded}</div>
              <div className="ad-cell"><StatusCell status={p.status} /></div>
              <div className="ad-cell ad-cell--more"><MoreButton /></div>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        .ad-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        /* Breadcrumb */
        .ad-crumb {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: var(--u-font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--u-color-base-foreground, #36485c);
          align-self: flex-start;
        }
        .ad-crumb:hover { color: var(--u-color-base-foreground-contrast, #071c31); }
        .ad-crumb-sep { color: var(--u-color-base-foreground-subtle, #607081); font-weight: 400; }

        /* Header */
        .ad-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
        }
        .ad-header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .ad-title {
          font-family: var(--u-font-body);
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.25px;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0;
        }
        .ad-subtitle {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground-subtle, #607081);
          margin: 0;
        }

        /* Stats row */
        .ad-stats {
          display: flex;
          gap: 48px;
          width: 100%;
        }

        /* Sections */
        .ad-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .ad-section-title {
          font-family: var(--u-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
          margin: 0 0 4px;
        }

        /* Tables */
        .ad-table { display: flex; flex-direction: column; width: 100%; }
        .ad-row {
          display: grid;
          align-items: center;
          gap: 16px;
          padding: 14px 4px;
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
        }
        .ad-table--plan .ad-row {
          grid-template-columns: 1.6fr 1.4fr 1fr 1fr 0.9fr 40px;
        }
        .ad-table--payments .ad-row {
          grid-template-columns: 1.3fr 1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 40px;
        }
        .ad-row--head {
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          padding-top: 0;
        }
        .ad-row--head .ad-cell {
          font-size: 14px;
          font-weight: 600;
          color: var(--u-color-base-foreground-subtle, #607081);
        }
        .ad-cell {
          font-family: var(--u-font-body);
          font-size: 14px;
          color: var(--u-color-base-foreground, #36485c);
          min-width: 0;
        }
        .ad-cell--fees { display: inline-flex; align-items: center; gap: 4px; }
        .ad-head-info { display: inline-flex; color: var(--u-color-base-foreground-subtle, #607081); }
        .ad-emph {
          font-weight: 700;
          color: var(--u-color-base-foreground-contrast, #071c31);
        }
        .ad-cell--muted { color: var(--u-color-base-foreground-subtle, #85909e); }
        .ad-cell--more { display: flex; justify-content: flex-end; }

        /* Status */
        .ad-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 4px;
          background: var(--u-color-background-default, #e8eaec);
          color: var(--u-color-base-foreground-subtle, #607081);
          font-size: 14px;
          font-weight: 600;
        }
        .ad-paid {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--u-color-success-foreground, #178143);
          font-size: 14px;
          font-weight: 600;
        }
        .ad-more {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--u-color-base-foreground-subtle, #607081);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .ad-more:hover { background: var(--u-color-background-subtle, #f5f6f7); }

        @media (max-width: 720px) {
          .ad-stats { flex-direction: column; gap: 24px; }
          .ad-table { overflow-x: auto; }
          .ad-table--plan .ad-row { grid-template-columns: 1.6fr 1.4fr 1fr 1fr 0.9fr 40px; min-width: 640px; }
          .ad-table--payments .ad-row { grid-template-columns: 1.3fr 1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 40px; min-width: 760px; }
        }
      `}</style>
    </div>
  );
}
