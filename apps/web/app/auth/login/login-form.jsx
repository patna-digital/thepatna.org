"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="form-card">
      <h3>Sign in</h3>
      <input name="next" type="hidden" value={next} />
      <label>
        Email
        <input name="email" placeholder="member@thepatna.org" type="email" />
      </label>
      <label>
        Password
        <input name="password" placeholder="Your password" type="password" />
      </label>
      <SubmitButton />
      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : (
        <p className="muted-note">
          Use an invited PATNA account. Cohort migration members will receive a set-password email
          and be routed into profile completion on first access.
        </p>
      )}
    </form>
  );
}
