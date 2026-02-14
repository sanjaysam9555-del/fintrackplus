export const isLandingDomain = () => {
  const host = window.location.hostname;
  return host === 'fintrackplus.com' || host === 'www.fintrackplus.com';
};

export const isAppDomain = () => {
  const host = window.location.hostname;
  return host === 'app.fintrackplus.com';
};

export const getAppUrl = (path = '/auth') => {
  const host = window.location.hostname;
  if (host === 'fintrackplus.com' || host === 'www.fintrackplus.com') {
    return `https://app.fintrackplus.com${path}`;
  }
  return path;
};
