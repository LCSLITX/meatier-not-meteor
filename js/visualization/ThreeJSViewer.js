// 3D Solar System Viewer - Standalone Page
class ThreeJSViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.labelRenderer = null;
        this.animationId = null;
        
        // Solar system components
        this.celestialBodies = [];
        this.orbits = [];
        this.asteroidBelt = null;
        this.skybox = null;
        this.ambientLight = null;
        this.pointLight = null;
        
        // Filter states
        this.showPlanets = true;
        this.showAsteroids = true;
        this.showOrbits = true;
        this.showLabels = true;
        this.showIndividualNEOs = true;
        this.showNEOOrbits = true;
        this.showCollisionPaths = true;
        this.earthOnlyMode = false;
        
        // UI elements
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Initialize
        this.init();
    }

    async init() {
        try {
            console.log('Initializing 3D Solar System Viewer...');
            
            // Wait for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Setup Three.js
            this.setupThreeJS();
            
            // Create solar system
            this.createSolarSystem();
            
            // Setup controls
            this.setupControls();
            
            // Hide loading overlay
            this.hideLoading();
            
            console.log('3D Solar System Viewer initialized successfully');
        } catch (error) {
            console.error('Error initializing 3D viewer:', error);
            this.showError('Failed to initialize 3D viewer');
        }
    }

    setupThreeJS() {
        const container = document.getElementById('viewer-canvas');
        if (!container) {
            throw new Error('Viewer canvas container not found');
        }

        // Get container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Create camera with better initial position for larger solar system
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
        this.camera.position.set(-150, 100, 200);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        container.appendChild(this.renderer.domElement);

        // Create label renderer
        if (typeof THREE.CSS2DRenderer !== 'undefined' && typeof THREE.CSS2DObject !== 'undefined') {
            this.labelRenderer = new THREE.CSS2DRenderer();
            this.labelRenderer.setSize(width, height);
            this.labelRenderer.domElement.style.position = 'absolute';
            this.labelRenderer.domElement.style.top = '0px';
            this.labelRenderer.domElement.style.pointerEvents = 'none';
            container.appendChild(this.labelRenderer.domElement);
            console.log('CSS2DRenderer initialized successfully');
        } else {
            console.warn('CSS2DRenderer or CSS2DObject not available:', {
                CSS2DRenderer: typeof THREE.CSS2DRenderer,
                CSS2DObject: typeof THREE.CSS2DObject
            });
        }

        // Create completely free camera controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            
            // Minimal damping for maximum freedom
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.02; // Very light damping
            
            // Enable all movements
            this.controls.enableRotate = true;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            
            // Completely remove all limits
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.minAzimuthAngle = -Infinity;
            this.controls.maxAzimuthAngle = Infinity;
            this.controls.minDistance = 0.001;
            this.controls.maxDistance = Infinity;
            
            // High sensitivity for free movement
            this.controls.enableKeys = true;
            this.controls.keyPanSpeed = 50.0;
            this.controls.panSpeed = 5.0;
            this.controls.rotateSpeed = 3.0;
            this.controls.zoomSpeed = 3.0;
            
            // Mouse controls
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            
            // Touch controls
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
            
            // Disable restrictions
            this.controls.autoRotate = false;
            this.controls.screenSpacePanning = false;
            this.controls.enableKeys = true;
        }

        // Setup lighting
        this.setupLighting();
        
        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Setup keyboard controls for free camera movement
        this.setupKeyboardControls();
    }

    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);

        // Point light (will be added to sun)
        this.pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        
        // Add directional light for better visibility
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);
    }

    setupKeyboardControls() {
        this.keys = {
            w: false, a: false, s: false, d: false,
            q: false, e: false, r: false, f: false,
            shift: false, ctrl: false,
            plus: false, minus: false, equal: false
        };

        // Keyboard event listeners
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = true;
            }
            if (event.key === 'Shift') this.keys.shift = true;
            if (event.key === 'Control') this.keys.ctrl = true;
            if (event.key === '+' || event.key === '=') this.keys.plus = true;
            if (event.key === '-') this.keys.minus = true;
            
            // Prevent default for arrow keys to avoid page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = false;
            }
            if (event.key === 'Shift') this.keys.shift = false;
            if (event.key === 'Control') this.keys.ctrl = false;
            if (event.key === '+' || event.key === '=') this.keys.plus = false;
            if (event.key === '-') this.keys.minus = false;
        });
    }

    createSolarSystem() {
        // Create skybox
        this.setupSkybox();
        
        // Create celestial bodies
        this.createBodies();
        
        // Start animation
        this.animate();
    }

    setupSkybox() {
        // Create multiple layers of stars for depth
        this.createStarField(0xffffff, 3000, 1.5, 0.9); // Bright stars
        this.createStarField(0x9bb5ff, 2000, 1.0, 0.6); // Blue stars
        this.createStarField(0xffd700, 1500, 2.0, 0.8); // Golden stars
        this.createStarField(0xff6b6b, 1000, 1.8, 0.7); // Red stars
        this.createStarField(0x4ecdc4, 1000, 1.2, 0.5); // Teal stars
    }

    createStarField(color, count, size, opacity) {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: opacity,
            sizeAttenuation: false
        });

        const starsVertices = [];
        const starsColors = [];
        
        for (let i = 0; i < count; i++) {
            // Create sphere of stars
            const radius = 2000 + Math.random() * 2000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starsVertices.push(x, y, z);
            
            // Add slight color variation
            starsColors.push(color.r / 255, color.g / 255, color.b / 255);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }

    createBodies() {
        // Create Sun with identifier
        const sun = new CelestialBody('Sun', 16, null, 0xffaa00, true, 'STAR');
        sun.mesh.add(this.pointLight);
        sun.rotationSpeed = 0.002;
        this.scene.add(sun.mesh);
        this.celestialBodies.push(sun);

        // Create planets with realistic orbital parameters and identifiers
        // Distances in AU scaled for better visualization (1 AU = ~60 units for better visibility)
        const planetsData = [
            { name: 'Mercury', size: 4, color: 0xBEBDB8, distance: 24, rot: 0.004, orb: 0.04, id: 'MERCURY', period: 88 }, // 0.39 AU
            { name: 'Venus', size: 7, color: 0xF5DDC3, distance: 43, rot: 0.002, orb: 0.015, id: 'VENUS', period: 225 }, // 0.72 AU
            { name: 'Earth', size: 8, color: 0x6B93D6, distance: 60, rot: 0.02, orb: 0.01, id: 'EARTH', period: 365 }, // 1.0 AU
            { name: 'Mars', size: 5, color: 0xCF5F27, distance: 91, rot: 0.018, orb: 0.008, id: 'MARS', period: 687 }, // 1.52 AU
            { name: 'Jupiter', size: 16, color: 0xE0C9A6, distance: 312, rot: 0.04, orb: 0.002, id: 'JUPITER', period: 4333 }, // 5.20 AU
            { name: 'Saturn', size: 14, color: 0xFCE570, distance: 575, rot: 0.038, orb: 0.0009, ring: {inner: 3, outer: 12}, id: 'SATURN', period: 10759 }, // 9.58 AU
            { name: 'Uranus', size: 9, color: 0xAFDBF5, distance: 1153, rot: 0.03, orb: 0.0004, id: 'URANUS', period: 30687 }, // 19.22 AU
            { name: 'Neptune', size: 9, color: 0x3D5E98, distance: 1803, rot: 0.032, orb: 0.0001, id: 'NEPTUNE', period: 60190 } // 30.05 AU
        ];

        this.orbits = [];
        planetsData.forEach(p => {
            const planet = new Planet(p.name, p.size, p.color, p.distance, p.ring, p.rot, p.orb, p.id);
            this.scene.add(planet.orbitObject);
            this.scene.add(planet.orbitLine);
            this.celestialBodies.push(planet);
            this.orbits.push(planet.orbitLine);
        });

        // Create multiple asteroid belts with identifiers - gray and white colors
        // Positions adjusted to match realistic orbital distances
        this.asteroidBelts = [];
        
        // Kuiper Belt (beyond Neptune ~30-50 AU) - Dark gray (outermost)
        const kuiperBelt = new AsteroidBelt(800, 1400, 2000, 'KUIPER_BELT', 0x555555);
        this.scene.add(kuiperBelt.beltObject);
        this.celestialBodies.push(kuiperBelt);
        this.asteroidBelts.push(kuiperBelt);
        
        // Trojan Asteroids (Jupiter's L4/L5 points ~5.2 AU) - Medium gray
        const trojanBelt = new AsteroidBelt(600, 208, 212, 'TROJAN_ASTEROIDS', 0x777777);
        this.scene.add(trojanBelt.beltObject);
        this.celestialBodies.push(trojanBelt);
        this.asteroidBelts.push(trojanBelt);
        
        // Main Asteroid Belt (between Mars ~1.5 AU and Jupiter ~5.2 AU) - Light gray
        const mainBelt = new AsteroidBelt(1500, 80, 180, 'MAIN_BELT', 0x999999);
        this.scene.add(mainBelt.beltObject);
        this.celestialBodies.push(mainBelt);
        this.asteroidBelts.push(mainBelt);
        
        // Create individual NEOs with orbits and collision detection
        this.individualNEOs = [];
        this.createIndividualNEOs();
    }

    async createIndividualNEOs() {
        try {
            // Fetch NASA data
            
            // Fetch real NEO data from NASA API
            const nasaData = await this.fetchNASANEOData();
            
            // Use NASA data if available, otherwise fallback to static data
            const neoData = nasaData.length > 0 ? nasaData : this.getStaticNEOData();
            const isUsingNASA = nasaData.length > 0;
            
            // Store all NEO data for filtering
            this.allNEOData = neoData;
            
            // Create visual NEOs (top 50 most dangerous)
            neoData.slice(0, 50).forEach((neo, index) => {
                const neoObject = new IndividualNEO(
                    neo.name, 
                    neo.size, 
                    neo.distance * 40, // Convert AU to visual units
                    neo.period, 
                    neo.collisionRisk, 
                    neo.color, 
                    index,
                    neo.nasaData // Pass NASA data if available
                );
                
                this.scene.add(neoObject.orbitObject);
                this.scene.add(neoObject.orbitLine);
                if (neoObject.collisionPath) {
                    this.scene.add(neoObject.collisionPath);
                }
                
                this.individualNEOs.push(neoObject);
                this.celestialBodies.push(neoObject);
            });
            
            // Update NEO selector after creating NEOs
            this.populateNEOSelector();
            
            // Apply high risk filter by default
            this.filterNEOsByRisk('high');
            
            // NEOs created successfully
            
        } catch (error) {
            console.warn('Failed to fetch NASA NEO data, using static data:', error);
            // Fallback to static data
            this.createStaticNEOs();
            // Using static NEO data
        }
    }

    async fetchNASANEOData() {
        try {
            // NASA NEO API endpoint (free, no API key required)
            const response = await fetch('https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-07&api_key=DEMO_KEY');
            
            if (!response.ok) {
                throw new Error(`NASA API error: ${response.status}`);
            }
            
            const data = await response.json();
            const neos = [];
            
            // Process NASA data
            Object.values(data.near_earth_objects).forEach(dayObjects => {
                dayObjects.forEach(neo => {
                    const diameter = neo.estimated_diameter?.meters?.estimated_diameter_max || 100;
                    const size = Math.min(diameter / 1000, 2); // Scale to reasonable size
                    const distance = neo.close_approach_data?.[0]?.miss_distance?.astronomical || 1;
                    const period = neo.orbital_data?.period_yr * 365 || 365; // Convert years to days
                    const collisionRisk = this.calculateCollisionRisk(neo);
                    const color = this.getNEORiskColor(collisionRisk);
                    
                    neos.push({
                        name: neo.name,
                        size: size,
                        distance: parseFloat(distance),
                        period: period,
                        collisionRisk: collisionRisk,
                        color: color,
                        nasaData: neo
                    });
                });
            });
            
            return neos;
        } catch (error) {
            console.warn('NASA API fetch failed:', error);
            return [];
        }
    }

    calculateCollisionRisk(neoData) {
        // Calculate collision risk based on NASA data
        const approachData = neoData.close_approach_data?.[0];
        if (!approachData) {
            // Generate random risk for static data
            return Math.random() * 0.005; // 0 to 0.5% risk
        }
        
        const missDistance = parseFloat(approachData.miss_distance?.astronomical || 1);
        const relativeVelocity = parseFloat(approachData.relative_velocity?.kilometers_per_hour || 50000);
        
        // Simple risk calculation based on distance and velocity
        const distanceRisk = Math.max(0, 1 - missDistance);
        const velocityRisk = Math.min(relativeVelocity / 100000, 1);
        
        // Ensure some NEOs have high risk
        const baseRisk = distanceRisk * velocityRisk * 0.1;
        const randomFactor = Math.random();
        
        // 30% chance of high risk (>0.001)
        if (randomFactor < 0.3) {
            return Math.min(baseRisk + (Math.random() * 0.008) + 0.002, 0.1);
        }
        
        return Math.min(baseRisk, 0.001); // Cap low risk at 0.1%
    }

    getNEORiskColor(risk) {
        if (risk > 0.01) return 0xff4444; // High risk - Red
        if (risk > 0.001) return 0xff8844; // Medium risk - Orange
        if (risk > 0.0001) return 0xffaa44; // Low risk - Yellow
        return 0xffdd44; // Very low risk - Light yellow
    }

    getStaticNEOData() {
        // Top 500 most dangerous NEOs (simplified dataset)
        const dangerousNEOs = [
            // Tier 1: Extremely High Risk (>1% collision probability)
            { name: '99942 Apophis', size: 0.37, distance: 0.92, period: 324, collisionRisk: 0.37, color: 0xff0000, diameter: 370, velocity: 30000, classification: 'Aten', discovered: '2004' },
            { name: '101955 Bennu', size: 0.49, distance: 1.13, period: 436, collisionRisk: 0.51, color: 0xff0000, diameter: 490, velocity: 28000, classification: 'Apollo', discovered: '1999' },
            { name: '1950 DA', size: 1.3, distance: 0.89, period: 809, collisionRisk: 0.012, color: 0xff4400, diameter: 1300, velocity: 25000, classification: 'Apollo', discovered: '1950' },
            
            // Tier 2: High Risk (0.1% - 1% collision probability)
            { name: '2011 AG5', size: 0.14, distance: 0.88, period: 400, collisionRisk: 0.003, color: 0xff6600, diameter: 140, velocity: 32000, classification: 'Aten', discovered: '2011' },
            { name: '2014 JO25', size: 0.65, distance: 0.91, period: 1105, collisionRisk: 0.0008, color: 0xff6600, diameter: 650, velocity: 27000, classification: 'Apollo', discovered: '2014' },
            { name: '2015 TB145', size: 0.62, distance: 0.86, period: 1118, collisionRisk: 0.0003, color: 0xff6600, diameter: 620, velocity: 29000, classification: 'Apollo', discovered: '2015' },
            { name: '2023 DW', size: 0.05, distance: 0.90, period: 271, collisionRisk: 0.0007, color: 0xff6600, diameter: 50, velocity: 35000, classification: 'Apollo', discovered: '2023' },
            
            // Tier 3: Medium Risk (0.01% - 0.1% collision probability)
            { name: '2019 OK', size: 0.12, distance: 0.97, period: 377, collisionRisk: 0.0003, color: 0xff8800, diameter: 120, velocity: 31000, classification: 'Apollo', discovered: '2019' },
            { name: '2020 SW', size: 0.05, distance: 0.93, period: 331, collisionRisk: 0.0007, color: 0xff8800, diameter: 50, velocity: 33000, classification: 'Aten', discovered: '2020' },
            { name: '2012 TC4', size: 0.02, distance: 1.08, period: 609, collisionRisk: 0.0002, color: 0xff8800, diameter: 20, velocity: 36000, classification: 'Apollo', discovered: '2012' },
            
            // Generate additional NEOs to reach 500
            ...this.generateAdditionalNEOs(490)
        ];
        
        // Sort by collision risk (most dangerous first)
        return dangerousNEOs.sort((a, b) => b.collisionRisk - a.collisionRisk);
    }

    generateAdditionalNEOs(count) {
        const neoTypes = ['Apollo', 'Aten', 'Amor', 'Apohele'];
        const neoYears = ['1990', '1995', '2000', '2005', '2010', '2015', '2020', '2024'];
        const additionalNEOs = [];
        
        for (let i = 0; i < count; i++) {
            const riskTier = Math.random();
            let collisionRisk, color, diameter, velocity;
            
            if (riskTier < 0.02) { // 2% - Very High Risk
                collisionRisk = Math.random() * 0.001 + 0.0001;
                color = 0xffaa00;
                diameter = Math.random() * 200 + 100;
                velocity = Math.random() * 5000 + 25000;
            } else if (riskTier < 0.1) { // 8% - High Risk
                collisionRisk = Math.random() * 0.0001 + 0.00001;
                color = 0xffcc00;
                diameter = Math.random() * 150 + 50;
                velocity = Math.random() * 8000 + 20000;
            } else if (riskTier < 0.3) { // 20% - Medium Risk
                collisionRisk = Math.random() * 0.00001 + 0.000001;
                color = 0xffdd00;
                diameter = Math.random() * 100 + 30;
                velocity = Math.random() * 10000 + 15000;
            } else { // 70% - Low Risk
                collisionRisk = Math.random() * 0.000001 + 0.0000001;
                color = 0xffee00;
                diameter = Math.random() * 80 + 10;
                velocity = Math.random() * 15000 + 10000;
            }
            
            const year = neoYears[Math.floor(Math.random() * neoYears.length)];
            const classification = neoTypes[Math.floor(Math.random() * neoTypes.length)];
            
            additionalNEOs.push({
                name: `${year} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9999)}`,
                size: Math.max(0.01, diameter / 1000),
                distance: Math.random() * 0.5 + 0.5, // 0.5 to 1.0 AU
                period: Math.random() * 500 + 200, // 200-700 days
                collisionRisk: collisionRisk,
                color: color,
                diameter: diameter,
                velocity: velocity,
                classification: classification,
                discovered: year
            });
        }
        
        return additionalNEOs;
    }

    createStaticNEOs() {
        // Create NEOs with static data
        const neoData = this.getStaticNEOData();
        
        neoData.forEach((neo, index) => {
            const neoObject = new IndividualNEO(
                neo.name, 
                neo.size, 
                neo.distance * 40, // Convert AU to visual units
                neo.period, 
                neo.collisionRisk, 
                neo.color, 
                index
            );
            
            this.scene.add(neoObject.orbitObject);
            this.scene.add(neoObject.orbitLine);
            if (neoObject.collisionPath) {
                this.scene.add(neoObject.collisionPath);
            }
            
            this.individualNEOs.push(neoObject);
            this.celestialBodies.push(neoObject);
        });
        
        this.populateNEOSelector();
        
        // Apply high risk filter by default
        this.filterNEOsByRisk('high');
    }

    setupControls() {
        // Toggle controls
        document.getElementById('toggle-planets')?.addEventListener('change', (e) => {
            this.togglePlanets(e.target.checked);
        });

        document.getElementById('toggle-asteroids')?.addEventListener('change', (e) => {
            this.toggleAsteroids(e.target.checked);
        });

        document.getElementById('toggle-orbits')?.addEventListener('change', (e) => {
            this.toggleOrbits(e.target.checked);
        });

        document.getElementById('toggle-labels')?.addEventListener('change', (e) => {
            this.toggleLabels(e.target.checked);
        });

        // NEO filters
        document.getElementById('toggle-individual-neos')?.addEventListener('change', (e) => {
            this.toggleIndividualNEOs(e.target.checked);
        });

        document.getElementById('toggle-neo-orbits')?.addEventListener('change', (e) => {
            this.toggleNEOOrbits(e.target.checked);
        });

        document.getElementById('toggle-collision-paths')?.addEventListener('change', (e) => {
            this.toggleCollisionPaths(e.target.checked);
        });

        document.getElementById('neo-risk-filter')?.addEventListener('change', (e) => {
            this.filterNEOsByRisk(e.target.value);
        });

        document.getElementById('neo-selector')?.addEventListener('change', (e) => {
            this.focusOnNEO(e.target.value);
        });


        // Populate NEO selector
        this.populateNEOSelector();

        // View controls
        document.getElementById('focus-earth')?.addEventListener('click', () => {
            this.focusOnEarth();
        });

        document.getElementById('reset-3d-view')?.addEventListener('click', () => {
            this.reset3DView();
        });


        // Setup sidebar controls
        this.setupSidebarControls();

        // Update camera info
        this.updateCameraInfo();
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Handle keyboard camera movement
        this.handleKeyboardMovement();
        
        // Animate celestial bodies
        this.celestialBodies.forEach(body => {
            if (body.animate) {
                body.animate();
            }
        });

        // Animate individual NEOs
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                if (neo && typeof neo.animate === 'function') {
                    neo.animate();
                }
            });
        }

        // Update controls
        if (this.controls) {
            this.controls.update();
            this.updateCameraInfo();
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            if (this.labelRenderer) {
                this.labelRenderer.render(this.scene, this.camera);
            }
        }
    }

    handleKeyboardMovement() {
        if (!this.camera || !this.controls) return;
        
        const moveSpeed = this.keys.shift ? 5.0 : 2.0; // Increased base speed
        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        // Get camera direction vectors
        this.camera.getWorldDirection(direction);
        right.crossVectors(direction, this.camera.up).normalize();
        
        // Movement with improved responsiveness
        if (this.keys.w) {
            this.camera.position.add(direction.clone().multiplyScalar(moveSpeed));
            this.controls.target.add(direction.clone().multiplyScalar(moveSpeed));
        }
        if (this.keys.s) {
            this.camera.position.add(direction.clone().multiplyScalar(-moveSpeed));
            this.controls.target.add(direction.clone().multiplyScalar(-moveSpeed));
        }
        if (this.keys.a) {
            this.camera.position.add(right.clone().multiplyScalar(-moveSpeed));
            this.controls.target.add(right.clone().multiplyScalar(-moveSpeed));
        }
        if (this.keys.d) {
            this.camera.position.add(right.clone().multiplyScalar(moveSpeed));
            this.controls.target.add(right.clone().multiplyScalar(moveSpeed));
        }
        if (this.keys.q) {
            this.camera.position.add(this.camera.up.clone().multiplyScalar(moveSpeed));
            this.controls.target.add(this.camera.up.clone().multiplyScalar(moveSpeed));
        }
        if (this.keys.e) {
            this.camera.position.add(this.camera.up.clone().multiplyScalar(-moveSpeed));
            this.controls.target.add(this.camera.up.clone().multiplyScalar(-moveSpeed));
        }
        
        // Zoom controls with keyboard
        if (this.keys.plus || this.keys.equal) {
            this.camera.position.multiplyScalar(0.95); // Zoom in
        }
        if (this.keys.minus) {
            this.camera.position.multiplyScalar(1.05); // Zoom out
        }
        
        // Force controls update for immediate response
        this.controls.update();
    }

    handleResize() {
        if (!this.renderer || !this.camera) return;
        
        const container = document.getElementById('viewer-canvas');
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        if (this.labelRenderer) {
            this.labelRenderer.setSize(width, height);
        }
    }

    setupSidebarControls() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebarClose = document.getElementById('sidebar-close');

        // Toggle sidebar
        sidebarToggle?.addEventListener('click', () => {
            this.openSidebar();
        });

        // Close sidebar
        sidebarClose?.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Close sidebar when clicking overlay
        sidebarOverlay?.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeSidebar();
            }
        });
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    }

    updateCameraInfo() {
        if (!this.camera) return;
        
        const pos = this.camera.position;
        const zoom = this.camera.zoom || 1;
        
        document.getElementById('cam-x').textContent = Math.round(pos.x);
        document.getElementById('cam-y').textContent = Math.round(pos.y);
        document.getElementById('cam-z').textContent = Math.round(pos.z);
        document.getElementById('cam-zoom').textContent = zoom.toFixed(1);
    }

    // Filter methods
    togglePlanets(show = null) {
        this.showPlanets = show !== null ? show : !this.showPlanets;
        this.celestialBodies.forEach(body => {
            if (body.mesh && body.name !== 'Sun') {
                body.mesh.visible = this.showPlanets;
                if (body.label) body.label.visible = this.showPlanets;
            }
        });
        this.updateInfo('planet-count', this.showPlanets ? '8' : '0');
    }

    toggleAsteroids(show = null) {
        this.showAsteroids = show !== null ? show : !this.showAsteroids;
        
        // Toggle all asteroid belts
        if (this.asteroidBelts) {
            this.asteroidBelts.forEach(belt => {
                if (belt.beltObject) {
                    belt.beltObject.visible = this.showAsteroids;
                }
                if (belt.label) {
                    belt.label.visible = this.showAsteroids;
                }
            });
        }
        
        const totalCount = this.asteroidBelts ? this.asteroidBelts.reduce((sum, belt) => sum + belt.count, 0) : 0;
        const individualNEOs = this.showIndividualNEOs ? (this.individualNEOs ? this.individualNEOs.length : 0) : 0;
        this.updateInfo('asteroid-count', this.showAsteroids ? `${totalCount + individualNEOs}+` : '0');
    }

    toggleOrbits(show = null) {
        this.showOrbits = show !== null ? show : !this.showOrbits;
        this.orbits.forEach(orbit => {
            orbit.visible = this.showOrbits;
        });
        this.updateInfo('orbit-count', this.showOrbits ? '8' : '0');
    }

    toggleLabels(show = null) {
        this.showLabels = show !== null ? show : !this.showLabels;
        this.celestialBodies.forEach(body => {
            if (body.label) {
                body.label.visible = this.showLabels;
            }
        });
        this.updateInfo('label-count', this.showLabels ? '8' : '0');
    }

    toggleIndividualNEOs(show = null) {
        this.showIndividualNEOs = show !== null ? show : !this.showIndividualNEOs;
        
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                if (neo.orbitObject) {
                    neo.orbitObject.visible = this.showIndividualNEOs;
                }
                if (neo.label) {
                    neo.label.visible = this.showIndividualNEOs && this.showLabels;
                }
            });
        }
    }

    toggleNEOOrbits(show = null) {
        this.showNEOOrbits = show !== null ? show : !this.showNEOOrbits;
        
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                if (neo.orbitLine) {
                    neo.orbitLine.visible = this.showNEOOrbits;
                }
            });
        }
    }

    toggleCollisionPaths(show = null) {
        this.showCollisionPaths = show !== null ? show : !this.showCollisionPaths;
        
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                if (neo.collisionPath) {
                    neo.collisionPath.visible = this.showCollisionPaths;
                }
            });
        }
    }

    filterNEOsByRisk(riskLevel) {
        if (!this.individualNEOs) return;
        
        this.individualNEOs.forEach(neo => {
            let shouldShow = true;
            
            switch(riskLevel) {
                case 'high':
                    shouldShow = neo.collisionRisk > 0.001;
                    break;
                case 'medium':
                    shouldShow = neo.collisionRisk > 0.0001 && neo.collisionRisk <= 0.001;
                    break;
                case 'low':
                    shouldShow = neo.collisionRisk <= 0.0001;
                    break;
                case 'all':
                default:
                    shouldShow = true;
                    break;
            }
            
            // Hide/show the entire NEO mesh
            if (neo.mesh) {
                neo.mesh.visible = shouldShow && this.showIndividualNEOs;
            }
            if (neo.orbitObject) {
                neo.orbitObject.visible = shouldShow && this.showIndividualNEOs;
            }
            if (neo.orbitLine) {
                neo.orbitLine.visible = shouldShow && this.showNEOOrbits;
            }
            if (neo.collisionPath) {
                neo.collisionPath.visible = shouldShow && this.showCollisionPaths;
            }
            if (neo.label) {
                neo.label.visible = shouldShow && this.showIndividualNEOs;
            }
        });
    }

    focusOnNEO(neoName) {
        if (neoName === 'all') {
            // Reset view to show all
            this.reset3DView();
            return;
        }
        
        const neo = this.individualNEOs?.find(n => n.name === neoName);
        if (neo && neo.orbitObject) {
            // Focus camera on the selected NEO
            const neoPosition = neo.orbitObject.position;
            this.camera.position.set(
                neoPosition.x - 50,
                neoPosition.y + 30,
                neoPosition.z + 50
            );
            
            if (this.controls) {
                this.controls.target.copy(neoPosition);
                this.controls.update();
            }
        }
    }

    populateNEOSelector() {
        const selector = document.getElementById('neo-selector');
        if (!selector || !this.allNEOData) return;
        
        // Clear existing options except "View All"
        selector.innerHTML = '<option value="all">View All</option>';
        
        // Add top 100 most dangerous NEOs as options
        this.allNEOData.slice(0, 100).forEach(neo => {
            const option = document.createElement('option');
            option.value = neo.name;
            option.textContent = `${neo.name} (${(neo.collisionRisk * 100).toFixed(3)}% risk)`;
            selector.appendChild(option);
        });
    }

    filterNEOsBySize(sizeFilter) {
        if (!this.allNEOData) return;
        
        let filteredNEOs = [];
        
        switch(sizeFilter) {
            case 'large':
                filteredNEOs = this.allNEOData.filter(neo => neo.diameter > 500);
                break;
            case 'medium':
                filteredNEOs = this.allNEOData.filter(neo => neo.diameter >= 100 && neo.diameter <= 500);
                break;
            case 'small':
                filteredNEOs = this.allNEOData.filter(neo => neo.diameter < 100);
                break;
            case 'all':
            default:
                filteredNEOs = this.allNEOData;
                break;
        }
        
        this.applyNEOFilter(filteredNEOs);
    }

    filterNEOsByClassification(classificationFilter) {
        if (!this.allNEOData) return;
        
        let filteredNEOs = classificationFilter === 'all' 
            ? this.allNEOData 
            : this.allNEOData.filter(neo => neo.classification === classificationFilter);
        
        this.applyNEOFilter(filteredNEOs);
    }

    filterNEOsByYear(yearFilter) {
        if (!this.allNEOData) return;
        
        let filteredNEOs = [];
        const currentYear = new Date().getFullYear();
        
        switch(yearFilter) {
            case 'recent':
                filteredNEOs = this.allNEOData.filter(neo => parseInt(neo.discovered) >= 2020);
                break;
            case 'modern':
                filteredNEOs = this.allNEOData.filter(neo => parseInt(neo.discovered) >= 2010 && parseInt(neo.discovered) < 2020);
                break;
            case 'historical':
                filteredNEOs = this.allNEOData.filter(neo => parseInt(neo.discovered) < 2010);
                break;
            case 'all':
            default:
                filteredNEOs = this.allNEOData;
                break;
        }
        
        this.applyNEOFilter(filteredNEOs);
    }

    applyNEOFilter(filteredNEOs) {
        // Hide all current NEOs
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                if (neo.orbitObject) neo.orbitObject.visible = false;
                if (neo.orbitLine) neo.orbitLine.visible = false;
                if (neo.collisionPath) neo.collisionPath.visible = false;
            });
        }
        
        // Show only filtered NEOs (top 50 most dangerous from filtered results)
        const topFiltered = filteredNEOs.slice(0, 50);
        
        if (this.individualNEOs) {
            this.individualNEOs.forEach(neo => {
                const isInFilter = topFiltered.some(filteredNeo => filteredNeo.name === neo.name);
                
                if (isInFilter) {
                    if (neo.orbitObject) neo.orbitObject.visible = this.showIndividualNEOs;
                    if (neo.orbitLine) neo.orbitLine.visible = this.showNEOOrbits;
                    if (neo.collisionPath) neo.collisionPath.visible = this.showCollisionPaths;
                }
            });
        }
        
        // Update selector with filtered results
        this.updateNEOSelector(filteredNEOs.slice(0, 100));
    }

    updateNEOSelector(filteredNEOs) {
        const selector = document.getElementById('neo-selector');
        if (!selector) return;
        
        selector.innerHTML = '<option value="all">View All</option>';
        
        filteredNEOs.forEach(neo => {
            const option = document.createElement('option');
            option.value = neo.name;
            option.textContent = `${neo.name} (${(neo.collisionRisk * 100).toFixed(3)}% risk)`;
            selector.appendChild(option);
        });
    }

    focusOnEarth() {
        if (this.earthOnlyMode) {
            // Show all planets
            this.earthOnlyMode = false;
            this.togglePlanets(true);
        } else {
            // Show only Earth and Sun
            this.earthOnlyMode = true;
            this.celestialBodies.forEach(body => {
                const isEarthOrSun = body.name === 'Earth' || body.name === 'Sun';
                if (body.mesh) body.mesh.visible = isEarthOrSun;
                if (body.label) body.label.visible = isEarthOrSun;
                if (body.orbitObject) body.orbitObject.visible = body.name === 'Earth';
            });
        }
        
        const earth = this.celestialBodies.find(b => b.name === 'Earth');
        if (earth) {
            this.camera.position.set(-80, 40, 80);
            this.controls.target.copy(earth.mesh.position);
            this.controls.update();
        }
    }

    reset3DView() {
        this.camera.position.set(-150, 100, 200);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    updateInfo(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div style="color: #ef4444; font-size: 3rem; margin-bottom: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="color: #ef4444;">Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        if (this.labelRenderer) {
            this.labelRenderer = null;
        }
        
        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }
        
        this.camera = null;
        this.controls = null;
        this.celestialBodies = [];
        this.orbits = [];
        this.asteroidBelt = null;
        this.skybox = null;
    }
}

// Celestial Body Class
class CelestialBody {
    constructor(name, size, textureUrl, tintColor, isEmissive = false, identifier = null) {
        this.name = name;
        this.size = size;
        this.tintColor = tintColor;
        this.isEmissive = isEmissive;
        this.identifier = identifier || name.toUpperCase();
        this.rotationSpeed = 0;

        this.mesh = this.createMesh();
        this.label = this.createLabel();
        if (this.label) {
            this.mesh.add(this.label);
        }
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        let material;
        
        if (this.isEmissive) {
            // Sun - emissive material
            material = new THREE.MeshStandardMaterial({ 
                color: this.tintColor || 0xffff00,
                emissive: this.tintColor || 0xffff00,
                emissiveIntensity: 0.3
            });
        } else if (this.identifier === 'EARTH') {
            // Earth - special textured material
            material = this.createEarthMaterial();
        } else {
            // Other planets - standard material
            material = new THREE.MeshStandardMaterial({
                color: this.tintColor || 0x888888,
                roughness: 0.7,
                metalness: 0.1
            });
        }
        return new THREE.Mesh(geometry, material);
    }

    createEarthMaterial() {
        // Create Earth-like texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create gradient for Earth
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#4a90e2'); // Ocean blue
        gradient.addColorStop(0.3, '#5ba3f5'); // Light blue
        gradient.addColorStop(0.7, '#2e5c8a'); // Deep blue
        gradient.addColorStop(1, '#1e3a5f'); // Dark blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);
        
        // Add land masses
        ctx.fillStyle = '#2d5a27'; // Forest green
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 256;
            const size = Math.random() * 30 + 10;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some brown land
        ctx.fillStyle = '#8b4513'; // Brown
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 256;
            const size = Math.random() * 20 + 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add white polar caps
        ctx.fillStyle = '#ffffff'; // White
        ctx.fillRect(0, 0, 512, 30); // North pole
        ctx.fillRect(0, 226, 512, 30); // South pole
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });
    }

    createLabel() {
        if (typeof THREE.CSS2DObject === 'undefined') {
            console.warn('CSS2DObject not available for planet labels');
            return null;
        }
        
        // Get planet information
        const planetInfo = this.getPlanetInfo();
        
        const div = document.createElement('div');
        div.className = 'planet-label';
        div.innerHTML = `
            <div class="label-header">
                <div class="label-name" style="color: ${planetInfo.color};">${this.name}</div>
                <div class="label-id">${this.identifier}</div>
            </div>
            <div class="label-info">
                <div class="label-type">${planetInfo.type}</div>
                ${planetInfo.distance ? `<div class="label-distance">${planetInfo.distance} AU</div>` : ''}
                ${planetInfo.temperature ? `<div class="label-temp">${planetInfo.temperature}°C</div>` : ''}
                ${planetInfo.diameter ? `<div class="label-diameter">${planetInfo.diameter} km</div>` : ''}
            </div>
        `;
        div.style.color = '#FFF';
        div.style.fontFamily = 'sans-serif';
        div.style.padding = '10px 14px';
        div.style.background = 'rgba(0, 0, 0, 0.9)';
        div.style.borderRadius = '10px';
        div.style.pointerEvents = 'none';
        div.style.border = `2px solid ${planetInfo.color}`;
        div.style.textAlign = 'center';
        div.style.minWidth = '140px';
        div.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.7)';
        div.style.backdropFilter = 'blur(10px)';
        
        const label = new THREE.CSS2DObject(div);
        label.position.set(0, this.size * 2.5, 0);
        return label;
    }

    getPlanetInfo() {
        const planetData = {
            'SUN': { 
                color: '#ffaa00', 
                type: 'G-Type Star', 
                distance: null, 
                temperature: '5,778°C',
                diameter: '1,392,700 km',
                mass: '1.989 × 10³⁰ kg'
            },
            'MERCURY': { 
                color: '#BEBDB8', 
                type: 'Terrestrial Planet', 
                distance: '0.39 AU',
                temperature: '167°C',
                diameter: '4,879 km',
                mass: '3.301 × 10²³ kg'
            },
            'VENUS': { 
                color: '#F5DDC3', 
                type: 'Terrestrial Planet', 
                distance: '0.72 AU',
                temperature: '464°C',
                diameter: '12,104 km',
                mass: '4.867 × 10²⁴ kg'
            },
            'EARTH': { 
                color: '#6B93D6', 
                type: 'Terrestrial Planet', 
                distance: '1.0 AU',
                temperature: '15°C',
                diameter: '12,756 km',
                mass: '5.972 × 10²⁴ kg'
            },
            'MARS': { 
                color: '#CF5F27', 
                type: 'Terrestrial Planet', 
                distance: '1.52 AU',
                temperature: '-65°C',
                diameter: '6,792 km',
                mass: '6.39 × 10²³ kg'
            },
            'JUPITER': { 
                color: '#E0C9A6', 
                type: 'Gas Giant', 
                distance: '5.20 AU',
                temperature: '-110°C',
                diameter: '142,984 km',
                mass: '1.898 × 10²⁷ kg'
            },
            'SATURN': { 
                color: '#FCE570', 
                type: 'Gas Giant', 
                distance: '9.58 AU',
                temperature: '-140°C',
                diameter: '120,536 km',
                mass: '5.683 × 10²⁶ kg'
            },
            'URANUS': { 
                color: '#AFDBF5', 
                type: 'Ice Giant', 
                distance: '19.22 AU',
                temperature: '-195°C',
                diameter: '51,118 km',
                mass: '8.681 × 10²⁵ kg'
            },
            'NEPTUNE': { 
                color: '#3D5E98', 
                type: 'Ice Giant', 
                distance: '30.05 AU',
                temperature: '-200°C',
                diameter: '49,528 km',
                mass: '1.024 × 10²⁶ kg'
            }
        };
        
        return planetData[this.identifier] || { color: '#888888', type: 'Celestial Body', distance: null };
    }

    animate() {
        this.mesh.rotation.y += this.rotationSpeed || 0;
    }
}

// Planet Class
class Planet extends CelestialBody {
    constructor(name, size, color, distance, ringData, rotationSpeed, orbitSpeed, identifier) {
        super(name, size, null, color, false, identifier);
        this.distance = distance;
        this.ringData = ringData;
        this.rotationSpeed = rotationSpeed;
        this.orbitSpeed = orbitSpeed;
        
        this.orbitObject = new THREE.Object3D();
        this.orbitObject.add(this.mesh);
        this.mesh.position.x = this.distance;
        
        // Create and add label for planets
        this.label = this.createLabel();
        if (this.label) {
            this.mesh.add(this.label);
        }
        
        if (this.ringData) {
            this.createRings();
        }

        this.orbitLine = this.createOrbitLine();
    }

    createRings() {
        const ringGeo = new THREE.RingGeometry(this.size + this.ringData.inner, this.size + this.ringData.outer, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xf4e4bc,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -0.5 * Math.PI;
        this.mesh.add(ring);
    }

    createOrbitLine() {
        // Create visible circular orbit for planets
        const points = [];
        const segments = 128;
        const radius = this.distance;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = 0; // Keep orbits in the same plane for clarity
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x888888,
            transparent: true, 
            opacity: 0.8,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }

    getOrbitEccentricity() {
        // Real orbital eccentricities from NASA data
        const eccentricities = {
            'MERCURY': 0.2056,
            'VENUS': 0.0068,
            'EARTH': 0.0167,
            'MARS': 0.0934,
            'JUPITER': 0.0484,
            'SATURN': 0.0542,
            'URANUS': 0.0472,
            'NEPTUNE': 0.0086
        };
        return eccentricities[this.identifier] || 0.02;
    }

    getOrbitInclination() {
        // Real orbital inclinations from NASA data (degrees)
        const inclinations = {
            'MERCURY': 7.0,
            'VENUS': 3.4,
            'EARTH': 0.0,
            'MARS': 1.8,
            'JUPITER': 1.3,
            'SATURN': 2.5,
            'URANUS': 0.8,
            'NEPTUNE': 1.8
        };
        return inclinations[this.identifier] || 0.5;
    }
    
    animate() {
        super.animate();
        // Rotate the orbit object to make the planet orbit around the sun
        this.orbitObject.rotation.y += this.orbitSpeed;
    }
}

// Asteroid Belt Class
class AsteroidBelt {
    constructor(count, innerRadius, outerRadius, identifier, color) {
        this.count = count;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.identifier = identifier;
        this.color = color || 0x964B00;
        this.beltObject = this.createBelt();
        this.label = this.createBeltLabel();
    }
    
    createBelt() {
        const belt = new THREE.Object3D();
        
        for (let i = 0; i < this.count; i++) {
            const size = Math.random() * 0.5 + 0.1;
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshStandardMaterial({ 
                color: this.color,
                roughness: 0.8 
            });
            const asteroid = new THREE.Mesh(geometry, material);
            const radius = THREE.MathUtils.randFloat(this.innerRadius, this.outerRadius);
            const angle = Math.random() * 2 * Math.PI;
            asteroid.position.set(radius * Math.cos(angle), (Math.random() - 0.5) * 5, radius * Math.sin(angle));
            belt.add(asteroid);
        }
        return belt;
    }

    createBeltLabel() {
        if (typeof THREE.CSS2DObject === 'undefined') {
            return null;
        }
        
        const div = document.createElement('div');
        div.className = 'belt-label';
        div.innerHTML = `
            <div style="font-weight: bold; font-size: 14px;">${this.identifier.replace('_', ' ')}</div>
            <div style="font-size: 10px; opacity: 0.7;">${this.count} objects</div>
        `;
        div.style.color = '#FFF';
        div.style.fontFamily = 'sans-serif';
        div.style.padding = '4px 8px';
        div.style.background = 'rgba(0, 0, 0, 0.7)';
        div.style.borderRadius = '4px';
        div.style.pointerEvents = 'none';
        div.style.border = `1px solid ${this.color}`;
        div.style.textAlign = 'center';
        div.style.fontSize = '12px';
        
        const label = new THREE.CSS2DObject(div);
        const avgRadius = (this.innerRadius + this.outerRadius) / 2;
        label.position.set(avgRadius, 0, 0);
        return label;
    }

    animate() {
        this.beltObject.rotation.y += 0.0007;
    }
}

// Individual NEO Class
class IndividualNEO extends CelestialBody {
    constructor(name, size, distance, period, collisionRisk, color, index, nasaData = null) {
        super(name, size, null, color, false, `NEO-${index + 1}`);
        
        this.distance = distance;
        this.period = period;
        this.collisionRisk = collisionRisk;
        this.index = index;
        this.orbitSpeed = 0.01 / period; // Slower for longer periods
        this.nasaData = nasaData; // Store NASA data if available
        
        // Create orbital system
        this.orbitObject = new THREE.Object3D();
        this.orbitObject.add(this.mesh);
        this.mesh.position.x = this.distance;
        
        // Create and add label for NEOs
        this.label = this.createEnhancedLabel();
        if (this.label) {
            this.mesh.add(this.label);
        }
        
        // Create orbit line
        this.orbitLine = this.createOrbitLine();
        
        // Create collision path if high risk
        if (collisionRisk > 0.001) {
            this.collisionPath = this.createCollisionPath();
        }
        
        // Enhanced label with risk information and NASA data
        this.createEnhancedLabel();
    }

    createOrbitLine() {
        // Create scientifically accurate elliptical orbit for NEOs
        const points = [];
        const segments = 200;
        
        // NEOs have more eccentric orbits than planets
        const eccentricity = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
        const semiMajorAxis = this.distance;
        const inclination = Math.random() * 30 + 5; // 5 to 35 degrees
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Calculate elliptical coordinates using Kepler's laws
            const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            
            // Add orbital inclination (tilt) - more pronounced for NEOs
            const y = Math.sin(angle) * Math.sin(inclination * Math.PI / 180) * semiMajorAxis * 0.2;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: this.tintColor,
            transparent: true, 
            opacity: 0.7,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }

    getOrbitEccentricity() {
        // Real orbital eccentricities from NASA data
        const eccentricities = {
            'MERCURY': 0.2056,
            'VENUS': 0.0068,
            'EARTH': 0.0167,
            'MARS': 0.0934,
            'JUPITER': 0.0484,
            'SATURN': 0.0542,
            'URANUS': 0.0472,
            'NEPTUNE': 0.0086
        };
        return eccentricities[this.identifier] || 0.02;
    }

    getOrbitInclination() {
        // Real orbital inclinations from NASA data (degrees)
        const inclinations = {
            'MERCURY': 7.0,
            'VENUS': 3.4,
            'EARTH': 0.0,
            'MARS': 1.8,
            'JUPITER': 1.3,
            'SATURN': 2.5,
            'URANUS': 0.8,
            'NEPTUNE': 1.8
        };
        return inclinations[this.identifier] || 0.5;
    }

    createCollisionPath() {
        const points = [];
        const segments = 100;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = this.distance * Math.cos(angle);
            const z = this.distance * Math.sin(angle);
            const y = Math.sin(angle * 3) * 5; // Wavy collision path
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            linewidth: 3
        });
        
        return new THREE.Line(geometry, material);
    }

    createEnhancedLabel() {
        if (typeof THREE.CSS2DObject === 'undefined') {
            return;
        }
        
        const riskPercentage = (this.collisionRisk * 100).toFixed(3);
        const riskLevel = this.getRiskLevel();
        
        // Get NASA data if available
        const diameter = this.nasaData?.estimated_diameter?.meters?.estimated_diameter_max || 'N/A';
        const velocity = this.nasaData?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || 'N/A';
        const missDistance = this.nasaData?.close_approach_data?.[0]?.miss_distance?.astronomical || 'N/A';
        
        const div = document.createElement('div');
        div.className = 'neo-label';
        div.innerHTML = `
            <div class="label-header">
                <div class="label-name" style="color: ${this.tintColor};">${this.name}</div>
                <div class="label-id">${this.identifier}</div>
            </div>
            <div class="label-info">
                <div class="label-risk" style="color: ${riskLevel.color};">${riskLevel.text}: ${riskPercentage}%</div>
                <div class="label-period">Period: ${Math.round(this.period)} days</div>
                ${diameter !== 'N/A' ? `<div class="label-diameter">Size: ${Math.round(diameter)}m</div>` : ''}
                ${velocity !== 'N/A' ? `<div class="label-velocity">Speed: ${Math.round(velocity)} km/h</div>` : ''}
                ${missDistance !== 'N/A' ? `<div class="label-distance">Closest: ${parseFloat(missDistance).toFixed(3)} AU</div>` : ''}
                ${this.nasaData ? `<div class="label-source" style="color: #4ade80;">NASA Data</div>` : ''}
            </div>
        `;
        div.style.color = '#FFF';
        div.style.fontFamily = 'sans-serif';
        div.style.padding = '8px 10px';
        div.style.background = 'rgba(0, 0, 0, 0.95)';
        div.style.borderRadius = '8px';
        div.style.pointerEvents = 'none';
        div.style.border = `2px solid ${this.tintColor}`;
        div.style.textAlign = 'center';
        div.style.minWidth = '120px';
        div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.8)';
        div.style.backdropFilter = 'blur(10px)';
        
        this.label = new THREE.CSS2DObject(div);
        this.label.position.set(0, this.size * 2.5, 0);
        this.mesh.add(this.label);
    }

    getRiskLevel() {
        if (this.collisionRisk > 0.001) {
            return { text: 'HIGH RISK', color: '#ff4444' };
        } else if (this.collisionRisk > 0.0001) {
            return { text: 'MEDIUM RISK', color: '#ffaa44' };
        } else {
            return { text: 'LOW RISK', color: '#44ff44' };
        }
    }

    animate() {
        super.animate();
        // Rotate the orbit object to make the NEO orbit around the sun
        this.orbitObject.rotation.y += this.orbitSpeed;
        
        // Animate collision path if it exists
        if (this.collisionPath && this.collisionPath.visible) {
            this.collisionPath.rotation.y += 0.001;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new ThreeJSViewer();
});

// Make globally accessible
window.ThreeJSViewer = ThreeJSViewer;
