"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  applicationEngagementOptions,
  applicationExpertiseOptions,
} from "@/lib/patna-data";
import { submitCommunityApplicationAction } from "./actions";

const initialState = { status: "idle", message: "", firstName: "" };

/* ── Submit button ── */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="join-submit-btn" disabled={pending} type="submit">
      {pending ? (
        <span className="join-submit-inner">
          <span className="join-spinner" aria-hidden="true" />
          Submitting…
        </span>
      ) : (
        <span className="join-submit-inner">
          Submit application
          <span aria-hidden="true">→</span>
        </span>
      )}
    </button>
  );
}

/* ── Dropdown multi-select ── */
function DropdownMultiSelect({ label, name, options, selected, onToggle, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOpts = options.filter((o) => selected.includes(o.slug));
  const triggerLabel =
    selectedOpts.length === 0
      ? placeholder
      : selectedOpts.length === 1
      ? selectedOpts[0].label
      : `${selectedOpts[0].label} +${selectedOpts.length - 1} more`;

  return (
    <div className="dmsel" ref={ref}>
      <div className="dmsel-label">{label}</div>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`dmsel-trigger${open ? " is-open" : ""}${selectedOpts.length ? " has-value" : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="dmsel-trigger-text">{triggerLabel}</span>
        <svg
          aria-hidden="true"
          className={`dmsel-chevron${open ? " is-open" : ""}`}
          fill="none"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="dmsel-panel" role="listbox" aria-multiselectable="true">
          {options.map((option) => {
            const checked = selected.includes(option.slug);
            return (
              <label
                className={`dmsel-option${checked ? " is-checked" : ""}`}
                key={option.slug}
                role="option"
                aria-selected={checked}
              >
                <input
                  checked={checked}
                  name={name}
                  onChange={(e) => onToggle(e.target.value, e.target.checked)}
                  type="checkbox"
                  value={option.slug}
                />
                <span aria-hidden="true" className="dmsel-option-box">
                  {checked && (
                    <svg fill="none" height="11" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 12 12" width="11">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="dmsel-option-text">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {selectedOpts.length > 0 && (
        <div aria-live="polite" className="dmsel-chips">
          {selectedOpts.map((opt) => (
            <span className="dmsel-chip" key={opt.slug}>
              {opt.label}
              <button
                aria-label={`Remove ${opt.label}`}
                className="dmsel-chip-x"
                onClick={() => onToggle(opt.slug, false)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Success / What's Next ── */
function JoinSuccess({ firstName }) {
  const name = firstName ? firstName.trim() : null;

  const pipeline = [
    {
      step: 1,
      title: "Secretariat review",
      body: "Your application is assessed for expertise, geographic fit, and cohort alignment.",
      timing: "1–2 weeks",
    },
    {
      step: 2,
      title: "Interview (if shortlisted)",
      body: "Shortlisted applicants are invited for a brief conversation to confirm alignment and goals.",
      timing: "Scheduled by PATNA",
    },
    {
      step: 3,
      title: "Cohort assignment",
      body: "Accepted members are placed in the cohort that best matches their expertise and objectives.",
      timing: "On acceptance",
    },
    {
      step: 4,
      title: "Welcome & onboarding",
      body: "You'll receive your invite by email, access to the member platform, and your community profile.",
      timing: "Same day",
    },
  ];

  const explore = [
    {
      href: "/insights",
      label: "Insights & Publications",
      desc: "Policy briefs, research outputs, and technical papers from PATNA and partners.",
      icon: "📄",
    },
    {
      href: "/events",
      label: "Events",
      desc: "Upcoming workshops, IMO sessions, and PATNA convenings open to the public.",
      icon: "📅",
    },
    {
      href: "/about",
      label: "About PATNA",
      desc: "Our mission, governance, expert cohorts, and institutional story.",
      icon: "🏛",
    },
    {
      href: "/projects",
      label: "Our Projects",
      desc: "The LEAP series, ORCA Africa, and other flagship PATNA programmes.",
      icon: "🌍",
    },
  ];

  return (
    <div className="join-success">
      <div className="join-success-inner">

        {/* confirmation header */}
        <div className="join-success-header">
          <div aria-hidden="true" className="join-success-mark">
            <svg fill="none" height="28" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 48 48" width="28">
              <path d="M10 25l10 10L38 14" />
            </svg>
          </div>
          <div className="join-success-eyebrow">Application received</div>
          <h2 className="join-success-title">
            {name ? <>Thank you, {name}.</> : "Thank you."}
          </h2>
          <p className="join-success-body">
            Your expression of interest is with the PATNA secretariat. We'll be in touch
            within <strong>2–4 weeks</strong>. You don't need to do anything else right now.
          </p>
        </div>

        {/* pipeline */}
        <div className="join-success-section">
          <div className="join-success-section-label">What happens next</div>
          <div className="join-pipeline">
            {pipeline.map((s, i) => (
              <div className="join-pipeline-step" key={s.step}>
                <div className="join-pipeline-left">
                  <div className="join-pipeline-num">{s.step}</div>
                  {i < pipeline.length - 1 && <div aria-hidden="true" className="join-pipeline-line" />}
                </div>
                <div className="join-pipeline-body">
                  <div className="join-pipeline-title">{s.title}</div>
                  <p className="join-pipeline-desc">{s.body}</p>
                  <div className="join-pipeline-timing">{s.timing}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* explore while you wait */}
        <div className="join-success-section">
          <div className="join-success-section-label">Explore PATNA while you wait</div>
          <div className="join-explore-grid">
            {explore.map((item) => (
              <Link className="join-explore-card" href={item.href} key={item.href}>
                <span aria-hidden="true" className="join-explore-icon">{item.icon}</span>
                <span className="join-explore-label">{item.label}</span>
                <span className="join-explore-desc">{item.desc}</span>
                <span aria-hidden="true" className="join-explore-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* admin note */}
        <div className="join-admin-note">
          <span className="join-admin-note-icon" aria-hidden="true">✉</span>
          <div>
            <strong>Were you directly invited to join?</strong>
            {" "}If you received an invite email from PATNA, check your inbox — it contains a direct link to set up your account. No application form is needed.
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main form component ── */
export function CommunityApplicationForm() {
  const [state, formAction] = useActionState(submitCommunityApplicationAction, initialState);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState([]);

  const showOtherExpertise = selectedExpertise.includes("other");
  const showOtherEngagement = selectedEngagement.includes("other");

  function toggleExpertise(value, checked) {
    setSelectedExpertise((cur) => checked ? [...cur, value] : cur.filter((v) => v !== value));
  }

  function toggleEngagement(value, checked) {
    setSelectedEngagement((cur) => checked ? [...cur, value] : cur.filter((v) => v !== value));
  }

  if (state.status === "success") {
    return <JoinSuccess firstName={state.firstName} />;
  }

  return (
    <form action={formAction} className="join-form" noValidate={false}>

      {/* Section 1 — About you */}
      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">1</span>
          <span className="jf-section-title">About you</span>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">First name <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="given-name" className="jf-input" name="first_name" placeholder="Amara" required />
          </label>
          <label className="jf-field">
            <span className="jf-label">Surname <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="family-name" className="jf-input" name="surname" placeholder="Diallo" required />
          </label>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Email address <span className="jf-req" aria-label="required">*</span></span>
            <input autoComplete="email" className="jf-input" name="email" placeholder="you@example.org" required type="email" />
          </label>
          <label className="jf-field">
            <span className="jf-label">Phone <span className="jf-opt">Optional</span></span>
            <input autoComplete="tel" className="jf-input" name="phone_number" placeholder="+1 555 000 0000" type="tel" />
          </label>
        </div>

        <div className="jf-row-2">
          <label className="jf-field">
            <span className="jf-label">Country <span className="jf-opt">Optional</span></span>
            <input autoComplete="country-name" className="jf-input" name="country" placeholder="Your country" />
          </label>
          <label className="jf-field">
            <span className="jf-label">Organisation / Institution <span className="jf-opt">Optional</span></span>
            <input autoComplete="organization" className="jf-input" name="organisation" placeholder="Organisation or institution" />
          </label>
        </div>

        <label className="jf-field">
          <span className="jf-label">Role / title <span className="jf-opt">Optional</span></span>
          <input autoComplete="organization-title" className="jf-input" name="role_title" placeholder="e.g. Policy adviser, Researcher, Legal counsel" />
        </label>
      </div>

      {/* Section 2 — Your profile */}
      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">2</span>
          <span className="jf-section-title">Your profile</span>
        </div>

        <DropdownMultiSelect
          label="Areas of expertise"
          name="expertise_slugs"
          onToggle={toggleExpertise}
          options={applicationExpertiseOptions}
          placeholder="Select all that apply…"
          selected={selectedExpertise}
        />

        {showOtherExpertise && (
          <label className="jf-field jf-other-field">
            <span className="jf-label">Other expertise — please specify</span>
            <input className="jf-input" name="expertise_other_text" placeholder="Describe your additional area of expertise" />
          </label>
        )}

        <DropdownMultiSelect
          label="How would you like to engage with PATNA?"
          name="engagement_slugs"
          onToggle={toggleEngagement}
          options={applicationEngagementOptions}
          placeholder="Select all that apply…"
          selected={selectedEngagement}
        />

        {showOtherEngagement && (
          <label className="jf-field jf-other-field">
            <span className="jf-label">Other engagement — please specify</span>
            <input className="jf-input" name="engagement_other_text" placeholder="Describe how else you'd like to engage" />
          </label>
        )}
      </div>

      {/* Section 3 — Motivation */}
      <div className="jf-section">
        <div className="jf-section-head">
          <span className="jf-section-num" aria-hidden="true">3</span>
          <span className="jf-section-title">Motivation</span>
        </div>

        <label className="jf-field">
          <span className="jf-label">
            Why do you want to join PATNA? <span className="jf-req" aria-label="required">*</span>
          </span>
          <textarea
            className="jf-textarea"
            name="motivation_text"
            placeholder="Tell us about your interest in African maritime decarbonisation, energy transition, or climate governance — and what you hope to contribute or gain through PATNA."
            required
          />
        </label>
      </div>

      {/* Consent */}
      <div className="jf-consent">
        <label className="jf-consent-row">
          <input className="jf-consent-check" name="consent_data_storage" required type="checkbox" value="yes" />
          <span>
            I consent to PATNA storing my information for community engagement purposes, in accordance with the{" "}
            <a href="/legal/privacy" rel="noopener noreferrer" target="_blank">Privacy Policy</a>.{" "}
            <span className="jf-req" aria-label="required">*</span>
          </span>
        </label>
        <label className="jf-consent-row">
          <input className="jf-consent-check" name="consent_updates" type="checkbox" value="yes" />
          <span>I would like to receive updates, newsletters, and invitations from PATNA.</span>
        </label>
      </div>

      {state.status === "error" && (
        <div className="jf-error-banner" role="alert">
          {state.message || "Something went wrong. Please try again."}
        </div>
      )}

      <SubmitButton />

      <p className="jf-footer-note">
        By submitting you agree to our{" "}
        <a href="/legal/terms" rel="noopener noreferrer" target="_blank">Terms of Service</a>{" "}
        and{" "}
        <a href="/legal/privacy" rel="noopener noreferrer" target="_blank">Privacy Policy</a>.
        PATNA reviews all applications and assigns cohort fit internally.
      </p>

    </form>
  );
}
