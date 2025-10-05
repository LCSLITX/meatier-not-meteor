// Three.js Scene Management
class ThreeJSManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.labelRenderer = null;
        this.sun = null;
        this.planets = [];
        this.orbits = [];
        this.asteroidBelt = null;
        this.skybox = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        // Filter states
        this.showPlanets = true;
        this.showAsteroids = true;
        this.showOrbits = true;
        this.showLabels = true;
        this.earthOnlyMode = false;
    }

    setupThreeJS() {
        try {
            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                return false;
            }

            // Check if container exists
            const container = document.getElementById('orbit-canvas');
            if (!container) {
                return false;
            }
            
            // Clear any existing content
            container.innerHTML = '';

            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000011);

            // Camera setup
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                2000
            );
            this.camera.position.set(-90, 140, 240);
            this.camera.lookAt(0, 0, 0);

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: false 
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(1);
            this.renderer.setClearColor(0x000011, 1);
            container.appendChild(this.renderer.domElement);

            // Label renderer setup
            if (typeof THREE.CSS2DRenderer !== 'undefined') {
                this.labelRenderer = new THREE.CSS2DRenderer();
                this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
                this.labelRenderer.domElement.style.position = 'absolute';
                this.labelRenderer.domElement.style.top = '0px';
                this.labelRenderer.domElement.style.pointerEvents = 'none';
                container.appendChild(this.labelRenderer.domElement);
            }

            // Controls setup
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
            }

            // Lighting setup
            this.setupLighting();
            
            console.log('ThreeJS setup completed successfully');
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
    }

    createSolarSystem() {
        try {
            console.log('Creating solar system...');
            
            if (!this.scene) {
                console.log('Scene not found, setting up Three.js...');
                const success = this.setupThreeJS();
                if (!success) {
                    console.error('Failed to setup Three.js');
                    return false;
                }
            }

            console.log('Creating sun...');
            this.createSun();
            
            console.log('Creating planets...');
            this.createPlanets();
            
            console.log('Creating asteroid belt...');
            this.createAsteroidBelt();
            
            console.log('Creating skybox...');
            this.createSkybox();
            
            console.log('Starting animation...');
            this.animate();
            
            console.log('Solar system created successfully');
            return true;
        } catch (error) {
            console.error('Error creating solar system:', error);
            return false;
        }
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(16, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.4
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);
        
        // Add sun light
        this.pointLight = new THREE.PointLight(0xffffff, 2, 600);
        this.sun.add(this.pointLight);
    }

    createPlanets() {
        const planetsData = [
            { name: 'Mercury', size: 3.2, color: 0xBEBDB8, distance: 28, speed: 0.04 },
            { name: 'Venus', size: 5.8, color: 0xF5DDC3, distance: 44, speed: 0.015 },
            { name: 'Earth', size: 6, color: 0x6B93D6, distance: 62, speed: 0.01 },
            { name: 'Mars', size: 4, color: 0xCF5F27, distance: 78, speed: 0.008 },
            { name: 'Jupiter', size: 12, color: 0xE0C9A6, distance: 110, speed: 0.002 },
            { name: 'Saturn', size: 10, color: 0xFCE570, distance: 148, speed: 0.0009, hasRings: true },
            { name: 'Uranus', size: 7, color: 0xAFDBF5, distance: 186, speed: 0.0004 },
            { name: 'Neptune', size: 7, color: 0x3D5E98, distance: 220, speed: 0.0001 }
        ];

        this.planets = planetsData.map((planetData, index) => {
            const planet = this.createPlanet(planetData, index);
            return planet;
        });
    }

    createPlanet(planetData, index) {
        // Planet mesh
        const geometry = new THREE.SphereGeometry(planetData.size, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: planetData.color 
        });
        const planet = new THREE.Mesh(geometry, material);
        
        // Orbit object
        const orbitObject = new THREE.Object3D();
        orbitObject.add(planet);
        this.scene.add(orbitObject);

        planet.position.x = planetData.distance;
        planetData.speed = planetData.speed || 0.01;

        // Add rings for Saturn
        if (planetData.hasRings) {
            const ringGeometry = new THREE.RingGeometry(planetData.size + 2, planetData.size + 8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -0.5 * Math.PI;
            planet.add(ring);
        }
        
        // Add label
        if (this.labelRenderer && typeof THREE.CSS2DObject !== 'undefined') {
            const planetDiv = document.createElement('div');
            planetDiv.className = 'planet-label';
            planetDiv.textContent = planetData.name;
            planetDiv.style.color = '#ffffff';
            planetDiv.style.fontSize = '12px';
            planetDiv.style.fontWeight = 'bold';
            planetDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
            
            const planetLabel = new THREE.CSS2DObject(planetDiv);
            planetLabel.position.set(0, planetData.size * 1.8, 0);
            planet.add(planetLabel);
        }

        // Create orbit ring
        this.createOrbitRing(planetData.distance);

        return {
            mesh: planet,
            orbit: orbitObject,
            data: planetData,
            index: index
        };
    }

    createOrbitRing(distance) {
        const orbitGeometry = new THREE.TorusGeometry(distance, 0.8, 8, 100);
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.3 
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        this.scene.add(orbit);
        this.orbits.push(orbit);
    }

    createAsteroidBelt() {
        this.asteroidBelt = new THREE.Object3D();
        const asteroidCount = 500;
        const beltInnerRadius = 85;
        const beltOuterRadius = 100;

        for (let i = 0; i < asteroidCount; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshLambertMaterial({ color: 0x964B00 });
            const asteroid = new THREE.Mesh(geometry, material);

            const radius = THREE.MathUtils.randFloat(beltInnerRadius, beltOuterRadius);
            const angle = Math.random() * 2 * Math.PI;
            
            asteroid.position.set(
                radius * Math.cos(angle), 
                (Math.random() - 0.5) * 5, 
                radius * Math.sin(angle)
            );
            this.asteroidBelt.add(asteroid);
        }
        this.scene.add(this.asteroidBelt);
    }

    createSkybox() {
        const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x000011,
            side: THREE.BackSide
        });
        this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(this.skybox);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate sun
        if (this.sun) {
            this.sun.rotation.y += 0.002;
        }
        
        // Rotate asteroid belt
        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += 0.0007;
        }

        // Rotate planets and their orbits
        const rotationSpeeds = [0.004, 0.002, 0.02, 0.018, 0.04, 0.038, 0.03, 0.032];

        this.planets.forEach((planet, index) => {
            if (planet.mesh) {
                planet.mesh.rotation.y += rotationSpeeds[index] || 0.01;
            }
            if (planet.orbit && planet.data) {
                planet.orbit.rotation.y += planet.data.speed;
            }
        });

        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
        if (this.labelRenderer) {
            this.labelRenderer.render(this.scene, this.camera);
        }
    }

    // Filter methods
    togglePlanets() {
        this.showPlanets = !this.showPlanets;
        this.planets.forEach(planet => {
            if (planet.mesh) {
                planet.mesh.visible = this.showPlanets;
            }
        });
    }

    toggleAsteroids() {
        this.showAsteroids = !this.showAsteroids;
        if (this.asteroidBelt) {
            this.asteroidBelt.visible = this.showAsteroids;
        }
    }

    toggleOrbits() {
        this.showOrbits = !this.showOrbits;
        this.orbits.forEach(orbit => {
            orbit.visible = this.showOrbits;
        });
    }

    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.planets.forEach(planet => {
            if (planet.mesh) {
                planet.mesh.children.forEach(child => {
                    if (child instanceof THREE.CSS2DObject) {
                        child.visible = this.showLabels;
                    }
                });
            }
        });
    }

    focusOnEarth() {
        if (this.earthOnlyMode) {
            // Show all planets
            this.earthOnlyMode = false;
            this.planets.forEach(planet => {
                if (planet.mesh) {
                    planet.mesh.visible = true;
                }
                if (planet.orbit) {
                    planet.orbit.visible = true;
                }
            });
            // Reset camera
            this.camera.position.set(-90, 140, 240);
            this.controls.target.set(0, 0, 0);
        } else {
            // Show only Earth
            this.earthOnlyMode = true;
            this.planets.forEach(planet => {
                if (planet.mesh) {
                    planet.mesh.visible = (planet.data.name === 'Earth');
                }
                if (planet.orbit) {
                    planet.orbit.visible = (planet.data.name === 'Earth');
                }
            });
            // Focus camera on Earth
            const earth = this.planets.find(p => p.data.name === 'Earth');
            if (earth) {
                this.camera.position.set(-80, 40, 80);
                this.controls.target.copy(earth.mesh.position);
            }
        }
        this.controls.update();
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
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Make globally accessible
window.ThreeJSManager = ThreeJSManager;