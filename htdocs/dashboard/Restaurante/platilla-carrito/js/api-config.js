/**
 * API Configuration for Restaurante Module
 * Integrates with backend-apiCrud and frontend-apicrud2
 */

// API Configuration
const API_CONFIG = {
    // Base URL for the backend API
    BASE_URL: window.location.origin + '/dashboard/backend-apiCrud',
    
    // Alternative base URLs to try
    FALLBACK_URLS: [
        'http://localhost/dashboard/backend-apiCrud',
        'http://127.0.0.1/dashboard/backend-apiCrud'
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
 * Make API request with automatic fallback
 */
async function apiRequest(endpoint, options = {}) {
    // Add default headers
    const headers = {
        ...API_CONFIG.HEADERS,
        ...options.headers
    };
    
    // Build full URL
    const urls = [
        `${API_CONFIG.BASE_URL}/index.php?url=${endpoint}`,
        `${API_CONFIG.BASE_URL}/${endpoint}`,
        ...API_CONFIG.FALLBACK_URLS.flatMap(base => [
            `${base}/index.php?url=${endpoint}`,
            `${base}/${endpoint}`
        ])
    ];
    
    let lastError;
    
    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return response;
            }
            
            lastError = `${response.status} ${response.statusText}`;
        } catch (error) {
            lastError = error.message || 'Network error';
            continue;
        }
    }
    
    throw new Error(`API request failed for ${endpoint}: ${lastError}`);
}

/**
 * API Helper Methods
 */
const api = {
    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const urlSuffix = queryString ? `&${queryString}` : '';
        const response = await apiRequest(endpoint + urlSuffix, { 
            method: 'GET' 
        });
        return response.json();
    },
    
    // POST request
    async post(endpoint, data) {
        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    // PUT request
    async put(endpoint, data) {
        const response = await apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    // DELETE request
    async delete(endpoint, data) {
        const response = await apiRequest(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
        return response.json();
    }
};

/**
 * Resource-specific API helpers
 */
const resources = {
    // Products API
    productos: {
        getAll: () => api.get('productos'),
        getById: (id) => api.get('productos', { id }),
        create: (data) => api.post('productos', data),
        update: (data) => api.put('productos', data),
        delete: (id) => api.delete('productos', { id })
    },
    
    // Clients API
    clientes: {
        getAll: () => api.get('clientes'),
        getById: (id) => api.get('clientes', { id }),
        create: (data) => api.post('clientes', data),
        update: (data) => api.put('clientes', data),
        delete: (id) => api.delete('clientes', { id })
    },
    
    // Orders API
    pedidos: {
        getAll: () => api.get('pedidos'),
        getById: (id) => api.get('pedidos', { id }),
        create: (data) => api.post('pedidos', data),
        update: (data) => api.put('pedidos', data),
        delete: (id) => api.delete('pedidos', { id })
    },
    
    // Authentication API
    auth: {
        login: (usuario, contrasena) => api.post('login', { usuario, contrasena })
    }
};

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.api = api;
    window.resources = resources;
    
    console.log('✅ API Configuration loaded successfully');
    console.log('🔗 Base URL:', API_CONFIG.BASE_URL);
    console.log('📦 Resources available:', Object.keys(resources));
}

// Legacy CommonJS support for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, api, resources };
}
