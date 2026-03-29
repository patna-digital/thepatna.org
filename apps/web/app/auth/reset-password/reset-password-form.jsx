"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" disabled={pending} type="submit">
      {pending ? "Saving..." : "Set password"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="form-card">
      <h3>Set your password</h3>
      <label>
        New password
        <input name="password" placeholder="Create a secure password" type="password" />
      </label>
      <label>
        Confirm password
        <input
          name="password_confirmation"
          placeholder="Repeat your password"
          type="password"
        />
      </label>
      <SubmitButton />
      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : (
        <p className="muted-note">
          After your password is set, PATNA will guide you into the remaining onboarding fields.
        </p>
      )}
    </form>
  );
}
