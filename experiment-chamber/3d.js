document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".model-container").forEach(container => {
        const modelPath = container.dataset.model.trim();
        const width = parseInt(container.dataset.width) || 300;
        const height = parseInt(container.dataset.height) || 300;
        const shadowRes = parseInt(container.dataset.shadowRes) || 1024;

        // Get custom camera position (if defined)
        let cameraPos = container.dataset.camera ? container.dataset.camera.split(',').map(Number) : [3, 4, 3];

        console.log("Initializing scene for:", modelPath);
        createScene(container, modelPath, width, height, shadowRes, cameraPos);
    });
});

function createScene(container, modelPath, width, height, shadowRes, cameraPosition) {
    if (!container) {
        console.error("Container not found.");
        return;
    }

    let autoRotate = false;
    let lightAngle = 45;
    let lightRadius = 10;
    let lightHeight = 10;

    const wrapper = document.createElement("div");
    wrapper.classList.add("canvas-wrapper");
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.position = "relative";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x303030);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(...cameraPosition); // Apply custom camera position

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = shadowRes;
    dirLight.shadow.mapSize.height = shadowRes;
    dirLight.shadow.bias = -0.00000001;
    dirLight.target.position.set(0, 0, 0);
    scene.add(dirLight.target);
    scene.add(dirLight);

    function updateLightPosition() {
        const radians = (lightAngle * Math.PI) / 180;
        dirLight.position.x = Math.cos(radians) * lightRadius;
        dirLight.position.z = Math.sin(radians) * lightRadius;
        dirLight.position.y = lightHeight;
        dirLight.shadow.camera.updateProjectionMatrix();
    }

    updateLightPosition();

    container.innerHTML = "";
    wrapper.appendChild(renderer.domElement);
    container.appendChild(wrapper);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.zoomSpeed = 0.5;
    controls.target.set(0, 1, 0);
    controls.update();

    // Store initial camera position & target
    const initialCameraPosition = camera.position.clone();
    const initialTarget = controls.target.clone();

    function resetCamera() {
        const duration = 1; // Animation duration in seconds
        const startTime = performance.now();

        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();

        function animateReset(time) {
            const elapsed = (time - startTime) / (duration * 2000);
            const t = Math.min(elapsed, 1); // Clamp between 0 and 1

            const easeOutT = 1 - Math.pow(1 - t, 3);

            camera.position.lerpVectors(startPos, initialCameraPosition, easeOutT);
            controls.target.lerpVectors(startTarget, initialTarget, easeOutT);
            controls.update();

            if (t < 1) {
                requestAnimationFrame(animateReset);
            }
        }

        requestAnimationFrame(animateReset);
    }

    renderer.domElement.addEventListener("dblclick", resetCamera);


    // Lights


    function updateLightPosition() {
        const radians = (lightAngle * Math.PI) / 180;
        dirLight.position.x = Math.cos(radians) * lightRadius;
        dirLight.position.z = Math.sin(radians) * lightRadius;
        dirLight.position.y = lightHeight;
        dirLight.shadow.camera.updateProjectionMatrix();
    }

    function animateLightOrbit() {
        if (autoRotate) {
            lightAngle += 0.5;
            if (lightAngle > 360) lightAngle = 0;
            updateLightPosition();
        }
        requestAnimationFrame(animateLightOrbit);
    }
    animateLightOrbit();

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const uiPanel = document.createElement("div");
    uiPanel.style.position = "absolute";
    uiPanel.style.bottom = "10px";
    uiPanel.style.left = "10px";
    uiPanel.style.padding = "8px";
    uiPanel.style.background = "rgba(0, 0, 0, 0.07)";
    uiPanel.style.color = "white";
    uiPanel.style.display = "flex";
    uiPanel.style.flexDirection = "column";
    uiPanel.style.alignItems = "center";
    uiPanel.style.gap = "10px";
    wrapper.appendChild(uiPanel);

    function createSlider(min, max, step, defaultValue, onChange) {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultValue;
        slider.style.width = "120px";
        slider.style.display = "none"; // Hidden by default

        slider.addEventListener("input", () => onChange(parseFloat(slider.value)));

        return slider;
    }

    function createToggleButton() {
        const button = document.createElement("img");
        button.src = "/source/web_ui/orbital_off.png";
        button.style.width = "30px";
        button.style.cursor = "pointer";
        button.style.imageRendering = "pixelated";
        button.style.imageRendering = "crisp-edges";

        let toggleState = 0;
        const images = ["/source/web_ui/orbital_off.png", "/source/web_ui/orbital_on.png"];

        button.addEventListener("click", () => {
            toggleState = (toggleState + 1) % images.length;
            button.src = images[toggleState];

            autoRotate = !autoRotate; // Toggle the auto-rotation of the light
        });

        button.addEventListener("mouseover", () => {
            button.style.cursor = "pointer";
        });

        return button;
    }
    

    const slider = createSlider(0, 360, 1, lightAngle, val => {
        lightAngle = val;
        updateLightPosition();
    });

    const toggleButton = createToggleButton();
    uiPanel.appendChild(toggleButton);
    uiPanel.appendChild(slider);

    // Toggle slider visibility with "F" key
    document.addEventListener("keydown", (event) => {
        if (event.key.toLowerCase() === "f") {
            slider.style.display = slider.style.display === "none" ? "block" : "none";
        }
    });

    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function (gltf) {
        const model = gltf.scene;
        console.log("Model loaded successfully:", modelPath);

        model.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material && node.material.emissive && node.material.emissive.getHex() !== 0x000000) {
                    node.material.emissiveIntensity = 1;
                }
            }
        });

        scene.add(model);
        model.traverse((node) => {
            if (node.isMesh && node.material.map) {
                node.castShadow = true;
                node.receiveShadow = true;

                node.customDepthMaterial = new THREE.MeshDepthMaterial({
                    depthPacking: THREE.RGBADepthPacking,
                    map: node.material.map,
                    alphaTest: 0.5, // Same as above
                });
            }
        }); model.traverse((node) => {
            if (node.isMesh && node.material.map) {
                node.castShadow = true;
                node.receiveShadow = true;

                node.customDepthMaterial = new THREE.MeshDepthMaterial({
                    depthPacking: THREE.RGBADepthPacking,
                    map: node.material.map,
                    alphaTest: 0.5, // Same as above
                });
            }
        });
    },
        undefined,
        function (error) {
            console.error(`Failed to load model: ${modelPath}`, error);
        });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
        const newWidth = container.clientWidth || width;
        const newHeight = container.clientHeight || height;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}
