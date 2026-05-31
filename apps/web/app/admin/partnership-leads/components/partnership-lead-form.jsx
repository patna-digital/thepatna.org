"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { parseOptionalText } from "@/lib/partnership-leads";

export default function PartnershipLeadForm({ action, deleteAction, cancelHref = "/admin/partnership-leads", lead, redirectTo, notice }) {
  const { pending } = useFormStatus();
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="lead_id" value={lead.id} />}
      <div>
        <label htmlFor="organisation" className="block text-sm font-medium mb-1">
          Organisation Name
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
          Contact Person
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
          Contact Email
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
            Organisation Type
          </label>
          <select
            id="org_type"
            name="org_type"
            value={formData.org_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">Select organisation type</option>
            <option value="ngo">NGO/Non-profit</option>
            <option value="government">Government</option>
            <option value="academic">Academic/Research</option>
            <option value="private">Private Sector</option>
            <option value="foundation">Foundation</option>
            <option value="multilateral">Multilateral</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_discussion">In Discussion</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="focus_areas" className="block text-sm font-medium mb-1">
          Focus Areas
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
            Budget Range (Optional)
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
            Success Definition (Optional)
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
            Support Type (Optional)
          </label>
          <select
            id="support_type"
            name="support_type"
            value={formData.support_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">Select support type</option>
            <option value="financial">Financial</option>
            <option value="technical">Technical Assistance</option>
            <option value="capacity_building">Capacity Building</option>
            <option value="advocacy">Advocacy Support</option>
            <option value="research">Research Collaboration</option>
          </select>
        </div>

        <div>
          <label htmlFor="assigned_to_user_id" className="block text-sm font-medium mb-1">
            Assigned To (Optional)
          </label>
          <select
            id="assigned_to_user_id"
            name="assigned_to_user_id"
            value={formData.assigned_to_user_id}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">Unassigned</option>
            {/* Member options would be populated here */}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Link
          href={cancelHref}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        {isEdit && deleteAction && (
          <form action={deleteAction} style={{ display: "inline" }}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              onClick={(e) => {
                if (!window.confirm("Delete this partnership lead? This cannot be undone.")) {
                  e.preventDefault();
                }
              }}
            >
              Delete
            </button>
          </form>
        )}
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-patna-blue text-white rounded-md hover:bg-patna-blue-dark disabled:opacity-50"
        >
          {pending ? "Saving..." : isEdit ? "Save Changes" : "Save Lead"}
        </button>
      </div>
    </form>
  );
}