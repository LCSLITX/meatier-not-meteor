// Main Application Class - Asteroid Defense Simulator
class AsteroidDefenseSimulator {
    constructor() {
        // Initialize managers
        this.splashManager = new SplashManager();
        this.sidebarManager = new SidebarManager();
        this.notificationManager = new NotificationManager();
        this.threeJSManager = new ThreeJSManager();
        this.mapManager = new MapManager();
        this.simulationManager = new SimulationManager();
        this.eventManager = new EventManager(this);
        this.utilsManager = new UtilsManager();
        
        // Make managers globally accessible for debugging
        window.splashManager = this.splashManager;
        window.sidebarManager = this.sidebarManager;
        window.notificationManager = this.notificationManager;
        window.threeJSManager = this.threeJSManager;
        window.mapManager = this.mapManager;
        window.simulationManager = this.simulationManager;
        window.eventManager = this.eventManager;
        window.utilsManager = this.utilsManager;
        window.simulator = this;
        
        // Initialize application
        this.init();
    }

    async init() {
        try {
            // Show splash screen
            this.splashManager.showSplashScreen();
            
            // Wait a bit for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Setup Three.js scene
            this.setupThreeJS();
            
            // Initialize sidebar first
            this.sidebarManager.initializeSidebarState();
            this.sidebarManager.setupSidebarToggle();
            
            // Initialize map
            this.initializeLeafletMap();
            
            // Bind all events
            this.eventManager.bindEvents();
            
            // Initialize solar system viewer
            this.initializeSolarSystemViewer();
            
            // Update UI
            this.updateUI();
            
            // Setup global functions
            this.setupGlobalFunctions();
            
        } catch (error) {
            // Show error in console for debugging
            console.error('Initialization error:', error);
            
            // Try to show notification if possible
            if (this.notificationManager) {
                this.notificationManager.showNotification(
                    'Failed to initialize application: ' + error.message,
                    'error'
                );
            }
        }
    }

    setupThreeJS() {
        this.threeJSManager.setupThreeJS();
        this.threeJSManager.createSolarSystem();
    }

    initializeLeafletMap() {
        // Initialize map after a delay to ensure DOM is ready
        setTimeout(() => {
            this.mapManager.initializeLeafletMap();
        }, 500);
    }

    initializeSolarSystemViewer() {
        // Initialize solar system viewer
    }

    setupGlobalFunctions() {
        // Global functions for backward compatibility
        window.debugSidebar = () => this.sidebarManager.debugSidebar();
        window.resetSplashScreen = () => this.splashManager.resetSplashScreen();
        
        // Debug functions
        window.hideSplash = () => {
            if (this.splashManager) {
                this.splashManager.forceHideSplashScreen();
            }
        };
        
        window.showMap = () => {
            if (this.mapManager) {
                this.mapManager.initializeLeafletMap();
            }
        };
        
        window.switchToMap = () => {
            this.eventManager.switchView('2d');
        };
        
        window.refreshMap = () => {
            if (this.mapManager && this.mapManager.map) {
                this.mapManager.map.invalidateSize();
                this.mapManager.map.setView([40.7128, -74.0060], 8);
            }
        };
        
        window.openMenu = () => {
            if (this.sidebarManager) {
                this.sidebarManager.openSidebar();
            }
        };
        
        window.closeMenu = () => {
            if (this.sidebarManager) {
                this.sidebarManager.closeSidebar();
            }
        };
        
        window.toggleMenu = () => {
            if (this.sidebarManager) {
                this.sidebarManager.toggleSidebar();
            }
        };
        
        // Global simulation functions
        window.runSimulation = () => this.eventManager.runSimulation();
        window.resetSimulation = () => this.eventManager.resetSimulation();
        window.switchView = (view) => this.eventManager.switchView(view);
        
        // Global data loading functions
        window.loadNASAData = () => this.eventManager.loadNASAData();
        window.loadSentryData = () => this.eventManager.loadSentryData();
        window.loadCustomData = () => this.eventManager.loadCustomData();
    }

    updateUI() {
        this.simulationManager.updateUI();
        this.simulationManager.setup3DFilters();
        // Sidebar already initialized in init()
    }

    // Main simulation methods
    runSimulation() {
        this.eventManager.runSimulation();
    }

    resetSimulation() {
        this.eventManager.resetSimulation();
    }

    switchView(view) {
        this.eventManager.switchView(view);
    }

    // Data loading methods
    loadNASAData() {
        this.eventManager.loadNASAData();
    }

    loadSentryData() {
        this.eventManager.loadSentryData();
    }

    loadCustomData() {
        this.eventManager.loadCustomData();
    }

    // Utility methods
    showNotification(message, type = 'info') {
        this.notificationManager.showNotification(message, type);
    }

    showLoadingState(message = 'Loading...') {
        return this.notificationManager.showLoadingState(message);
    }

    hideLoadingState() {
        this.notificationManager.hideLoadingState();
    }

    // Cleanup method
    dispose() {
        // Dispose all managers
        this.threeJSManager.dispose();
        this.mapManager.dispose();
        this.eventManager.dispose();
        this.utilsManager.dispose();
        
        // Clear global references
        window.splashManager = null;
        window.sidebarManager = null;
        window.notificationManager = null;
        window.threeJSManager = null;
        window.mapManager = null;
        window.simulationManager = null;
        window.eventManager = null;
        window.utilsManager = null;
        window.simulator = null;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.asteroidSimulator = new AsteroidDefenseSimulator();
    window.asteroidSimulator.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.asteroidSimulator) {
        window.asteroidSimulator.dispose();
    }
});