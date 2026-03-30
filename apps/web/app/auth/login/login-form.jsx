"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

const HASH_ERROR_MESSAGES = {
  otp_expired: "Your invite link has expired. Ask your administrator to resend the login email from the Members page.",
  access_denied: "Access was denied. Your invite link may be invalid or already used.",
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
  const [hashError, setHashError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");
    if (errorCode) {
      setHashError(
        HASH_ERROR_MESSAGES[errorCode] ||
          errorDescription?.replaceAll("+", " ") ||
          "Your login link was invalid. Please sign in or request a new invite.",
      );
    }
  }, []);

  const errorMessage = state.status === "error" ? state.message : hashError;

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
      {errorMessage ? (
        <p className="form-error">{errorMessage}</p>
      ) : state.status === "success" && state.message ? (
        <p className="form-success">{state.message}</p>
      ) : (
        <p className="muted-note">
          Use an invited PATNA account. Cohort migration members will receive a set-password email
          and be routed into profile completion on first access.
        </p>
      )}
    </form>
  );
}
