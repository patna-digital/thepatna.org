export function EventFormFields({ values }) {
  return (
    <>
      <div className="two-column-grid">
        <label>
          Event title
          <input defaultValue={values.title} name="title" placeholder="PATNA event title" required />
        </label>
        <label>
          Event type
          <input defaultValue={values.event_type} name="event_type" placeholder="Summit, workshop, IMO meeting" />
        </label>
      </div>

      <div className="two-column-grid">
        <label>
          Start date
          <input defaultValue={values.starts_on} name="starts_on" type="date" />
        </label>
        <label>
          End date
          <input defaultValue={values.ends_on} name="ends_on" type="date" />
        </label>
      </div>

      <div className="two-column-grid">
        <label>
          Display date
          <input
            defaultValue={values.display_date}
            name="display_date"
            placeholder="October 2026 (TBC) or 16 June 2026 to 18 June 2026"
          />
          <span className="field-help">Preserve uncertain or editorial date text here when exact timestamps are not appropriate.</span>
        </label>
        <label>
          Location
          <input defaultValue={values.location} name="location" placeholder="Abuja, Nigeria" />
        </label>
      </div>

      <label>
        Organising institutions
        <textarea
          defaultValue={values.organising_institutions}
          name="organising_institutions"
          placeholder={"PATNA Initiative;\nGovernment of Senegal;\nIMO"}
        />
        <span className="field-help">Use semicolons or new lines to separate institutions.</span>
      </label>

      <label>
        Summary
        <textarea
          defaultValue={values.summary}
          name="summary"
          placeholder="Short PATNA-facing summary for public and admin surfaces."
        />
      </label>

      <label>
        Body
        <textarea
          defaultValue={values.body}
          name="body"
          placeholder="Longer event note, programme context, or institutional detail."
        />
      </label>

      <div className="two-column-grid">
        <label>
          PATNA involvement
          <input defaultValue={values.patna_involvement} name="patna_involvement" placeholder="Lead organiser, participant, observer" />
        </label>
        <label>
          Official link
          <input defaultValue={values.official_link} name="official_link" placeholder="https://thepatna.org/..." type="url" />
        </label>
      </div>

      <label>
        Themes
        <textarea
          defaultValue={values.themes}
          name="themes"
          placeholder={"Maritime Decarbonisation;\nClimate Finance;\nIMO"}
        />
        <span className="field-help">Use semicolons or new lines to separate themes.</span>
      </label>
    </>
  );
}
