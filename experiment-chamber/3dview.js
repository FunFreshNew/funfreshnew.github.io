document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".model-container").forEach(container => {
        const modelPath = container.dataset.model.trim();
        const width = parseInt(container.dataset.width) || 300;
        const height = parseInt(container.dataset.height) || 300;
        const shadowRes = parseInt(container.dataset.shadowRes) || 1024;

        console.log("Initializing scene for:", modelPath);
        createScene(container, modelPath, width, height, shadowRes);
    });
});

function createScene(container, modelPath, width, height, shadowRes) {
    if (!container) {
        console.error("Container not found.");
        return;
    }

    let autoRotate = false;
    let pixelationEnabled = false; // Track pixelation state
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
    camera.position.set(3, 4, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = shadowRes;
    dirLight.shadow.mapSize.height = shadowRes;
    dirLight.shadow.bias = -0.00000001;

    // ✅ FIX: Set the light's target properly
    dirLight.target.position.set(0, 0, 0);
    scene.add(dirLight.target);

    scene.add(dirLight);

    function updateLightPosition() {
        const radians = (lightAngle * Math.PI) / 180;
        dirLight.position.x = Math.cos(radians) * lightRadius;
        dirLight.position.z = Math.sin(radians) * lightRadius;
        dirLight.position.y = lightHeight;

        // ✅ FIX: Make sure shadow camera updates
        dirLight.shadow.camera.updateProjectionMatrix();
    }

    // ✅ FIX: Ensure the light is positioned correctly at the start
    updateLightPosition();

    // ✅ FIX: Force a render update before animation starts
    renderer.render(scene, camera);



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

            // Ease-out using cubic function (slows down toward the end)
            const easeOutT = 1 - Math.pow(1 - t, 3);

            // Smooth interpolation
            camera.position.lerpVectors(startPos, initialCameraPosition, easeOutT);
            controls.target.lerpVectors(startTarget, initialTarget, easeOutT);
            controls.update();

            if (t < 1) {
                requestAnimationFrame(animateReset);
            }
        }

        requestAnimationFrame(animateReset);
    }


    // Reset camera on double click
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
    uiPanel.style.display = "none";
    uiPanel.style.display = "flex";
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


        slider.addEventListener("input", () => onChange(parseFloat(slider.value)));

        return slider;
    }

    function createToggleButton() {
        const button = document.createElement("button");
        button.textContent = autoRotate ? "Auto: ON" : "Auto: OFF";
        button.style.padding = "5px 10px";
        button.style.fontSize = "12px";
        button.style.cursor = "pointer";
        button.style.border = "1px solid white";
        button.style.background = "black";
        button.style.color = "white";
        button.style.borderRadius = "4px";

        button.addEventListener("click", () => {
            autoRotate = !autoRotate;
            button.textContent = autoRotate ? "Auto: ON" : "Auto: OFF";
        });

        return button;
    }

    const slider = createSlider(0, 360, 1, lightAngle, val => { lightAngle = val; updateLightPosition(); });
    const toggleButton = createToggleButton();

    uiPanel.appendChild(slider);
    uiPanel.appendChild(toggleButton);

    let uiHovered = false;
    uiPanel.addEventListener("mouseenter", () => uiHovered = true);
    uiPanel.addEventListener("mouseleave", () => uiHovered = false);

    renderer.domElement.addEventListener("mouseenter", () => {
        if (!uiHovered) uiPanel.style.display = "flex";
    });

    renderer.domElement.addEventListener("mouseleave", () => {
        setTimeout(() => { if (!uiHovered) uiPanel.style.display = "none"; }, 200);
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

        if (pixelationEnabled) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
    }
    animate();

    window.addEventListener("resize", () => {
        const newWidth = container.clientWidth || width;
        const newHeight = container.clientHeight || height;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        composer.setSize(newWidth, newHeight);
    });
}
