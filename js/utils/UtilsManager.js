// Utility Functions Manager
class UtilsManager {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
    }

    // Debounce function calls
    debounce(func, delay, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    // Throttle function calls
    throttle(func, delay, key = 'default') {
        return (...args) => {
            if (this.throttleTimers.has(key)) {
                return;
            }
            
            func.apply(this, args);
            
            const timer = setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
            
            this.throttleTimers.set(key, timer);
        };
    }

    // Format numbers with locale
    formatNumber(number, options = {}) {
        const defaultOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(number);
    }

    // Format large numbers with units
    formatLargeNumber(number) {
        if (number >= 1e12) {
            return `${(number / 1e12).toFixed(2)}T`;
        } else if (number >= 1e9) {
            return `${(number / 1e9).toFixed(2)}B`;
        } else if (number >= 1e6) {
            return `${(number / 1e6).toFixed(2)}M`;
        } else if (number >= 1e3) {
            return `${(number / 1e3).toFixed(2)}K`;
        }
        return this.formatNumber(number);
    }

    // Format scientific notation
    formatScientific(number, precision = 2) {
        return number.toExponential(precision);
    }

    // Convert units
    convertUnits(value, fromUnit, toUnit) {
        const conversions = {
            // Length
            'm_to_km': (m) => m / 1000,
            'km_to_m': (km) => km * 1000,
            'm_to_miles': (m) => m * 0.000621371,
            'km_to_miles': (km) => km * 0.621371,
            
            // Energy
            'j_to_kj': (j) => j / 1000,
            'kj_to_j': (kj) => kj * 1000,
            'j_to_mj': (j) => j / 1e6,
            'mj_to_j': (mj) => mj * 1e6,
            
            // Mass
            'kg_to_ton': (kg) => kg / 1000,
            'ton_to_kg': (ton) => ton * 1000,
            
            // Time
            's_to_min': (s) => s / 60,
            'min_to_s': (min) => min * 60,
            's_to_hour': (s) => s / 3600,
            'hour_to_s': (hour) => hour * 3600
        };

        const key = `${fromUnit}_to_${toUnit}`;
        if (conversions[key]) {
            return conversions[key](value);
        }
        
        return value;
    }

    // Calculate distance between two points
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Generate random ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Deep clone object
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Check if object is empty
    isEmpty(obj) {
        if (obj == null) return true;
        if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    }

    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate coordinates
    isValidCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    // Validate asteroid parameters
    validateAsteroidParameters(params) {
        const errors = [];
        
        if (!params.diameter || params.diameter <= 0 || params.diameter > 10000) {
            errors.push('Diameter must be between 0 and 10,000 meters');
        }
        
        if (!params.velocity || params.velocity <= 0 || params.velocity > 100) {
            errors.push('Velocity must be between 0 and 100 km/s');
        }
        
        if (!params.impactAngle || params.impactAngle < 0 || params.impactAngle > 90) {
            errors.push('Impact angle must be between 0 and 90 degrees');
        }
        
        if (!params.composition || !['rocky', 'iron', 'carbonaceous'].includes(params.composition)) {
            errors.push('Composition must be rocky, iron, or carbonaceous');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Color utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Animation utilities
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    easeOutCubic(t) {
        return (--t) * t * t + 1;
    }

    // Storage utilities
    setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    // URL utilities
    getUrlParams() {
        const params = {};
        const urlSearchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlSearchParams) {
            params[key] = value;
        }
        return params;
    }

    setUrlParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        window.history.replaceState({}, '', url);
    }

    // Performance utilities
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return result;
    }

    async measureAsyncPerformance(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        return result;
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error${context ? ` in ${context}` : ''}:`, error);
        
        // You could send error to logging service here
        // this.logError(error, context);
        
        return {
            message: error.message || 'An unknown error occurred',
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    // Cleanup
    dispose() {
        // Clear all timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.throttleTimers.clear();
    }
}
