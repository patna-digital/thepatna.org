"use client";

export function DeletePersonButton({ personName, deleteAction, personId }) {
  return (
    <form action={deleteAction}>
      <input name="person_id" type="hidden" value={personId} />
      <button
        className="danger-button"
        type="submit"
        onClick={(e) => {
          if (!window.confirm(`Delete ${personName}? This cannot be undone.`)) {
            e.preventDefault();
          }
        }}
      >
        Delete profile
      </button>
    </form>
  );
}
