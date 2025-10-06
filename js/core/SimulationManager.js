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
            composition: '',
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
            }
        ];
    }

    calculateDefenseEffectiveness(strategy, asteroidSize, timeToImpact) {
        const strategies = {
            kinetic: Math.min(0.9, 0.5 + (timeToImpact / 8760) * 0.4) // Needs months
        };
        
        return strategies[strategy] || 0;
    }

    getAsteroidDensity(composition) {
        const densities = {
            'rocky': 3000,      // kg/m³ - Chondrites
            'metallic': 7800,   // kg/m³ - Iron meteorites
            'icy': 1500,        // kg/m³ - Cometary material
            'mixed': 2500       // kg/m³ - Mixed composition
        };
        return densities[composition] || 2500; // Default to mixed
    }

    calculateCraterDiameter(explosiveYield, velocity) {
        // Simplified crater scaling law (Collins et al., 2005)
        const craterDiameter = 1.16 * Math.pow(explosiveYield, 0.294);
        return Math.max(craterDiameter, 0.1); // Minimum 0.1 km
    }

    calculateFireballRadius(explosiveYield) {
        // Fireball radius scaling (Glasstone & Dolan, 1977)
        const fireballRadius = 0.28 * Math.pow(explosiveYield, 0.4);
        return Math.max(fireballRadius, 0.05); // Minimum 0.05 km
    }

    calculateBlastRadius(explosiveYield) {
        // Blast radius for 5 psi overpressure (Glasstone & Dolan, 1977)
        const blastRadius = 0.45 * Math.pow(explosiveYield, 0.33);
        return Math.max(blastRadius, 0.1); // Minimum 0.1 km
    }

    calculateSeismicMagnitude(explosiveYield) {
        // Seismic magnitude scaling (Richter scale)
        const seismicMagnitude = 0.67 * Math.log10(explosiveYield) + 4.0;
        return Math.max(seismicMagnitude, 1.0); // Minimum magnitude 1.0
    }

    calculateTsunamiEffects(explosiveYield, latitude, longitude) {
        // Check if impact is in ocean (latitude between -60 and 60, near coastlines)
        const isOceanImpact = this.isOceanLocation(latitude, longitude);
        
        if (!isOceanImpact) {
            return {
                tsunamiHeight: 0,
                tsunamiRisk: 'None',
                affectedDistance: 0,
                warningTime: 0
            };
        }

        // Tsunami height calculation based on explosive yield and water depth
        const waterDepth = this.estimateWaterDepth(latitude, longitude);
        const tsunamiHeight = this.calculateTsunamiHeight(explosiveYield, waterDepth);
        
        // Tsunami risk assessment
        const tsunamiRisk = this.assessTsunamiRisk(tsunamiHeight);
        
        // Affected distance (simplified)
        const affectedDistance = this.calculateTsunamiAffectedDistance(explosiveYield);
        
        // Warning time (time for tsunami to reach coastlines)
        const warningTime = this.calculateTsunamiWarningTime(latitude, longitude, affectedDistance);

        return {
            tsunamiHeight: Math.max(tsunamiHeight, 0),
            tsunamiRisk: tsunamiRisk,
            affectedDistance: Math.max(affectedDistance, 0),
            warningTime: Math.max(warningTime, 0)
        };
    }

    isOceanLocation(latitude, longitude) {
        // Simplified ocean detection based on coordinates
        // In a real implementation, this would use actual ocean/land data
        
        // Major landmasses to exclude
        const landRegions = [
            { minLat: -35, maxLat: 37, minLng: -25, maxLng: 60 }, // Africa/Europe
            { minLat: 50, maxLat: 80, minLng: 20, maxLng: 180 }, // Asia
            { minLat: 30, maxLat: 70, minLng: -170, maxLng: -50 }, // North America
            { minLat: -55, maxLat: 15, minLng: -85, maxLng: -30 }, // South America
            { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 }, // Australia
        ];

        for (const region of landRegions) {
            if (latitude >= region.minLat && latitude <= region.maxLat &&
                longitude >= region.minLng && longitude <= region.maxLng) {
                return false; // Land location
            }
        }

        // If not in major land regions, assume ocean
        return true;
    }

    estimateWaterDepth(latitude, longitude) {
        // Simplified water depth estimation
        // In reality, this would use bathymetry data
        
        // Continental shelf: 0-200m
        // Continental slope: 200-3000m
        // Deep ocean: 3000-6000m
        
        // Rough estimation based on distance from major coastlines
        const distanceFromCoast = this.calculateDistanceFromCoast(latitude, longitude);
        
        if (distanceFromCoast < 50) {
            return 100; // Continental shelf
        } else if (distanceFromCoast < 200) {
            return 1500; // Continental slope
        } else {
            return 4000; // Deep ocean
        }
    }

    calculateDistanceFromCoast(latitude, longitude) {
        // Simplified distance calculation from major coastlines
        // This is a rough approximation
        
        const majorCoasts = [
            { lat: 40.7128, lng: -74.0060 }, // New York
            { lat: 51.5074, lng: -0.1278 }, // London
            { lat: 35.6762, lng: 139.6503 }, // Tokyo
            { lat: -33.8688, lng: 151.2093 }, // Sydney
            { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
        ];

        let minDistance = Infinity;
        for (const coast of majorCoasts) {
            const distance = Math.sqrt(
                Math.pow(latitude - coast.lat, 2) + Math.pow(longitude - coast.lng, 2)
            ) * 111; // Rough conversion to km
            minDistance = Math.min(minDistance, distance);
        }

        return minDistance;
    }

    calculateTsunamiHeight(explosiveYield, waterDepth) {
        // Tsunami height calculation based on Ward & Asphaug (2000)
        // Simplified model for impact-generated tsunamis
        
        const energyTransfer = 0.1; // 10% of impact energy transferred to water
        
        // Convert explosive yield from tons to kilotons for calculation
        const yieldKt = explosiveYield / 1000;
        
        // Tsunami height scales with explosive yield and inversely with water depth
        // Using corrected scaling law for impact-generated tsunamis
        const tsunamiHeight = 2.0 * Math.pow(yieldKt * energyTransfer, 0.25) / Math.pow(Math.max(waterDepth, 100) / 1000, 0.5);
        
        // Limit maximum tsunami height (realistic upper bound)
        return Math.min(Math.max(tsunamiHeight, 0), 100); // Between 0 and 100m
    }

    assessTsunamiRisk(tsunamiHeight) {
        if (tsunamiHeight < 1) return 'Low';
        if (tsunamiHeight < 5) return 'Moderate';
        if (tsunamiHeight < 15) return 'High';
        if (tsunamiHeight < 30) return 'Very High';
        return 'Extreme';
    }

    calculateTsunamiAffectedDistance(explosiveYield) {
        // Calculation of how far tsunami effects extend
        // Based on energy dissipation and wave propagation
        
        const yieldKt = explosiveYield / 1000; // Convert to kilotons
        const baseDistance = 200; // Base affected distance in km
        
        // Tsunami affected distance scales with explosive yield
        const energyFactor = Math.pow(yieldKt, 0.4);
        
        return Math.min(baseDistance * energyFactor, 2000); // Maximum 2000km
    }

    calculateTsunamiWarningTime(latitude, longitude, affectedDistance) {
        // Tsunami propagation speed in deep water: ~200 m/s (720 km/h)
        const tsunamiSpeed = 720; // km/h
        
        // Time to reach nearest coastlines
        const nearestCoastDistance = this.calculateDistanceFromCoast(latitude, longitude);
        
        // Warning time in hours
        const warningTime = nearestCoastDistance / tsunamiSpeed;
        
        return Math.max(warningTime, 0.1); // Minimum 6 minutes
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

        // Calculate impact data with more accurate formulas
        const density = this.getAsteroidDensity(composition);
        const radius = asteroidSize / 2; // Convert diameter to radius
        const mass = (4/3) * Math.PI * Math.pow(radius, 3) * density;
        const velocity = asteroidVelocity * 1000; // Convert km/s to m/s
        const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);
        
        // Convert to TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
        const explosiveYield = kineticEnergy / (4.184 * Math.pow(10, 9)); // in tons
        
        // Impact effects using more accurate scaling laws
        const craterDiameter = this.calculateCraterDiameter(explosiveYield, velocity);
        const fireballRadius = this.calculateFireballRadius(explosiveYield);
        const blastRadius = this.calculateBlastRadius(explosiveYield);
        const seismicMagnitude = this.calculateSeismicMagnitude(explosiveYield);
        
        // Casualty estimates
        const casualties = this.calculateCasualties(explosiveYield, blastRadius);
        
        // Tsunami effects calculation
        const tsunamiEffects = this.calculateTsunamiEffects(explosiveYield, latitude, longitude);
        
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
            tsunamiEffects,
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
        const tsunamiEffects = this.results.tsunamiEffects;
        
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
        `;

        // Add tsunami effects if applicable
        if (tsunamiEffects && tsunamiEffects.tsunamiHeight > 0) {
            analysis += `
                <div class="analysis-section">
                    <h4>🌊 Tsunami Effects</h4>
                    <ul>
                        <li><strong>Tsunami Height:</strong> ${tsunamiEffects.tsunamiHeight.toFixed(1)} m</li>
                        <li><strong>Risk Level:</strong> ${tsunamiEffects.tsunamiRisk}</li>
                        <li><strong>Affected Distance:</strong> ${tsunamiEffects.affectedDistance.toFixed(0)} km</li>
                        <li><strong>Warning Time:</strong> ${tsunamiEffects.warningTime.toFixed(1)} hours</li>
                    </ul>
                </div>
            `;
        } else if (tsunamiEffects) {
            analysis += `
                <div class="analysis-section">
                    <h4>🌊 Tsunami Effects</h4>
                    <p><strong>No tsunami generated</strong> - Impact location is on land</p>
                </div>
            `;
        }
        
        analysis += `
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
        this.updateSliderBackground('asteroid-size', this.parameters.asteroidSize || 10, 10, 11000);
        this.updateSliderBackground('asteroid-velocity', this.parameters.asteroidVelocity || 5, 5, 50);
        this.updateSliderBackground('action-time', this.parameters.actionTime || 24, 24, 87600);
    }

    resetSimulation() {
        this.isSimulating = false;
        this.simulationTime = 0;
        this.results = {};
        
        // Reset parameters to defaults
        this.parameters = {
            asteroidSize: 10,
            asteroidVelocity: 5,
            impactAngle: 0,
            composition: '',
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
            this.updateSliderBackground('asteroid-size', size, 10, 11000);
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
                <div class="filter-group">
                    <div class="filter-toggle">
                        <label for="toggle-planets">
                            <i class="fas fa-globe"></i>
                            Show Planets
                        </label>
                        <input type="checkbox" id="toggle-planets" checked>
                    </div>
                </div>
                <div class="filter-group">
                    <div class="filter-toggle">
                        <label for="toggle-asteroids">
                            <i class="fas fa-asterisk"></i>
                            Show Asteroids
                        </label>
                        <input type="checkbox" id="toggle-asteroids" checked>
                    </div>
                </div>
                <div class="filter-group">
                    <div class="filter-toggle">
                        <label for="toggle-orbits">
                            <i class="fas fa-circle"></i>
                            Show Orbits
                        </label>
                        <input type="checkbox" id="toggle-orbits" checked>
                    </div>
                </div>
                <div class="filter-group">
                    <div class="filter-toggle">
                        <label for="toggle-labels">
                            <i class="fas fa-tag"></i>
                            Show Labels
                        </label>
                        <input type="checkbox" id="toggle-labels" checked>
                    </div>
                </div>
                <button class="focus-button" id="focus-earth">
                    <i class="fas fa-crosshairs"></i>
                    Focus on Earth
                </button>
                <button class="reset-view-btn" id="reset-3d-view">
                    <i class="fas fa-undo"></i>
                    Reset View
                </button>
            `;
        }
    }
}
