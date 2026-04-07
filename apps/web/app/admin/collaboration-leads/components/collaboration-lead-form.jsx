"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { parseOptionalText } from "@/lib/collaboration-leads";

export default function CollaborationLeadForm({ action, redirectTo, notice }) {
  const { pending } = useFormStatus();
  const [formData, setFormData] = useState({
    organisation: "",
    name: "",
    email: "",
    collaboration_type: "",
    proposal: "",
    status: "new",
    assigned_to_user_id: "",
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
          <label htmlFor="collaboration_type" className="block text-sm font-medium mb-1">
            Collaboration Type
          </label>
          <select
            id="collaboration_type"
            name="collaboration_type"
            value={formData.collaboration_type}
            onChange={handleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-patna-blue focus:border-patna-blue"
          >
            <option value="">Select collaboration type</option>
            <option value="research">Research</option>
            <option value="content">Content</option>
            <option value="events">Events</option>
            <option value="training">Training</option>
            <option value="advocacy">Advocacy</option>
            <option value="technical">Technical Assistance</option>
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
            <option value="agreed">Agreed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="proposal" className="block text-sm font-medium mb-1">
          Proposal Summary
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

        <div>
          {/* Empty div for layout alignment */}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={pending}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-patna-blue text-white rounded-md hover:bg-patna-blue-dark disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Lead"}
        </button>
      </div>
    </form>
  );
}