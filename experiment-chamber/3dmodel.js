const visualSettings = {
    brightness: 1.0,  
    contrast: 1.0,    
    saturation: 1.0   
};

controlSettings.rotationSpeed = 0.3;
controlSettings.zoomSpeed = 0.5;

visualSettings.brightness = 1.2;
visualSettings.contrast = 1;
visualSettings.saturation = 1.1;
updateVisualSettings();


// Check if Three.js is loaded
if (!THREE) {
    console.error("Three.js is not loaded.");
}

// Create Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting Adjustments
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Softer ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Reduce intensity
directionalLight.position.set(3, 5, 2); 
scene.add(directionalLight);

// Add Lighting (Important!)
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 5, 5);
scene.add(light);

// Load GLB Model
const loader = new THREE.GLTFLoader();
loader.load(
    'favian alpaca v2 ALT.glb', // Check path!
    function (gltf) {
        const model = gltf.scene;
        model.position.set(0, -1, 0); // Adjust position
        scene.add(model);
    },
    undefined,
    function (error) {
        console.error("Error loading model:", error);
    }
);

// Set Camera Position
camera.position.z = 5;

// Animate the Model
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();


// Add Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth motion
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2; // Prevent flipping

// Animate & Update Controls
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Fix Responsive Scaling
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});