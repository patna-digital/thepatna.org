"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { parseOptionalText } from "@/lib/service-requests";

export default function ServiceRequestForm({ serviceRequest, action, deleteAction, cancelHref = "/admin/service-requests", submitLabel = "Save Request" }) {
  const { pending } = useFormStatus();
  const isEdit = Boolean(serviceRequest?.id);

  const [formData, setFormData] = useState({
    requester_name: serviceRequest?.requester_name || "",
    requester_email: serviceRequest?.requester_email || "",
    organisation: serviceRequest?.organisation || "",
    request_type: serviceRequest?.request_type || "",
    details: serviceRequest?.details || "",
    country: serviceRequest?.country || "",
    decision_context: serviceRequest?.decision_context || "",
    timeline: serviceRequest?.timeline || "",
    status: serviceRequest?.status || "new",
    assigned_to_user_id: serviceRequest?.assigned_to_user_id || "",
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
      {isEdit && <input type="hidden" name="request_id" value={serviceRequest.id} />}
      <div>
        <label htmlFor="requester_name" className="block text-sm font-medium mb-1">
          Requester Name
        </label>
        <input
          id="requester_name"
          name="requester_name"
          type="text"
          required
          value={formData.requester_name}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div>
        <label htmlFor="requester_email" className="block text-sm font-medium mb-1">
          Requester Email
        </label>
        <input
          id="requester_email"
          name="requester_email"
          type="email"
          required
          value={formData.requester_email}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div>
        <label htmlFor="organisation" className="block text-sm font-medium mb-1">
          Organisation
        </label>
        <input
          id="organisation"
          name="organisation"
          type="text"
          value={formData.organisation}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div>
        <label htmlFor="request_type" className="block text-sm font-medium mb-1">
          Request Type
        </label>
        <select
          id="request_type"
          name="request_type"
          value={formData.request_type}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        >
          <option value="">Select request type</option>
          <option value="technical">Technical</option>
          <option value="research">Research</option>
          <option value="content">Content</option>
          <option value="events">Events</option>
          <option value="partnership">Partnership</option>
          <option value="training">Training</option>
        </select>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-medium mb-1">
          Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          required
          value={formData.details}
          onChange={handleChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            value={formData.country}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          />
        </div>

        <div>
          <label htmlFor="decision_context" className="block text-sm font-medium mb-1">
            Decision Context
          </label>
          <input
            id="decision_context"
            name="decision_context"
            type="text"
            value={formData.decision_context}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="timeline" className="block text-sm font-medium mb-1">
            Timeline
          </label>
          <input
            id="timeline"
            name="timeline"
            type="text"
            value={formData.timeline}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          />
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
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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
          {/* In a real implementation, this would be populated with member options */}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <Link
          href={cancelHref}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </Link>
        {isEdit && deleteAction && (
          <form action={deleteAction} style={{ display: "inline" }}>
            <input type="hidden" name="request_id" value={serviceRequest.id} />
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
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
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}