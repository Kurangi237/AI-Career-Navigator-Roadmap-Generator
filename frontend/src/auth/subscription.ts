import { SubscriptionPlan, ViewState, UserRole } from '@shared/types';

export const planViewAccess: Record<SubscriptionPlan, ViewState[]> = {
  starter: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
  ],
  pro: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
    ViewState.CHAT,
    ViewState.RESUME,
    ViewState.SAVED_ITEMS,
  ],
  business: [
    ViewState.DASHBOARD,
    ViewState.CODING_ARENA,
    ViewState.ROADMAP,
    ViewState.COURSES,
    ViewState.JOB_SEARCH,
    ViewState.PROFILE,
    ViewState.CHAT,
    ViewState.RESUME,
    ViewState.SAVED_ITEMS,
    ViewState.ROLE_INTEL,
  ],
};

export const canAccessByPlan = (plan: SubscriptionPlan, view: ViewState): boolean => {
  return planViewAccess[plan]?.includes(view) ?? false;
};

export const canAccessFeature = (role: UserRole, plan: SubscriptionPlan, view: ViewState): boolean => {
  // Project is fully free for public access.
  return true;
};
