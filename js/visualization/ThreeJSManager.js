// Three.js Solar System Manager - Based on Working POO Code
class ThreeJSManager {
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
        this.earthOnlyMode = false;
        
        // Theme state
        this.isLightTheme = false;
    }

    // Initialize Three.js scene
    setupThreeJS() {
        try {
            if (typeof THREE === 'undefined') {
                console.error('ThreeJSManager: THREE is undefined');
                return false;
            }

            const container = document.getElementById('orbit-canvas');
            if (!container) {
                console.error('ThreeJSManager: orbit-canvas container not found');
                return false;
            }
            
            container.innerHTML = '';

            // Get container dimensions
            const containerRect = container.getBoundingClientRect();
            const width = containerRect.width || container.clientWidth || 800;
            const height = containerRect.height || container.clientHeight || 600;

            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);

            // Create camera
            this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
            this.camera.position.set(-90, 140, 240);

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            container.appendChild(this.renderer.domElement);
            
            // Debug: Check if canvas was added
            console.log('Canvas added to container:', container.children.length);
            console.log('Canvas element:', this.renderer.domElement);
            console.log('Canvas dimensions:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);

            // Create label renderer
            console.log('CSS2DRenderer available:', typeof THREE.CSS2DRenderer !== 'undefined');
            console.log('CSS2DObject available:', typeof THREE.CSS2DObject !== 'undefined');
            
            if (typeof THREE.CSS2DRenderer !== 'undefined' && typeof THREE.CSS2DObject !== 'undefined') {
                this.labelRenderer = new THREE.CSS2DRenderer();
                this.labelRenderer.setSize(width, height);
                this.labelRenderer.domElement.style.position = 'absolute';
                this.labelRenderer.domElement.style.top = '0px';
                this.labelRenderer.domElement.style.pointerEvents = 'none';
                container.appendChild(this.labelRenderer.domElement);
                console.log('Label renderer created successfully');
            } else {
                console.warn('CSS2DRenderer or CSS2DObject not available - labels will be disabled');
            }

            // Create controls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
            }

            // Setup lighting
            this.setupLighting();
            
            // Add test cube to verify rendering
            const testGeometry = new THREE.BoxGeometry(5, 5, 5);
            const testMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const testCube = new THREE.Mesh(testGeometry, testMaterial);
            testCube.position.set(0, 0, 0);
            this.scene.add(testCube);
            
            // Test render to ensure everything is working
            this.renderer.render(this.scene, this.camera);
            console.log('Initial render completed with test cube');
            
            return true;
        } catch (error) {
            console.error('ThreeJS setup error:', error);
            return false;
        }
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

    createSolarSystem() {
        try {
            if (!this.scene) {
                const success = this.setupThreeJS();
                if (!success) {
                    console.error('ThreeJSManager: Failed to setup Three.js');
                    return false;
                }
            }

            // Create skybox
            this.setupSkybox();
            
            // Create celestial bodies
            this.createBodies();
            
            // Setup theme switcher
            this.setupThemeSwitcher();
            
            // Handle resize
            this.setupResizeListener();
            
            // Start animation
            this.animate();
            
            // Render once to ensure everything is visible
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
                console.log('Solar system render completed');
            }
            
            return true;
        } catch (error) {
            console.error('Error creating solar system:', error);
            return false;
        }
    }

    setupSkybox() {
        // Create procedural stars instead of texture
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });

        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 4000;
            const y = (Math.random() - 0.5) * 4000;
            const z = (Math.random() - 0.5) * 4000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        this.skybox = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.skybox);
    }

    createBodies() {
        // Create Sun
        const sun = new CelestialBody('Sun', 16, null, 0xffaa00, true);
        sun.mesh.add(this.pointLight);
        sun.rotationSpeed = 0.002;
        this.scene.add(sun.mesh);
        this.celestialBodies.push(sun);

        // Create planets with realistic orbital parameters
        const planetsData = [
            { name: 'Mercury', size: 3.2, color: 0xBEBDB8, distance: 28, rot: 0.004, orb: 0.04 },
            { name: 'Venus', size: 5.8, color: 0xF5DDC3, distance: 44, rot: 0.002, orb: 0.015 },
            { name: 'Earth', size: 6, color: 0x6B93D6, distance: 62, rot: 0.02, orb: 0.01 },
            { name: 'Mars', size: 4, color: 0xCF5F27, distance: 78, rot: 0.018, orb: 0.008 },
            { name: 'Jupiter', size: 12, color: 0xE0C9A6, distance: 110, rot: 0.04, orb: 0.002 },
            { name: 'Saturn', size: 10, color: 0xFCE570, distance: 148, rot: 0.038, orb: 0.0009, ring: {inner: 2, outer: 10} },
            { name: 'Uranus', size: 7, color: 0xAFDBF5, distance: 186, rot: 0.03, orb: 0.0004 },
            { name: 'Neptune', size: 7, color: 0x3D5E98, distance: 220, rot: 0.032, orb: 0.0001 }
        ];

        this.orbits = [];
        planetsData.forEach(p => {
            const planet = new Planet(p.name, p.size, p.color, p.distance, p.ring, p.rot, p.orb);
            this.scene.add(planet.orbitObject);
            this.scene.add(planet.orbitLine);
            this.celestialBodies.push(planet);
            this.orbits.push(planet.orbitLine);
        });

        // Create asteroid belt
        this.asteroidBelt = new AsteroidBelt(1000, 85, 100);
        this.scene.add(this.asteroidBelt.beltObject);
        this.celestialBodies.push(this.asteroidBelt);
    }

    setupThemeSwitcher() {
        // Theme switcher functionality
        const setTheme = (isLight) => {
            this.isLightTheme = isLight;
            if (isLight) {
                this.renderer.setClearColor('#f0f8ff');
                this.skybox.visible = false;
                this.ambientLight.intensity = 1.2;
                this.pointLight.intensity = 2;
                this.orbits.forEach(o => o.material.color.set('#666666'));
                document.querySelectorAll('.label').forEach(l => {
                    l.style.color = '#000';
                    l.style.background = 'rgba(255, 255, 255, 0.4)';
                });
            } else {
                this.renderer.setClearColor('#000000');
                this.skybox.visible = true;
                this.ambientLight.intensity = 1.2;
                this.pointLight.intensity = 6;
                this.orbits.forEach(o => o.material.color.set('#cccccc'));
                document.querySelectorAll('.label').forEach(l => {
                    l.style.color = '#FFF';
                    l.style.background = 'rgba(0, 0, 0, 0.6)';
                });
            }
        };
        
        // Set initial dark theme
        setTheme(false);
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;
            
            const container = document.getElementById('orbit-canvas');
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
            const width = containerRect.width || container.clientWidth || 800;
            const height = containerRect.height || container.clientHeight || 600;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
            if (this.labelRenderer) {
                this.labelRenderer.setSize(width, height);
            }
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Animate celestial bodies
        this.celestialBodies.forEach(body => {
            if (body.animate) {
                body.animate();
            }
        });

        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            if (this.labelRenderer) {
                this.labelRenderer.render(this.scene, this.camera);
            }
        }
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
    }

    toggleAsteroids(show = null) {
        this.showAsteroids = show !== null ? show : !this.showAsteroids;
        if (this.asteroidBelt && this.asteroidBelt.beltObject) {
            this.asteroidBelt.beltObject.visible = this.showAsteroids;
        }
    }

    toggleOrbits(show = null) {
        this.showOrbits = show !== null ? show : !this.showOrbits;
        this.orbits.forEach(orbit => {
            orbit.visible = this.showOrbits;
        });
    }

    toggleLabels(show = null) {
        this.showLabels = show !== null ? show : !this.showLabels;
        this.celestialBodies.forEach(body => {
            if (body.label) {
                body.label.visible = this.showLabels;
            }
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
        this.camera.position.set(-90, 140, 240);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    // Cleanup
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
    constructor(name, size, textureUrl, tintColor, isEmissive = false) {
        this.name = name;
        this.size = size;
        this.tintColor = tintColor;
        this.isEmissive = isEmissive;
        this.rotationSpeed = 0;

        this.mesh = this.createMesh();
        this.label = this.createLabel();
        if (this.label) {
            this.mesh.add(this.label);
        }
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 30, 30);
        const material = this.isEmissive 
            ? new THREE.MeshStandardMaterial({ 
                color: this.tintColor || 0xffff00,
                emissive: this.tintColor || 0xffff00,
                emissiveIntensity: 0.3
            })
            : new THREE.MeshStandardMaterial({
                color: this.tintColor || 0x888888,
                roughness: 0.7,
                metalness: 0.1
            });
        return new THREE.Mesh(geometry, material);
    }

    createLabel() {
        if (typeof THREE.CSS2DObject === 'undefined') {
            console.warn('CelestialBody: CSS2DObject not available for', this.name);
            return null;
        }
        
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = this.name;
        div.style.color = '#FFF';
        div.style.fontFamily = 'sans-serif';
        div.style.padding = '4px 8px';
        div.style.background = 'rgba(0, 0, 0, 0.6)';
        div.style.borderRadius = '4px';
        div.style.fontSize = '14px';
        div.style.pointerEvents = 'none';
        
        const label = new THREE.CSS2DObject(div);
        label.position.set(0, this.size * 1.5, 0);
        return label;
    }

    animate() {
        this.mesh.rotation.y += this.rotationSpeed || 0;
    }
}

// Planet Class
class Planet extends CelestialBody {
    constructor(name, size, color, distance, ringData, rotationSpeed, orbitSpeed) {
        super(name, size, null, color);
        this.distance = distance;
        this.ringData = ringData;
        this.rotationSpeed = rotationSpeed;
        this.orbitSpeed = orbitSpeed;
        
        this.orbitObject = new THREE.Object3D();
        this.orbitObject.add(this.mesh);
        this.mesh.position.x = this.distance;
        
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
        const geometry = new THREE.TorusGeometry(this.distance, 0.1, 16, 100);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xcccccc, 
            transparent: true, 
            opacity: 0.4 
        });
        const orbit = new THREE.Mesh(geometry, material);
        orbit.rotation.x = Math.PI / 2;
        return orbit;
    }
    
    animate() {
        super.animate();
        this.orbitObject.rotation.y += this.orbitSpeed;
    }
}

// Asteroid Belt Class
class AsteroidBelt {
    constructor(count, innerRadius, outerRadius) {
        this.count = count;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.beltObject = this.createBelt();
    }
    
    createBelt() {
        const belt = new THREE.Object3D();
        
        for (let i = 0; i < this.count; i++) {
            const size = Math.random() * 0.5 + 0.1;
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x964B00,
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

    animate() {
        this.beltObject.rotation.y += 0.0007;
    }
}

// Make globally accessible
window.ThreeJSManager = ThreeJSManager;

// Test function for debugging
window.testThreeJS = function() {
    console.log('Testing Three.js...');
    
    // Check if THREE is available
    console.log('THREE available:', typeof THREE !== 'undefined');
    
    // Check container
    const container = document.getElementById('orbit-canvas');
    console.log('Container found:', !!container);
    console.log('Container dimensions:', container?.getBoundingClientRect());
    
    if (container && typeof THREE !== 'undefined') {
        // Create simple scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setSize(800, 600);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        
        // Create cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        camera.position.z = 5;
        
        // Render
        renderer.render(scene, camera);
        console.log('Test render completed');
        
        return true;
    }
    
    return false;
};