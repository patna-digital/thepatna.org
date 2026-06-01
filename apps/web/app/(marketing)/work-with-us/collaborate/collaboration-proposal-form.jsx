"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitCollaborationProposalAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send collaboration proposal"}
    </button>
  );
}

export function CollaborationProposalForm() {
  const [state, formAction] = useActionState(submitCollaborationProposalAction, initialState);

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
        <label htmlFor="organisation">Organisation <span aria-hidden="true">*</span></label>
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
        <label htmlFor="collaboration_type">Type of collaboration</label>
        <select id="collaboration_type" name="collaboration_type">
          <option value="">Select (optional)</option>
          <option value="research">Research Partnership</option>
          <option value="content">Content / Co-authored Output</option>
          <option value="events">Workshop / Event</option>
          <option value="training">Training / Knowledge Exchange</option>
          <option value="advocacy">Advocacy / Policy Engagement</option>
          <option value="technical">Technical Assistance</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="proposal">Collaboration proposal <span aria-hidden="true">*</span></label>
        <textarea
          id="proposal"
          name="proposal"
          rows={5}
          required
          placeholder="Outline the idea, the contribution you have in mind, and the public value or outcome you expect."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
