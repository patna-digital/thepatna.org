"use client";

import { useEffect, useState } from "react";

function countSelected(checkboxName) {
  return document.querySelectorAll(`input[name="${checkboxName}"]:checked`).length;
}

function ConfirmModal({ count, actionLabel, isDestructive, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <span className={`confirm-modal-icon ${isDestructive ? "confirm-modal-icon-warn" : "confirm-modal-icon-info"}`} aria-hidden="true">
            {isDestructive ? "⚠" : "✉"}
          </span>
          <h3>Confirm {actionLabel.toLowerCase()}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>
            You are about to <strong>{actionLabel.toLowerCase()}</strong> for{" "}
            <strong>{count} member{count === 1 ? "" : "s"}</strong>.
          </p>
          <p className="confirm-modal-note">
            {isDestructive
              ? "This will attempt to repair profile data. Only proceed if you have reviewed the selected members."
              : "Each member will receive a login email. Only proceed once they have been cleared for access."}
          </p>
        </div>
        <div className="confirm-modal-footer">
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={isDestructive ? "secondary-button confirm-button-warn" : "primary-button"}
            onClick={onConfirm}
            type="button"
          >
            Confirm — {actionLabel} ({count})
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminMembersBulkAction({
  checkboxName = "profile_ids",
  idleLabel = "Send to selected",
  secondaryAction = null,
  secondaryLabel = "",
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [pending, setPending] = useState(null); // { isSecondary: bool }

  useEffect(() => {
    function updateSelectedCount() {
      setSelectedCount(countSelected(checkboxName));
    }

    updateSelectedCount();

    const checkboxes = Array.from(document.querySelectorAll(`input[name="${checkboxName}"]`));
    checkboxes.forEach((cb) => cb.addEventListener("change", updateSelectedCount));

    return () => {
      checkboxes.forEach((cb) => cb.removeEventListener("change", updateSelectedCount));
    };
  }, [checkboxName]);

  function handlePrimary() {
    if (selectedCount === 0) return;
    setPending({ isSecondary: false });
  }

  function handleSecondary() {
    if (selectedCount === 0) return;
    setPending({ isSecondary: true });
  }

  function handleConfirm() {
    const form = document.getElementById("bulk-member-action-form");
    if (!form) return;

    if (pending?.isSecondary && secondaryAction) {
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.formAction = secondaryAction;
      btn.style.display = "none";
      form.appendChild(btn);
      btn.click();
      form.removeChild(btn);
    } else {
      form.requestSubmit();
    }

    setPending(null);
  }

  const actionLabel = pending?.isSecondary ? secondaryLabel : idleLabel;

  return (
    <>
      <div className="bulk-action-summary">
        <span className={selectedCount ? "selection-count is-active" : "selection-count"}>
          {selectedCount} selected
        </span>
        {secondaryAction && secondaryLabel ? (
          <button
            className="secondary-button"
            disabled={selectedCount === 0}
            onClick={handleSecondary}
            type="button"
          >
            {selectedCount ? `${secondaryLabel} (${selectedCount})` : secondaryLabel}
          </button>
        ) : null}
        <button
          className="primary-button"
          disabled={selectedCount === 0}
          onClick={handlePrimary}
          type="button"
        >
          {selectedCount ? `${idleLabel} (${selectedCount})` : idleLabel}
        </button>
      </div>

      {pending ? (
        <ConfirmModal
          actionLabel={actionLabel}
          count={selectedCount}
          isDestructive={pending.isSecondary}
          onCancel={() => setPending(null)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
