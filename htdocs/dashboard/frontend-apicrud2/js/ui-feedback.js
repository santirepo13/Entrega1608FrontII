// UI Feedback Utility Module
// Provides consistent user feedback across all pages

export class UIFeedback {
    constructor() {
        this.createFeedbackContainer();
    }

    createFeedbackContainer() {
        // Check if container already exists
        if (document.getElementById('ui-feedback-container')) {
            return;
        }

        // Create container for feedback messages
        const container = document.createElement('div');
        container.id = 'ui-feedback-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .feedback-message {
                padding: 15px 20px;
                margin-bottom: 10px;
                border-radius: 5px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-family: 'Nunito', sans-serif;
            }
            
            .feedback-message.success {
                background-color: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }
            
            .feedback-message.error {
                background-color: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
            }
            
            .feedback-message.warning {
                background-color: #fff3cd;
                color: #856404;
                border-left: 4px solid #ffc107;
            }
            
            .feedback-message.info {
                background-color: #d1ecf1;
                color: #0c5460;
                border-left: 4px solid #17a2b8;
            }
            
            .feedback-close {
                cursor: pointer;
                margin-left: 15px;
                font-size: 20px;
                line-height: 1;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .feedback-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
            
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(0,0,0,.1);
                border-radius: 50%;
                border-top-color: #007bff;
                animation: spin 0.8s linear infinite;
                margin-right: 10px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('ui-feedback-container');
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `feedback-message ${type}`;
        
        // Add icon based on type
        let icon = '';
        switch(type) {
            case 'success':
                icon = '✓';
                break;
            case 'error':
                icon = '✕';
                break;
            case 'warning':
                icon = '⚠';
                break;
            case 'info':
                icon = 'ℹ';
                break;
        }
        
        messageEl.innerHTML = `
            <span><strong>${icon}</strong> ${message}</span>
            <span class="feedback-close">&times;</span>
        `;
        
        // Add close functionality
        const closeBtn = messageEl.querySelector('.feedback-close');
        closeBtn.addEventListener('click', () => this.remove(messageEl));
        
        // Add to container
        container.appendChild(messageEl);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(messageEl), duration);
        }
        
        return messageEl;
    }

    remove(messageEl) {
        if (!messageEl) return;
        
        messageEl.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    loading(message = 'Procesando...') {
        const container = document.getElementById('ui-feedback-container');
        
        const loadingEl = document.createElement('div');
        loadingEl.className = 'feedback-message info';
        loadingEl.id = 'loading-indicator';
        loadingEl.innerHTML = `
            <span><span class="loading-spinner"></span> ${message}</span>
        `;
        
        container.appendChild(loadingEl);
        return loadingEl;
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            this.remove(loadingEl);
        }
        
        // Also remove any loading-indicator class elements that might be stuck
        const allLoadingElements = document.querySelectorAll('.feedback-message.info');
        allLoadingElements.forEach(el => {
            if (el.textContent.includes('Cargando productos')) {
                this.remove(el);
            }
        });
    }

    // Clear all messages
    clearAll() {
        const container = document.getElementById('ui-feedback-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Create singleton instance
const uiFeedback = new UIFeedback();

// Export for use in other modules
export default uiFeedback;

// Also make available globally for non-module scripts
window.uiFeedback = uiFeedback;
