"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactEnquiryAction } from "./actions";

const initialState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactEnquiryAction, initialState);

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

      <div className="form-field">
        <label htmlFor="organisation">Organisation (optional)</label>
        <input id="organisation" name="organisation" type="text" autoComplete="organization" />
      </div>

      <div className="form-field">
        <label htmlFor="details">Your message <span aria-hidden="true">*</span></label>
        <textarea id="details" name="details" rows={5} required placeholder="How can PATNA help?" />
      </div>

      <SubmitButton />
    </form>
  );
}
