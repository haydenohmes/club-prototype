'use client';

import React from 'react';

export const STEPS = ['Program Type', 'Program Details', 'Questions', 'Registrations', 'Summary', 'Next Steps'];

export function StepIndicator({ currentStep, steps = STEPS }: { currentStep: number; steps?: string[] }) {
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
