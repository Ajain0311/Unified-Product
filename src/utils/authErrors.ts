type AuthenticationErrorShape = {
  message?: unknown;
  statusCode?: unknown;
  isUnauthorized?: unknown;
  response?: { status?: unknown; data?: { message?: unknown } };
};

const AUTHENTICATION_MESSAGE = /\b(authentication required|authentication expired|unauthorized|not authenticated|login required)\b/i;

export function isAuthenticationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as AuthenticationErrorShape;
  const statusCode = Number(candidate.statusCode ?? candidate.response?.status);
  const message = [candidate.message, candidate.response?.data?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');

  return candidate.isUnauthorized === true || statusCode === 401 || AUTHENTICATION_MESSAGE.test(message);
}
