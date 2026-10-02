/**
 * U-Link HTTP Client Utilities
 * Provides better error handling and HTTP request management
 */

const HttpClient = {
    /**
     * Make an authenticated HTTP request
     */
    async request(url, options = {}) {
        try {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Include cookies for session
            };

            const finalOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            };

            const response = await fetch(url, finalOptions);

            // Handle network errors
            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    status: 'error',
                    message: `HTTP ${response.status}: ${response.statusText}`
                }));
                throw new Error(error.message || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`HTTP Request Error [${url}]:`, error);
            throw error;
        }
    },

    /**
     * POST request with error handling
     */
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * GET request with error handling
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }
};

/**
 * UI Helper - Show error messages to user
 */
const UIHelper = {
    /**
     * Show error toast notification
     */
    showError(message, duration = 5000) {
        if (typeof showToast === 'function') {
            showToast(message, 'error', duration);
        } else {
            console.error('UI Error:', message);
        }
    },

    /**
     * Show success toast notification
     */
    showSuccess(message, duration = 3000) {
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            console.log('Success:', message);
        }
    },

    /**
     * Show loading state
     */
    setLoading(element, isLoading = true) {
        if (element) {
            if (isLoading) {
                element.classList.add('opacity-50', 'pointer-events-none');
                element.disabled = true;
            } else {
                element.classList.remove('opacity-50', 'pointer-events-none');
                element.disabled = false;
            }
        }
    }
};

/**
 * Data Validator - Validate user inputs
 */
const Validator = {
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Validate password strength
     */
    isStrongPassword(password) {
        return password && password.length >= 8;
    },

    /**
     * Validate non-empty string
     */
    isNonEmpty(str) {
        return str && typeof str === 'string' && str.trim().length > 0;
    },

    /**
     * Validate user input for registration
     */
    validateRegistration(data) {
        const errors = [];

        if (!this.isNonEmpty(data.name)) {
            errors.push('Full name is required');
        }

        if (!this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }

        if (!this.isStrongPassword(data.password)) {
            errors.push('Password must be at least 8 characters');
        }

        if (!this.isNonEmpty(data.department)) {
            errors.push('Department is required');
        }

        return errors;
    },

    /**
     * Validate login input
     */
    validateLogin(email, password) {
        const errors = [];

        if (!this.isNonEmpty(email)) {
            errors.push('Email or ID is required');
        }

        if (!this.isNonEmpty(password)) {
            errors.push('Password is required');
        }

        return errors;
    }
};

/**
 * HTML escaping helper.
 *
 * Post bodies, bios, names and community names are stored and returned as plain
 * text, and the SPA renders them with innerHTML. Anything interpolated into a
 * template literal therefore has to be escaped here or a user can inject markup
 * into their own profile.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Export for use
window.HttpClient = HttpClient;
window.UIHelper = UIHelper;
window.Validator = Validator;
window.escapeHtml = escapeHtml;
