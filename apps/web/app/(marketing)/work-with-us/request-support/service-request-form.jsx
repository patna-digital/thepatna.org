"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitServiceRequestAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send support request"}
    </button>
  );
}

export function ServiceRequestForm() {
  const [state, formAction] = useActionState(submitServiceRequestAction, initialState);

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

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="requester_name">Your name <span aria-hidden="true">*</span></label>
          <input id="requester_name" name="requester_name" type="text" required autoComplete="name" />
        </div>
        <div className="form-field">
          <label htmlFor="requester_email">Your email <span aria-hidden="true">*</span></label>
          <input id="requester_email" name="requester_email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="organisation">Institution / Organisation</label>
          <input id="organisation" name="organisation" type="text" autoComplete="organization" />
        </div>
        <div className="form-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" autoComplete="country-name" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="request_type">Type of support needed</label>
        <select id="request_type" name="request_type">
          <option value="">Select (optional)</option>
          <option value="technical">Technical Analysis</option>
          <option value="research">Research Support</option>
          <option value="content">Content / Briefings</option>
          <option value="events">Convening / Events</option>
          <option value="training">Training / Capacity Building</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="details">Request details <span aria-hidden="true">*</span></label>
        <textarea id="details" name="details" rows={4} required placeholder="Describe what you need, the context, and any time constraints." />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="decision_context">Decision context (optional)</label>
          <input id="decision_context" name="decision_context" type="text" placeholder="e.g. IMO session, national policy review" />
        </div>
        <div className="form-field">
          <label htmlFor="timeline">Timeline (optional)</label>
          <input id="timeline" name="timeline" type="text" placeholder="e.g. Before June 2026, flexible" />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
