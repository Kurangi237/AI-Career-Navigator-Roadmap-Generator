import { UserRole, ViewState } from '@shared/types';

export const roleViewAccess: Record<UserRole, ViewState[]> = {
  admin: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.RESUME,
    ViewState.CHAT,
    ViewState.ROLE_INTEL,
    ViewState.SAVED_ITEMS,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
    ViewState.PORTFOLIO,
    ViewState.ANALYTICS,
  ],
  mentor: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.RESUME,
    ViewState.CHAT,
    ViewState.ROLE_INTEL,
    ViewState.SAVED_ITEMS,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
    ViewState.PORTFOLIO,
  ],
  student: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.RESUME,
    ViewState.CHAT,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
    ViewState.SAVED_ITEMS,
    ViewState.PORTFOLIO,
  ],
};

export const canAccessView = (role: UserRole | string, view: ViewState): boolean => {
  const normalized = String(role || '').toLowerCase() as UserRole;
  const allowed = roleViewAccess[normalized];
  // Fallback-open to avoid blocking users if stored role is stale/malformed.
  if (!allowed) return true;
  return allowed.includes(view);
};

export const getDefaultViewForRole = (): ViewState => ViewState.DASHBOARD;

