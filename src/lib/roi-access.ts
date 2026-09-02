type MaybeProject =
  | {
      projectType?: string;
      type?: string;
      [key: string]: unknown;
    }
  | null
  | undefined;

function normalize(value?: string | null) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function canAccessROI(user?: unknown) {
  void user;
  return process.env.NEXT_PUBLIC_ROI_ENABLED === "true";
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
  if (hasRoiAccess) return projects;
  return projects.filter((project) => !isROIProject(project));
}
