"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SettingsSelect({ action, currentValue, name, options }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const router = useRouter();

  const currentOption = options.find((opt) => opt.value === currentValue);
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  async function handleSave() {
    setError(null);

    const formData = new FormData();
    formData.set(name, selectedValue);

    startTransition(async () => {
      try {
        const result = await action(formData);

        if (result.ok) {
          setIsEditing(false);
          router.refresh();
        } else {
          setError(result.error || "Failed to save");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    });
  }

  function handleCancel() {
    setSelectedValue(currentValue);
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="settings-select-display">
        <button
          className="settings-select-button"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          <span className="settings-select-value">
            {currentOption?.label || currentValue}
          </span>
          {currentOption?.description && (
            <span className="settings-select-description">
              {currentOption.description}
            </span>
          )}
          <span className="settings-select-edit">Edit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="settings-select-edit-mode">
      <div className="settings-select-wrapper">
        <select
          className="settings-select-input"
          disabled={isPending}
          name={name}
          onChange={(e) => setSelectedValue(e.target.value)}
          value={selectedValue}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="settings-select-arrow">▼</span>
      </div>

      {selectedOption?.description && (
        <p className="settings-select-description">{selectedOption.description}</p>
      )}

      {selectedOption?.details && selectedOption.details.length > 0 && (
        <div className="settings-visibility-details">
          <span className="settings-visibility-details-label">What&apos;s visible:</span>
          <ul className="settings-visibility-list">
            {selectedOption.details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="settings-select-error">{error}</p>
      )}

      <div className="settings-select-actions">
        <button
          className="primary-button settings-select-save"
          disabled={isPending || selectedValue === currentValue}
          onClick={handleSave}
          type="button"
        >
          {isPending ? (
            <>
              <span className="settings-spinner" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
        <button
          className="secondary-button settings-select-cancel"
          disabled={isPending}
          onClick={handleCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
