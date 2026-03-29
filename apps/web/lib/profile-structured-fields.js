export const STANDARD_LANGUAGE_OPTIONS = ["English", "French", "Arabic", "Portuguese"];

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function normaliseUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function splitLanguages(languages = []) {
  const selected = uniqueStrings(
    (languages || [])
      .map((value) => String(value || "").trim())
      .filter((value) => STANDARD_LANGUAGE_OPTIONS.includes(value)),
  );
  const other = uniqueStrings(
    (languages || [])
      .map((value) => String(value || "").trim())
      .filter((value) => value && !STANDARD_LANGUAGE_OPTIONS.includes(value)),
  );

  return {
    selected,
    other,
    otherText: other.join(", "),
  };
}

export function normaliseLanguages({ otherText = "", selected = [] }) {
  const standardSelections = uniqueStrings(
    (selected || [])
      .map((value) => String(value || "").trim())
      .filter((value) => STANDARD_LANGUAGE_OPTIONS.includes(value)),
  );
  const customSelections = uniqueStrings(
    String(otherText || "")
      .split(",")
      .map((value) => String(value || "").trim())
      .filter((value) => value && !STANDARD_LANGUAGE_OPTIONS.includes(value)),
  );

  return [...standardSelections, ...customSelections];
}

export function normaliseRelevantProjects(projects = []) {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects
    .map((project) => ({
      title: String(project?.title || "").trim(),
      link: normaliseUrl(project?.link || ""),
    }))
    .filter((project) => hasText(project.title) || hasText(project.link));
}
