"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import Link from "next/link";

function SubmitButton({ isEdit }) {
  const { pending } = useFormStatus();
  const t = useTranslations("admin.partnershipLeads.forms.submit");
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

export function PartnershipLeadForm({ action, deleteAction, cancelHref = "/admin/partnership-leads", lead, notice, adminUsers = [] }) {
  const t = useTranslations("admin.partnershipLeads.forms");
  const isEdit = Boolean(lead?.id);
  const [formData, setFormData] = useState({
    organisation: lead?.organisation || "",
    name: lead?.name || "",
    email: lead?.email || "",
    org_type: lead?.org_type || "",
    focus_areas: lead?.focus_areas || "",
    budget_range: lead?.budget_range || "",
    status: lead?.status || "new",
    assigned_to_user_id: lead?.assigned_to_user_id || "",
    success_definition: lead?.success_definition || "",
    support_type: lead?.support_type || "",
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
          <label htmlFor="org_type" className="block text-sm font-medium mb-1">
            {t("labels.orgType")}
          </label>
          <select
            id="org_type"
            name="org_type"
            value={formData.org_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">{t("labels.selectOrgType")}</option>
            <option value="ngo">{t("orgTypes.ngo")}</option>
            <option value="government">{t("orgTypes.government")}</option>
            <option value="academic">{t("orgTypes.academic")}</option>
            <option value="private">{t("orgTypes.private")}</option>
            <option value="foundation">{t("orgTypes.foundation")}</option>
            <option value="multilateral">{t("orgTypes.multilateral")}</option>
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
            <option value="closed_won">{t("statusOptions.closed_won")}</option>
            <option value="closed_lost">{t("statusOptions.closed_lost")}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="focus_areas" className="block text-sm font-medium mb-1">
          {t("labels.focusAreas")}
        </label>
        <textarea
          id="focus_areas"
          name="focus_areas"
          rows={3}
          value={formData.focus_areas}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget_range" className="block text-sm font-medium mb-1">
            {t("labels.budgetRange")}
          </label>
          <input
            id="budget_range"
            name="budget_range"
            type="text"
            value={formData.budget_range}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          />
        </div>

        <div>
          <label htmlFor="success_definition" className="block text-sm font-medium mb-1">
            {t("labels.successDefinition")}
          </label>
          <input
            id="success_definition"
            name="success_definition"
            type="text"
            value={formData.success_definition}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="support_type" className="block text-sm font-medium mb-1">
            {t("labels.supportType")}
          </label>
          <select
            id="support_type"
            name="support_type"
            value={formData.support_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">{t("labels.selectSupportType")}</option>
            <option value="financial">{t("supportTypes.financial")}</option>
            <option value="technical">{t("supportTypes.technical")}</option>
            <option value="capacity_building">{t("supportTypes.capacity_building")}</option>
            <option value="advocacy">{t("supportTypes.advocacy")}</option>
            <option value="research">{t("supportTypes.research")}</option>
          </select>
        </div>

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
            {adminUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {[u.first_name, u.surname].filter(Boolean).join(" ") || u.email}
                {u.role_title ? ` · ${u.role_title}` : ""}
              </option>
            ))}
          </select>
        </div>
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

export default PartnershipLeadForm;
