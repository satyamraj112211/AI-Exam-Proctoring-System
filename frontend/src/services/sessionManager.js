import { adminAuthAPI } from './api/adminAuthAPI';
import { teacherAuthAPI, studentAuthAPI } from './api/authAPI';

/**
 * Centralised session helper for the frontend.
 *
 * There are two layers:
 * - long-lived auth tokens in localStorage (what you already had)
 * - a short-lived "browser session" flag in sessionStorage
 *
 * When Chrome (this profile) is fully closed, sessionStorage is cleared.
 * On the very first load in a new browser session we:
 *   - detect that the flag is missing
 *   - clear any leftover tokens from localStorage
 *   - set the flag for the new session
 *
 * This ensures that "remembered" tokens never silently auto-login you
 * after a full browser close; a new session always starts from the homepage.
 */

const SESSION_FLAG_KEY = 'virtualxa_session_active';

const safeSessionStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const resetAuthOnNewBrowserSession = () => {
  const ss = safeSessionStorage();
  if (!ss) return;

  const hasFlag = ss.getItem(SESSION_FLAG_KEY);

  // If there is no flag, this is the first load in a new browser session.
  if (!hasFlag) {
    // Clear any stale tokens from a previous session.
    try {
      adminAuthAPI.logout();
    } catch {
      // ignore
    }
    try {
      teacherAuthAPI.logout();
    } catch {
      // ignore
    }
    try {
      studentAuthAPI.logout();
    } catch {
      // ignore
    }
  }

  // Mark this browser session as active so subsequent navigations / tabs
  // in the same session do not clear tokens again.
  ss.setItem(SESSION_FLAG_KEY, '1');
};

/**
 * Read the currently logged in user (if any) from the existing auth APIs
 * after browser-session checks have been applied.
 */
export const getCurrentSession = () => {
  if (adminAuthAPI.isAuthenticated()) {
    const admin = adminAuthAPI.getCurrentAdmin();
    return {
      role: 'admin',
      email: admin?.email || null,
      dashboardPath: '/admin/dashboard',
    };
  }

  if (teacherAuthAPI.isAuthenticated()) {
    const teacher = teacherAuthAPI.getCurrentTeacher?.();
    return {
      role: 'teacher',
      email: teacher?.email || null,
      dashboardPath: '/teacher/dashboard',
    };
  }

  if (studentAuthAPI.isAuthenticated()) {
    const student = studentAuthAPI.getCurrentStudent?.();
    return {
      role: 'student',
      email: student?.email || null,
      dashboardPath: '/student/dashboard',
    };
  }

  return null;
};

export const isAnyUserAuthenticated = () => !!getCurrentSession();


