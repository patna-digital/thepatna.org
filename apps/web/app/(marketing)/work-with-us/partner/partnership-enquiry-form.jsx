"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPartnershipEnquiryAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="join-submit-btn" type="submit" disabled={pending}>
      {pending ? (
        <span className="join-submit-inner">
          <span className="join-spinner" aria-hidden="true" />
          Sending…
        </span>
      ) : (
        <span className="join-submit-inner">
          Start a partnership enquiry
          <span aria-hidden="true">→</span>
        </span>
      )}
    </button>
  );
}

function PartnershipSuccess({ message }) {
  return (
    <div className="join-success">
      <div className="join-success-inner">
        <div className="join-success-header">
          <div aria-hidden="true" className="join-success-mark">
            <svg fill="none" height="28" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 48 48" width="28">
              <path d="M10 25l10 10L38 14" />
            </svg>
          </div>
          <div className="join-success-eyebrow">Enquiry received</div>
          <h2 className="join-success-title">Thank you.</h2>
          <p className="join-success-body">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function PartnershipEnquiryForm() {
  const [state, formAction] = useActionState(submitPartnershipEnquiryAction, initialState);

  if (state.status === "success") {
    return <PartnershipSuccess message={state.message} />;
  }

  return (
    <form action={formAction} className="join-form">

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">1</span>
          <span className="jf-section-title">About your organisation</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">Organisation name <span className="jf-req" aria-label="required">*</span></span>
          <input autoComplete="organization" className="jf-input" id="organisation" name="organisation" required />
        </label>

        <label className="jf-field">
          <span className="jf-label">Organisation type <span className="jf-opt">Optional</span></span>
          <select className="jf-input" id="org_type" name="org_type" defaultValue="">
            <option value="">Select…</option>
            <option value="ngo">NGO / Non-profit</option>
            <option value="government">Government</option>
            <option value="academic">Academic / Research</option>
            <option value="private">Private Sector</option>
            <option value="foundation">Foundation</option>
            <option value="multilateral">Multilateral</option>
          </select>
        </label>
      </div>

      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">2</span>
          <span className="jf-section-title">Your contact details</span>
        </div>

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
          <span className="jf-section-num" aria-hidden="true">3</span>
          <span className="jf-section-title">Partnership details</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">Areas of shared interest <span className="jf-opt">Optional</span></span>
          <textarea
            className="jf-textarea"
            id="focus_areas"
            name="focus_areas"
            placeholder="Describe the programme, research, or funding areas you have in mind."
            rows={3}
          />
        </label>

        <label className="jf-field">
          <span className="jf-label">What would a successful partnership look like? <span className="jf-opt">Optional</span></span>
          <textarea
            className="jf-textarea"
            id="success_definition"
            name="success_definition"
            placeholder="Describe outcomes or deliverables you have in mind."
            rows={3}
          />
        </label>

        <label className="jf-field">
          <span className="jf-label">Budget range <span className="jf-opt">Optional</span></span>
          <input className="jf-input" id="budget_range" name="budget_range" placeholder="e.g. $50k–$200k, TBD" />
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
