// ===== Authentication Guard Utility =====
// This module provides authentication checks for admin pages

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export function checkAuthentication() {
    const userLogin = localStorage.getItem("userLogin");
    return !!userLogin;
}

/**
 * Check if user has specific role
 * @param {string} requiredRole - The role required (e.g., "administrador")
 * @returns {boolean} True if user has role, false otherwise
 */
export function checkRole(requiredRole) {
    const userLogin = localStorage.getItem("userLogin");
    if (!userLogin) return false;
    
    try {
        const user = JSON.parse(userLogin);
        return user.rol === requiredRole;
    } catch (e) {
        console.error("Error parsing user data:", e);
        return false;
    }
}

/**
 * Get current user data
 * @returns {object|null} User object or null if not authenticated
 */
export function getCurrentUser() {
    const userLogin = localStorage.getItem("userLogin");
    if (!userLogin) return null;
    
    try {
        return JSON.parse(userLogin);
    } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
    }
}

/**
 * Redirect to login page if not authenticated
 * @param {string} redirectUrl - URL to redirect to after login (optional)
 */
export function requireAuthentication(redirectUrl = null) {
    if (!checkAuthentication()) {
        alert("Acceso denegado. Por favor inicia sesión.");
        if (redirectUrl) {
            localStorage.setItem("redirectAfterLogin", redirectUrl);
        }
        window.location.href = "login.html";
        return false;
    }
    return true;
}

/**
 * Require specific role, redirect if not authorized
 * @param {string} requiredRole - Required role
 * @param {string} unauthorizedUrl - URL to redirect to if unauthorized (optional)
 */
export function requireRole(requiredRole, unauthorizedUrl = "index.html") {
    if (!requireAuthentication()) return false;
    
    if (!checkRole(requiredRole)) {
        alert(`Acceso denegado. Se requiere rol: ${requiredRole}`);
        window.location.href = unauthorizedUrl;
        return false;
    }
    return true;
}

/**
 * Logout user and redirect to login
 */
export function logout() {
    localStorage.removeItem("userLogin");
    localStorage.removeItem("redirectAfterLogin");
    window.location.href = "login.html";
}

/**
 * Initialize authentication guard for the page
 * @param {object} options - Configuration options
 * @param {string} options.requiredRole - Required role (optional)
 * @param {boolean} options.requireAuth - Require authentication (default: true)
 */
export function initAuthGuard(options = {}) {
    const { requiredRole, requireAuth = true } = options;
    
    // Check authentication if required
    if (requireAuth && !requireAuthentication()) {
        return false;
    }
    
    // Check role if specified
    if (requiredRole && !requireRole(requiredRole)) {
        return false;
    }
    
    // Set up logout buttons if they exist
    const logoutButtons = document.querySelectorAll('#btnLogout, .btn-logout, [data-action="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                logout();
            }
        });
    });
    
    // Display user info if elements exist
    const userNameElements = document.querySelectorAll('#nombre-usuario, .user-name');
    const user = getCurrentUser();
    if (user && userNameElements.length > 0) {
        const displayName = user.usuario || user.nombre_usuario || user.nombre || "Usuario";
        userNameElements.forEach(el => {
            el.textContent = displayName;
        });
    }
    
    return true;
}

// Export default for convenience
export default {
    checkAuthentication,
    checkRole,
    getCurrentUser,
    requireAuthentication,
    requireRole,
    logout,
    initAuthGuard
};
