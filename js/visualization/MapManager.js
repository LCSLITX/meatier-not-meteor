// Leaflet Map Management
class MapManager {
    constructor() {
        this.map = null;
        this.mapInitialized = false;
        this.impactMarker = null;
        this.locationMarker = null;
        this.impactEffects = [];
        this.isSimulationActive = false;
    }

    initializeLeafletMap() {
        if (this.mapInitialized) {
            return;
        }

        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.error('Leaflet is not loaded');
                this.showMapError();
                return;
            }

            // Check if container exists
            const container = document.getElementById('leaflet-map');
            if (!container) {
                console.error('Map container not found');
                this.showMapError();
                return;
            }


            // Initialize map centered on New York
            this.map = L.map('leaflet-map', {
                center: [40.7128, -74.0060], // New York coordinates
                zoom: 8,
                zoomControl: true,
                attributionControl: true
            });


            // Use CartoDB as primary layer (more reliable)
            const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '© CARTO, © OpenStreetMap contributors',
                maxZoom: 20,
                subdomains: ['a', 'b', 'c', 'd'],
                detectRetina: true
            });

            // Add fallback layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                subdomains: ['a', 'b', 'c'],
                detectRetina: true
            });

            const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, DeLorme, NAVTEQ',
                maxZoom: 18,
                detectRetina: true
            });

            // Add primary layer
            cartoLayer.addTo(this.map);
            
            // Add error handling with multiple fallbacks
            cartoLayer.on('tileerror', (e) => {
                console.warn('CartoDB tile failed, switching to OSM...');
                this.map.removeLayer(cartoLayer);
                osmLayer.addTo(this.map);
                
                osmLayer.on('tileerror', (e2) => {
                    console.warn('OSM tile failed, switching to Esri...');
                    this.map.removeLayer(osmLayer);
                    esriLayer.addTo(this.map);
                });
            });

            // Force map to invalidate size and refresh
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 500);


              // Add New York marker
              this.addNewYorkMarker();

            // Add click event for impact selection
            this.map.on('click', (e) => {
                this.handleMapClick(e.latlng);
            });

            // Initialize legend filters
            this.initializeLegendFilters();

            this.mapInitialized = true;
            
            // Additional refresh after initialization
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                    this.map.setView([40.7128, -74.0060], 8);
                }
            }, 1000);

        } catch (error) {
            console.error('Map initialization error:', error);
            this.showMapError();
        }
    }

    addNewYorkMarker() {
        // Add default location marker at New York (information only)
        const nyLatlng = { lat: 40.7128, lng: -74.0060 };
        
        // Create location marker (information only)
        this.createLocationMarker(nyLatlng);
    }

    addDefaultImpactEffects(latlng) {
        // Calculate impact with minimum asteroid size
        const minAsteroidSize = 10; // Minimum size in meters
        const minVelocity = 5; // Minimum velocity
        const composition = 'rocky';
        
        const density = this.getAsteroidDensity(composition);
        const mass = (4/3) * Math.PI * Math.pow(minAsteroidSize/2, 3) * density;
        const kineticEnergy = 0.5 * mass * Math.pow(minVelocity * 1000, 2);
        const explosiveYield = kineticEnergy / (4.184 * Math.pow(10, 15));
        
        // Calculate effects
        const craterDiameter = Math.pow(explosiveYield, 0.294) * 195;
        const fireballRadius = Math.pow(explosiveYield, 0.4) * 1000;
        const blastRadius = Math.pow(explosiveYield, 0.33) * 1000;
        
        // Create circles directly (don't use impactEffects array for default)
        const blastCircle = L.circle(latlng, {
            color: '#2563eb', // Blue
            fillColor: '#2563eb',
            fillOpacity: 0.3,
            weight: 2,
            radius: blastRadius * 1000, // Convert km to meters
            className: 'impact-circle'
        }).addTo(this.map);
        
        const fireballCircle = L.circle(latlng, {
            color: '#f97316', // Orange
            fillColor: '#f97316',
            fillOpacity: 0.4,
            weight: 2,
            radius: fireballRadius * 1000, // Convert km to meters
            className: 'impact-circle'
        }).addTo(this.map);

        return [blastCircle, fireballCircle];
    }

    createDefaultSimulation() {
        // Create a default simulation in New York with minimum asteroid parameters
        const nyLatLng = L.latLng(40.7128, -74.0060);
        
        // Remove any existing default simulation
        if (this.defaultSimulationMarker) {
            this.map.removeLayer(this.defaultSimulationMarker);
        }
        if (this.defaultImpactEffects) {
            this.defaultImpactEffects.forEach(effect => {
                if (this.map.hasLayer(effect)) {
                    this.map.removeLayer(effect);
                }
            });
        }

        // Add default impact effects (without red ball marker)
        this.defaultImpactEffects = this.addDefaultImpactEffects(nyLatLng);

        // Update statistics with default simulation
        this.updateStatisticsForLocation(nyLatLng, 'New York City, NY', this.getLocationDetails(nyLatLng));
    }

    clearDefaultSimulation() {
        // Remove default simulation effects
        if (this.defaultImpactEffects) {
            this.defaultImpactEffects.forEach(effect => {
                if (this.map.hasLayer(effect)) {
                    this.map.removeLayer(effect);
                }
            });
            this.defaultImpactEffects = null;
        }
    }

    showSimulationModal(latlng) {
        const modal = document.getElementById('simulation-modal');
        const loading = document.getElementById('simulation-loading');
        const results = document.getElementById('simulation-results');
        
        if (!modal) return;

        // Show modal with loading
        modal.classList.add('active');
        loading.style.display = 'block';
        results.style.display = 'none';

        // Simulate loading time and populate modal
        setTimeout(async () => {
            await this.populateSimulationModal(latlng);
            loading.style.display = 'none';
            results.style.display = 'block';
        }, 2000);
    }

    async populateSimulationModal(latlng) {
        const locationName = await this.getLocationNameWithGeocoding(latlng);
        const impactData = this.calculateImpactData(latlng);
        const locationInfo = this.getLocationDetails(latlng);
        
        // Update location info
        document.getElementById('simulation-location').textContent = locationName;
        document.getElementById('simulation-coordinates').textContent = 
            `${latlng.lat.toFixed(4)}°N, ${latlng.lng.toFixed(4)}°W`;

        // Update impact effects with better formatting
        document.getElementById('modal-crater-diameter').textContent = 
            `${(impactData.craterDiameter / 1000).toFixed(1)} km`;
        document.getElementById('modal-fireball-radius').textContent = 
            `${(impactData.fireballRadius / 1000).toFixed(1)} km`;
        document.getElementById('modal-blast-radius').textContent = 
            `${(impactData.blastRadius / 1000).toFixed(1)} km`;
        document.getElementById('modal-seismic-magnitude').textContent = 
            `${impactData.seismicMagnitude.toFixed(1)}`;

        // Update tsunami and population info
        document.getElementById('modal-tsunami-risk').textContent = 
            locationInfo.tsunamiRisk || 'Low Risk';
        document.getElementById('modal-tsunami-height').textContent = 
            locationInfo.tsunamiHeight || '0-2m';
        document.getElementById('modal-affected-population').textContent = 
            locationInfo.affectedPopulation || 'Calculating...';
        document.getElementById('modal-evacuation-time').textContent = 
            locationInfo.evacuationTime || 'Unknown';

        // Update terrain info
        document.getElementById('modal-terrain-type').textContent = 
            impactData.isContinental ? 'Continental' : 'Oceanic';
        
        const oceanDepthEl = document.getElementById('modal-ocean-depth');
        const elevationEl = document.getElementById('modal-elevation');
        
        if (impactData.isContinental) {
            oceanDepthEl.style.display = 'none';
            elevationEl.style.display = 'flex';
            document.getElementById('modal-elevation-value').textContent = 
                `${impactData.coastalElevation.toFixed(0)}m`;
        } else {
            elevationEl.style.display = 'none';
            oceanDepthEl.style.display = 'flex';
            document.getElementById('modal-ocean-depth-value').textContent = 
                `${impactData.oceanDepth.toFixed(0)}m`;
        }

        // Update location statistics with better formatting
        document.getElementById('modal-population').textContent = 
            locationInfo.population || 'Unknown';
        document.getElementById('modal-infrastructure').textContent = 
            locationInfo.infrastructure || 'Unknown';
        
        const riskLevelEl = document.getElementById('modal-risk-level');
        riskLevelEl.textContent = locationInfo.riskLevel || 'Unknown';
        riskLevelEl.className = `stat-value risk-${(locationInfo.riskLevel || 'unknown').toLowerCase()}`;
        
        document.getElementById('modal-expected-damage').textContent = 
            locationInfo.expectedDamage || 'Unknown';

        // Update statistics panel with simulation data
        this.updateStatisticsForLocation(latlng, locationName, locationInfo);
    }

    async updateStatisticsForLocationWithGeocoding(latlng) {
        const locationName = await this.getLocationNameWithGeocoding(latlng);
        const locationInfo = this.getLocationDetails(latlng);
        this.updateStatisticsForLocation(latlng, locationName, locationInfo);
    }

    hideSimulationModal() {
        const modal = document.getElementById('simulation-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }


    handleMapClick(latlng) {
        // Remove previous markers if exist
        if (this.locationMarker) {
            this.map.removeLayer(this.locationMarker);
        }
        if (this.impactMarker) {
            this.map.removeLayer(this.impactMarker);
            this.removeImpactEffects();
        }

        // Create new location marker at clicked location (information only)
        this.createLocationMarker(latlng);
        
        // Update map coordinates display
        this.updateMapCoordinates(latlng);

        // Update statistics with location information
        this.updateStatisticsForLocationWithGeocoding(latlng);
        
        // Update simulation parameters with clicked location
        this.updateSimulationLocation(latlng);
    }

    createLocationMarker(latlng) {
        // Create location marker (information only)
        this.locationMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'location-marker',
                html: '<div class="location-marker-inner"><i class="fas fa-map-marker-alt"></i></div>',
                iconSize: [25, 25],
                iconAnchor: [12, 25]
            })
        }).addTo(this.map);

        // Show location info
        this.showLocationInfo(latlng);
    }

    createImpactMarker(latlng) {
        // Create new marker
        this.impactMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'impact-marker',
                html: '<div class="impact-marker-inner"><i class="fas fa-bullseye"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);

        // Show impact info
        this.showImpactInfo(latlng);
    }

    updateStatisticsForLocation(latlng, locationName, locationInfo) {
        // If called with location info, show location statistics
        if (locationName && locationInfo) {
            // Calculate real impact data based on current asteroid parameters
            const impactData = this.calculateImpactData(latlng);
            
            // Update the statistics header
            const statsHeader = document.querySelector('.stats-panel-2d h3');
            if (statsHeader) {
                statsHeader.innerHTML = `<i class="fas fa-chart-line"></i> Statistics - ${locationName}`;
            }
            
            // Update individual stat cards with calculated impact data
            const energyStat = document.getElementById('energy-stat');
            if (energyStat) {
                energyStat.textContent = `${impactData.explosiveYield.toFixed(1)} MT`;
            }
            
            const craterStat = document.getElementById('crater-stat');
            if (craterStat) {
                craterStat.textContent = `${(impactData.craterDiameter / 1000).toFixed(1)} km`;
            }
            
            const seismicStat = document.getElementById('seismic-stat');
            if (seismicStat) {
                seismicStat.textContent = `${impactData.seismicMagnitude.toFixed(1)}`;
            }
            
            const tsunamiStat = document.getElementById('tsunami-stat');
            if (tsunamiStat) {
                tsunamiStat.textContent = `${impactData.tsunamiHeight || '0-2m'}`;
            }
            
            const casualtiesStat = document.getElementById('casualties-stat');
            if (casualtiesStat) {
                casualtiesStat.textContent = impactData.estimatedCasualties || 'N/A';
            }
        } else {
            // If called without location info, show impact data
            const impactData = this.calculateImpactData(latlng);
            this.updateStatisticsDisplay(impactData);
        }
    }

    calculateImpactData(latlng) {
        // Get current simulation parameters with proper validation
        const asteroidSizeInput = document.getElementById('asteroid-size');
        const asteroidVelocityInput = document.getElementById('asteroid-velocity');
        const compositionSelect = document.getElementById('composition');
        
        const asteroidSize = asteroidSizeInput ? parseFloat(asteroidSizeInput.value) || 100 : 100;
        const asteroidVelocity = asteroidVelocityInput ? parseFloat(asteroidVelocityInput.value) || 15 : 15;
        const impactAngle = 90; // Fixed impact angle (vertical impact)
        const composition = compositionSelect ? compositionSelect.value || 'rocky' : 'rocky';
        
        // Enhanced calculations based on composition
        const density = this.getAsteroidDensity(composition);
        
        // Correct spherical asteroid calculation (not ellipsoidal)
        // Assuming asteroid is a perfect sphere with diameter = asteroidSize
        const radius = asteroidSize / 2; // radius in meters
        const volume = (4/3) * Math.PI * Math.pow(radius, 3); // volume in cubic meters
        const mass = volume * density; // mass in kg
        
        // Kinetic energy calculation (velocity in km/s, convert to m/s)
        const kineticEnergy = 0.5 * mass * Math.pow(asteroidVelocity * 1000, 2);
        const explosiveYield = kineticEnergy / (4.184 * Math.pow(10, 15)); // Convert to megatons
        
        // Improved impact effects calculations based on real impact physics
        // Crater diameter (Pike's scaling law for simple craters)
        const craterDiameter = Math.pow(explosiveYield, 0.294) * 195; // meters
        
        // Fireball radius (thermal radiation zone)
        const fireballRadius = Math.pow(explosiveYield, 0.4) * 1000; // meters
        
        // Blast radius (overpressure effects)
        const blastRadius = Math.pow(explosiveYield, 0.33) * 1000; // meters
        
        // Seismic magnitude (Richter scale)
        const seismicMagnitude = 0.67 * Math.log10(explosiveYield * 1000000) + 5.87;
        
        // Tsunami calculations (for oceanic impacts)
        const isContinental = this.isContinental(latlng);
        let tsunamiHeight = 0;
        if (!isContinental && explosiveYield > 0.1) {
            // Simplified tsunami height calculation
            tsunamiHeight = Math.pow(explosiveYield, 0.5) * 100; // meters
        }
        
        // Determine if continental or oceanic
        const oceanDepth = isContinental ? 0 : this.getOceanDepth(latlng);
        const coastalElevation = isContinental ? this.getCoastalElevation(latlng) : 0;
        
        // Create impact data object first
        const impactData = {
            latlng: latlng,
            asteroidSize: asteroidSize,
            asteroidVelocity: asteroidVelocity,
            impactAngle: impactAngle,
            composition: composition,
            mass: mass,
            kineticEnergy: kineticEnergy,
            explosiveYield: explosiveYield,
            craterDiameter: craterDiameter,
            fireballRadius: fireballRadius,
            blastRadius: blastRadius,
            seismicMagnitude: seismicMagnitude,
            tsunamiHeight: tsunamiHeight,
            distanceFromCoast: this.getDistanceFromCoast(latlng),
            isContinental: isContinental,
            oceanDepth: oceanDepth,
            coastalElevation: coastalElevation,
            terrainType: isContinental ? 'Continental' : 'Oceanic'
        };
        
        // Calculate estimated casualties based on impact effects
        impactData.estimatedCasualties = this.calculateEstimatedCasualties(impactData, latlng);
        
        return impactData;
    }

    getAsteroidDensity(composition) {
        const densities = {
            'rocky': 3000,      // kg/m³ - typical stony asteroid
            'metallic': 7800,   // kg/m³ - iron-nickel asteroid
            'icy': 1500,        // kg/m³ - water ice composition
            'mixed': 4500       // kg/m³ - mixed composition
        };
        return densities[composition] || 3000;
    }

    calculateEstimatedCasualties(impactData, latlng) {
        // Get population density for the area
        const locationInfo = this.getLocationDetails(latlng);
        const population = locationInfo.population || 'N/A';
        
        if (population === 'N/A') {
            return 'N/A';
        }
        
        // Extract population number (remove 'M', 'K', etc.)
        let populationNumber = 0;
        if (typeof population === 'string') {
            if (population.includes('M')) {
                populationNumber = parseFloat(population.replace('M', '')) * 1000000;
            } else if (population.includes('K')) {
                populationNumber = parseFloat(population.replace('K', '')) * 1000;
            } else {
                populationNumber = parseFloat(population.replace(/[^\d.]/g, ''));
            }
        } else {
            populationNumber = parseFloat(population);
        }
        
        // Calculate casualty rate based on impact effects
        let casualtyRate = 0;
        const explosiveYield = impactData.explosiveYield;
        
        // Blast radius effects (immediate fatalities)
        const blastRadiusKm = impactData.blastRadius / 1000;
        if (blastRadiusKm > 50) {
            casualtyRate += 0.8; // 80% within 50km blast radius
        } else if (blastRadiusKm > 20) {
            casualtyRate += 0.6; // 60% within 20km blast radius
        } else if (blastRadiusKm > 10) {
            casualtyRate += 0.4; // 40% within 10km blast radius
        } else {
            casualtyRate += 0.2; // 20% within smaller blast radius
        }
        
        // Fireball effects (thermal radiation)
        const fireballRadiusKm = impactData.fireballRadius / 1000;
        if (fireballRadiusKm > 30) {
            casualtyRate += 0.3; // Additional 30% from thermal effects
        } else if (fireballRadiusKm > 15) {
            casualtyRate += 0.2; // Additional 20% from thermal effects
        }
        
        // Seismic effects
        if (impactData.seismicMagnitude > 8.0) {
            casualtyRate += 0.2; // Additional 20% from seismic effects
        } else if (impactData.seismicMagnitude > 7.0) {
            casualtyRate += 0.1; // Additional 10% from seismic effects
        }
        
        // Tsunami effects (for coastal areas)
        if (!impactData.isContinental && impactData.tsunamiHeight > 10) {
            casualtyRate += 0.4; // Additional 40% from tsunami
        } else if (!impactData.isContinental && impactData.tsunamiHeight > 5) {
            casualtyRate += 0.2; // Additional 20% from tsunami
        }
        
        // Cap casualty rate at 95% (some people always survive)
        casualtyRate = Math.min(casualtyRate, 0.95);
        
        // Calculate estimated casualties
        const estimatedCasualties = Math.round(populationNumber * casualtyRate);
        
        // Format the result
        if (estimatedCasualties >= 1000000) {
            return `${(estimatedCasualties / 1000000).toFixed(1)}M`;
        } else if (estimatedCasualties >= 1000) {
            return `${(estimatedCasualties / 1000).toFixed(1)}K`;
        } else {
            return estimatedCasualties.toString();
        }
    }

    getDistanceFromCoast(latlng) {
        // Simplified distance calculation (in reality, this would use more complex algorithms)
        const coastLat = 40.5; // Approximate coast latitude
        const distance = Math.abs(latlng.lat - coastLat) * 111; // Rough conversion to km
        return Math.round(distance);
    }

    isContinental(latlng) {
        // More accurate continental detection
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // North America
        if (lat >= 15 && lat <= 85 && lng >= -180 && lng <= -50) return true;
        // South America  
        if (lat >= -60 && lat <= 15 && lng >= -85 && lng <= -30) return true;
        // Europe
        if (lat >= 35 && lat <= 75 && lng >= -25 && lng <= 45) return true;
        // Asia
        if (lat >= 15 && lat <= 75 && lng >= 45 && lng <= 180) return true;
        // Africa
        if (lat >= -35 && lat <= 40 && lng >= -20 && lng <= 55) return true;
        // Australia
        if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) return true;
        // Antarctica
        if (lat <= -60) return true;
        
        return false;
    }

    getOceanDepth(latlng) {
        // More accurate ocean depth calculation based on real bathymetry
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // Pacific Ocean - Deep trenches and abyssal plains
        if (lat >= -60 && lat <= 60 && lng >= 120 && lng <= -120) {
            // Mariana Trench area (deepest)
            if (lat >= 10 && lat <= 20 && lng >= 140 && lng <= 150) {
                return 10500 + Math.random() * 500; // 10500-11000m
            }
            // Tonga Trench
            if (lat >= -25 && lat <= -15 && lng >= -175 && lng <= -170) {
                return 9500 + Math.random() * 500; // 9500-10000m
            }
            // Kermadec Trench
            if (lat >= -35 && lat <= -25 && lng >= 175 && lng <= 180) {
                return 9000 + Math.random() * 500; // 9000-9500m
            }
            // General Pacific depths
            return 4000 + Math.random() * 2000; // 4000-6000m
        }
        
        // Atlantic Ocean
        if (lat >= -60 && lat <= 60 && lng >= -80 && lng <= 20) {
            // Puerto Rico Trench
            if (lat >= 15 && lat <= 25 && lng >= -70 && lng <= -60) {
                return 8500 + Math.random() * 300; // 8500-8800m
            }
            // South Sandwich Trench
            if (lat >= -60 && lat <= -50 && lng >= -30 && lng <= -20) {
                return 8000 + Math.random() * 500; // 8000-8500m
            }
            // General Atlantic depths
            return 3500 + Math.random() * 1500; // 3500-5000m
        }
        
        // Indian Ocean
        if (lat >= -60 && lat <= 30 && lng >= 20 && lng <= 120) {
            // Java Trench (Sunda Trench)
            if (lat >= -10 && lat <= 5 && lng >= 100 && lng <= 115) {
                return 7500 + Math.random() * 500; // 7500-8000m
            }
            // Diamantina Trench
            if (lat >= -35 && lat <= -25 && lng >= 100 && lng <= 115) {
                return 7000 + Math.random() * 300; // 7000-7300m
            }
            // General Indian Ocean depths
            return 3800 + Math.random() * 1700; // 3800-5500m
        }
        
        // Arctic Ocean
        if (lat >= 70) {
            // Eurasian Basin
            if (lng >= 0 && lng <= 180) {
                return 4000 + Math.random() * 1000; // 4000-5000m
            }
            // Canadian Basin
            if (lng >= -180 && lng <= 0) {
                return 3500 + Math.random() * 1000; // 3500-4500m
            }
            // Continental shelf areas
            return 1000 + Math.random() * 1000; // 1000-2000m
        }
        
        // Mediterranean Sea
        if (lat >= 30 && lat <= 45 && lng >= -10 && lng <= 40) {
            return 1500 + Math.random() * 1000; // 1500-2500m
        }
        
        // Caribbean Sea
        if (lat >= 10 && lat <= 25 && lng >= -90 && lng <= -60) {
            return 2000 + Math.random() * 1000; // 2000-3000m
        }
        
        // Default continental shelf
        return 500 + Math.random() * 1000; // 500-1500m
    }

    getCoastalElevation(latlng) {
        // Calculate coastal elevation based on proximity to coast and terrain
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // North American coastal elevations
        if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65) {
            // West Coast (Pacific) - Higher elevations
            if (lng >= -125 && lng <= -115) {
                return 500 + Math.random() * 1500; // 500-2000m
            }
            // East Coast (Atlantic) - Lower elevations
            if (lng >= -80 && lng <= -65) {
                return 50 + Math.random() * 200; // 50-250m
            }
            // Gulf Coast
            if (lat >= 25 && lat <= 35 && lng >= -100 && lng <= -80) {
                return 10 + Math.random() * 50; // 10-60m
            }
        }
        
        // European coastal elevations
        if (lat >= 35 && lat <= 70 && lng >= -25 && lng <= 40) {
            // Mediterranean coast
            if (lat >= 35 && lat <= 45 && lng >= -10 && lng <= 40) {
                return 200 + Math.random() * 800; // 200-1000m
            }
            // Atlantic coast (France, Spain, Portugal)
            if (lat >= 35 && lat <= 50 && lng >= -10 && lng <= 5) {
                return 100 + Math.random() * 400; // 100-500m
            }
            // North Sea coast
            if (lat >= 50 && lat <= 60 && lng >= -5 && lng <= 10) {
                return 20 + Math.random() * 80; // 20-100m
            }
        }
        
        // Asian coastal elevations
        if (lat >= 15 && lat <= 75 && lng >= 45 && lng <= 180) {
            // Japanese coast
            if (lat >= 30 && lat <= 45 && lng >= 130 && lng <= 145) {
                return 300 + Math.random() * 700; // 300-1000m
            }
            // Chinese coast
            if (lat >= 20 && lat <= 40 && lng >= 110 && lng <= 125) {
                return 100 + Math.random() * 300; // 100-400m
            }
            // Indian coast
            if (lat >= 8 && lat <= 25 && lng >= 70 && lng <= 85) {
                return 50 + Math.random() * 200; // 50-250m
            }
        }
        
        // Australian coastal elevations
        if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) {
            // East coast (Great Dividing Range)
            if (lng >= 150 && lng <= 155) {
                return 400 + Math.random() * 800; // 400-1200m
            }
            // West coast
            if (lng >= 110 && lng <= 120) {
                return 100 + Math.random() * 300; // 100-400m
            }
        }
        
        // South American coastal elevations
        if (lat >= -60 && lat <= 15 && lng >= -90 && lng <= -30) {
            // West coast (Andes)
            if (lng >= -85 && lng <= -70) {
                return 1000 + Math.random() * 2000; // 1000-3000m
            }
            // East coast
            if (lng >= -50 && lng <= -30) {
                return 50 + Math.random() * 200; // 50-250m
            }
        }
        
        // African coastal elevations
        if (lat >= -35 && lat <= 40 && lng >= -20 && lng <= 55) {
            // Atlas Mountains (North Africa)
            if (lat >= 30 && lat <= 40 && lng >= -10 && lng <= 10) {
                return 800 + Math.random() * 1200; // 800-2000m
            }
            // South African coast
            if (lat >= -35 && lat <= -25 && lng >= 15 && lng <= 35) {
                return 200 + Math.random() * 600; // 200-800m
            }
        }
        
        // Default coastal elevation
        return 50 + Math.random() * 150; // 50-200m
    }

    async showLocationInfo(latlng) {
        const locationName = await this.getLocationNameWithGeocoding(latlng);
        const locationInfo = this.getLocationDetails(latlng);
        const isContinental = this.isContinental(latlng);
        const oceanDepth = isContinental ? 0 : this.getOceanDepth(latlng);
        const coastalElevation = isContinental ? this.getCoastalElevation(latlng) : 0;
        
        // Update statistics with location data
        this.updateStatisticsForLocation(latlng, locationName, locationInfo);
        
        const popupContent = `
            <div class="location-popup">
                <h4>${locationName}</h4>
                <div class="location-details">
                    <p><strong>Coordinates:</strong> ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</p>
                    <p><strong>Population:</strong> ${locationInfo.population}</p>
                    <p><strong>Infrastructure:</strong> ${locationInfo.infrastructure}</p>
                    <p><strong>Risk Level:</strong> <span class="risk-level ${locationInfo.riskLevel.toLowerCase()}">${locationInfo.riskLevel}</span></p>
                    <p><strong>Terrain:</strong> ${isContinental ? 'Continental' : 'Oceanic'}</p>
                    ${!isContinental ? `<p><strong>Ocean Depth:</strong> ${oceanDepth.toFixed(0)}m</p>` : ''}
                    ${isContinental ? `<p><strong>Coastal Elevation:</strong> ${coastalElevation.toFixed(0)}m</p>` : ''}
                </div>
                <div class="popup-actions">
                    <button class="btn-simulate-popup" onclick="window.eventManager.runImpactSimulationFromPopup(${latlng.lat}, ${latlng.lng})">
                        <i class="fas fa-play"></i> Simulate Impact
                    </button>
                </div>
            </div>
        `;

        this.locationMarker.bindPopup(popupContent).openPopup();
    }

    async showImpactInfo(latlng) {
        const locationName = await this.getLocationNameWithGeocoding(latlng);
        const locationInfo = this.getLocationDetails(latlng);
        const impactData = this.calculateImpactData(latlng);
        
        const popupContent = `
            <div class="location-popup">
                <h4>${locationName}</h4>
                <div class="location-details">
                    <p><strong>Coordinates:</strong> ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</p>
                    <p><strong>Population:</strong> ${locationInfo.population}</p>
                    <p><strong>Infrastructure:</strong> ${locationInfo.infrastructure}</p>
                    <p><strong>Risk Level:</strong> <span class="risk-level ${locationInfo.riskLevel.toLowerCase()}">${locationInfo.riskLevel}</span></p>
                    <p><strong>Terrain:</strong> ${impactData.terrainType}</p>
                    ${!impactData.isContinental ? `<p><strong>Ocean Depth:</strong> ${impactData.oceanDepth.toFixed(0)}m</p>` : ''}
                    ${impactData.isContinental ? `<p><strong>Coastal Elevation:</strong> ${impactData.coastalElevation.toFixed(0)}m</p>` : ''}
                </div>
                
                <div class="impact-simulation">
                    <h5>Impact Simulation (Current Parameters)</h5>
                    <div class="simulation-details">
                        <p><strong>Asteroid:</strong> ${impactData.asteroidSize}m diameter, ${impactData.composition} composition</p>
                        <p><strong>Velocity:</strong> ${impactData.asteroidVelocity} km/s</p>
                        <p><strong>Impact Angle:</strong> ${impactData.impactAngle}°</p>
                        <p><strong>Mass:</strong> ${(impactData.mass/1000).toFixed(1)} tons</p>
                        <p><strong>Explosive Yield:</strong> ${impactData.explosiveYield.toFixed(2)} megatons</p>
                        <p><strong>Crater Diameter:</strong> ${impactData.craterDiameter.toFixed(1)} km</p>
                        <p><strong>Blast Radius:</strong> ${(impactData.blastRadius/1000).toFixed(1)} km</p>
                        <p><strong>Seismic Magnitude:</strong> ${impactData.seismicMagnitude.toFixed(1)}</p>
                    </div>
                </div>
                
            </div>
        `;

        this.impactMarker.bindPopup(popupContent).openPopup();
    }

    showDetailedImpactData(lat, lng) {
        const latlng = { lat: lat, lng: lng };
        const locationName = this.getLocationName(latlng);
        
        // Calculate detailed impact data
        const detailedData = this.calculateDetailedImpactData(latlng);
        
        // Update statistics display
        this.updateStatisticsWithDetailedData(latlng, locationName);
        
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.showNotification(
                `Detailed analysis completed for ${locationName}`,
                'success'
            );
        }
    }

    calculateDetailedImpactData(latlng) {
        const asteroidSize = parseFloat(document.getElementById('asteroid-size').value) || 100;
        const asteroidVelocity = parseFloat(document.getElementById('asteroid-velocity').value) || 15;
        const composition = document.getElementById('composition').value || 'rocky';
        
        // Enhanced calculations
        const density = composition === 'iron' ? 7800 : composition === 'rocky' ? 3000 : 1500;
        const mass = (4/3) * Math.PI * Math.pow(asteroidSize/2, 3) * density;
        const kineticEnergy = 0.5 * mass * Math.pow(asteroidVelocity * 1000, 2);
        const explosiveYield = kineticEnergy / (4.184 * Math.pow(10, 15));
        
        // Impact effects
        const craterDiameter = Math.pow(explosiveYield, 0.294) * 195; // Simplified formula
        const fireballRadius = Math.pow(explosiveYield, 0.4) * 1000;
        const blastRadius = Math.pow(explosiveYield, 0.33) * 1000;
        
        return {
            latlng: latlng,
            mass: mass,
            kineticEnergy: kineticEnergy,
            explosiveYield: explosiveYield,
            craterDiameter: craterDiameter,
            fireballRadius: fireballRadius,
            blastRadius: blastRadius,
            elevation: this.getEstimatedElevation(latlng)
        };
    }

    getEstimatedElevation(latlng) {
        // Simplified elevation estimation
        const baseElevation = 100; // meters
        const randomVariation = (Math.random() - 0.5) * 200;
        return Math.max(0, baseElevation + randomVariation);
    }

    getRegionalPopulationDensity(latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // Regional population density estimation (people per km²)
        if (lat > 40 && lat < 45 && lng > -80 && lng < -70) {
            // Northeast US - High density
            return Math.floor(Math.random() * 5000) + 8000;
        } else if (lat > 32 && lat < 38 && lng > -125 && lng < -115) {
            // West Coast US - High density
            return Math.floor(Math.random() * 4000) + 6000;
        } else if (lat > 25 && lat < 30 && lng > -85 && lng < -80) {
            // Southeast US - Medium-high density
            return Math.floor(Math.random() * 3000) + 4000;
        } else if (lat > 45 && lat < 55 && lng > -10 && lng < 10) {
            // Western Europe - High density
            return Math.floor(Math.random() * 6000) + 7000;
        } else if (lat > 30 && lat < 40 && lng > 130 && lng < 140) {
            // East Asia - Very high density
            return Math.floor(Math.random() * 8000) + 10000;
        } else if (lat > -40 && lat < -20 && lng > -60 && lng < -40) {
            // South America - Medium density
            return Math.floor(Math.random() * 2000) + 1500;
        } else if (lat > 20 && lat < 40 && lng > 0 && lng < 40) {
            // Africa/Middle East - Medium density
            return Math.floor(Math.random() * 1500) + 1000;
        } else {
            // Remote areas - Low density
            return Math.floor(Math.random() * 500) + 100;
        }
    }

    getLocationDetails(latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // Get location-specific details with precise population data
        if (lat > 40.7 && lat < 40.8 && lng > -74.1 && lng < -74.0) {
            // New York City
            return {
                population: "8.8M",
                infrastructure: "High density urban",
                riskLevel: "CRITICAL",
                expectedDamage: "Severe urban damage",
                evacuationTime: "4-6 hours",
                tsunamiRisk: "Low (protected by harbor)",
                tsunamiHeight: "0-2m",
                affectedPopulation: "500,000",
                energy: "12.5 MT",
                craterSize: "2.1 km",
                seismicMagnitude: "7.2"
            };
        } else if (lat > 34.0 && lat < 34.1 && lng > -118.3 && lng < -118.2) {
            // Los Angeles
            return {
                population: "3,971,883",
                infrastructure: "High density urban",
                riskLevel: "CRITICAL",
                expectedDamage: "Severe urban damage",
                evacuationTime: "3-5 hours",
                tsunamiRisk: "High (coastal location)",
                tsunamiHeight: "5-15m",
                affectedPopulation: "2,100,000"
            };
        } else if (lat > 25.7 && lat < 25.8 && lng > -80.3 && lng < -80.2) {
            return {
                population: "470,000",
                infrastructure: "High density urban",
                riskLevel: "HIGH",
                expectedDamage: "Major urban damage",
                evacuationTime: "2-4 hours"
            };
        } else if (lat > 41.8 && lat < 41.9 && lng > -87.7 && lng < -87.6) {
            return {
                population: "2.7 million",
                infrastructure: "High density urban",
                riskLevel: "CRITICAL",
                expectedDamage: "Severe urban damage",
                evacuationTime: "4-6 hours"
            };
        } else if (lat > 51.5 && lat < 51.6 && lng > -0.2 && lng < -0.1) {
            return {
                population: "9.5 million",
                infrastructure: "High density urban",
                riskLevel: "CRITICAL",
                expectedDamage: "Severe urban damage",
                evacuationTime: "6-8 hours"
            };
        } else if (lat > 35.6 && lat < 35.7 && lng > 139.7 && lng < 139.8) {
            return {
                population: "14.0 million",
                infrastructure: "High density urban",
                riskLevel: "CRITICAL",
                expectedDamage: "Severe urban damage",
                evacuationTime: "8-12 hours"
            };
        } else if (lat > 30 && lat < 50 && lng > -130 && lng < -60) {
            return {
                population: "N/A",
                infrastructure: "Mixed urban/rural",
                riskLevel: "MEDIUM",
                expectedDamage: "Moderate damage",
                evacuationTime: "1-3 hours"
            };
        } else if (lat > 35 && lat < 70 && lng > -25 && lng < 40) {
            return {
                population: "N/A",
                infrastructure: "Mixed urban/rural",
                riskLevel: "MEDIUM",
                expectedDamage: "Moderate damage",
                evacuationTime: "2-4 hours"
            };
        } else if (lat > -60 && lat < 15 && lng > -90 && lng < -30) {
            return {
                population: "N/A",
                infrastructure: "Mixed urban/rural",
                riskLevel: "MEDIUM",
                expectedDamage: "Moderate damage",
                evacuationTime: "1-3 hours"
            };
        } else if (lat > -35 && lat < 35 && lng > 15 && lng < 55) {
            return {
                population: "N/A",
                infrastructure: "Mixed urban/rural",
                riskLevel: "MEDIUM",
                expectedDamage: "Moderate damage",
                evacuationTime: "2-4 hours"
            };
        } else if (lat > -50 && lat < 60 && lng > 60 && lng < 180) {
            return {
                population: "N/A",
                infrastructure: "Mixed urban/rural",
                riskLevel: "MEDIUM",
                expectedDamage: "Moderate damage",
                evacuationTime: "2-4 hours"
            };
        } else if (lat > 60) {
            return {
                population: "Sparse",
                infrastructure: "Minimal",
                riskLevel: "LOW",
                expectedDamage: "Minimal damage",
                evacuationTime: "1-2 hours"
            };
        } else if (lat < -60) {
            return {
                population: "Research stations only",
                infrastructure: "Minimal",
                riskLevel: "LOW",
                expectedDamage: "Minimal damage",
                evacuationTime: "30 minutes"
            };
        } else {
            return {
                population: "Unknown",
                infrastructure: "Unknown",
                riskLevel: "UNKNOWN",
                expectedDamage: "Unknown",
                evacuationTime: "Unknown"
            };
        }
    }

    getDefenseStrategies(latlng) {
        const locationInfo = this.getLocationDetails(latlng);
        const riskLevel = locationInfo.riskLevel;
        
        const strategies = [
            {
                type: "evacuation",
                name: "Evacuation",
                icon: "fas fa-people-arrows",
                description: "Emergency evacuation of affected areas"
            },
            {
                type: "deflection",
                name: "Deflection",
                icon: "fas fa-bullseye",
                description: "Kinetic impactor to deflect asteroid"
            },
            {
                type: "nuclear",
                name: "Nuclear",
                icon: "fas fa-bomb",
                description: "Nuclear device to fragment asteroid"
            }
        ];
        
        if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
            strategies.push({
                type: "shelter",
                name: "Shelter",
                icon: "fas fa-shield-alt",
                description: "Underground shelters for protection"
            });
        }
        
        if (riskLevel === "CRITICAL") {
            strategies.push({
                type: "early_warning",
                name: "Early Warning",
                icon: "fas fa-bell",
                description: "Advanced warning systems"
            });
        }
        
        return strategies;
    }

    selectStrategy(strategyType) {
        // Handle strategy selection
        const strategies = {
            evacuation: "Evacuation protocol activated",
            deflection: "Kinetic impactor mission planned",
            nuclear: "Nuclear fragmentation mission planned",
            shelter: "Underground shelter protocol activated",
            early_warning: "Early warning systems deployed"
        };
        
        if (this.notificationManager) {
            this.notificationManager.showNotification(
                strategies[strategyType] || "Strategy selected",
                "success"
            );
        }
    }

    getLocationName(latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // Fallback to coordinate-based detection for major cities
        
        // North America
        if (lat > 40.7 && lat < 40.8 && lng > -74.1 && lng < -74.0) {
            return 'New York City, NY';
        } else if (lat > 34.0 && lat < 34.1 && lng > -118.3 && lng < -118.2) {
            return 'Los Angeles, CA';
        } else if (lat > 25.7 && lat < 25.8 && lng > -80.3 && lng < -80.2) {
            return 'Miami, FL';
        } else if (lat > 41.8 && lat < 41.9 && lng > -87.7 && lng < -87.6) {
            return 'Chicago, IL';
        } else if (lat > 29.7 && lat < 29.8 && lng > -95.4 && lng < -95.3) {
            return 'Houston, TX';
        } else if (lat > 33.7 && lat < 33.8 && lng > -84.4 && lng < -84.3) {
            return 'Atlanta, GA';
        } else if (lat > 40.0 && lat < 40.1 && lng > -82.9 && lng < -82.8) {
            return 'Columbus, OH';
        } else if (lat > 39.7 && lat < 39.8 && lng > -105.0 && lng < -104.9) {
            return 'Denver, CO';
        } else if (lat > 47.6 && lat < 47.7 && lng > -122.4 && lng < -122.3) {
            return 'Seattle, WA';
        } else if (lat > 45.5 && lat < 45.6 && lng > -73.6 && lng < -73.5) {
            return 'Montreal, QC';
        } else if (lat > 43.6 && lat < 43.7 && lng > -79.4 && lng < -79.3) {
            return 'Toronto, ON';
        } else if (lat > 49.2 && lat < 49.3 && lng > -123.1 && lng < -123.0) {
            return 'Vancouver, BC';
        }
        
        // Europe
        else if (lat > 51.5 && lat < 51.6 && lng > -0.2 && lng < -0.1) {
            return 'London, UK';
        } else if (lat > 48.8 && lat < 48.9 && lng > 2.3 && lng < 2.4) {
            return 'Paris, France';
        } else if (lat > 52.5 && lat < 52.6 && lng > 13.3 && lng < 13.4) {
            return 'Berlin, Germany';
        } else if (lat > 41.9 && lat < 42.0 && lng > 12.5 && lng < 12.6) {
            return 'Rome, Italy';
        } else if (lat > 55.7 && lat < 55.8 && lng > 37.6 && lng < 37.7) {
            return 'Moscow, Russia';
        }
        
        // Asia
        else if (lat > 35.6 && lat < 35.7 && lng > 139.7 && lng < 139.8) {
            return 'Tokyo, Japan';
        } else if (lat > 39.9 && lat < 40.0 && lng > 116.4 && lng < 116.5) {
            return 'Beijing, China';
        } else if (lat > 31.2 && lat < 31.3 && lng > 121.5 && lng < 121.6) {
            return 'Shanghai, China';
        } else if (lat > 37.5 && lat < 37.6 && lng > 126.9 && lng < 127.0) {
            return 'Seoul, South Korea';
        } else if (lat > 19.0 && lat < 19.1 && lng > 72.8 && lng < 72.9) {
            return 'Mumbai, India';
        }
        
        // South America
        else if (lat > -23.6 && lat < -23.5 && lng > -46.7 && lng < -46.6) {
            return 'São Paulo, Brazil';
        } else if (lat > -22.9 && lat < -22.8 && lng > -43.2 && lng < -43.1) {
            return 'Rio de Janeiro, Brazil';
        } else if (lat > -34.6 && lat < -34.5 && lng > -58.4 && lng < -58.3) {
            return 'Buenos Aires, Argentina';
        }
        
        // Africa
        else if (lat > -26.2 && lat < -26.1 && lng > 28.0 && lng < 28.1) {
            return 'Johannesburg, South Africa';
        } else if (lat > -33.9 && lat < -33.8 && lng > 18.4 && lng < 18.5) {
            return 'Cape Town, South Africa';
        }
        
        // Australia
        else if (lat > -33.9 && lat < -33.8 && lng > 151.2 && lng < 151.3) {
            return 'Sydney, Australia';
        } else if (lat > -37.8 && lat < -37.7 && lng > 144.9 && lng < 145.0) {
            return 'Melbourne, Australia';
        }
        
        // Generic regional names
        else if (lat > 30 && lat < 50 && lng > -130 && lng < -60) {
            return 'North America';
        } else if (lat > 35 && lat < 70 && lng > -25 && lng < 40) {
            return 'Europe';
        } else if (lat > -60 && lat < 15 && lng > -90 && lng < -30) {
            return 'South America';
        } else if (lat > -35 && lat < 35 && lng > 15 && lng < 55) {
            return 'Africa';
        } else if (lat > -50 && lat < 60 && lng > 60 && lng < 180) {
            return 'Asia';
        } else if (lat > -50 && lat < -10 && lng > 110 && lng < 180) {
            return 'Australia';
        } else if (lat > 60) {
            return 'Arctic Region';
        } else if (lat < -60) {
            return 'Antarctic Region';
        } else {
            return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        }
    }

    async getLocationNameWithGeocoding(latlng) {
        const lat = latlng.lat;
        const lng = latlng.lng;
        
        // Try reverse geocoding first
        try {
            const locationName = await this.reverseGeocode(lat, lng);
            if (locationName) {
                return locationName;
            }
        } catch (error) {
            console.warn('Reverse geocoding failed, using fallback:', error);
        }
        
        // Fallback to regular getLocationName
        return this.getLocationName(latlng);
    }

    async reverseGeocode(lat, lng) {
        // Use OpenStreetMap Nominatim API for reverse geocoding
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AsteroidImpactSimulator/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.display_name) {
                // Format the location name nicely
                const parts = data.display_name.split(', ');
                let locationName = '';
                
                // Take the first 2-3 parts for a clean name
                if (parts.length >= 3) {
                    locationName = parts.slice(0, 3).join(', ');
                } else {
                    locationName = data.display_name;
                }
                
                return locationName;
            }
            
            return null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    updateStatisticsDisplay(impactData) {
        // Update statistics panel
        const statsContainer = document.getElementById('statistics-panel');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <h3>Impact Statistics</h3>
                <div class="stat-item">
                    <label>Asteroid Size:</label>
                    <span>${impactData.asteroidSize} m</span>
                </div>
                <div class="stat-item">
                    <label>Velocity:</label>
                    <span>${impactData.asteroidVelocity} km/s</span>
                </div>
                <div class="stat-item">
                    <label>Composition:</label>
                    <span>${impactData.composition}</span>
                </div>
                <div class="stat-item">
                    <label>Mass:</label>
                    <span>${(impactData.mass/1000).toFixed(1)} tons</span>
                </div>
                <div class="stat-item">
                    <label>Explosive Yield:</label>
                    <span>${impactData.explosiveYield.toFixed(2)} megatons</span>
                </div>
                <div class="stat-item">
                    <label>Crater Diameter:</label>
                    <span>${impactData.craterDiameter.toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Fireball Radius:</label>
                    <span>${(impactData.fireballRadius/1000).toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Blast Radius:</label>
                    <span>${(impactData.blastRadius/1000).toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Seismic Magnitude:</label>
                    <span>${impactData.seismicMagnitude.toFixed(1)}</span>
                </div>
                <div class="stat-item">
                    <label>Distance from Coast:</label>
                    <span>${impactData.distanceFromCoast} km</span>
                </div>
                <div class="stat-item">
                    <label>Terrain Type:</label>
                    <span>${impactData.isContinental ? 'Continental' : 'Oceanic'}</span>
                </div>
            `;
        }
    }

    updateStatisticsWithDetailedData(latlng, locationName) {
        const detailedData = this.calculateDetailedImpactData(latlng);
        
        const statsContainer = document.getElementById('statistics-panel');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <h3>Detailed Impact Analysis</h3>
                <div class="stat-item">
                    <label>Location:</label>
                    <span>${locationName}</span>
                </div>
                <div class="stat-item">
                    <label>Mass:</label>
                    <span>${(detailedData.mass / 1000).toFixed(2)} tons</span>
                </div>
                <div class="stat-item">
                    <label>Explosive Yield:</label>
                    <span>${detailedData.explosiveYield.toFixed(2)} megatons</span>
                </div>
                <div class="stat-item">
                    <label>Crater Diameter:</label>
                    <span>${detailedData.craterDiameter.toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Fireball Radius:</label>
                    <span>${(detailedData.fireballRadius / 1000).toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Blast Radius:</label>
                    <span>${(detailedData.blastRadius / 1000).toFixed(1)} km</span>
                </div>
                <div class="stat-item">
                    <label>Elevation:</label>
                    <span>${detailedData.elevation.toFixed(0)} m</span>
                </div>
            `;
        }
        
        this.highlightUpdatedStatistics();
    }

    highlightUpdatedStatistics() {
        const statsContainer = document.getElementById('statistics-panel');
        if (statsContainer) {
            statsContainer.classList.add('updated');
            setTimeout(() => {
                statsContainer.classList.remove('updated');
            }, 2000);
        }
    }

    updateMapCoordinates(latlng) {
        const coordsDisplay = document.getElementById('coordinates-display');
        if (coordsDisplay) {
            coordsDisplay.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
        }
    }

    updateSimulationLocation(latlng) {
        // Update simulation manager with new location
        if (window.simulationManager) {
            window.simulationManager.parameters.latitude = latlng.lat;
            window.simulationManager.parameters.longitude = latlng.lng;
        }
    }

    updateImpactEffects() {
        // Update impact effects when parameters change
        if (this.impactMarker && this.isSimulationActive) {
            const latlng = this.impactMarker.getLatLng();
            
            // Remove current effects
            this.removeImpactEffects();
            
            // Add new effects with current parameters
            this.addImpactEffects();
            
            // Update popup with new data
            this.showImpactInfo(latlng);
            
            // Update statistics dynamically
            this.updateStatisticsForLocation(latlng);
        }
    }

    // Method to be called when asteroid parameters change
    onAsteroidParametersChanged() {
        this.updateImpactEffects();
    }

    createAsteroidTrajectory(latlng) {
        // Use fixed impact angle of 90 degrees (vertical impact)
        const impactAngle = 90;
        
        // Calculate trajectory based on impact angle
        const trajectoryLength = 300; // km - longer trajectory for better visual effect
        const angleRad = (impactAngle * Math.PI) / 180;
        
        // Calculate start point based on impact angle and trajectory length
        const startLat = latlng.lat + (trajectoryLength / 111.32) * Math.cos(angleRad);
        const startLng = latlng.lng + (trajectoryLength / (111.32 * Math.cos(latlng.lat * Math.PI / 180))) * Math.sin(angleRad);
        
        // Create multiple trajectory points for a more realistic curved path
        const trajectoryPoints = [];
        const numPoints = 20;
        
        for (let i = 0; i <= numPoints; i++) {
            const progress = i / numPoints;
            const currentLat = startLat + (latlng.lat - startLat) * progress;
            const currentLng = startLng + (latlng.lng - startLng) * progress;
            
            // Add slight curve to simulate gravitational influence
            const curveOffset = Math.sin(progress * Math.PI) * 0.01; // Small curve
            const curvedLat = currentLat + curveOffset;
            
            trajectoryPoints.push([curvedLat, currentLng]);
        }
        
        // Create animated polyline for trajectory
        this.asteroidTrajectory = L.polyline(trajectoryPoints, {
            color: '#ff6b35',
            weight: 6,
            opacity: 0.9,
            dashArray: '20, 10',
            className: 'asteroid-trajectory'
        }).addTo(this.map);
        
        // Ensure trajectory is visible by bringing it to front
        this.asteroidTrajectory.bringToFront();
        
        // Add multiple arrow markers along the trajectory
        const arrowIcon = L.divIcon({
            className: 'trajectory-arrow',
            html: '<div class="trajectory-arrow-inner">🔥</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        // Add arrows at key points
        this.asteroidTrajectoryMarkers = [];
        
        // Start point marker
        const startMarker = L.marker([startLat, startLng], {
            icon: L.divIcon({
                className: 'trajectory-start',
                html: '<div class="trajectory-start-inner">🚀</div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(this.map);
        this.asteroidTrajectoryMarkers.push(startMarker);
        
        // Midpoint marker
        const midPoint = Math.floor(numPoints / 2);
        const midLat = trajectoryPoints[midPoint][0];
        const midLng = trajectoryPoints[midPoint][1];
        const midMarker = L.marker([midLat, midLng], {
            icon: arrowIcon
        }).addTo(this.map);
        this.asteroidTrajectoryMarkers.push(midMarker);
        
        // Impact point marker
        const impactMarker = L.marker([latlng.lat, latlng.lng], {
            icon: L.divIcon({
                className: 'trajectory-impact',
                html: '<div class="trajectory-impact-inner">💥</div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            })
        }).addTo(this.map);
        this.asteroidTrajectoryMarkers.push(impactMarker);
    }

    // Execute impact simulation at specified coordinates
    runImpactSimulation(latlng) {
        // Remove previous simulation markers and effects
        if (this.impactMarker) {
            this.map.removeLayer(this.impactMarker);
            this.removeImpactEffects();
        }
        
        // Remove previous trajectory
        if (this.asteroidTrajectory) {
            this.map.removeLayer(this.asteroidTrajectory);
        }

        // Create asteroid trajectory
        this.createAsteroidTrajectory(latlng);

        // Get asteroid size for marker radius
        const asteroidSizeInput = document.getElementById('asteroid-size');
        const asteroidSize = asteroidSizeInput ? parseFloat(asteroidSizeInput.value) : 50;
        
        // Calculate marker radius based on asteroid size (scaled for visibility)
        const markerRadius = Math.max(6, Math.min(20, asteroidSize / 100));
        
        // Create impact marker for simulation
        this.impactMarker = L.circleMarker(latlng, {
            radius: markerRadius,
            fillColor: '#ef4444',
            color: '#dc2626',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
            className: 'impact-marker'
        }).addTo(this.map);
        
        // Add impact effects
        this.addImpactEffects();
        
        // Don't show modal automatically - only when Simulate button is clicked
        
        // Mark simulation as active
        this.isSimulationActive = true;
        
        // Show notification
        if (window.simulator && window.simulator.notificationManager) {
            window.simulator.notificationManager.showNotification(
                'Impact simulation executed',
                'success'
            );
        }
    }

    initializeLegendFilters() {
        const legendContainer = document.getElementById('map-legend');
        if (legendContainer) {
            legendContainer.innerHTML = `
                <h4>Impact Effects</h4>
                <div class="legend-item">
                    <input type="checkbox" id="filter-blast" checked>
                    <label for="filter-blast">Blast Radius</label>
                </div>
                <div class="legend-item">
                    <input type="checkbox" id="filter-seismic" checked>
                    <label for="filter-seismic">Seismic Waves</label>
                </div>
                <div class="legend-item">
                    <input type="checkbox" id="filter-tsunami" checked>
                    <label for="filter-tsunami">Tsunami Zones</label>
                </div>
            `;

            // Add event listeners
            legendContainer.addEventListener('change', () => {
                this.applyLegendFilters();
            });
        }
    }

    applyLegendFilters() {
        const blastFilter = document.getElementById('filter-blast');
        const seismicFilter = document.getElementById('filter-seismic');
        const tsunamiFilter = document.getElementById('filter-tsunami');

        // Toggle visibility of impact effects based on filters
        this.impactEffects.forEach(effect => {
            if (effect.type === 'blast' && blastFilter) {
                effect.layer.setOpacity(blastFilter.checked ? 0.7 : 0);
            } else if (effect.type === 'seismic' && seismicFilter) {
                effect.layer.setOpacity(seismicFilter.checked ? 0.7 : 0);
            } else if (effect.type === 'tsunami' && tsunamiFilter) {
                effect.layer.setOpacity(tsunamiFilter.checked ? 0.7 : 0);
            }
        });
    }

    addImpactEffects() {
        this.removeImpactEffects();
        
        if (!this.impactMarker) return;

        const latlng = this.impactMarker.getLatLng();
        const impactData = this.calculateImpactData(latlng);

        // Add blast radius
        this.addBlastRadius(latlng, impactData.blastRadius);
        
        // Add fireball radius
        this.addFireballRadius(latlng, impactData.fireballRadius);
        
        // Add seismic waves
        this.addSeismicWaves(latlng, impactData.explosiveYield);
        
        // Add tsunami zones (if oceanic)
        if (!impactData.isContinental) {
            this.addTsunamiZones(latlng, impactData.explosiveYield);
        }
    }

    addBlastRadius(latlng, radius) {
        const circle = L.circle(latlng, {
            color: '#2563eb', // Blue
            fillColor: '#2563eb',
            fillOpacity: 0.3,
            weight: 2,
            radius: radius * 1000, // Convert km to meters
            className: 'impact-circle'
        }).addTo(this.map);

        this.impactEffects.push({
            type: 'blast',
            layer: circle
        });

        return circle;
    }

    addFireballRadius(latlng, radius) {
        const circle = L.circle(latlng, {
            color: '#f97316', // Orange
            fillColor: '#f97316',
            fillOpacity: 0.4,
            weight: 2,
            radius: radius * 1000, // Convert km to meters
            className: 'impact-circle'
        }).addTo(this.map);

        this.impactEffects.push({
            type: 'fireball',
            layer: circle
        });

        return circle;
    }

    addCraterRadius(latlng, radius) {
        const circle = L.circle(latlng, {
            color: '#60a5fa', // Light blue
            fillColor: '#60a5fa',
            fillOpacity: 0.2,
            weight: 2,
            radius: radius * 1000, // Convert km to meters
            className: 'impact-circle'
        }).addTo(this.map);

        this.impactEffects.push({
            type: 'crater',
            layer: circle
        });
    }

    addSeismicWaves(latlng, explosiveYield) {
        const seismicRadius = Math.pow(explosiveYield, 0.4) * 500; // Simplified seismic radius
        
        for (let i = 1; i <= 3; i++) {
            const radius = seismicRadius * i;
            const circle = L.circle(latlng, {
                color: 'orange',
                fillColor: 'orange',
                fillOpacity: 0.1,
                radius: radius * 1000,
                weight: 2
            }).addTo(this.map);

            this.impactEffects.push({
                type: 'seismic',
                layer: circle
            });
        }
    }

    addTsunamiZones(latlng, explosiveYield) {
        const tsunamiRadius = Math.pow(explosiveYield, 0.5) * 1000; // Simplified tsunami radius
        
        const circle = L.circle(latlng, {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.2,
            radius: tsunamiRadius * 1000,
            weight: 2
        }).addTo(this.map);

        this.impactEffects.push({
            type: 'tsunami',
            layer: circle
        });
    }

    removeImpactEffects() {
        this.impactEffects.forEach(effect => {
            this.map.removeLayer(effect.layer);
        });
        this.impactEffects = [];
        
        // Also remove trajectory if it exists
        if (this.asteroidTrajectory) {
            this.map.removeLayer(this.asteroidTrajectory);
            this.asteroidTrajectory = null;
        }
        
        // Remove new trajectory markers
        if (this.asteroidTrajectoryMarkers) {
            this.asteroidTrajectoryMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.asteroidTrajectoryMarkers = [];
        }
        
        // Remove old single trajectory marker (for compatibility)
        if (this.asteroidTrajectoryMarker) {
            this.map.removeLayer(this.asteroidTrajectoryMarker);
            this.asteroidTrajectoryMarker = null;
        }
    }

    showMapError() {
        const mapContainer = document.getElementById('leaflet-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444; background: #1f2937; border-radius: 8px; min-height: 400px;">
                    <div style="text-align: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Failed to load map</p>
                        <p style="font-size: 0.9rem; color: #9ca3af; margin: 0.5rem 0;">Check your internet connection</p>
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Show error notification
        if (window.simulator && window.simulator.notificationManager) {
            window.simulator.notificationManager.showNotification(
                'Failed to load map. Check your internet connection.',
                'error'
            );
        }
    }

    dispose() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.impactEffects = [];
        this.impactMarker = null;
        this.mapInitialized = false;
    }
}
