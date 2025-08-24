/**
 * Payment Methods Configuration
 * Centralized configuration for payment methods used across the system
 * This ensures consistency between web frontend and intranet
 */

const PAYMENT_METHODS = {
    // Core payment methods with standardized values
    CONTRAENTREGA: 'Contraentrega',
    PSE: 'PSE',
    TRANSFERENCIA: 'Transferencia',
    TARJETA: 'Tarjeta',
    
    // Display configurations for each method
    display: {
        'Contraentrega': {
            label: 'Contraentrega',
            description: 'Pago en efectivo al recibir',
            badgeClass: 'badge-warning',
            icon: 'fas fa-money-bill-wave'
        },
        'PSE': {
            label: 'PSE',
            description: 'Pago Seguro en Línea',
            badgeClass: 'badge-primary',
            icon: 'fas fa-university'
        },
        'Transferencia': {
            label: 'Transferencia Bancaria',
            description: 'Transferencia directa',
            badgeClass: 'badge-info',
            icon: 'fas fa-exchange-alt'
        },
        'Tarjeta': {
            label: 'Tarjeta de Crédito/Débito',
            description: 'Pago con tarjeta',
            badgeClass: 'badge-success',
            icon: 'fas fa-credit-card'
        }
    },
    
    // Get all payment methods as array
    getAll: function() {
        return [
            this.CONTRAENTREGA,
            this.PSE,
            this.TRANSFERENCIA,
            this.TARJETA
        ];
    },
    
    // Get display info for a payment method
    getDisplayInfo: function(method) {
        return this.display[method] || {
            label: method,
            description: 'Método de pago',
            badgeClass: 'badge-secondary',
            icon: 'fas fa-question-circle'
        };
    },
    
    // Validate if a payment method is valid
    isValid: function(method) {
        return this.getAll().includes(method);
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PAYMENT_METHODS;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PAYMENT_METHODS = PAYMENT_METHODS;
}
