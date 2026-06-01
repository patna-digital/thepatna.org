"use client";

import { useState, useTransition } from "react";

function ContactCard({ contact, partnerId, onEdit, deleteAction }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Remove ${contact.full_name}?`)) return;
    const fd = new FormData();
    fd.set("contact_id", contact.id);
    fd.set("partner_id", partnerId);
    startTransition(() => deleteAction(fd));
  }

  return (
    <div className={`contact-card${contact.is_primary ? " is-primary-contact" : ""}`}>
      <div className="contact-card-body">
        <div className="contact-card-name">
          <strong>{contact.full_name}</strong>
          {contact.is_primary && <span className="status-chip chip-success">Primary</span>}
        </div>
        {contact.role_title && <p className="contact-card-role">{contact.role_title}</p>}
        <div className="contact-card-details">
          {contact.email && (
            <a className="contact-card-link" href={`mailto:${contact.email}`}>{contact.email}</a>
          )}
          {contact.phone && <span>{contact.phone}</span>}
        </div>
        {contact.notes && <p className="contact-card-notes">{contact.notes}</p>}
      </div>
      <div className="contact-card-actions">
        <button className="secondary-button btn-sm" onClick={() => onEdit(contact)} type="button">
          Edit
        </button>
        <button
          className="danger-button btn-sm"
          disabled={isPending}
          onClick={handleDelete}
          type="button"
        >
          {isPending ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

function ContactForm({ contact = null, partnerId, onCancel, saveAction }) {
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary ?? false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(() => saveAction(fd));
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input name="partner_id" type="hidden" value={partnerId} />
      {contact?.id && <input name="contact_id" type="hidden" value={contact.id} />}

      <div className="form-grid-2">
        <div className="form-field">
          <label className="form-label" htmlFor={`cf-name-${contact?.id || "new"}`}>
            Full name <span className="form-required">*</span>
          </label>
          <input
            className="form-input"
            defaultValue={contact?.full_name || ""}
            id={`cf-name-${contact?.id || "new"}`}
            name="full_name"
            placeholder="Dr Jane Okonkwo"
            required
            type="text"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`cf-role-${contact?.id || "new"}`}>Role / title</label>
          <input
            className="form-input"
            defaultValue={contact?.role_title || ""}
            id={`cf-role-${contact?.id || "new"}`}
            name="role_title"
            placeholder="Maritime Director"
            type="text"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`cf-email-${contact?.id || "new"}`}>Email</label>
          <input
            className="form-input"
            defaultValue={contact?.email || ""}
            id={`cf-email-${contact?.id || "new"}`}
            name="email"
            placeholder="jane@example.org"
            type="email"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`cf-phone-${contact?.id || "new"}`}>Phone</label>
          <input
            className="form-input"
            defaultValue={contact?.phone || ""}
            id={`cf-phone-${contact?.id || "new"}`}
            name="phone"
            placeholder="+234 xxx xxxx"
            type="tel"
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={`cf-notes-${contact?.id || "new"}`}>Notes</label>
        <textarea
          className="form-textarea"
          defaultValue={contact?.notes || ""}
          id={`cf-notes-${contact?.id || "new"}`}
          name="notes"
          placeholder="Relationship context, preferred communication channel…"
          rows={2}
        />
      </div>

      <label className="form-checkbox-label">
        <input
          checked={isPrimary}
          name="is_primary"
          onChange={(e) => setIsPrimary(e.target.checked)}
          type="checkbox"
        />
        <span>Primary contact for this partner</span>
      </label>

      <div className="contact-form-actions">
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "Saving…" : contact ? "Save contact" : "Add contact"}
        </button>
        <button className="secondary-button" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PartnerContactsPanel({ contacts = [], deleteAction, partnerId, saveAction }) {
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);

  function handleEdit(contact) {
    setEditContact(contact);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditContact(null);
  }

  return (
    <div className="dashboard-card partner-contacts-panel">
      {contacts.length === 0 && !showForm && (
        <div className="app-row-empty">
          <strong>No contacts yet.</strong>
          <p>Add contact persons for this partner — especially useful when the relationship was not initiated via the website form.</p>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="contact-list">
          {contacts.map((contact) => (
            <ContactCard
              contact={contact}
              deleteAction={deleteAction}
              key={contact.id}
              onEdit={handleEdit}
              partnerId={partnerId}
            />
          ))}
        </div>
      )}

      {showForm ? (
        <ContactForm
          contact={editContact}
          onCancel={handleCancel}
          partnerId={partnerId}
          saveAction={saveAction}
        />
      ) : (
        <button
          className="secondary-button"
          onClick={() => { setEditContact(null); setShowForm(true); }}
          type="button"
        >
          + Add contact person
        </button>
      )}
    </div>
  );
}
