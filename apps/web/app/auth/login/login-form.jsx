"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signInAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

const HASH_ERROR_KEYS = {
  otp_expired: "loginForm.otpExpired",
  access_denied: "loginForm.accessDenied",
};

function SubmitButton({ t }) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? t("loginForm.btnSigningIn") : t("loginForm.btnSignIn")}
    </button>
  );
}

export function LoginForm({ next }) {
  const t = useTranslations();
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
        HASH_ERROR_KEYS[errorCode]
          ? t(HASH_ERROR_KEYS[errorCode])
          : errorDescription?.replaceAll("+", " ") || t("loginForm.invalidLink"),
      );
    }
  }, [t]);

  const errorMessage = state.status === "error" ? state.message : hashError;

  return (
    <form action={formAction} className="form-card">
      <h3>{t("loginForm.title")}</h3>
      <input name="next" type="hidden" value={next} />
      <label>
        {t("loginForm.labelEmail")}
        <input name="email" placeholder={t("loginForm.placeholderEmail")} type="email" />
      </label>
      <label>
        {t("loginForm.labelPassword")}
        <input name="password" placeholder={t("loginForm.placeholderPassword")} type="password" />
      </label>
      <div className="forgot-password-link">
        <Link href="/auth/forgot-password">{t("loginForm.forgotPassword")}</Link>
      </div>
      <SubmitButton t={t} />
      {errorMessage ? (
        <p className="form-error">{errorMessage}</p>
      ) : state.status === "success" && state.message ? (
        <p className="form-success">{state.message}</p>
      ) : (
        <p className="muted-note">{t("loginForm.migrationNote")}</p>
      )}
    </form>
  );
}
