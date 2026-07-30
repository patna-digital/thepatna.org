"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitServiceRequestAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="join-submit-btn" data-variant="support" type="submit" disabled={pending}>
      {pending ? (
        <span className="join-submit-inner">
          <span className="join-spinner" aria-hidden="true" />
          Sending…
        </span>
      ) : (
        <span className="join-submit-inner">
          Submit support request
          <span aria-hidden="true">→</span>
        </span>
      )}
    </button>
  );
}

function ServiceRequestSuccess({ message }) {
  return (
    <div className="join-success">
      <div className="join-success-inner">
        <div className="join-success-header">
          <div aria-hidden="true" className="join-success-mark" data-variant="support">
            <svg fill="none" height="28" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 48 48" width="28">
              <path d="M10 25l10 10L38 14" />
            </svg>
          </div>
          <div className="join-success-eyebrow" data-variant="support">Request received</div>
          <h2 className="join-success-title">Thank you.</h2>
          <p className="join-success-body">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ServiceRequestForm() {
  const [state, formAction] = useActionState(submitServiceRequestAction, initialState);

  if (state.status === "success") {
    return <ServiceRequestSuccess message={state.message} />;
  }

  return (
    <form action={formAction} className="join-form">

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">1</span>
          <span className="jf-section-title">About you</span>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Your name <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="name" className="jf-input" id="requester_name" name="requester_name" required />
          </label>
          <label className="jf-field">
            <span className="jf-label">Your email <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="email" className="jf-input" id="requester_email" name="requester_email" required type="email" />
          </label>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Institution / Organisation <span className="jf-opt">Optional</span></span>
            <input autoComplete="organization" className="jf-input" id="organisation" name="organisation" />
          </label>
          <label className="jf-field">
            <span className="jf-label">Country <span className="jf-opt">Optional</span></span>
            <input autoComplete="country-name" className="jf-input" id="country" name="country" />
          </label>
        </div>
      </div>

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">2</span>
          <span className="jf-section-title">Your request</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">Type of support needed <span className="jf-opt">Optional</span></span>
          <select className="jf-input" id="request_type" name="request_type" defaultValue="">
            <option value="">Select…</option>
            <option value="technical">Technical Analysis</option>
            <option value="research">Research Support</option>
            <option value="content">Content / Briefings</option>
            <option value="events">Convening / Events</option>
            <option value="training">Training / Capacity Building</option>
          </select>
        </label>

        <label className="jf-field">
          <span className="jf-label">Request details <span className="jf-req" aria-label="required">*</span></span>
          <textarea
            className="jf-textarea"
            id="details"
            name="details"
            placeholder="Describe what you need, the context, and any time constraints."
            required
            rows={4}
          />
        </label>
      </div>

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">3</span>
          <span className="jf-section-title">Timing</span>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Decision context <span className="jf-opt">Optional</span></span>
            <input className="jf-input" id="decision_context" name="decision_context" placeholder="e.g. IMO session, national policy review" />
          </label>
          <label className="jf-field">
            <span className="jf-label">Timeline <span className="jf-opt">Optional</span></span>
            <input className="jf-input" id="timeline" name="timeline" placeholder="e.g. Before June 2026, flexible" />
          </label>
        </div>
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
