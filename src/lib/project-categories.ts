export const projectCategories = [
  { id: "ALL", label: "All Categories" },
  { id: "school", label: "School" },
  { id: "church", label: "Church" },
  { id: "community_group", label: "Community Group" },
  { id: "ngo", label: "NGO" },
  { id: "individual", label: "Individual" },
  { id: "family", label: "Family" },
  { id: "technology", label: "Technology" },
  { id: "education", label: "Education" },
  { id: "health", label: "Health" },
  { id: "agriculture", label: "Agriculture" },
  { id: "energy", label: "Energy" },
  { id: "environment", label: "Environment" },
  { id: "financial_services", label: "Financial Services" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "real_estate", label: "Real Estate" },
  { id: "transport", label: "Transport" },
  { id: "other", label: "Other" },
];
export function normalizeCategory(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "all") return "ALL";
  return normalized === "community" ? "community_group" : normalized;
}
export function categoryLabel(value?: string | null) {
  const id = normalizeCategory(value);
  return (
    projectCategories.find((category) => category.id === id)?.label ||
    value ||
    "Campaign"
  );
}
export const homeCategories = [
  { label: "School", href: "/explore?type=CHARITY&category=school" },
  { label: "NGO", href: "/explore?type=CHARITY&category=ngo" },
  {
    label: "Community Group",
    href: "/explore?type=CHARITY&category=community_group",
  },
  { label: "Church", href: "/explore?type=CHARITY&category=church" },
  { label: "Individual", href: "/explore?type=CHARITY&category=individual" },
  { label: "Family", href: "/explore?type=CHARITY&category=family" },
];
