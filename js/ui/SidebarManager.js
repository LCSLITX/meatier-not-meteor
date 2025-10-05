// Sidebar Management - Updated
class SidebarManager {
    constructor() {
        this.sidebarOpen = false;
        this.sidebar = document.getElementById('sidebar');
        this.toggleButton = document.getElementById('sidebar-toggle');
        this.appContainer = document.getElementById('app-container');
        this.mainViewport = document.getElementById('main-viewport');
        
        // Debug: Check if elements exist
        if (!this.sidebar) {
            console.error('Sidebar element not found');
        }
        if (!this.toggleButton) {
            console.error('Sidebar toggle button not found');
        }
        if (!this.appContainer) {
            console.error('App container not found');
        }
    }

    initializeSidebarState() {
        // Check if sidebar should be open on page load
        const savedState = localStorage.getItem('asteroid-simulator-sidebar-open');
        if (savedState === 'true') {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    setupSidebarToggle() {
        
        if (this.toggleButton) {
            
            // Remove any existing listeners
            this.toggleButton.onclick = null;
            
            // Add new click listener
            this.toggleButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            };
        } else {
            console.error('Toggle button not found!');
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (event) => {
            if (this.sidebarOpen && 
                this.sidebar && 
                this.toggleButton &&
                !this.sidebar.contains(event.target) && 
                !this.toggleButton.contains(event.target)) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        if (this.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebarOpen = true;
        
        if (this.sidebar) {
            this.sidebar.classList.add('open');
        } else {
            console.error('Sidebar element not found');
        }
        
        if (this.appContainer) {
            this.appContainer.classList.add('sidebar-open');
        } else {
            console.error('App container not found');
        }
        
        if (this.toggleButton) {
            this.toggleButton.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            console.error('Toggle button not found');
        }

        // Save state
        localStorage.setItem('asteroid-simulator-sidebar-open', 'true');
    }

    openSidebarAndFocusSimulation() {
        this.openSidebar();
        
        // Focus on simulation section
        setTimeout(() => {
            const simulationSection = document.getElementById('simulation-section');
            if (simulationSection) {
                simulationSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
                simulationSection.focus();
            }
        }, 100);
    }

    closeSidebar() {
        this.sidebarOpen = false;
        
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
        }
        
        if (this.appContainer) {
            this.appContainer.classList.remove('sidebar-open');
        }
        
        if (this.toggleButton) {
            this.toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        }

        // Save state
        localStorage.setItem('asteroid-simulator-sidebar-open', 'false');
    }

    debugSidebar() {
        // Try to open sidebar
        this.openSidebar();
    }
}
