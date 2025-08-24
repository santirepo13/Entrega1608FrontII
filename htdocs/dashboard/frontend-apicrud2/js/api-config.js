// ===== Centralized API Configuration =====
// This module provides consistent API endpoints and utilities

/**
 * API Configuration
 */
export const API_CONFIG = {
    // Base URLs to try (in order of preference)
    BASE_URLS: [
        // Manual override if set
        ...(typeof window !== "undefined" && window.__API_BASE__ ? [window.__API_BASE__] : []),
        
        // ✅ CORRECT: Backend API location
        `${location.origin}/dashboard/backend-apiCrud`,
        
        // Fallback URLs
        "http://localhost/dashboard/backend-apiCrud",
        "http://127.0.0.1/dashboard/backend-apiCrud",
        
        // Legacy fallbacks (in case you need them)
        `${location.origin}/backend-apiCrud`,
        "http://localhost/backend-apiCrud",
        "http://127.0.0.1/backend-apiCrud"
    ],
    
    // Timeout for API requests (in milliseconds)
    TIMEOUT: 10000,
    
    // Default headers
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/**
 * Generate all possible endpoints for a resource
 * @param {string} resource - The resource name (e.g., 'productos', 'clientes')
 * @returns {string[]} Array of possible endpoint URLs
 */
export function getEndpoints(resource) {
    return API_CONFIG.BASE_URLS.flatMap(base => [
        `${base}/${resource}`,
        `${base}/index.php?url=${resource}`
    ]);
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {object} params - Query parameters
 * @returns {string} Complete URL with parameters
 */
export function buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

/**
 * Make API request with fallback support
 * @param {string} resource - Resource name
 * @param {object} options - Fetch options
 * @param {object} params - Query parameters (for GET requests)
 * @returns {Promise<Response>} Fetch response
 */
export async function apiRequest(resource, options = {}, params = {}) {
    const endpoints = getEndpoints(resource);
    let lastError;
    
    // Add default headers
    const headers = {
        ...API_CONFIG.HEADERS,
        ...options.headers
    };
    
    for (const endpoint of endpoints) {
        try {
            // Build URL with parameters for GET requests
            const url = Object.keys(params).length > 0 && options.method === 'GET' 
                ? buildUrl(endpoint, params)
                : endpoint;
                
            // Make the request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // If successful, return response
            if (response.ok) {
                return response;
            }
            
            // If not successful but got a response, try method override for PUT/DELETE
            if (!response.ok && options.method && ['PUT', 'DELETE', 'PATCH'].includes(options.method)) {
                try {
                    const overrideResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'X-HTTP-Method-Override': options.method
                        },
                        body: options.body,
                        signal: controller.signal
                    });
                    
                    if (overrideResponse.ok) {
                        return overrideResponse;
                    }
                } catch (overrideError) {
                    // Continue to next endpoint
                }
            }
            
            lastError = `${response.status} ${response.statusText}`;
            
        } catch (error) {
            lastError = error.message || 'Network error';
            continue;
        }
    }
    
    throw new Error(`API request failed for ${resource}: ${lastError}`);
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
    /**
     * GET request
     * @param {string} resource - Resource name
     * @param {object} params - Query parameters
     * @returns {Promise<any>} Parsed JSON response
     */
    async get(resource, params = {}) {
        // NUCLEAR cache-busting with multiple strategies
        const paramsWithCacheBust = {
            ...params,
            _t: Date.now(),
            _r: Math.random().toString(36).substr(2, 9),
            _v: '2.0', // Version bump
            _cb: Math.floor(Math.random() * 999999) // Additional random number
        };
        
        const response = await apiRequest(resource, { 
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Cache-Buster': Date.now().toString()
            }
        }, paramsWithCacheBust);
        return response.json();
    },
    
    /**
     * POST request
     * @param {string} resource - Resource name
     * @param {object} data - Request body data
     * @returns {Promise<any>} Parsed JSON response
     */
    async post(resource, data) {
        const response = await apiRequest(resource, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    /**
     * PUT request
     * @param {string} resource - Resource name
     * @param {object} data - Request body data
     * @param {string|number} id - Resource ID (optional)
     * @returns {Promise<any>} Parsed JSON response
     */
    async put(resource, data, id = null) {
        const params = id ? { id } : {};
        const response = await apiRequest(resource, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, params);
        return response.json();
    },
    
    /**
     * DELETE request
     * @param {string} resource - Resource name
     * @param {string|number|object} idOrData - Resource ID or data object
     * @returns {Promise<any>} Parsed JSON response
     */
    async delete(resource, idOrData) {
        const isObject = typeof idOrData === 'object';
        const params = isObject ? {} : { id: idOrData };
        const body = isObject ? JSON.stringify(idOrData) : JSON.stringify({ id: idOrData });
        
        const response = await apiRequest(resource, {
            method: 'DELETE',
            body: body
        }, params);
        return response.json();
    }
};

/**
 * Resource-specific API helpers
 */
export const resources = {
    productos: {
        getAll: () => api.get('productos'),
        getById: (id) => api.get('productos', { id }),
        create: (data) => api.post('productos', data),
        update: (data) => api.put('productos', data),
        delete: (id) => api.delete('productos', id)
    },
    
    clientes: {
        getAll: () => api.get('clientes'),
        getById: (id) => api.get('clientes', { id }),
        create: (data) => api.post('clientes', data),
        update: (data) => api.put('clientes', data),
        delete: (id) => api.delete('clientes', id)
    },
    
    usuarios: {
        getAll: () => api.get('usuarios'),
        getById: (id) => api.get('usuarios', { id }),
        create: (data) => api.post('usuarios', data),
        update: (data) => api.put('usuarios', data),
        delete: (id) => api.delete('usuarios', id)
    },
    
    pedidos: {
        getAll: () => api.get('pedidos'),
        getById: (id) => api.get('pedidos', { id }),
        create: (data) => api.post('pedidos', data),
        update: (data) => api.put('pedidos', data),
        delete: (id) => api.delete('pedidos', id)
    },
    
    auth: {
        login: (usuario, contrasena) => api.post('login', { usuario, contrasena })
    }
};

// Export everything as default too
export default {
    API_CONFIG,
    getEndpoints,
    buildUrl,
    apiRequest,
    api,
    resources
};
