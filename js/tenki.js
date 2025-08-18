const canvas = document.getElementById("tenkiCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = document.documentElement.scrollHeight;
const killZoneOffset = -40;


const particles = [];
let running = true;
let paused = false;
let mouse = { x: 1, y: 1 };


// --- Particle Class ---
class Particle {
    constructor(x, y, typeId) {
        this.repelActive = false;
        this.id = typeId;
        this.config = particleTypes[typeId];
        this.x = x;
        this.y = y;
        this.vx = this.config.wind * (Math.random() * 2 - 1);
        this.vy = 0;
        this.alpha = 1;
        this.dead = false;
        this.spawnTime = Date.now();
        this.image = new Image();

        if (this.config.images && Array.isArray(this.config.images)) {
            if (typeof this.config.images[0] === "string") {
                // Fallback for simple arrays (equal chance)
                const randImg = this.config.images[Math.floor(Math.random() * this.config.images.length)];
                this.image.src = randImg;
            } else {
                // Weighted selection
                const totalWeight = this.config.images.reduce((sum, img) => sum + img.weight, 0);
                let pick = Math.random() * totalWeight;
                for (const img of this.config.images) {
                    if (pick < img.weight) {
                        this.image.src = img.src;
                        break;
                    }
                    pick -= img.weight;
                }
            }
        }
        else {
            this.image.src = this.config.image || "";
        }
        this.splashImage = this.config.splashImage ? new Image() : null;
        if (this.config.splashImages && Array.isArray(this.config.splashImages)) {
            const randSplash = this.config.splashImages[Math.floor(Math.random() * this.config.splashImages.length)];
            this.splashImage = new Image();
            this.splashImage.src = randSplash;
        } else if (this.config.splashImage) {
            this.splashImage = new Image();
            this.splashImage.src = this.config.splashImage;
        } else {
            this.splashImage = null;
        }


        this.repelled = false;
        this.lastRepelTime = 0;
        this.rotationSpeed = (Math.random() - 0.5) * this.config.rotationSpeedRange;
        this.defaultRotationSpeed = this.rotationSpeed; // 
        this.rotation = 0;
        this.rotationSpeed = 0;

        // If rotation is enabled for this particle, assign random speed
        if (this.config.rotate) {
            this.rotationSpeed = (Math.random() - 0.5) * this.config.rotationSpeedRange;
        }

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
    }

    update() {
        // Apply gravity first (always)
        this.vy += this.config.gravity;
        this.repelActive = false; // Reset each frame

        if (this.config.repelCursor) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.config.cursorSize) {
                this.repelActive = true; // It's being influenced!

                const repelPower = this.config.repelPower ?? 1;
                const falloff = 1 - dist / this.config.cursorSize;

                this.vx += (dx / dist) * repelPower * falloff;
                this.vy += (dy / dist) * repelPower * falloff;

                if (dy < 0) {
                    this.vy *= 0.9;
                }

                // Directional repel-based rotation (5-zone logic)
                let direction = 0;
                const angle = Math.atan2(dy, dx);

                if (dy < -10) {
                    if (dx < -10) direction = -1;
                    else if (dx > 10) direction = 1;
                }

                const repelRotationSpeed = direction * (this.config.rotationStrength ?? 0.05) * falloff;
                this.rotation += repelRotationSpeed;
            }

        }

        // Time threshold in ms to consider repel "recent"
        const repelGracePeriod = 300;

        if (this.config.rotate) {
            const timeSinceRepel = Date.now() - this.lastRepelTime;

            if (timeSinceRepel > repelGracePeriod) {
                // Not recently repelled — apply default rotation
                this.repelledRecently = false;
                this.rotation += this.rotationSpeed;
            }
        }

        // Apply retention on vertical velocity (after repel)
        if (this.vy < 0) {
            this.vy *= 0.98;  // Retain upward motion for a while, gradually slowing down
        }

        // Update particle position
        this.x += this.vx;
        this.y += this.vy;

        // Hit the bottom
        const killY = window.scrollY + window.innerHeight + killZoneOffset;
        if (this.y >= killY) {
            if (this.config.decayOnHit) {
                // Smooth deceleration for movement
                this.vx *= 0.95;
                this.vy *= 0.8;

                if (Math.abs(this.vx) < 0.05) this.vx = 0;
                if (Math.abs(this.vy) < 0.05) this.vy = 0;

                // 🔁 Smooth deceleration for rotation
                this.rotationSpeed *= 0.9;
                if (Math.abs(this.rotationSpeed) < 0.001) {
                    this.rotationSpeed = 0;
                }

                // Begin fading after fully stopped
                if (this.vx === 0 && this.vy === 0 && this.rotationSpeed === 0) {
                    this.alpha -= 0.01;
                    if (this.alpha <= 0) this.dead = true;
                }
            } else {
                this.dead = true;
            }
        }
        const killLeft = -100;
        const killRight = canvas.width + 100;

        if (this.x < killLeft || this.x > killRight) {
            this.dead = true;
        }

        // ⏳ Lifespan fadeout and removal
        let age = Date.now() - this.spawnTime;
        let lifeLeft = this.config.lifespan - age;
        if (lifeLeft < 1000) {
            this.alpha = Math.max(0, lifeLeft / 1000);
        }
        if (lifeLeft <= 0) {
            this.vx = 0;
            this.vy = 0;
            this.alpha -= 0.01;
            if (this.alpha <= 0) this.dead = true;
        }

        // Apply rotation if enabled
        if (this.config.rotate) {
            this.rotation += this.rotationSpeed;
        }
    }

    draw() {
        if (this.alpha <= 0) return;

        const size = Math.round(20 * this.config.size);
        const xPos = Math.floor(this.x);
        const yPos = Math.floor(this.y);

        ctx.globalAlpha = this.alpha;
        ctx.save();
        ctx.translate(xPos + size / 2, yPos + size / 2);
        ctx.rotate(this.rotation);

        const isLegendary = [...RARE_PARTICLE].some(name =>
            this.image.src.includes(name)
        );

        if (isLegendary) {
            ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
            ctx.shadowBlur = 20;
        }

        ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// --- Main Loop ---
function animate() {
    if (!running) return; // If fully disabled, stop everything
    requestAnimationFrame(animate);

    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Remove dead particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].dead) particles.splice(i, 1);
        }

    } else {
        // Still redraw existing particles without updating
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => p.draw());
    }
}

// --- Spawn Logic ---
function spawnParticlesFromElement(id, typeId) {

    const el = document.getElementById(id);
    if (!el) return; // Exit if the element doesn't exist

    const rect = el.getBoundingClientRect();
    const density = particleTypes[typeId].density || 5; // Use the density configured for each type, default to 5 if not defined

    for (let i = 0; i < density; i++) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height - 50;
        particles.push(new Particle(x, y, typeId));
    }
}

// --- ZAWARUDO: Pause and Resume ---
document.getElementById("zawarudo").addEventListener("click", () => {
    paused = !paused;
});

// --- Disable/Enable Tenki ---
document.getElementById("disableTenki").addEventListener("click", () => {
    running = !running;

    const img = document.getElementById("tenkiToggleImg") || document.getElementById("disableTenki");
    if (running) {
        animate();
        spawnParticlesRandomly();
        img.src = "/source/tenki/tenki-on.png"; // ON image
    } else {
        particles.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        img.src = "/source/tenki/tenki-off.png"; // OFF image
    }
});



// --- Mouse Tracker for Dodge ---
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// total particle
function countParticlesByType(typeId) {
    return particles.filter(p => p.id === typeId).length;
}

// --- Spawner Loop ---
// Set a spawn rate (milliseconds)
const spawnRate = 100; // Adjust this value to control how often particles spawn (lower = faster)

function spawnParticlesRandomly() {
    if (!running || paused) return;

    const spawners = [
        { id: "leafSpawner", type: "leaf" },
        { id: "autumnSpawner", type: "autumn" },
        { id: "summerSpawner", type: "summer" },
        { id: "rainSpawner", type: "rain" },
        { id: "snowSpawner", type: "snow" },
        { id: "s_rainSpawner", type: "s_rain" },
        { id: "s_snowSpawner", type: "s_snow" },
    ];

    const randomSpawner = spawners[Math.floor(Math.random() * spawners.length)];
    const el = document.getElementById(randomSpawner.id);

    if (el && particleTypes[randomSpawner.type]) {
        spawnParticlesFromElement(randomSpawner.id, randomSpawner.type);

        // Use individual spawnRate for this type
        const rate = particleTypes[randomSpawner.type].spawnRate || 50;
        setTimeout(spawnParticlesRandomly, rate);
    } else {
        // fallback to a default delay if no element/type matched
        setTimeout(spawnParticlesRandomly, 100);
    }
}


// Preloaded images for better performance
const preloadedImages = {
    leaf: [],
    snow: [],
    rain: new Image(),
    splashRain: new Image()
};

// 🌿 Leaf Images (includes normal and dead leaves)
const leafImagePaths = [];

// Add normal leaves
for (let i = 1; i <= 9; i++) {
    leafImagePaths.push(`leaf${i}.png`);
}

// Add dead leaves
for (let i = 1; i <= 9; i++) {
    leafImagePaths.push(`dead_leaf${i}.png`);
}

for (let i = 1; i <= 9; i++) {
    leafImagePaths.push(`dry_leaf${i}.png`);
}

leafImagePaths.forEach((name, i) => {
    const img = new Image();
    img.src = `/source/tenki/${name}`;
    preloadedImages.leaf[i] = img;
});

// ❄️ Snow Images
const snowImagePaths = [
    "snow1.png", "snow2.png", "snow3.png", "snow4.png",
    "snow5.png", "snow9.png"
];
snowImagePaths.forEach((name, i) => {
    const img = new Image();
    img.src = `/source/tenki/${name}`;
    preloadedImages.snow[i] = img;
});

// 🌧️ Rain Images
preloadedImages.rain.src = "/source/tenki/droplet1.png";
preloadedImages.splashRain.src = "/source/tenki/splash1.png";

const RARE_PARTICLE = new Set(["leaf9", "snow9", "ash9", "rain9"]);

const particleTypes = {
    leaf: {
        images: [
            { src: "/source/tenki/leaf1.png", weight: 500 },
            { src: "/source/tenki/leaf2.png", weight: 500 },
            { src: "/source/tenki/leaf3.png", weight: 200 },
            { src: "/source/tenki/leaf4.png", weight: 200 },
            { src: "/source/tenki/leaf5.png", weight: 200 },
            { src: "/source/tenki/leaf6.png", weight: 200 },
            { src: "/source/tenki/dry_leaf1.png", weight: 200 },
            { src: "/source/tenki/dry_leaf2.png", weight: 200 },
            { src: "/source/tenki/dry_leaf3.png", weight: 100 },
            { src: "/source/tenki/dry_leaf4.png", weight: 100 },
            { src: "/source/tenki/dry_leaf5.png", weight: 100 },
            { src: "/source/tenki/dry_leaf6.png", weight: 100 },
            { src: "/source/tenki/sakura1.png", weight: 100 },
            { src: "/source/tenki/sakura2.png", weight: 100 },
            { src: "/source/tenki/sakura3.png", weight: 100 },
            { src: "/source/tenki/leaf9.png", weight: 10 }
        ],
        gravity: 0.002,
        wind: 2,
        size: 2,
        repelCursor: true,
        repelPower: 0.1,
        cursorSize: 50,
        decayOnHit: true,
        bounceOnHit: false,
        lifespan: 100000,
        rotate: true,
        rotationSpeedRange: Math.PI / 50,
        density: 4,
        spawnRate: 200
    },
    rain: {
        image: "/source/tenki/droplet1.png",
        splashImage: "/source/tenki/splash1.png",
        gravity: 0.5,
        wind: 0.2,
        size: 2,
        repelCursor: false,
        bounceOnHit: true,
        lifespan: 3000,
        density: 10,
        spawnRate: 100 // 🟢 fast and frequent
    },
    snow: {
        images: [
            { src: "/source/tenki/snow1.png", weight: 500 },
            { src: "/source/tenki/snow2.png", weight: 500 },
            { src: "/source/tenki/snow3.png", weight: 100 },
            { src: "/source/tenki/snow4.png", weight: 100 },
            { src: "/source/tenki/snow5.png", weight: 100 },
            { src: "/source/tenki/snow9.png", weight: 2.5 }

        ],
        gravity: 0.001,
        wind: 1,
        size: 1.5,
        repelCursor: true,
        repelPower: 0.1,
        cursorSize: 50,
        decayOnHit: true,
        bounceOnHit: false,
        lifespan: 100000,
        rotate: true,
        rotationSpeedRange: Math.PI / 50,
        density: 15,
        spawnRate: 1 // 
    }
};

animate();
spawnParticlesRandomly();