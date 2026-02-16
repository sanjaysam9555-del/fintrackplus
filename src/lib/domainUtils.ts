export const isLandingDomain = () => {
  const host = window.location.hostname;
  return host === 'fintrackplus.com' || host === 'www.fintrackplus.com';
};

export const isAppDomain = () => {
  return window.location.hostname === 'app.fintrackplus.com';
};

/**
 * Prefix a path with the app subdomain (on landing domain) or /application (legacy).
 * On preview/dev domains the path is returned as-is.
 */
export const appPath = (path = '/') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isLandingDomain()) {
    return `https://app.fintrackplus.com${cleanPath}`;
  }
  return path;
};

export const isPWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

export const getAppUrl = (path = '/auth') => {
  return appPath(path);
};
