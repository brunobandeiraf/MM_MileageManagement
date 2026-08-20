const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/**
 * Parses the error response body and throws an Error with the message from the body.
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let message = `HTTP error ${response.status}`;
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') {
      message = body.error;
    } else if (body && typeof body.message === 'string') {
      message = body.message;
    }
  } catch {
    // If the body is not valid JSON, keep the generic HTTP error message
  }
  throw new Error(message);
}

/**
 * Performs a GET request to the given API path.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

/**
 * Performs a POST request to the given API path with an optional body.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    return handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

/**
 * Performs a PUT request to the given API path with an optional body.
 */
export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    return handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

/**
 * Performs a DELETE request to the given API path.
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    return handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}
