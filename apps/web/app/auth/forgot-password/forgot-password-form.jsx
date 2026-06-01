"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="form-card">
      <h3>Reset your password</h3>
      <label>
        Email
        <input name="email" placeholder="member@thepatna.org" type="email" required />
      </label>
      <SubmitButton />
      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>
          {state.message}
        </p>
      ) : (
        <p className="muted-note">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      )}
      <div className="form-footer-link">
        <Link href="/auth/login">← Back to sign in</Link>
      </div>
    </form>
  );
}
