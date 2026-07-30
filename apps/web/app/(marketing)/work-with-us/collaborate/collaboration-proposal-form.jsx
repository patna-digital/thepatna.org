"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitCollaborationProposalAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="join-submit-btn" data-variant="collaborate" type="submit" disabled={pending}>
      {pending ? (
        <span className="join-submit-inner">
          <span className="join-spinner" aria-hidden="true" />
          Sending…
        </span>
      ) : (
        <span className="join-submit-inner">
          Send collaboration proposal
          <span aria-hidden="true">→</span>
        </span>
      )}
    </button>
  );
}

function CollaborationSuccess({ message }) {
  return (
    <div className="join-success">
      <div className="join-success-inner">
        <div className="join-success-header">
          <div aria-hidden="true" className="join-success-mark" data-variant="collaborate">
            <svg fill="none" height="28" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 48 48" width="28">
              <path d="M10 25l10 10L38 14" />
            </svg>
          </div>
          <div className="join-success-eyebrow" data-variant="collaborate">Proposal received</div>
          <h2 className="join-success-title">Thank you.</h2>
          <p className="join-success-body">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function CollaborationProposalForm() {
  const [state, formAction] = useActionState(submitCollaborationProposalAction, initialState);

  if (state.status === "success") {
    return <CollaborationSuccess message={state.message} />;
  }

  return (
    <form action={formAction} className="join-form">

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">1</span>
          <span className="jf-section-title">About you</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">Organisation <span className="jf-req" aria-label="required">*</span></span>
          <input autoComplete="organization" className="jf-input" id="organisation" name="organisation" required />
        </label>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Your name <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="name" className="jf-input" id="name" name="name" required />
          </label>
          <label className="jf-field">
            <span className="jf-label">Your email <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="email" className="jf-input" id="email" name="email" required type="email" />
          </label>
        </div>
      </div>

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">2</span>
          <span className="jf-section-title">Your proposal</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">Type of collaboration <span className="jf-opt">Optional</span></span>
          <select className="jf-input" id="collaboration_type" name="collaboration_type" defaultValue="">
            <option value="">Select…</option>
            <option value="research">Research Partnership</option>
            <option value="content">Content / Co-authored Output</option>
            <option value="events">Workshop / Event</option>
            <option value="training">Training / Knowledge Exchange</option>
            <option value="advocacy">Advocacy / Policy Engagement</option>
            <option value="technical">Technical Assistance</option>
          </select>
        </label>

        <label className="jf-field">
          <span className="jf-label">Collaboration proposal <span className="jf-req" aria-label="required">*</span></span>
          <textarea
            className="jf-textarea"
            id="proposal"
            name="proposal"
            placeholder="Outline the idea, the contribution you have in mind, and the public value or outcome you expect."
            required
            rows={5}
          />
        </label>
      </div>

      {state.status === "error" && (
        <div className="jf-error-banner" role="alert">
          {state.message || "Something went wrong. Please try again."}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
