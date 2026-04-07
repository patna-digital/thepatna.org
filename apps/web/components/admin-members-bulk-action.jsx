"use client";

import { useEffect, useState } from "react";

function countSelected(checkboxName) {
  return document.querySelectorAll(`input[name="${checkboxName}"]:checked`).length;
}

export function AdminMembersBulkAction({
  checkboxName = "profile_ids",
  idleLabel = "Send to selected",
  secondaryAction = null,
  secondaryLabel = "",
}) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    function updateSelectedCount() {
      setSelectedCount(countSelected(checkboxName));
    }

    updateSelectedCount();

    const checkboxes = Array.from(document.querySelectorAll(`input[name="${checkboxName}"]`));
    checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateSelectedCount));

    return () => {
      checkboxes.forEach((checkbox) => checkbox.removeEventListener("change", updateSelectedCount));
    };
  }, [checkboxName]);

  return (
    <div className="bulk-action-summary">
      <span className={selectedCount ? "selection-count is-active" : "selection-count"}>
        {selectedCount} selected
      </span>
      {secondaryAction && secondaryLabel ? (
        <button
          className="secondary-button"
          disabled={selectedCount === 0}
          formAction={secondaryAction}
          type="submit"
        >
          {selectedCount ? `${secondaryLabel} (${selectedCount})` : secondaryLabel}
        </button>
      ) : null}
      <button className="primary-button" disabled={selectedCount === 0} type="submit">
        {selectedCount ? `${idleLabel} (${selectedCount})` : idleLabel}
      </button>
    </div>
  );
}
