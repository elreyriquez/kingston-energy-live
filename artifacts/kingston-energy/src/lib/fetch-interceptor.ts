/**
 * Intercepts global fetch to attach the Authorization token to API requests.
 * This ensures the generated orval hooks automatically send credentials
 * without modifying the generated code.
 *
 * IMPORTANT: config.headers may be a Headers instance (not a plain object).
 * Using `new Headers(existing)` correctly copies all entries including
 * Content-Type, which plain spreading { ...headersInstance } does NOT do.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [resource, config] = args;

    if (typeof resource === 'string' && resource.startsWith('/api')) {
      const token = localStorage.getItem('ke_auth_token');

      if (token) {
        const headers = new Headers(config?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        const newConfig: RequestInit = { ...(config || {}), headers };
        return originalFetch(resource, newConfig);
      }
    }

    return originalFetch(...args);
  };
}
