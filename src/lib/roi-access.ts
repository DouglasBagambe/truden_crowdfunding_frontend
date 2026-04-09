type MaybeUser = {
  id?: string;
  _id?: string;
} | null | undefined;

type MaybeProject = {
  projectType?: string;
  type?: string;
  [key: string]: unknown;
} | null | undefined;

function normalize(value?: string | null) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function isPublicRoiAccessMode() {
  const mode = normalize(process.env.NEXT_PUBLIC_ROI_ACCESS_MODE);
  return mode === 'PUBLIC';
}

export function getAllowedRoiUserIds() {
  return (process.env.NEXT_PUBLIC_ROI_ALLOWED_USER_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getUserId(user: MaybeUser) {
  return user?.id || user?._id || '';
}

export function canAccessROI(user: MaybeUser) {
  const allowedIds = getAllowedRoiUserIds();
  if (isPublicRoiAccessMode() || allowedIds.includes('*')) {
    return true;
  }

  const userId = getUserId(user);
  if (!userId) return false;
  return allowedIds.includes(userId);
}

export function getProjectType(project: MaybeProject) {
  return normalize(project?.projectType || project?.type);
}

export function isROIProject(project: MaybeProject) {
  return getProjectType(project) === 'ROI';
}

export function isCharityProject(project: MaybeProject) {
  return getProjectType(project) === 'CHARITY';
}

export function filterVisibleProjects<T extends MaybeProject>(projects: T[], hasRoiAccess: boolean) {
  if (hasRoiAccess) return projects;
  return projects.filter((project) => !isROIProject(project));
}
