"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import Link from "next/link";

function SubmitButton({ isEdit }) {
  const { pending } = useFormStatus();
  const t = useTranslations("admin.collaborationLeads.forms.submit");
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-patna-blue text-white rounded-md hover:bg-patna-blue-dark disabled:opacity-50 form-submit-btn"
    >
      {pending && <span className="form-submit-spinner" aria-hidden="true" />}
      {pending ? (isEdit ? t("saving") : t("creating")) : isEdit ? t("save") : t("create")}
    </button>
  );
}

export default function CollaborationLeadForm({ action, deleteAction, cancelHref = "/admin/collaboration-leads", lead, notice }) {
  const t = useTranslations("admin.collaborationLeads.forms");
  const isEdit = Boolean(lead?.id);
  const [formData, setFormData] = useState({
    organisation: lead?.organisation || "",
    name: lead?.name || "",
    email: lead?.email || "",
    collaboration_type: lead?.collaboration_type || "",
    proposal: lead?.proposal || "",
    status: lead?.status || "new",
    assigned_to_user_id: lead?.assigned_to_user_id || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="lead_id" value={lead.id} />}

      {notice === "saved" && (
        <div className="form-feedback-banner success" role="status">
          ✓ {t("feedback.saved")}
        </div>
      )}
      {notice === "error" && (
        <div className="form-feedback-banner error" role="alert">
          ✕ {t("feedback.error")}
        </div>
      )}

      <div>
        <label htmlFor="organisation" className="block text-sm font-medium mb-1">
          {t("labels.organisation")}
        </label>
        <input
          id="organisation"
          name="organisation"
          type="text"
          required
          value={formData.organisation}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {t("labels.contactPerson")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t("labels.contactEmail")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="collaboration_type" className="block text-sm font-medium mb-1">
            {t("labels.collaborationType")}
          </label>
          <select
            id="collaboration_type"
            name="collaboration_type"
            value={formData.collaboration_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">{t("labels.selectCollabType")}</option>
            <option value="research">{t("collabTypes.research")}</option>
            <option value="content">{t("collabTypes.content")}</option>
            <option value="events">{t("collabTypes.events")}</option>
            <option value="training">{t("collabTypes.training")}</option>
            <option value="advocacy">{t("collabTypes.advocacy")}</option>
            <option value="technical">{t("collabTypes.technical")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            {t("labels.status")}
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="new">{t("statusOptions.new")}</option>
            <option value="contacted">{t("statusOptions.contacted")}</option>
            <option value="in_discussion">{t("statusOptions.in_discussion")}</option>
            <option value="proposal_sent">{t("statusOptions.proposal_sent")}</option>
            <option value="negotiation">{t("statusOptions.negotiation")}</option>
            <option value="agreed">{t("statusOptions.agreed")}</option>
            <option value="declined">{t("statusOptions.declined")}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="proposal" className="block text-sm font-medium mb-1">
          {t("labels.proposalSummary")}
        </label>
        <textarea
          id="proposal"
          name="proposal"
          rows={4}
          value={formData.proposal}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="assigned_to_user_id" className="block text-sm font-medium mb-1">
            {t("labels.assignedTo")}
          </label>
          <select
            id="assigned_to_user_id"
            name="assigned_to_user_id"
            value={formData.assigned_to_user_id}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">{t("labels.unassigned")}</option>
          </select>
        </div>
        <div />
      </div>

      <div className="flex justify-end space-x-3">
        <Link href={cancelHref} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          {t("submit.cancel")}
        </Link>
        {isEdit && deleteAction && (
          <form action={deleteAction} style={{ display: "inline" }}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              onClick={(e) => {
                if (!window.confirm(t("feedback.deleteConfirm"))) {
                  e.preventDefault();
                }
              }}
            >
              {t("submit.delete")}
            </button>
          </form>
        )}
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
