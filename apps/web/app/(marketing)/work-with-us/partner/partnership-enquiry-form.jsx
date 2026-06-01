"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPartnershipEnquiryAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send partnership enquiry"}
    </button>
  );
}

export function PartnershipEnquiryForm() {
  const [state, formAction] = useActionState(submitPartnershipEnquiryAction, initialState);

  if (state.status === "success") {
    return (
      <div className="form-success-panel">
        <p className="form-success">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="stack">
      {state.status === "error" && <p className="form-error">{state.message}</p>}

      <div className="form-field">
        <label htmlFor="organisation">Organisation name <span aria-hidden="true">*</span></label>
        <input id="organisation" name="organisation" type="text" required autoComplete="organization" />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="name">Your name <span aria-hidden="true">*</span></label>
          <input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className="form-field">
          <label htmlFor="email">Your email <span aria-hidden="true">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="org_type">Organisation type</label>
        <select id="org_type" name="org_type">
          <option value="">Select (optional)</option>
          <option value="ngo">NGO / Non-profit</option>
          <option value="government">Government</option>
          <option value="academic">Academic / Research</option>
          <option value="private">Private Sector</option>
          <option value="foundation">Foundation</option>
          <option value="multilateral">Multilateral</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="focus_areas">Areas of shared interest</label>
        <textarea id="focus_areas" name="focus_areas" rows={3} placeholder="Describe the programme, research, or funding areas you have in mind." />
      </div>

      <div className="form-field">
        <label htmlFor="success_definition">What would a successful partnership look like?</label>
        <textarea id="success_definition" name="success_definition" rows={3} placeholder="Optional — describe outcomes or deliverables you have in mind." />
      </div>

      <div className="form-field">
        <label htmlFor="budget_range">Budget range (optional)</label>
        <input id="budget_range" name="budget_range" type="text" placeholder="e.g. $50k–$200k, TBD" />
      </div>

      <SubmitButton />
    </form>
  );
}
