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
  ],
  mentor: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.RESUME,
    ViewState.CHAT,
    ViewState.ROLE_INTEL,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
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
  ],
};

export const canAccessView = (role: UserRole, view: ViewState): boolean => {
  return roleViewAccess[role]?.includes(view) ?? false;
};

export const getDefaultViewForRole = (): ViewState => ViewState.DASHBOARD;
