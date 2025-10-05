// Splash Screen Manager
class SplashManager {
    constructor() {
        this.splashScreen = document.getElementById('splash-screen');
        this.appContainer = document.getElementById('app-container');
    }

    showSplashScreen() {
        // Check if splash has already been shown
        const splashShown = localStorage.getItem('asteroid-simulator-splash-shown');
        
        if (splashShown === 'true') {
            // Skip splash screen - hide immediately
            this.hideSplashScreen();
        } else {
            // Show splash screen for 2 seconds, then mark as shown
            setTimeout(() => {
                // Fade out splash screen
                if (this.splashScreen) {
                    this.splashScreen.style.opacity = '0';
                    this.splashScreen.style.transition = 'opacity 0.3s ease-out';
                    
                    setTimeout(() => {
                        this.hideSplashScreen();
                        localStorage.setItem('asteroid-simulator-splash-shown', 'true');
                    }, 300); // Wait for fade transition
                }
            }, 2000);
        }
    }

    hideSplashScreen() {
        if (this.splashScreen) {
            this.splashScreen.style.display = 'none';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'flex';
        }
    }

    resetSplashScreen() {
        localStorage.removeItem('asteroid-simulator-splash-shown');
        // Force show splash screen again
        this.showSplashScreen();
    }

    // Force hide splash screen immediately (for debugging)
    forceHideSplashScreen() {
        if (this.splashScreen) {
            this.splashScreen.style.display = 'none';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'flex';
        }
        localStorage.setItem('asteroid-simulator-splash-shown', 'true');
    }
}
