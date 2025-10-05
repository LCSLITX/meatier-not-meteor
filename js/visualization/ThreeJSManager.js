// Three.js Scene Management
class ThreeJSManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earth = null;
        this.sun = null;
        this.trajectory = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.solarSystemViewer = null;
    }

    setupThreeJS() {
        try {
            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js is not loaded');
            }

            // Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000011);

            // Camera
            this.setupCamera();

            // Renderer
            this.setupRenderer();

            // Controls
            this.setupMouseControls();

            // Lighting
            this.setupLighting();

            // Add to DOM
            const container = document.getElementById('orbit-canvas');
            if (container) {
                container.appendChild(this.renderer.domElement);
            } else {
                throw new Error('Canvas container not found');
            }

            // Animation loop
            this.animate();
            
        } catch (error) {
            console.error('Three.js setup error:', error);
            throw error;
        }
    }

    setupCamera() {
        const container = document.getElementById('orbit-canvas');
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
        this.camera.position.set(0, 0, 500);
    }

    setupRenderer() {
        const container = document.getElementById('orbit-canvas');
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    setupMouseControls() {
        // Check if OrbitControls is available
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.enableRotate = true;
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 0.5;
            this.controls.minDistance = 50;
            this.controls.maxDistance = 2000;
            this.controls.target.set(0, 0, 0);
        } else {
            // Fallback: basic mouse controls without OrbitControls
            this.setupBasicControls();
        }
    }

    setupBasicControls() {
        // Basic mouse controls without OrbitControls
        let mouseX = 0, mouseY = 0;
        let isMouseDown = false;
        
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;
            
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            this.camera.position.x += deltaX * 0.1;
            this.camera.position.y -= deltaY * 0.1;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoom = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(zoom);
        });
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1000, 1000, 1000);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 3000;
        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;
        this.scene.add(directionalLight);
    }

    createSolarSystem() {
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.createNearEarthBelt();
        this.createStars();
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            emissive: 0xff4400,
            emissiveIntensity: 0.5
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(0, 0, 0);
        this.scene.add(this.sun);

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(25, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(glow);
    }

    createPlanets() {
        // More realistic planet data (scaled for visualization)
        const planets = [
            { name: 'Mercury', size: 1.5, distance: 80, color: 0x8c7853, speed: 0.04, orbitalInclination: 7.0 },
            { name: 'Venus', size: 2.5, distance: 120, color: 0xffc649, speed: 0.025, orbitalInclination: 3.4 },
            { name: 'Earth', size: 3, distance: 160, color: 0x6b93d6, speed: 0.02, orbitalInclination: 0.0 },
            { name: 'Mars', size: 2, distance: 220, color: 0xc1440e, speed: 0.015, orbitalInclination: 1.8 },
            { name: 'Jupiter', size: 10, distance: 320, color: 0xd8ca9d, speed: 0.008, orbitalInclination: 1.3 },
            { name: 'Saturn', size: 8, distance: 480, color: 0xfad5a5, speed: 0.005, orbitalInclination: 2.5 }
        ];

        planets.forEach(planet => {
            const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
            const material = new THREE.MeshLambertMaterial({ color: planet.color });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Set initial position with orbital inclination
            const inclination = planet.orbitalInclination * Math.PI / 180;
            mesh.position.x = planet.distance * Math.cos(inclination);
            mesh.position.y = planet.distance * Math.sin(inclination);
            
            mesh.userData = { 
                name: planet.name, 
                speed: planet.speed, 
                distance: planet.distance,
                originalSize: planet.size,
                inclination: inclination,
                angle: 0
            };
            
            if (planet.name === 'Earth') {
                this.enhanceEarthAppearance(mesh);
                this.earth = mesh;
            }
            
            if (planet.name === 'Saturn') {
                this.createSaturnRings(mesh);
            }
            
            this.scene.add(mesh);
            this.createPlanetLabel(mesh, planet.name);
            this.createPlanetOrbit(planet);
        });
    }

    createPlanetOrbit(planet) {
        // Create orbital path
        const points = [];
        const segments = 64;
        const inclination = planet.orbitalInclination * Math.PI / 180;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = planet.distance * Math.cos(angle) * Math.cos(inclination);
            const y = planet.distance * Math.sin(inclination);
            const z = planet.distance * Math.sin(angle);
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.3 
        });
        const orbit = new THREE.Line(geometry, material);
        orbit.userData = { name: planet.name + '_orbit' };
        this.scene.add(orbit);
    }

    enhanceEarthAppearance(earth) {
        // Add atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(4.2, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        earth.add(atmosphere);

        // Add continents (simplified)
        const continentGeometry = new THREE.SphereGeometry(4.1, 32, 32);
        const continentMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        const continents = new THREE.Mesh(continentGeometry, continentMaterial);
        earth.add(continents);
    }

    createSaturnRings(saturn) {
        const ringGeometry = new THREE.RingGeometry(12, 18, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b7355,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        saturn.add(rings);
    }

    createPlanetLabel(planet, name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 32;
        
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#000000';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 5);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(20, 5, 1);
        sprite.position.y = planet.userData.originalSize + 5;
        planet.add(sprite);
    }

    createAsteroidBelt() {
        const asteroidCount = 100;
        for (let i = 0; i < asteroidCount; i++) {
            const geometry = new THREE.DodecahedronGeometry(0.5, 0);
            const material = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.5, 0.5)
            });
            const asteroid = new THREE.Mesh(geometry, material);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 300 + Math.random() * 100;
            asteroid.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 10,
                Math.sin(angle) * distance
            );
            
            asteroid.userData = {
                speed: 0.001 + Math.random() * 0.002,
                originalAngle: angle
            };
            
            this.scene.add(asteroid);
        }
    }

    createNearEarthBelt() {
        const nearEarthCount = 50;
        for (let i = 0; i < nearEarthCount; i++) {
            const geometry = new THREE.OctahedronGeometry(0.3, 0);
            const material = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.1, 0.8, 0.6)
            });
            const asteroid = new THREE.Mesh(geometry, material);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 220 + Math.random() * 60;
            asteroid.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 20,
                Math.sin(angle) * distance
            );
            
            asteroid.userData = {
                speed: 0.005 + Math.random() * 0.005,
                originalAngle: angle
            };
            
            this.scene.add(asteroid);
        }
    }

    createStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        if (this.controls && this.controls.update) {
            this.controls.update();
        }
        
        // Animate planets with realistic orbital motion
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.speed && child.userData.distance) {
                // Update orbital angle
                child.userData.angle += child.userData.speed * deltaTime * 60;
                
                // Calculate new position based on orbital mechanics
                const angle = child.userData.angle;
                const distance = child.userData.distance;
                const inclination = child.userData.inclination;
                
                // Realistic orbital motion with inclination
                child.position.x = distance * Math.cos(angle) * Math.cos(inclination);
                child.position.y = distance * Math.sin(inclination);
                child.position.z = distance * Math.sin(angle);
                
                // Planet rotation (day/night cycle)
                child.rotation.y += child.userData.speed * deltaTime * 60 * 2;
            }
        });
        
        // Animate sun
        if (this.sun) {
            this.sun.rotation.y += 0.001;
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        const container = document.getElementById('orbit-canvas');
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // 3D Filter functions
    togglePlanets(show) {
        // Toggle planet visibility
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.name) {
                child.visible = show;
            }
        });
    }

    toggleAsteroids(show) {
        // Toggle asteroid visibility
        this.scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'DodecahedronGeometry') {
                child.visible = show;
            }
        });
    }

    toggleOrbits(show) {
        // Toggle orbit visibility
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.name && child.userData.name.includes('_orbit')) {
                child.visible = show;
            }
        });
    }

    toggleLabels(show) {
        // Toggle label visibility
        this.scene.children.forEach(child => {
            child.children.forEach(subChild => {
                if (subChild.type === 'Sprite') {
                    subChild.visible = show;
                }
            });
        });
    }

    focusOnEarth() {
        if (this.earth && this.camera) {
            this.camera.position.set(250, 50, 250);
            if (this.controls && this.controls.target) {
                this.controls.target.copy(this.earth.position);
                this.controls.update();
            }
        }
    }

    reset3DView() {
        if (this.camera) {
            this.camera.position.set(0, 0, 500);
            if (this.controls && this.controls.target) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }
    }

    updateZoom(zoomLevel) {
        if (this.camera) {
            this.camera.position.multiplyScalar(zoomLevel);
            if (this.controls) {
                this.controls.update();
            }
        }
    }

    toggleFiltersVisibility() {
        // Toggle 3D filters panel visibility
        const filtersPanel = document.getElementById('3d-filters-panel');
        if (filtersPanel) {
            filtersPanel.style.display = filtersPanel.style.display === 'none' ? 'block' : 'none';
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
    }
}
