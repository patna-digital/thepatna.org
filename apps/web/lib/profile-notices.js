export function getProfileNoticeMessage(notice) {
  if (notice === "invalid-selection") {
    return "Please choose valid PATNA profile options and supported file types.";
  }

  if (notice === "save-error") {
    return "Profile progress could not be saved. Please retry.";
  }

  if (notice === "saved") {
    return "Progress saved.";
  }

  if (notice === "completed") {
    return "Your core PATNA profile is complete.";
  }

  if (notice === "headshot-updated") {
    return "Profile photo updated.";
  }

  if (notice === "headshot-missing-file") {
    return "Choose an image before updating your profile photo.";
  }

  if (notice === "headshot-file-too-large") {
    return "Profile photo is too large. Use a JPG, PNG, or WebP image up to 5MB.";
  }

  if (notice === "headshot-error") {
    return "Profile photo could not be updated. Please retry.";
  }

  return "";
}

export function getProfileNoticeTone(notice) {
  return ["saved", "completed", "headshot-updated"].includes(notice) ? "success" : "error";
}
