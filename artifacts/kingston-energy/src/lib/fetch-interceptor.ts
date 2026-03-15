/**
 * Intercepts global fetch to attach the Authorization token to API requests.
 * This ensures the generated orval hooks automatically send credentials
 * without modifying the generated code.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [resource, config] = args;
    
    // Check if the request is going to our API
    if (typeof resource === 'string' && resource.startsWith('/api')) {
      const token = localStorage.getItem('ke_auth_token');
      
      if (token) {
        const newConfig = { ...config } || {};
        newConfig.headers = {
          ...newConfig.headers,
          'Authorization': `Bearer ${token}`
        };
        return originalFetch(resource, newConfig);
      }
    }
    
    return originalFetch(...args);
  };
}
