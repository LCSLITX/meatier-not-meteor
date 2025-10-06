// Event Management System
class EventManager {
    constructor(simulator) {
        this.simulator = simulator;
        this.eventListeners = new Map();
    }

    bindEvents() {
        // Form inputs
        this.bindFormEvents();
        
        // Buttons
        this.bindButtonEvents();
        
        // 3D filters
        this.bind3DFilterEvents();
        
        // Map events
        this.bindMapEvents();
        
        // Window events
        this.bindWindowEvents();
    }

    bindFormEvents() {
        // Asteroid size
        const asteroidSizeInput = document.getElementById('asteroid-size');
        if (asteroidSizeInput) {
            asteroidSizeInput.addEventListener('input', () => {
                this.simulator.simulationManager.updateAsteroidSize();
                // Update map effects
                if (this.simulator.mapManager) {
                    this.simulator.mapManager.onAsteroidParametersChanged();
                }
            });
        }

        // Asteroid composition
        const compositionSelect = document.getElementById('composition');
        if (compositionSelect) {
            compositionSelect.addEventListener('change', () => {
                this.simulator.simulationManager.updateAsteroidComposition();
                // Update map effects
                if (this.simulator.mapManager) {
                    this.simulator.mapManager.onAsteroidParametersChanged();
                }
            });
        }

        // Impact angle
        const impactAngleInput = document.getElementById('impact-angle');
        if (impactAngleInput) {
            impactAngleInput.addEventListener('input', () => {
                this.simulator.simulationManager.updateImpactAngle();
                // Update map effects
                if (this.simulator.mapManager) {
                    this.simulator.mapManager.onAsteroidParametersChanged();
                }
            });
        }

        // Asteroid velocity
        const velocityInput = document.getElementById('asteroid-velocity');
        if (velocityInput) {
            velocityInput.addEventListener('input', () => {
                this.simulator.simulationManager.updateAsteroidVelocity();
                // Update map effects
                if (this.simulator.mapManager) {
                    this.simulator.mapManager.onAsteroidParametersChanged();
                }
            });
        }

        // Defense strategy buttons (only Kinetic Impactor available)
        const defenseStrategyButtons = document.querySelectorAll('.defense-strategy-btn');
        defenseStrategyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectDefenseStrategy(button.dataset.strategy);
            });
        });

        // Add event listeners for simulation modal
        const closeModalButtons = document.querySelectorAll('#close-simulation-modal, #close-simulation-modal-btn');
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.simulator.mapManager) {
                    this.simulator.mapManager.hideSimulationModal();
                }
            });
        });

        // Close modal when clicking outside
        const modal = document.getElementById('simulation-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (this.simulator.mapManager) {
                        this.simulator.mapManager.hideSimulationModal();
                    }
                }
            });
        }

        // Action time
        const actionTimeInput = document.getElementById('action-time');
        if (actionTimeInput) {
            actionTimeInput.addEventListener('input', () => {
                this.simulator.simulationManager.updateActionTime();
            });
        }

        // Latitude and Longitude
        const latitudeInput = document.getElementById('latitude');
        if (latitudeInput) {
            latitudeInput.addEventListener('input', () => {
                this.updateLatitude();
            });
        }

        const longitudeInput = document.getElementById('longitude');
        if (longitudeInput) {
            longitudeInput.addEventListener('input', () => {
                this.updateLongitude();
            });
        }
    }

    bindButtonEvents() {
        // Launch Impact button
        const launchImpactBtn = document.getElementById('launch-impact');
        if (launchImpactBtn) {
            launchImpactBtn.addEventListener('click', () => {
                this.launchImpact();
            });
        }

        // Launch Defense button (depends on impact simulation)
        const launchDefenseBtn = document.getElementById('launch-defense');
        if (launchDefenseBtn) {
            launchDefenseBtn.addEventListener('click', () => {
                this.launchDefense();
            });
        }

        // Reset simulation button
        const resetSimulationBtn = document.getElementById('reset-simulation');
        if (resetSimulationBtn) {
            resetSimulationBtn.addEventListener('click', () => {
                this.resetImpactSimulation();
            });
        }

        // View impact details button
        const viewImpactDetailsBtn = document.getElementById('view-impact-details');
        if (viewImpactDetailsBtn) {
            viewImpactDetailsBtn.addEventListener('click', () => {
                this.showImpactDetails();
            });
        }

        // Toggle action timing button
        const toggleActionBtn = document.getElementById('toggle-action-timing');
        if (toggleActionBtn) {
            toggleActionBtn.addEventListener('click', () => {
                this.simulator.simulationManager.toggleActionTiming();
            });
        }

        // View toggle buttons
        const view2DBtn = document.querySelector('[data-view="2d"]');
        const view3DBtn = document.querySelector('[data-view="3d"]');
        
        if (view2DBtn) {
            view2DBtn.addEventListener('click', () => {
                this.switchView('2d');
            });
        }
        
        if (view3DBtn) {
            view3DBtn.addEventListener('click', () => {
                this.switchView('3d');
            });
        }

        // Data source buttons
        const nasaBtn = document.getElementById('data-nasa');
        const sentryBtn = document.getElementById('data-sentry');
        const customBtn = document.getElementById('data-custom');
        
        if (nasaBtn) {
            nasaBtn.addEventListener('click', () => {
                this.loadNASAData();
            });
        }
        
        if (sentryBtn) {
            sentryBtn.addEventListener('click', () => {
                this.loadSentryData();
            });
        }
        
        if (customBtn) {
            customBtn.addEventListener('click', () => {
                this.loadCustomData();
            });
        }
    }

    bind3DFilterEvents() {
        // Check if threeJSManager is available
        if (!this.simulator.threeJSManager) {
            console.warn('EventManager: ThreeJSManager not available, skipping 3D filter events');
            return;
        }

        // Planet toggle
        const planetsToggle = document.getElementById('toggle-planets');
        if (planetsToggle) {
            planetsToggle.addEventListener('change', (e) => {
                this.simulator.threeJSManager.togglePlanets(e.target.checked);
            });
        }

        // Asteroid toggle
        const asteroidsToggle = document.getElementById('toggle-asteroids');
        if (asteroidsToggle) {
            asteroidsToggle.addEventListener('change', (e) => {
                this.simulator.threeJSManager.toggleAsteroids(e.target.checked);
            });
        }

        // Orbit toggle
        const orbitsToggle = document.getElementById('toggle-orbits');
        if (orbitsToggle) {
            orbitsToggle.addEventListener('change', (e) => {
                this.simulator.threeJSManager.toggleOrbits(e.target.checked);
            });
        }

        // Labels toggle
        const labelsToggle = document.getElementById('toggle-labels');
        if (labelsToggle) {
            labelsToggle.addEventListener('change', (e) => {
                this.simulator.threeJSManager.toggleLabels(e.target.checked);
            });
        }

        // Focus on Earth button
        const focusEarthBtn = document.getElementById('focus-earth');
        if (focusEarthBtn) {
            focusEarthBtn.addEventListener('click', () => {
                this.simulator.threeJSManager.focusOnEarth();
            });
        }

        // Reset view button
        const resetViewBtn = document.getElementById('reset-3d-view');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.simulator.threeJSManager.reset3DView();
            });
        }
    }

    bindMapEvents() {
        // Map container events are handled by MapManager
        // This is for any additional map-related events
    }

    bindWindowEvents() {
        // Window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    // Event handlers
    updateImpactAngle() {
        const angle = parseFloat(document.getElementById('impact-angle').value);
        if (angle >= 0 && angle <= 90) {
            this.simulator.simulationManager.parameters.impactAngle = angle;
            this.updateUI();
            // Update map effects
            if (this.simulator.mapManager) {
                this.simulator.mapManager.onAsteroidParametersChanged();
            }
        }
    }

    updateAsteroidVelocity() {
        const velocity = parseFloat(document.getElementById('asteroid-velocity').value);
        if (velocity > 0) {
            this.simulator.simulationManager.parameters.asteroidVelocity = velocity;
            this.updateUI();
            // Update map effects
            if (this.simulator.mapManager) {
                this.simulator.mapManager.onAsteroidParametersChanged();
            }
        }
    }

    selectDefenseStrategy(strategyType) {
        // Remove active class from all buttons
        document.querySelectorAll('.defense-strategy-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        const selectedButton = document.querySelector(`[data-strategy="${strategyType}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        // Update simulation manager
        this.simulator.simulationManager.parameters.strategy = strategyType;
        this.updateUI();
        
        // Update map effects if there's an active impact
        if (this.simulator.mapManager) {
            this.simulator.mapManager.onAsteroidParametersChanged();
        }
        
        // Show gamified notification
        if (this.simulator.notificationManager) {
            const strategyMessages = {
                kinetic: "🎯 Kinetic Impactor Ready! Mission parameters configured for maximum deflection efficiency."
            };
            
            this.simulator.notificationManager.showNotification(
                strategyMessages[strategyType] || "Strategy selected",
                "success"
            );
        }
    }

    updateStrategy() {
        const strategy = document.getElementById('strategy').value;
        this.simulator.simulationManager.parameters.strategy = strategy;
        this.updateUI();
    }

    updateActionTime() {
        const actionTime = parseFloat(document.getElementById('action-time').value);
        if (actionTime >= 0) {
            this.simulator.simulationManager.parameters.actionTime = actionTime;
            this.updateUI();
        }
    }

    updateLatitude() {
        const latitude = parseFloat(document.getElementById('latitude').value);
        if (latitude >= -90 && latitude <= 90) {
            this.simulator.simulationManager.parameters.latitude = latitude;
            // Update impact effects dynamically when lat/lng changes
            this.updateImpactEffects();
        }
    }

    updateLongitude() {
        const longitude = parseFloat(document.getElementById('longitude').value);
        if (longitude >= -180 && longitude <= 180) {
            this.simulator.simulationManager.parameters.longitude = longitude;
            // Update impact effects dynamically when lat/lng changes
            this.updateImpactEffects();
        }
    }

    updateImpactEffects() {
        const lat = this.simulator.simulationManager.parameters.latitude;
        const lng = this.simulator.simulationManager.parameters.longitude;
        
        if (lat && lng && this.simulator.mapManager) {
            const latlng = { lat: lat, lng: lng };
            
            // Update impact effects on the map
            if (this.simulator.mapManager.isSimulationActive) {
                this.simulator.mapManager.updateImpactEffects();
            }
            
            // Update statistics for the new location
            this.simulator.mapManager.updateStatisticsForLocationWithGeocoding(latlng);
        }
    }

    openSidebar() {
        if (this.simulator.sidebarManager) {
            this.simulator.sidebarManager.openSidebar();
        }
    }

    openSidebarAndFocusSimulation() {
        if (this.simulator.sidebarManager) {
            this.simulator.sidebarManager.openSidebarAndFocusSimulation();
        }
    }

    showImpactConfigModal() {
        const modal = document.getElementById('impact-config-modal');
        if (modal) {
            modal.classList.add('active');
            this.setupConfigModalEvents();
            
            // Initialize values immediately
            setTimeout(() => {
                this.updateConfigSliderValues();
            }, 100);
        }
    }

    hideImpactConfigModal() {
        const modal = document.getElementById('impact-config-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    setupConfigModalEvents() {
        // Close modal buttons
        const closeModalButtons = document.querySelectorAll('#close-config-modal, #cancel-config');
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideImpactConfigModal();
            });
        });

        // Close modal when clicking outside
        const modal = document.getElementById('impact-config-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideImpactConfigModal();
                }
            });
        }

        // Slider events - remove existing listeners first
        const sizeSlider = document.getElementById('config-asteroid-size');
        const velocitySlider = document.getElementById('config-asteroid-velocity');

        if (sizeSlider) {
            // Remove existing listeners
            sizeSlider.oninput = null;
            sizeSlider.addEventListener('input', (e) => {
                this.updateConfigSliderValue('config-size-value', e.target.value, 'm');
                this.updateStatisticsPreview();
            });
        }

        if (velocitySlider) {
            // Remove existing listeners
            velocitySlider.oninput = null;
            velocitySlider.addEventListener('input', (e) => {
                this.updateConfigSliderValue('config-velocity-value', e.target.value, ' km/s');
                this.updateStatisticsPreview();
            });
        }

        // Confirm button
        const confirmBtn = document.getElementById('confirm-config');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmImpactConfig();
            });
        }
    }

    updateConfigSliderValue(elementId, value, unit) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value + unit;
        }
    }

    updateConfigSliderValues() {
        const sizeSlider = document.getElementById('config-asteroid-size');
        const velocitySlider = document.getElementById('config-asteroid-velocity');

        if (sizeSlider) {
            this.updateConfigSliderValue('config-size-value', sizeSlider.value, 'm');
        }
        if (velocitySlider) {
            this.updateConfigSliderValue('config-velocity-value', velocitySlider.value, ' km/s');
        }
    }

    updateStatisticsPreview() {
        // Get current values from config modal
        const sizeSlider = document.getElementById('config-asteroid-size');
        const velocitySlider = document.getElementById('config-asteroid-velocity');
        const angle = 90; // Fixed angle

        if (sizeSlider && velocitySlider && this.pendingSimulationCoords) {
            const size = parseFloat(sizeSlider.value);
            const velocity = parseFloat(velocitySlider.value);

            // Update the main sliders to reflect the config
            const mainSizeSlider = document.getElementById('asteroid-size');
            const mainVelocitySlider = document.getElementById('asteroid-velocity');

            if (mainSizeSlider) mainSizeSlider.value = size;
            if (mainVelocitySlider) mainVelocitySlider.value = velocity;

            // Update statistics with preview data
            if (this.simulator.mapManager) {
                const latlng = this.pendingSimulationCoords;
                this.simulator.mapManager.updateStatisticsForLocation(latlng);
            }
        }
    }

    confirmImpactConfig() {
        // Get values from config modal
        const sizeSlider = document.getElementById('config-asteroid-size');
        const velocitySlider = document.getElementById('config-asteroid-velocity');
        const angle = 90; // Fixed angle

        if (sizeSlider && velocitySlider && this.pendingSimulationCoords) {
            // Update main simulation parameters
            this.simulator.simulationManager.parameters.asteroidSize = parseFloat(sizeSlider.value);
            this.simulator.simulationManager.parameters.asteroidVelocity = parseFloat(velocitySlider.value);
            this.simulator.simulationManager.parameters.impactAngle = angle;

            // Update main UI sliders
            const mainSizeSlider = document.getElementById('asteroid-size');
            const mainVelocitySlider = document.getElementById('asteroid-velocity');

            if (mainSizeSlider) mainSizeSlider.value = sizeSlider.value;
            if (mainVelocitySlider) mainVelocitySlider.value = velocitySlider.value;

            // Hide config modal
            this.hideImpactConfigModal();

            // Run the actual simulation
            const latlng = this.pendingSimulationCoords;
            this.simulator.mapManager.runImpactSimulation(latlng);
            this.simulator.mapManager.showSimulationModal(latlng);

            // Enable defense button after simulation from popup
            const launchDefenseBtn = document.getElementById('launch-defense');
            if (launchDefenseBtn) {
                launchDefenseBtn.disabled = false;
                launchDefenseBtn.classList.remove('disabled');
            }

            // Show gamified notification
            if (this.simulator.notificationManager) {
                this.simulator.notificationManager.showNotification(
                    '💥 IMPACT SIMULATION COMPLETE! 🎯\nThreat assessment finished successfully!\n⚡ Planetary damage analysis: COMPLETE\n🛡️ Defense systems: ARMED and READY!\n🚀 Kinetic Impactor: AVAILABLE for deployment!',
                    'success'
                );
            }
        }
    }

    launchImpact() {
        // Validate required parameters for impact simulation
        const asteroidSize = parseFloat(document.getElementById('asteroid-size').value);
        const asteroidVelocity = parseFloat(document.getElementById('asteroid-velocity').value);
        const composition = document.getElementById('composition').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);

        if (!asteroidSize || asteroidSize <= 0) {
            this.simulator.notificationManager.showNotification(
                '🚨 CRITICAL ALERT! 🚨\nAsteroid size parameter MISSING!\n⚡ Cannot calculate impact devastation without threat dimensions!\n🎯 Please configure asteroid size for impact analysis!',
                'warning'
            );
            return;
        }

        if (!asteroidVelocity || asteroidVelocity <= 0) {
            this.simulator.notificationManager.showNotification(
                '🚨 CRITICAL ALERT! 🚨\nAsteroid velocity parameter MISSING!\n⚡ Cannot calculate collision trajectory without speed data!\n🎯 Please configure asteroid velocity for impact simulation!',
                'warning'
            );
            return;
        }

        if (!composition) {
            this.simulator.notificationManager.showNotification(
                '🚨 CRITICAL ALERT! 🚨\nAsteroid composition UNKNOWN!\n⚡ Cannot assess impact damage without material analysis!\n🎯 Please select asteroid composition for threat assessment!',
                'warning'
            );
            return;
        }

        if (!latitude || !longitude) {
            this.simulator.notificationManager.showNotification(
                '🚨 CRITICAL ALERT! 🚨\nImpact coordinates UNDEFINED!\n⚡ Cannot calculate destruction radius without target location!\n🎯 Please set impact coordinates for damage assessment!',
                'warning'
            );
            return;
        }

        // Run the impact simulation
        this.runImpactSimulation();

        // Show gamified notification
        if (this.simulator.notificationManager) {
            this.simulator.notificationManager.showNotification(
                '💥 CATASTROPHIC IMPACT SIMULATION INITIATED! 🚨\nAnalyzing collision effects and planetary devastation...\n⚡ Calculating destruction radius and casualty estimates...',
                'success'
            );
        }

        // Enable defense button after successful impact simulation
        const launchDefenseBtn = document.getElementById('launch-defense');
        if (launchDefenseBtn) {
            launchDefenseBtn.disabled = false;
            launchDefenseBtn.classList.remove('disabled');
        }
    }

    launchDefense() {
        // Check if impact simulation has been run first
        if (!this.simulator.mapManager || !this.simulator.mapManager.isSimulationActive) {
            this.simulator.notificationManager.showNotification(
                '⚠️ Please run Impact Simulation first before launching defense!',
                'warning'
            );
            return;
        }

        // Show gamified notification
        if (this.simulator.notificationManager) {
            this.simulator.notificationManager.showNotification(
                '🚀 KINETIC IMPACTOR LAUNCHED! 🛡️\nDefense system deployed and targeting asteroid...\n🎯 Calculating optimal impact trajectory...\n⚡ Preparing for maximum deflection force...',
                'success'
            );
        }

        // Here you could add additional defense-specific logic
        // For example, showing defense effectiveness or modifying impact results
        this.showDefenseResults();
    }

    showDefenseResults() {
        // Show additional information about defense effectiveness
        if (this.simulator.notificationManager) {
            // Clear any existing notifications first
            this.simulator.notificationManager.clearAll();
            
            setTimeout(() => {
                this.simulator.notificationManager.showNotification(
                    '🛡️ DEFENSE SUCCESSFUL! ⚡\nKinetic Impactor achieved 85% deflection effectiveness!\n🎯 Asteroid trajectory successfully altered!\n📊 Threat level reduced from CRITICAL to MINIMAL!',
                    'info',
                    3000 // 3 seconds duration
                );
            }, 1000);
            
            setTimeout(() => {
                this.simulator.notificationManager.showNotification(
                    '🏆 MISSION ACCOMPLISHED! 🌍\nYou saved Planet Earth from destruction! 🎉\n👨‍🚀 Congratulations, Space Defense Hero! 🚀\n🏅 Achievement Unlocked: Planetary Savior! ⭐',
                    'success',
                    5000 // 5 seconds duration
                );
            }, 4500); // Start after first alert is about to close
        }
    }

    showImpactDetails() {
        // Check if there's an active simulation
        if (!this.simulator.mapManager || !this.simulator.mapManager.isSimulationActive) {
            this.simulator.notificationManager.showNotification(
                '🚨 NO SIMULATION DATA AVAILABLE! 🚨\n⚡ Impact simulation required for detailed analysis!\n🎯 Please run Impact Simulation first to view threat details!\n🛡️ Defense systems need threat assessment data!',
                'warning'
            );
            return;
        }

        // Get current coordinates and show simulation modal
        const lat = this.simulator.simulationManager.parameters.latitude;
        const lng = this.simulator.simulationManager.parameters.longitude;
        
        if (lat && lng) {
            const latlng = { lat: lat, lng: lng };
            this.simulator.mapManager.showSimulationModal(latlng);
        }
    }

    runImpactSimulation() {
        const lat = this.simulator.simulationManager.parameters.latitude;
        const lng = this.simulator.simulationManager.parameters.longitude;
        
        if (lat && lng && this.simulator.mapManager) {
            // Switch to Impact Map view
            this.switchView('2d');
            
            const latlng = { lat: lat, lng: lng };
            
            // Clear any existing simulation
            if (this.simulator.mapManager.impactMarker) {
                this.simulator.mapManager.map.removeLayer(this.simulator.mapManager.impactMarker);
                this.simulator.mapManager.removeImpactEffects();
                this.simulator.mapManager.impactMarker = null;
            }
            
            // Run the simulation (creates effects on map)
            this.simulator.mapManager.runImpactSimulation(latlng);
            
            // Show the modal with simulation results
            this.simulator.mapManager.showSimulationModal(latlng);
        }
    }

    runImpactSimulationFromPopup(lat, lng) {
        if (this.simulator.mapManager) {
            // Store the coordinates for later use
            this.pendingSimulationCoords = { lat: lat, lng: lng };
            
            // Switch to Impact Map view
            this.switchView('2d');
            
            // Update simulation parameters with clicked location
            this.simulator.simulationManager.parameters.latitude = lat;
            this.simulator.simulationManager.parameters.longitude = lng;
            
            // Update UI coordinates
            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            if (latInput) latInput.value = lat.toFixed(4);
            if (lngInput) lngInput.value = lng.toFixed(4);
            
            // Show configuration modal
            this.showImpactConfigModal();
        }
    }

    resetImpactSimulation() {
        if (this.simulator.mapManager) {
            // Remove impact marker and effects
            if (this.simulator.mapManager.impactMarker) {
                this.simulator.mapManager.map.removeLayer(this.simulator.mapManager.impactMarker);
                this.simulator.mapManager.removeImpactEffects();
                this.simulator.mapManager.impactMarker = null;
                this.simulator.mapManager.isSimulationActive = false;
            }
            
            // Clear any remaining markers
            if (this.simulator.mapManager.locationMarker) {
                this.simulator.mapManager.map.removeLayer(this.simulator.mapManager.locationMarker);
                this.simulator.mapManager.locationMarker = null;
            }
        }

        // Disable defense button after reset
        const launchDefenseBtn = document.getElementById('launch-defense');
        if (launchDefenseBtn) {
            launchDefenseBtn.disabled = true;
            launchDefenseBtn.classList.add('disabled');
        }
        
        // Show gamified notification
        if (this.simulator.notificationManager) {
            this.simulator.notificationManager.showNotification(
                '🔄 MISSION RESET INITIATED! 🔧\nAll defense systems returned to standby position...\n🛡️ Planetary Defense Grid: ONLINE\n🚀 Ready for new asteroid threat! ⚡',
                'info'
            );
        }
    }

    runSimulation() {
        if (this.simulator.simulationManager.isSimulating) {
            this.simulator.notificationManager.showNotification(
                'Simulation already running',
                'warning'
            );
            return;
        }

        // Validate inputs
        if (!this.validateInputs()) {
            return;
        }

        this.simulator.simulationManager.startSimulation();
    }

    resetSimulation() {
        this.simulator.simulationManager.resetSimulation();
        this.simulator.notificationManager.showNotification(
            '🔄 Mission Reset! All parameters restored to default values.',
            'info'
        );
    }

    switchView(view) {
        
        this.simulator.simulationManager.switchView(view);
        
        // Update viewport visibility
        const viewport3D = document.getElementById('viewport-3d');
        const viewport2D = document.getElementById('viewport-2d');
        
        if (viewport3D && viewport2D) {
            if (view === '2d') {
                // Show 2D, hide 3D
                viewport3D.classList.remove('active');
                viewport2D.classList.add('active');
                
                // Ensure map is initialized when switching to 2D
                if (this.simulator.mapManager) {
                    if (!this.simulator.mapManager.mapInitialized) {
                        setTimeout(() => {
                            this.simulator.mapManager.initializeLeafletMap();
                        }, 100);
                    } else {
                        // Force refresh existing map
                        setTimeout(() => {
                            if (this.simulator.mapManager.map) {
                                this.simulator.mapManager.map.invalidateSize();
                                this.simulator.mapManager.map.setView([40.7128, -74.0060], 8);
                            }
                        }, 200);
                    }
                }
            } else {
                // Show 3D, hide 2D
                viewport2D.classList.remove('active');
                viewport3D.classList.add('active');
                
                // Ensure 3D is initialized when switching to 3D
                if (this.simulator.threeJSManager) {
                    setTimeout(() => {
                        if (!this.simulator.threeJSManager.scene) {
                            this.simulator.threeJSManager.setupThreeJS();
                            this.simulator.threeJSManager.createSolarSystem();
                        }
                    }, 100);
                }
            }
        }
        
        // Update button states
        const view2DBtn = document.querySelector('[data-view="2d"]');
        const view3DBtn = document.querySelector('[data-view="3d"]');
        
        if (view2DBtn && view3DBtn) {
            if (view === '2d') {
                view2DBtn.classList.add('active');
                view3DBtn.classList.remove('active');
            } else {
                view3DBtn.classList.add('active');
                view2DBtn.classList.remove('active');
            }
        } else {
            console.error('View buttons not found');
        }
    }

    loadNASAData() {
        this.loadAsteroidData('nasa');
    }

    loadSentryData() {
        this.loadAsteroidData('sentry');
    }

    loadCustomData() {
        this.loadAsteroidData('custom');
    }

    async loadAsteroidData(source) {
        try {
            this.simulator.notificationManager.showLoadingState(`Loading ${source} data...`);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock data based on source
            const mockData = this.getMockAsteroidData(source);
            
            this.simulator.simulationManager.updateParametersFromAPI(mockData);
            this.updateDataSourceUI(source);
            
            this.simulator.notificationManager.hideLoadingState();
            this.simulator.notificationManager.showNotification(
                `${source.toUpperCase()} data loaded successfully`,
                'success'
            );
            
        } catch (error) {
            this.simulator.notificationManager.hideLoadingState();
            this.simulator.notificationManager.showNotification(
                `Failed to load ${source} data`,
                'error'
            );
        }
    }

    getMockAsteroidData(source) {
        const mockData = {
            nasa: {
                diameter: 120,
                velocity: 18,
                composition: 'rocky'
            },
            sentry: {
                diameter: 80,
                velocity: 12,
                composition: 'iron'
            },
            custom: {
                diameter: 150,
                velocity: 22,
                composition: 'carbonaceous'
            }
        };
        
        return mockData[source] || mockData.nasa;
    }

    updateDataSourceUI(source) {
        const buttons = ['nasa', 'sentry', 'custom'];
        buttons.forEach(btn => {
            const element = document.getElementById(`data-${btn}`);
            if (element) {
                element.classList.toggle('active', btn === source);
            }
        });
    }

    validateInputs() {
        const asteroidSize = parseFloat(document.getElementById('asteroid-size').value);
        const asteroidVelocity = parseFloat(document.getElementById('asteroid-velocity').value);
        const impactAngle = parseFloat(document.getElementById('impact-angle').value);
        
        if (asteroidSize <= 0 || asteroidSize > 10000) {
            this.simulator.notificationManager.showNotification(
                'Asteroid size must be between 0 and 10,000 meters',
                'error'
            );
            return false;
        }
        
        if (asteroidVelocity <= 0 || asteroidVelocity > 100) {
            this.simulator.notificationManager.showNotification(
                'Asteroid velocity must be between 0 and 100 km/s',
                'error'
            );
            return false;
        }
        
        if (impactAngle < 0 || impactAngle > 90) {
            this.simulator.notificationManager.showNotification(
                'Impact angle must be between 0 and 90 degrees',
                'error'
            );
            return false;
        }
        
        return true;
    }

    updateUI() {
        this.simulator.simulationManager.updateUI();
    }

    handleWindowResize() {
        // Handle Three.js resize
      
        
        // Handle map resize
        if (this.simulator.mapManager && this.simulator.mapManager.map) {
            this.simulator.mapManager.map.invalidateSize();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + R: Reset simulation
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.resetSimulation();
        }
        
        // Space: Run simulation
        if (e.key === ' ' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            this.runSimulation();
        }
        
        // Escape: Close sidebar
        if (e.key === 'Escape') {
            if (this.simulator.sidebarManager.sidebarOpen) {
                this.simulator.sidebarManager.closeSidebar();
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause animations if needed
        } else {
            // Page is visible, resume animations
        }
    }

    // Cleanup method
    dispose() {
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(listener => {
                element.removeEventListener(listener.event, listener.handler);
            });
        });
        this.eventListeners.clear();
    }
}
