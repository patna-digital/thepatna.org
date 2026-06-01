"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  applicationEngagementOptions,
  applicationExpertiseOptions,
} from "@/lib/patna-data";
import { submitCommunityApplicationAction } from "./actions";

const initialState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button join-submit-btn" type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit application"}
    </button>
  );
}

function CheckboxOption({ name, option, checked, onChange }) {
  return (
    <label className={`checkbox-item${checked ? " checkbox-item--checked" : ""}`}>
      <input
        name={name}
        onChange={onChange}
        type="checkbox"
        value={option.slug}
        checked={checked}
      />
      <span>{option.label}</span>
    </label>
  );
}

export function CommunityApplicationForm() {
  const [state, formAction] = useActionState(submitCommunityApplicationAction, initialState);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState([]);

  const showOtherExpertise = useMemo(() => selectedExpertise.includes("other"), [selectedExpertise]);
  const showOtherEngagement = useMemo(() => selectedEngagement.includes("other"), [selectedEngagement]);

  function handleExpertiseChange(event) {
    const { value, checked } = event.target;
    setSelectedExpertise((cur) => checked ? [...cur, value] : cur.filter((v) => v !== value));
  }

  function handleEngagementChange(event) {
    const { value, checked } = event.target;
    setSelectedEngagement((cur) => checked ? [...cur, value] : cur.filter((v) => v !== value));
  }

  if (state.status === "success") {
    return (
      <div className="form-card application-submitted">
        <div className="eyebrow">Application received</div>
        <h3>Your application has been submitted</h3>
        <p>
          Thank you for your interest in joining PATNA. We will review your application, assess
          cohort fit, and be in touch with next steps.
        </p>
        <p className="muted-note">There is nothing more you need to do at this stage.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="form-card join-form">

      {/* ── Section 1: About you ── */}
      <div className="form-section">
        <div className="form-section-label">
          <span className="form-section-num">1</span>
          <span className="form-section-title">About you</span>
        </div>
        <div className="two-column-grid">
          <label>
            First name <span className="field-required">*</span>
            <input name="first_name" placeholder="Amara" required />
          </label>
          <label>
            Surname <span className="field-required">*</span>
            <input name="surname" placeholder="Diallo" required />
          </label>
        </div>
        <div className="two-column-grid">
          <label>
            Email <span className="field-required">*</span>
            <input name="email" placeholder="name@example.org" type="email" required />
          </label>
          <label>
            Phone number
            <input name="phone_number" placeholder="+[country code] …" />
          </label>
        </div>
        <div className="two-column-grid">
          <label>
            Country
            <input name="country" placeholder="Your country" />
          </label>
          <label>
            Organisation / institution
            <input name="organisation" placeholder="Institution or organisation" />
          </label>
        </div>
        <label>
          Role / title
          <input name="role_title" placeholder="e.g. Policy adviser, Researcher, Legal counsel" />
        </label>
      </div>

      {/* ── Section 2: Your expertise ── */}
      <div className="form-section">
        <div className="form-section-label">
          <span className="form-section-num">2</span>
          <span className="form-section-title">Your expertise</span>
        </div>

        <fieldset className="checkbox-group">
          <legend>Area(s) of expertise</legend>
          <div className="checkbox-grid">
            {applicationExpertiseOptions.map((option) => (
              <CheckboxOption
                key={option.slug}
                name="expertise_slugs"
                option={option}
                checked={selectedExpertise.includes(option.slug)}
                onChange={handleExpertiseChange}
              />
            ))}
          </div>
        </fieldset>

        {showOtherExpertise && (
          <label style={{ marginTop: "0.75rem" }}>
            Other expertise
            <input name="expertise_other_text" placeholder="Enter additional expertise areas" />
          </label>
        )}

        <fieldset className="checkbox-group" style={{ marginTop: "1.5rem" }}>
          <legend>How would you like to engage with PATNA?</legend>
          <div className="checkbox-grid">
            {applicationEngagementOptions.map((option) => (
              <CheckboxOption
                key={option.slug}
                name="engagement_slugs"
                option={option}
                checked={selectedEngagement.includes(option.slug)}
                onChange={handleEngagementChange}
              />
            ))}
          </div>
        </fieldset>

        {showOtherEngagement && (
          <label style={{ marginTop: "0.75rem" }}>
            Other engagement
            <input
              name="engagement_other_text"
              placeholder="Enter another way you would like to engage"
            />
          </label>
        )}
      </div>

      {/* ── Section 3: Motivation ── */}
      <div className="form-section">
        <div className="form-section-label">
          <span className="form-section-num">3</span>
          <span className="form-section-title">Motivation</span>
        </div>

        <label>
          Why do you want to join PATNA? <span className="field-required">*</span>
          <textarea
            name="motivation_text"
            placeholder="Tell us about your interest in African maritime decarbonisation, energy transition, or climate governance, and what you hope to contribute or gain through PATNA."
            required
          />
        </label>
      </div>

      {/* ── Consent & submit ── */}
      <div className="join-form-consent">
        <label className="checkbox-item consent-item">
          <input name="consent_data_storage" required type="checkbox" value="yes" />
          <span>
            I consent to PATNA storing my information for community engagement in accordance with the{" "}
            <a href="/legal/privacy" rel="noopener noreferrer" target="_blank">Privacy Policy</a>.
          </span>
        </label>
        <label className="checkbox-item consent-item">
          <input name="consent_updates" type="checkbox" value="yes" />
          <span>I would like to receive updates, newsletters, and invitations from PATNA.</span>
        </label>
      </div>

      <SubmitButton />

      <p className="muted-note join-form-footer-note">
        {state.message ? (
          <span className={state.status === "error" ? "form-error" : "form-success"}>
            {state.message}
          </span>
        ) : (
          <>
            By submitting you agree to our{" "}
            <a href="/legal/terms" rel="noopener noreferrer" target="_blank">Terms of Service</a>
            {" "}and{" "}
            <a href="/legal/privacy" rel="noopener noreferrer" target="_blank">Privacy Policy</a>.
            {" "}PATNA reviews all applications and assigns cohort fit internally.
          </>
        )}
      </p>

    </form>
  );
}
