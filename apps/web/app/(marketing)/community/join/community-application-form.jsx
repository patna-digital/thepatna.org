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
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit application"}
    </button>
  );
}

export function CommunityApplicationForm() {
  const [state, formAction] = useActionState(submitCommunityApplicationAction, initialState);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState([]);
  const showOtherExpertise = useMemo(
    () => selectedExpertise.includes("other"),
    [selectedExpertise],
  );
  const showOtherEngagement = useMemo(
    () => selectedEngagement.includes("other"),
    [selectedEngagement],
  );

  function handleExpertiseChange(event) {
    const { value, checked } = event.target;
    setSelectedExpertise((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value),
    );
  }

  function handleEngagementChange(event) {
    const { value, checked } = event.target;
    setSelectedEngagement((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value),
    );
  }

  return (
    <form action={formAction} className="form-card">
      <h3>Community application</h3>
      <div className="two-column-grid">
        <label>
          First name
          <input name="first_name" placeholder="Amara" />
        </label>
        <label>
          Surname
          <input name="surname" placeholder="Diallo" />
        </label>
      </div>
      <div className="two-column-grid">
        <label>
          Email
          <input name="email" placeholder="name@example.org" type="email" />
        </label>
        <label>
          Phone number
          <input name="phone_number" placeholder="+234..." />
        </label>
      </div>
      <div className="two-column-grid">
        <label>
          Country
          <input name="country" placeholder="Senegal" />
        </label>
        <label>
          Organisation / institution
          <input name="organisation" placeholder="Institution or organisation" />
        </label>
      </div>
      <label>
        Role / title
        <input name="role_title" placeholder="Policy adviser" />
      </label>

      <fieldset className="checkbox-group">
        <legend>Area(s) of expertise</legend>
        <div className="checkbox-grid">
          {applicationExpertiseOptions.map((option) => (
            <label className="checkbox-item" key={option.slug}>
              <input
                name="expertise_slugs"
                onChange={handleExpertiseChange}
                type="checkbox"
                value={option.slug}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showOtherExpertise ? (
        <label>
          Other expertise
          <input name="expertise_other_text" placeholder="Enter additional expertise areas" />
        </label>
      ) : null}

      <fieldset className="checkbox-group">
        <legend>How would you like to engage with PATNA?</legend>
        <div className="checkbox-grid">
          {applicationEngagementOptions.map((option) => (
            <label className="checkbox-item" key={option.slug}>
              <input
                name="engagement_slugs"
                onChange={handleEngagementChange}
                type="checkbox"
                value={option.slug}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showOtherEngagement ? (
        <label>
          Other engagement
          <input
            name="engagement_other_text"
            placeholder="Enter another way you would like to engage"
          />
        </label>
      ) : null}

      <label>
        Motivation
        <textarea
          name="motivation_text"
          placeholder="Why do you want to join the PATNA community?"
        />
      </label>

      <div className="stack">
        <label className="checkbox-item">
          <input name="consent_data_storage" required type="checkbox" value="yes" />
          <span>I consent to PATNA storing my information for community engagement.</span>
        </label>
        <label className="checkbox-item">
          <input name="consent_updates" type="checkbox" value="yes" />
          <span>I would like to receive updates, newsletters, and invitations from PATNA.</span>
        </label>
      </div>

      <SubmitButton />

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : (
        <p className="muted-note">
          PATNA reviews applications first, then assigns cohort fit and interview routing internally.
        </p>
      )}
    </form>
  );
}
