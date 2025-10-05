// API Configuration for Asteroid Defense Simulator
// Static data for now, ready for backend integration

const APIConfig = {
    // Backend API endpoints (ready for future integration)
    backend: {
        baseUrl: 'http://localhost:3000/api', // Replace with your backend URL
        endpoints: {
            simulate: '/simulate',
            asteroids: '/asteroids',
            results: '/results'
        }
    },

    // Mapbox configuration
    mapbox: {
        accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', // Replace with your Mapbox access token
        defaultStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
        fallbackStyle: 'mapbox://styles/mapbox/streets-v12'
    },

    // Static demo data
    demoData: {
        asteroids: [
            {
                id: 'demo-001',
                name: 'Demo Asteroid Alpha',
                diameter: 150,
                velocity: 18.5,
                composition: 'rocky',
                hazardous: true
            },
            {
                id: 'demo-002', 
                name: 'Demo Asteroid Beta',
                diameter: 75,
                velocity: 22.3,
                composition: 'metallic',
                hazardous: false
            },
            {
                id: 'demo-003',
                name: 'Demo Asteroid Gamma', 
                diameter: 200,
                velocity: 15.8,
                composition: 'icy',
                hazardous: true
            }
        ],
        
        simulationResults: {
            impactEnergy: 450000,
            craterSize: 2.8,
            seismicMagnitude: 7.2,
            tsunamiHeight: 12.5,
            estimatedCasualties: 85000
        }
    },

    // API Helper Functions (ready for backend integration)
    helpers: {
        // Generate backend API URL
        generateBackendUrl: function(endpoint, params = {}) {
            const baseUrl = APIConfig.backend.baseUrl + endpoint;
            if (Object.keys(params).length > 0) {
                const urlParams = new URLSearchParams(params);
                return `${baseUrl}?${urlParams.toString()}`;
            }
            return baseUrl;
        },

        // Handle API errors
        handleAPIError: function(error, apiName = 'Backend') {
            console.error(`${apiName} API Error:`, error);
            
            if (error.status === 429) {
                return 'Rate limit exceeded. Please try again later.';
            } else if (error.status === 403) {
                return 'Access forbidden. Check your credentials.';
            } else if (error.status >= 500) {
                return 'Server error. Please try again later.';
            } else {
                return `API request failed: ${error.message}`;
            }
        },

        // Validate API response
        validateResponse: function(response, expectedFields = []) {
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response format');
            }

            expectedFields.forEach(field => {
                if (!response.hasOwnProperty(field)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            });

            return true;
        }
    },

    // API functions (ready for backend integration)
    api: {
        // Simulate asteroid impact
        simulateImpact: async function(simulationData) {
            const url = APIConfig.helpers.generateBackendUrl('/simulate');
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(simulationData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                APIConfig.helpers.validateResponse(result, ['impactEnergy', 'craterSize', 'seismicMagnitude', 'tsunamiHeight', 'estimatedCasualties']);
                
                return result;
            } catch (error) {
                console.warn('Backend not available, using demo data:', error.message);
                // Return demo data if backend is not available
                return APIConfig.demoData.simulationResults;
            }
        },

        // Get asteroid data
        getAsteroids: async function() {
            const url = APIConfig.helpers.generateBackendUrl('/asteroids');
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                APIConfig.helpers.validateResponse(result, ['asteroids']);
                
                return result.asteroids;
            } catch (error) {
                console.warn('Backend not available, using demo data:', error.message);
                // Return demo data if backend is not available
                return APIConfig.demoData.asteroids;
            }
        },

        // Get simulation results
        getResults: async function(simulationId) {
            const url = APIConfig.helpers.generateBackendUrl('/results', { id: simulationId });
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                APIConfig.helpers.validateResponse(result, ['results']);
                
                return result.results;
            } catch (error) {
                console.warn('Backend not available, using demo data:', error.message);
                // Return demo data if backend is not available
                return APIConfig.demoData.simulationResults;
            }
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
} else if (typeof window !== 'undefined') {
    window.APIConfig = APIConfig;
}