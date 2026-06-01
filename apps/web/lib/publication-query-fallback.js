export function serialisePublicationError(error) {
  if (!error) {
    return null;
  }

  return {
    code: error.code || "",
    details: error.details || "",
    hint: error.hint || "",
    message: error.message || String(error),
  };
}

export function isMissingContentGalleryRelation(error) {
  const formattedError = serialisePublicationError(error);
  const errorText = [
    formattedError?.code,
    formattedError?.details,
    formattedError?.hint,
    formattedError?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!errorText) {
    return false;
  }

  return (
    errorText.includes("content_gallery") &&
    (
      errorText.includes("schema cache") ||
      errorText.includes("relationship") ||
      errorText.includes("does not exist") ||
      errorText.includes("not found")
    )
  );
}
