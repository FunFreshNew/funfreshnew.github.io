// FunFreshNew © //
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".model-container").forEach(container => {
        const modelPath = container.dataset.model.trim();
        const width = parseInt(container.dataset.width) || 300;
        const height = parseInt(container.dataset.height) || 300;
        const shadowRes = parseInt(container.dataset.shadowRes) || 1024;
        const lightIntensity = parseFloat(container.dataset.lightIntensity) || 1.0;
        const lightColor = container.dataset.lightColor || "#ffffff";
        const ambientIntensity = parseFloat(container.dataset.ambientIntensity) || 0.5;
        const ambientColor = container.dataset.ambientColor || "#888888";
        const lightAngle = parseFloat(container.dataset.lightAngle) || 45;
        const lightRadius = parseFloat(container.dataset.lightRadius) || 10;
        const lightHeight = parseFloat(container.dataset.lightHeight) || 10;

        let cameraPos = container.dataset.camera ? container.dataset.camera.split(',').map(Number) : [3, 4, 3];
        let cameraTarget = container.dataset.cameraTarget ? container.dataset.cameraTarget.split(',').map(Number) : [0, 1, 0];
        let bgColor = container.dataset.bgcolor || "#303030";

        console.log("Initializing scene for:", modelPath);
        createScene(container, modelPath, width, height, shadowRes, cameraPos, cameraTarget, bgColor,
            ambientIntensity, ambientColor, lightIntensity, lightColor, lightAngle, lightRadius, lightHeight);
    });
});


function createScene(container, modelPath, width, height, shadowRes, cameraPosition, cameraTarget, bgColor,
    ambientIntensity, ambientColor, lightIntensity, lightColor, lightAngle, lightRadius, lightHeight) {
    if (!container) {
        console.error("Container not found.");
        return;
    }

    let autoRotate = false;


    let model = null;



    const wrapper = document.createElement("div");
    wrapper.classList.add("canvas-wrapper");
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.position = "relative";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor); // Apply unique background color

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(...cameraPosition);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(new THREE.Color(ambientColor), ambientIntensity);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(new THREE.Color(lightColor), lightIntensity);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = shadowRes;
    dirLight.shadow.mapSize.height = shadowRes;
    dirLight.shadow.radius = 1;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;

    dirLight.target.position.set(0, 0, 0);
    scene.add(dirLight.target);
    scene.add(dirLight);


    function applyLightSettings(modelElement) {
        if (!modelElement.dirLight) {
            console.error("No directional light found for this model element.");
            return;
        }

        const dirLight = modelElement.dirLight;  // Retrieve stored directional light

        const lightColor = modelElement.getAttribute("data-light-color") || "#ffffff";
        const lightIntensity = parseFloat(modelElement.getAttribute("data-light-intensity")) || 1;
        const lightAngleValue = parseFloat(modelElement.getAttribute("data-light-angle")) || 45;

        dirLight.color.set(lightColor);
        dirLight.intensity = lightIntensity;

        // Apply new angle
        lightAngle = lightAngleValue;
        updateLightPosition(); // Ensure the new light position updates
    }

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
    controls.target.set(...cameraTarget); // Set camera focus point
    controls.update();

    // Disable zoom scrolling initially
    controls.enableZoom = false;

    // Enable zoom scrolling when the user clicks inside the canvas
    renderer.domElement.addEventListener("pointerdown", () => {
        controls.enableZoom = true;
    });

    // Disable zoom scrolling when the user clicks outside the canvas
    document.addEventListener("pointerdown", (event) => {
        if (!wrapper.contains(event.target)) {
            controls.enableZoom = false;
        }
    });




    // Store initial camera position & target
    const initialCameraPosition = camera.position.clone();
    const initialTarget = controls.target.clone();

    function resetCamera() {
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();

        function animateReset(time) {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / duration, 1);
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

    // **Double Click to Reset Camera (Desktop)**
    renderer.domElement.addEventListener("dblclick", resetCamera);

    // **Double Tap to Reset Camera (Touchscreen)**
    let lastTap = 0;
    const doubleTapThreshold = 300; // 300ms max interval for double tap
    let touchStartX = 0;
    let touchStartY = 0;

    renderer.domElement.addEventListener("touchstart", (event) => {
        if (event.touches.length === 1) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            isVerticalSwipe = false; // Reset flag

            if (tapLength < doubleTapThreshold && tapLength > 0) {
                resetCamera();
            }
            lastTap = currentTime;
        }
    });

    renderer.domElement.addEventListener("touchmove", (event) => {
        if (event.touches.length === 1) {
            const touchY = event.touches[0].clientY;
            const deltaY = Math.abs(touchY - touchStartY);

            let isVerticalSwipe = false;
        }
    });

    renderer.domElement.addEventListener("touchend", () => {
        if (isVerticalSwipe) {
            controls.enabled = false; // Disable interaction if it was a vertical swipe
            setTimeout(() => {
                controls.enabled = true; // Re-enable after a short delay
            }, 500);
        }

    });

    // Prevent page scroll only when last click was inside the canvas
    document.querySelectorAll(".ui-button").forEach(button => {
        button.addEventListener("wheel", (event) => {
            if (clickedInsideCanvas) {
                event.preventDefault(); // Prevent page scroll
                const newEvent = new WheelEvent("wheel", {
                    deltaX: event.deltaX,
                    deltaY: event.deltaY,
                    deltaMode: event.deltaMode,
                    bubbles: true,
                    cancelable: true,
                });

                canvas.dispatchEvent(newEvent); // Redirect event to canvas
            }
        }, { passive: false });
    });

    function animateLightOrbit() {
        if (autoRotate) {
            lightAngle += 0.5;
            if (lightAngle > 360) lightAngle = 0;
            updateLightPosition();
        }
        requestAnimationFrame(animateLightOrbit);
    } animateLightOrbit();

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const uiPanel = document.createElement("div");
    uiPanel.style.position = "absolute";
    uiPanel.style.bottom = "10px";
    uiPanel.style.left = "10px";
    uiPanel.style.padding = "0px";
    uiPanel.style.background = "rgba(0, 0, 0, 0)";
    uiPanel.style.color = "white";
    uiPanel.style.display = "flex";
    uiPanel.style.flexDirection = "column-reverse"; // Expands upwards
    uiPanel.style.alignItems = "center";
    uiPanel.style.gap = "0px"; // 
    wrapper.appendChild(uiPanel);



    // Root Button (With Toggle Image)
    function createRootButton() {
        const button = document.createElement("div");
        button.classList.add("ui-button");
        button.style.width = "40px";
        button.style.height = "40px";
        button.style.borderRadius = "0px";
        button.style.background = "rgba(104, 104, 104, 0.4)"; // Default color
        button.style.display = "flex";
        button.style.justifyContent = "center";
        button.style.alignItems = "center";
        button.style.cursor = "pointer";
        button.style.transition = "background 0.2s"; // Smooth transition

        const img = document.createElement("img");
        img.src = "/source/web_ui/orbital_off.png"; // Default state
        img.style.width = "30px";
        img.style.height = "30px";
        img.style.imageRendering = "pixelated";
        button.appendChild(img);

        let isExpanded = false;

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            isExpanded = !isExpanded;

            img.src = isExpanded ? "/source/web_ui/main_root_on.png" : "/source/web_ui/main_root_off.png";

            // Change background color when toggled
            button.style.background = isExpanded ? "rgba(24, 24, 24, 0.7)" : "rgba(104, 104, 104, 0.4)";

            subButtons.forEach((btn, index) => {
                btn.style.transition = "none"; // Cancel animation

                if (isExpanded) {
                    btn.style.display = "block";
                    requestAnimationFrame(() => {
                        btn.style.transition = "opacity 0.3s, transform 0.3s";
                        btn.style.opacity = "1";
                        btn.style.transform = `translateY(${-15 * (index + 1)}px)`;
                    });
                } else {
                    btn.style.opacity = "0";
                    btn.style.transform = "translateY(0)";
                    setTimeout(() => {
                        if (!isExpanded) btn.style.display = "none"; // Hide only if still closed
                    }, 300);
                }
            });
        });

        return button;
    }

    // Sub-Buttons (Expanding upwards) with Toggle State
    function createToggleButton(offIcon, onIcon, action) {

        const button = document.createElement("div");
        button.classList.add("ui-button");
        button.style.width = "30px";
        button.style.height = "30px";
        button.style.borderRadius = "0px";
        button.style.background = "rgba(70, 70, 70, 0.8)";
        button.style.display = "flex";
        button.style.justifyContent = "center";
        button.style.alignItems = "center";
        button.style.cursor = "pointer";
        button.style.opacity = "0";
        button.style.transform = "translateY(0)";
        button.style.transition = "opacity 0.2s, transform 0.2s";

        const img = document.createElement("img");
        img.src = offIcon;
        img.style.width = "30px";
        img.style.imageRendering = "pixelated";
        button.appendChild(img);

        let isOn = false;
        button.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevents triggering document's pointerdown
            isOn = !isOn;
            img.src = isOn ? onIcon : offIcon;
            action(isOn);
            event.stopPropagation();
        });

        return button;
    }

    // Toggle Auto-Rotating Light
    let autoRotateLight = false;
    function toggleAutoRotateLight(state) {
        autoRotateLight = state;
        console.log("Auto-Rotate Light:", autoRotateLight);

        if (autoRotateLight) {
            requestAnimationFrame(updateLightRotation); // Ensure animation starts
        }
    }

    // Function to update light rotation
    function updateLightRotation() {
        if (!autoRotateLight) return; // Stop if autoRotateLight is false

        lightAngle += 0.5; // Increment angle while keeping it continuous
        if (lightAngle > 360) lightAngle -= 360; // Keep it within 0-360 range

        updateLightPosition();
        slider.value = lightAngle; // Sync slider with auto-rotation
        requestAnimationFrame(updateLightRotation);
    }

    // Toggle Model Spinning
    let isModelSpinning = false;
    function toggleModelSpin(state) {
        isModelSpinning = state;
        console.log("Model Spinning:", isModelSpinning);
    }

    // Model Spinning Animation
    function animateModel() {
        if (isModelSpinning && model) {
            model.rotation.y -= 0.02; // Inverted rotation (if needed, change to +=)
        }
        requestAnimationFrame(animateModel);
    }
    animateModel();




    // Create a div for camera coordinates
    const cameraInfo = document.createElement("div");
    cameraInfo.style.position = "absolute";
    cameraInfo.style.top = "0px"; // Moved to top-left
    cameraInfo.style.left = "0px";
    cameraInfo.style.padding = "0px";
    cameraInfo.style.background = "rgba(0, 0, 0, 0.7)";
    cameraInfo.style.color = "white";
    cameraInfo.style.fontSize = "12px";
    cameraInfo.style.fontFamily = "monospace";
    cameraInfo.style.display = "none"; // Initially hidden
    wrapper.appendChild(cameraInfo);

    // Function to update camera position display
    function updateCameraInfo() {
        const pos = camera.position;
        const target = controls.target;

        // Set the inner text of the element to the formatted camera information
        cameraInfo.innerText =
            `Camera: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}\n` +
            `Target: x=${target.x.toFixed(2)}, y=${target.y.toFixed(2)}, z=${target.z.toFixed(2)}`;
    }

    function updateDirLightInfo() {
        if (!dirLight) return;

        const { x, y, z } = dirLight.position;
        dirLightPositionDisplay.innerText = `DirLight Position: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
    }


    // Hidden Slider (Toggle with "F")
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "360";
    slider.step = "1";
    slider.value = lightAngle;
    slider.style.position = "absolute";
    slider.style.top = "39px"; // Moved to top-left
    slider.style.left = "0px";
    slider.style.bottom = "0px";
    slider.style.width = "120px";
    slider.style.height = "5px";
    slider.style.display = "none"; // Initially hidden
    wrapper.appendChild(slider);

    // Create a label for DirLight position info
    const dirLightLabel = document.createElement("div");
    dirLightLabel.style.position = "absolute";
    dirLightLabel.style.top = "28px"; // Below the slider
    dirLightLabel.style.left = "0px";
    dirLightLabel.style.color = "#fff";
    dirLightLabel.style.fontSize = "12px";
    dirLightLabel.style.background = "rgba(0, 0, 0, 0.7)";
    dirLightLabel.style.display = "none"; // Initially hidden
    wrapper.appendChild(dirLightLabel);

    // Update function for DirLight position
    function updateDirLightInfo() {
        if (!dirLight) return;

        const { x, y, z } = dirLight.position;
        dirLightLabel.innerText = `DirLight Pos: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
    }

    slider.addEventListener("input", (event) => {
        lightAngle = parseFloat(event.target.value); // Update light angle
        updateLightPosition();
        updateDirLightInfo(); // Move the light accordingly
    });


    wrapper.appendChild(slider);

    document.addEventListener("keydown", (event) => {
        if (event.key.toLowerCase() === "f") {
            const isHidden = slider.style.display === "none";
            slider.style.display = isHidden ? "block" : "none";
            dirLightLabel.style.display = isHidden ? "block" : "none";
            cameraInfo.style.display = cameraInfo.style.display === "none" ? "block" : "none";





            if (isVisible) {
                updateCameraInfo();
                updateDirLightInfo();
            }
        }
    });




    // Create Buttons
    const rootButton = createRootButton();
    const rotateLightButton = createToggleButton(
        "../source/web_ui/sun_rotate_off.png",
        "../source/web_ui/sun_rotate_on.png",
        toggleAutoRotateLight
    );
    const spinModelButton = createToggleButton(
        "../source/web_ui/fig_rotate_off.png",
        "../source/web_ui/fig_rotate_on.png",
        toggleModelSpin
    );

    uiPanel.appendChild(rootButton);
    uiPanel.appendChild(rotateLightButton);
    uiPanel.appendChild(spinModelButton);

    // Store Sub-Buttons for Expansion
    const subButtons = [rotateLightButton, spinModelButton];



    updateDirLightInfo();
    // Model Rotation Update Loop
    function updateModelRotation() {
        if (isModelSpinning && model) {
            model.rotation.y += 0.02;
        }
        requestAnimationFrame(updateModelRotation);
    }

    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function (gltf) {
        model = gltf.scene; // Store model reference here
        console.log("Model loaded successfully:", modelPath);

        model.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material && node.material.emissive) {
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
        });
    }, undefined, function (error) {
        console.error(`Failed to load model: ${modelPath}`, error);
    });


    // Continuously update camera coordinates while moving
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        updateCameraInfo(); // Keep updating the position
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

// FunFreshNew © //