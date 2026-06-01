"use client";

export function DeletePartnerButton({ partnerName, deleteAction, partnerId }) {
  return (
    <form action={deleteAction}>
      <input name="partner_id" type="hidden" value={partnerId} />
      <button
        className="danger-button"
        type="submit"
        onClick={(e) => {
          if (!window.confirm(`Delete ${partnerName}? This cannot be undone.`)) {
            e.preventDefault();
          }
        }}
      >
        Delete partner
      </button>
    </form>
  );
}
