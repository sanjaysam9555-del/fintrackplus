export const isLandingDomain = () => {
  const host = window.location.hostname;
  return host === 'fintrackplus.com' || host === 'www.fintrackplus.com';
};

/**
 * Prefix a path with /application when running on the production domain.
 * On preview/dev domains the path is returned as-is.
 */
export const appPath = (path = '/') => {
  if (isLandingDomain()) {
    // Ensure no double slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/application${cleanPath}`;
  }
  return path;
};

export const getAppUrl = (path = '/auth') => {
  return appPath(path);
};
