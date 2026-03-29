const COHORT_FORM_CONFIG = {
  academic: {
    title: "Academic cohort profile",
    subtitle:
      "Capture research focus, evidence areas, publications, and collaboration interests for PATNA's academic community.",
    focusLabel: "Current research interest",
    focusPlaceholder: "Describe your current research agenda or evidence focus.",
    notableWorkLabel: "Relevant publications or projects",
    notableWorkPlaceholder: "List notable publications, projects, or evidence outputs.",
  },
  policy: {
    title: "Policy cohort profile",
    subtitle:
      "Capture policy focus, negotiation interests, briefs, and strategic areas of work for PATNA's policy community.",
    focusLabel: "Current policy interest",
    focusPlaceholder: "Describe your policy, negotiation, or governance focus.",
    notableWorkLabel: "Relevant publications, briefs, or projects",
    notableWorkPlaceholder: "List notable briefs, policy contributions, or major projects.",
  },
  industry: {
    title: "Industry cohort profile",
    subtitle:
      "Capture operational experience, implementation interests, and major projects for PATNA's industry cohort.",
    focusLabel: "Current implementation interest",
    focusPlaceholder: "Describe your implementation or sector focus.",
    notableWorkLabel: "Relevant projects, deployments, or initiatives",
    notableWorkPlaceholder: "List notable projects, pilots, or operational initiatives.",
  },
  "civil-society": {
    title: "Civil society cohort profile",
    subtitle:
      "Capture advocacy priorities, community-facing focus areas, and major programmes for PATNA's civil society cohort.",
    focusLabel: "Current advocacy interest",
    focusPlaceholder: "Describe your advocacy, justice, or public-interest focus.",
    notableWorkLabel: "Relevant campaigns, programmes, or projects",
    notableWorkPlaceholder: "List notable campaigns, programmes, or initiatives.",
  },
};

const defaultConfig = {
  title: "PATNA cohort profile",
  subtitle:
    "Complete your core PATNA profile using the shared cohort form structure.",
  focusLabel: "Current focus area",
  focusPlaceholder: "Describe your current focus area.",
  notableWorkLabel: "Relevant publications or projects",
  notableWorkPlaceholder: "List notable publications, projects, or outputs.",
};

export function getCohortOnboardingConfig(slug) {
  return COHORT_FORM_CONFIG[slug] || defaultConfig;
}
