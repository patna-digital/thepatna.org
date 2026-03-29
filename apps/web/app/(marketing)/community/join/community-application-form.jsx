"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  applicationCohortOptions,
  applicationDomainOptions,
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
          Country
          <input name="country" placeholder="Senegal" />
        </label>
      </div>
      <label>
        Organisation
        <input name="organisation" placeholder="Institution or organisation" />
      </label>
      <label>
        Role title
        <input name="role_title" placeholder="Policy adviser" />
      </label>

      <fieldset className="checkbox-group">
        <legend>Cohort interests</legend>
        <div className="checkbox-grid">
          {applicationCohortOptions.map((cohort) => (
            <label className="checkbox-item" key={cohort.slug}>
              <input name="cohort_interests" type="checkbox" value={cohort.slug} />
              <span>{cohort.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkbox-group">
        <legend>Domain interests</legend>
        <div className="checkbox-grid">
          {applicationDomainOptions.map((tag) => (
            <label className="checkbox-item" key={tag.slug}>
              <input name="domain_interests" type="checkbox" value={tag.slug} />
              <span>{tag.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Motivation
        <textarea
          name="motivation_text"
          placeholder="Why do you want to join the PATNA community?"
        />
      </label>

      <SubmitButton />

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : (
        <p className="muted-note">
          This form now writes to the Supabase application tables when the project env vars are set.
        </p>
      )}
    </form>
  );
}
