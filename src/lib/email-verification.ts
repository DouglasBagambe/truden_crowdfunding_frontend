export function buildVerifyEmailUrl(params: {
  email?: string;
  next?: string;
}): string {
  const query = new URLSearchParams();

  if (params.email) {
    query.set('email', params.email);
  }
  if (params.next) {
    query.set('next', params.next);
  }

  const suffix = query.toString();
  return suffix ? `/verify-email?${suffix}` : '/verify-email';
}

export function getCurrentLocationPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const current = `${window.location.pathname}${window.location.search}`;
  return current || '/';
}
