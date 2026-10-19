import { INVESTMENTS_ENABLED } from "./product-features";

type MaybeProject =
  | {
      projectType?: string;
      type?: string;
    }
  | null
  | undefined;

function normalize(value?: string | null) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function canAccessROI(user?: unknown) {
  if (!INVESTMENTS_ENABLED || !user || typeof user !== "object") return false;
  const capabilities = (user as { capabilities?: unknown }).capabilities;
  return Boolean(
    capabilities &&
    typeof capabilities === "object" &&
    (capabilities as { viewRoi?: unknown }).viewRoi === true,
  );
}

export function getProjectType(project: MaybeProject) {
  return normalize(project?.projectType || project?.type);
}

export function isROIProject(project: MaybeProject) {
  return getProjectType(project) === "ROI";
}

export function isCharityProject(project: MaybeProject) {
  return getProjectType(project) === "CHARITY";
}

export function filterVisibleProjects<T extends MaybeProject>(
  projects: T[],
  hasRoiAccess: boolean,
) {
  if (INVESTMENTS_ENABLED && hasRoiAccess) return projects;
  return projects.filter((project) => !isROIProject(project));
}
