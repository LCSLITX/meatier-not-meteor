// Simulation Management
class SimulationManager {
    constructor() {
        this.isSimulating = false;
        this.simulationTime = 0;
        this.results = {};
        this.currentDate = new Date();
        this.parameters = {
            asteroidSize: 10,
            asteroidVelocity: 5,
            impactAngle: 0,
            composition: 'rocky',
            strategy: 'none',
            actionTime: 12,
            // NEW YORK Location Default
            latitude: 40.7128,
            longitude: -74.0060,
            cameraTarget: 'free'
        };
    }

    getAvailableDefenseStrategies() {
        return [
            {
                type: "kinetic",
                name: "Kinetic Impactor",
                icon: "fas fa-bullseye",
                description: "Kinetic impactor to deflect asteroid",
                effectiveness: 0.9,
                cost: "High",
                timeRequired: "6-24 months"
            },
            {
                type: "gravity",
                name: "Gravity Tractor",
                icon: "fas fa-magnet",
                description: "Use gravitational pull to deflect asteroid",
                effectiveness: 0.85,
                cost: "Very High",
                timeRequired: "12-36 months"
            }
        ];
    }

    calculateDefenseEffectiveness(strategy, asteroidSize, timeToImpact) {
        const strategies = {
            kinetic: Math.min(0.9, 0.5 + (timeToImpact / 8760) * 0.4), // Needs months
            gravity: Math.min(0.85, 0.4 + (timeToImpact / 17520) * 0.45) // Needs years
        };
        
        return strategies[strategy] || 0;
    }

    calculateResults() {
        const asteroidSize = parseFloat(document.getElementById('asteroid-size').value) || 100;
        const asteroidVelocity = parseFloat(document.getElementById('asteroid-velocity').value) || 15;
        const impactAngle = parseFloat(document.getElementById('impact-angle').value) || 45;
        const composition = document.getElementById('composition').value || 'rocky';
        const strategy = document.getElementById('strategy').value || 'none';
        const actionTime = parseFloat(document.getElementById('action-time').value) || 12;
        
        // Update parameters
        this.parameters = {
            asteroidSize,
            asteroidVelocity,
            impactAngle,
            composition,
            strategy,
            actionTime,
            latitude: this.parameters.latitude,
            longitude: this.parameters.longitude,
            cameraTarget: this.parameters.cameraTarget
        };

        // Calculate impact data
        const density = composition === 'iron' ? 7800 : composition === 'rocky' ? 3000 : 1500;
        const mass = (4/3) * Math.PI * Math.pow(asteroidSize/2, 3) * density;
        const kineticEnergy = 0.5 * mass * Math.pow(asteroidVelocity * 1000, 2);
        const explosiveYield = kineticEnergy / (4.184 * Math.pow(10, 15));
        
        // Impact effects
        const craterDiameter = Math.pow(explosiveYield, 0.294) * 195;
        const fireballRadius = Math.pow(explosiveYield, 0.4) * 1000;
        const blastRadius = Math.pow(explosiveYield, 0.33) * 1000;
        const seismicMagnitude = 0.67 * Math.log10(explosiveYield * 1000000) + 5.87;
        
        // Casualty estimates
        const casualties = this.calculateCasualties(explosiveYield, blastRadius);
        
        // Defense strategy analysis
        const defenseStrategies = this.getAvailableDefenseStrategies();
        const timeToImpact = actionTime * 24; // Convert to hours
        const defenseAnalysis = defenseStrategies.map(strat => ({
            ...strat,
            effectiveness: this.calculateDefenseEffectiveness(strat.type, asteroidSize, timeToImpact),
            recommended: this.calculateDefenseEffectiveness(strat.type, asteroidSize, timeToImpact) > 0.6
        }));
        
        this.results = {
            parameters: this.parameters,
            impactData: {
                mass,
                kineticEnergy,
                explosiveYield,
                craterDiameter,
                fireballRadius,
                blastRadius,
                seismicMagnitude
            },
            casualties,
            severity: this.getSeverityClass(explosiveYield),
            defenseStrategies: defenseAnalysis,
            recommendedStrategies: defenseAnalysis.filter(s => s.recommended),
            timestamp: new Date().toISOString()
        };

        return this.results;
    }

    calculateCasualties(explosiveYield, blastRadius) {
        // Simplified casualty calculation
        const populationDensity = 50; // people per km² (average)
        const affectedArea = Math.PI * Math.pow(blastRadius, 2);
        const affectedPopulation = affectedArea * populationDensity;
        
        // Casualty rates based on distance from impact
        let casualties = 0;
        if (blastRadius > 0) {
            const casualtyRate = Math.min(0.9, blastRadius / 100); // Max 90% casualty rate
            casualties = Math.round(affectedPopulation * casualtyRate);
        }
        
        return {
            estimated: casualties,
            injured: Math.round(casualties * 0.3),
            fatalities: Math.round(casualties * 0.7)
        };
    }

    getSeverityClass(explosiveYield) {
        if (explosiveYield < 0.1) return 'low';
        if (explosiveYield < 1) return 'moderate';
        if (explosiveYield < 10) return 'high';
        if (explosiveYield < 100) return 'severe';
        return 'catastrophic';
    }

    getSeverityText() {
        const severity = this.results.severity;
        const severityTexts = {
            low: 'Low Impact',
            moderate: 'Moderate Impact',
            high: 'High Impact',
            severe: 'Severe Impact',
            catastrophic: 'Catastrophic Impact'
        };
        return severityTexts[severity] || 'Unknown';
    }

    getImpactAnalysis() {
        if (!this.results.impactData) return '';

        const data = this.results.impactData;
        const casualties = this.results.casualties;
        
        let analysis = `
            <h3>Impact Analysis</h3>
            <div class="analysis-section">
                <h4>Physical Effects</h4>
                <ul>
                    <li><strong>Crater Diameter:</strong> ${data.craterDiameter.toFixed(1)} km</li>
                    <li><strong>Fireball Radius:</strong> ${(data.fireballRadius / 1000).toFixed(1)} km</li>
                    <li><strong>Blast Radius:</strong> ${(data.blastRadius / 1000).toFixed(1)} km</li>
                    <li><strong>Seismic Magnitude:</strong> ${data.seismicMagnitude.toFixed(1)}</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h4>Human Impact</h4>
                <ul>
                    <li><strong>Estimated Casualties:</strong> ${casualties.estimated.toLocaleString()}</li>
                    <li><strong>Injured:</strong> ${casualties.injured.toLocaleString()}</li>
                    <li><strong>Fatalities:</strong> ${casualties.fatalities.toLocaleString()}</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h4>Severity Assessment</h4>
                <p class="severity-${this.results.severity}">${this.getSeverityText()}</p>
            </div>
        `;
        
        return analysis;
    }

    prepareDataForAPI() {
        return {
            asteroid: {
                diameter: this.parameters.asteroidSize,
                velocity: this.parameters.asteroidVelocity,
                composition: this.parameters.composition,
                impact_angle: this.parameters.impactAngle
            },
            impact: {
                latitude: this.parameters.latitude,
                longitude: this.parameters.longitude,
                action_time: this.parameters.actionTime,
                strategy: this.parameters.strategy
            },
            simulation: {
                timestamp: this.currentDate.toISOString(),
                version: '1.0'
            }
        };
    }

    handleAPIResponse(apiData) {
        if (apiData && apiData.results) {
            // Merge API results with local calculations
            this.results = {
                ...this.results,
                apiData: apiData.results,
                confidence: apiData.confidence || 0.8
            };
            
            return true;
        }
        return false;
    }

    displayResults() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;

        const analysis = this.getImpactAnalysis();
        resultsContainer.innerHTML = analysis;
        
        // Show results panel
        const resultsPanel = document.getElementById('results-panel');
        if (resultsPanel) {
            resultsPanel.classList.add('visible');
        }
    }

    updateImpactMap() {
        // Update 2D map visualization
        if (window.mapManager) {
            const latlng = {
                lat: this.parameters.latitude,
                lng: this.parameters.longitude
            };
            
            window.mapManager.createImpactMarker(latlng);
            window.mapManager.updateStatisticsForLocation(latlng);
            window.mapManager.addImpactEffects();
        }
    }

    toggleActionTiming() {
        const actionTimeContainer = document.getElementById('action-time-container');
        const actionTimeInput = document.getElementById('action-time');
        
        if (actionTimeContainer && actionTimeInput) {
            const isVisible = actionTimeContainer.style.display !== 'none';
            actionTimeContainer.style.display = isVisible ? 'none' : 'block';
            actionTimeInput.disabled = isVisible;
        }
    }

    updateUI() {
        // Update UI elements based on current parameters
        const elements = {
            'asteroid-size': this.parameters.asteroidSize,
            'asteroid-velocity': this.parameters.asteroidVelocity,
            'impact-angle': this.parameters.impactAngle,
            'composition': this.parameters.composition,
            'strategy': this.parameters.strategy,
            'action-time': this.parameters.actionTime
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        // Initialize slider backgrounds
        this.updateSliderBackground('asteroid-size', this.parameters.asteroidSize || 10, 10, 1000);
        this.updateSliderBackground('asteroid-velocity', this.parameters.asteroidVelocity || 5, 5, 50);
        this.updateSliderBackground('impact-angle', this.parameters.impactAngle || 0, 0, 90);
        this.updateSliderBackground('action-time', this.parameters.actionTime || 24, 24, 87600);
    }

    resetSimulation() {
        this.isSimulating = false;
        this.simulationTime = 0;
        this.results = {};
        
        // Reset parameters to defaults
        this.parameters = {
            asteroidSize: 100,
            asteroidVelocity: 15,
            impactAngle: 45,
            composition: 'rocky',
            strategy: 'none',
            actionTime: 12,
            latitude: 40.7128,
            longitude: -74.0060,
            cameraTarget: 'free'
        };
        
        // Reset UI
        this.updateUI();
        
        // Clear results display
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        // Hide results panel
        const resultsPanel = document.getElementById('results-panel');
        if (resultsPanel) {
            resultsPanel.classList.remove('visible');
        }
        
        // Clear map effects
        if (window.mapManager) {
            window.mapManager.removeImpactEffects();
        }
        
    }

    startSimulation() {
        if (this.isSimulating) {
            return;
        }

        this.isSimulating = true;
        this.simulationTime = 0;
        
        // Show loading state
        if (window.notificationManager) {
            window.notificationManager.showLoadingState('Running simulation...');
        }
        
        // Calculate results
        setTimeout(() => {
            this.calculateResults();
            this.displayResults();
            this.updateImpactMap();
            
            this.isSimulating = false;
            
            // Hide loading state
            if (window.notificationManager) {
                window.notificationManager.hideLoadingState();
                window.notificationManager.showNotification(
                    'Simulation completed successfully',
                    'success'
                );
            }
        }, 2000); // Simulate processing time
    }

    updateParametersFromAPI(asteroidData) {
        if (asteroidData) {
            // Update parameters based on API data
            if (asteroidData.diameter) {
                this.parameters.asteroidSize = asteroidData.diameter;
            }
            if (asteroidData.velocity) {
                this.parameters.asteroidVelocity = asteroidData.velocity;
            }
            if (asteroidData.composition) {
                this.parameters.composition = asteroidData.composition;
            }
            
            // Update UI
            this.updateUI();
        }
    }

    updateAsteroidSize() {
        const size = parseFloat(document.getElementById('asteroid-size').value);
        if (size > 0) {
            this.parameters.asteroidSize = size;
            // Update displayed value
            const sizeValue = document.getElementById('size-value');
            if (sizeValue) {
                sizeValue.textContent = `${size}m`;
            }
            // Update slider background to show progress from minimum
            this.updateSliderBackground('asteroid-size', size, 10, 1000);
        }
    }

    updateAsteroidComposition() {
        const composition = document.getElementById('composition').value;
        if (composition) {
            this.parameters.composition = composition;
        }
    }

    updateAsteroidVelocity() {
        const velocity = parseFloat(document.getElementById('asteroid-velocity').value);
        if (velocity > 0) {
            this.parameters.asteroidVelocity = velocity;
            // Update displayed value
            const velocityValue = document.getElementById('velocity-value');
            if (velocityValue) {
                velocityValue.textContent = `${velocity} km/s`;
            }
            // Update slider background to show progress from minimum
            this.updateSliderBackground('asteroid-velocity', velocity, 5, 50);
        }
    }

    updateImpactAngle() {
        const angle = parseFloat(document.getElementById('impact-angle').value);
        if (angle >= 0) {
            this.parameters.impactAngle = angle;
            // Update displayed value
            const angleValue = document.getElementById('angle-value');
            if (angleValue) {
                angleValue.textContent = `${angle}°`;
            }
            // Update slider background to show progress from 0
            this.updateSliderBackground('impact-angle', angle, 0, 90);
        }
    }

    updateActionTime() {
        const time = parseFloat(document.getElementById('action-time').value);
        if (time > 0) {
            this.parameters.actionTime = time;
            // Update displayed value
            const timeValue = document.getElementById('time-value');
            if (timeValue) {
                // Format time display
                if (time < 24) {
                    timeValue.textContent = `${time} hours`;
                } else if (time < 8760) {
                    const days = Math.round(time / 24);
                    timeValue.textContent = `${days} days`;
                } else {
                    const years = Math.round(time / 8760 * 10) / 10;
                    timeValue.textContent = `${years} years`;
                }
            }
            // Update slider background to show progress from minimum
            this.updateSliderBackground('action-time', time, 24, 87600);
        }
    }

    updateSliderBackground(sliderId, value, min, max) {
        const slider = document.getElementById(sliderId);
        if (slider) {
            const percentage = ((value - min) / (max - min)) * 100;
            // Ensure percentage is between 0 and 100
            const clampedPercentage = Math.max(0, Math.min(100, percentage));
            slider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${clampedPercentage}%, var(--bg-tertiary) ${clampedPercentage}%, var(--bg-tertiary) 100%)`;
        }
    }

    updatePlanetScale() {
        // Update planet scale in 3D view
    }

    switchView(view) {
        const view2D = document.querySelector('[data-view="2d"]');
        const view3D = document.querySelector('[data-view="3d"]');
        const mapContainer = document.getElementById('viewport-2d');
        const threeContainer = document.getElementById('viewport-3d');
        
        if (view === '2d') {
            if (mapContainer) mapContainer.classList.add('active');
            if (threeContainer) threeContainer.classList.remove('active');
            if (view2D) view2D.classList.add('active');
            if (view3D) view3D.classList.remove('active');
        } else {
            if (mapContainer) mapContainer.classList.remove('active');
            if (threeContainer) threeContainer.classList.add('active');
            if (view3D) view3D.classList.add('active');
            if (view2D) view2D.classList.remove('active');
        }
    }

    setup3DFilters() {
        // Setup 3D filters panel
        const filtersPanel = document.getElementById('3d-filters-panel');
        if (filtersPanel) {
            filtersPanel.innerHTML = `
                <h4>3D Controls</h4>
                <div class="filter-group">
                    <input type="checkbox" id="toggle-planets" checked>
                    <label for="toggle-planets">Show Planets</label>
                </div>
                <div class="filter-group">
                    <input type="checkbox" id="toggle-asteroids" checked>
                    <label for="toggle-asteroids">Show Asteroids</label>
                </div>
                <div class="filter-group">
                    <input type="checkbox" id="toggle-orbits">
                    <label for="toggle-orbits">Show Orbits</label>
                </div>
                <div class="filter-group">
                    <input type="checkbox" id="toggle-labels" checked>
                    <label for="toggle-labels">Show Labels</label>
                </div>
                <div class="filter-buttons">
                    <button id="focus-earth">Focus Earth</button>
                    <button id="reset-3d-view">Reset View</button>
                    <button id="zoom-in">Zoom In</button>
                    <button id="zoom-out">Zoom Out</button>
                </div>
            `;
        }
    }
}
