// API helpers for authentication
export async function validateUserAPI(email: string) {
  const response = await fetch('/api/auth/validate-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (response.status === 429) {
    const { parseJsonSafe } = await import('@/utils/parseResponse');
    const errorData = await parseJsonSafe(response).catch(() => ({}));
    throw new Error(`Rate limit exceeded. ${errorData.error || ''}`);
  }

  if (!response.ok) {
    throw new Error('Failed to validate user');
  }

  const { parseJsonSafe } = await import('@/utils/parseResponse');
  return parseJsonSafe(response);
}

export async function validatePasswordAPI(data: {
  digest: string;
  identifier: string;
  password: string;
  cookies?: string;
}) {
  const response = await fetch('/api/auth/validate-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Ensure cookies are included
    body: JSON.stringify(data),
  });

  if (response.status === 429) {
    const { parseJsonSafe } = await import('@/utils/parseResponse');
    const errorData = await parseJsonSafe(response).catch(() => ({}));
    throw new Error(`Rate limit exceeded. ${errorData.error || ''}`);
  }

  if (!response.ok) {
    throw new Error('Failed to validate password');
  }

  const { parseJsonSafe } = await import('@/utils/parseResponse');
  return parseJsonSafe(response);
}

export async function terminateSessionsAPI() {
  const response = await fetch('/api/auth/terminate-sessions', {
    method: 'POST',
    credentials: 'include',
  });

  const { parseJsonSafe } = await import('@/utils/parseResponse');
  const payload = await parseJsonSafe(response).catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to terminate sessions');
  }

  return payload;
}
