const canvas = document.getElementById("tenkiCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
let spawning = false;
let mouse = { x: -9999, y: -9999 };
const spawnTimers = [];

// --- Particle Type Configs ---
const particleTypes = {
    leaf: {
        images: [
            "/source/sekai/leaf1.png",
            "leaf2.png",
            "leaf3.png"
        ],
        gravity: 0.1,
        wind: 0.05,
        weight: 1,
        repelCursor: true,
        cursorSize: 60,
        decayOnHit: true,
        bounceOnHit: false,
        size: { min: 12, max: 24, chanceGrow: 0.3 }
    },
    rain: {
        images: ["raindrop1.png"],
        splashImage: "splash.png",
        gravity: 0.5,
        wind: 0.02,
        weight: 2,
        repelCursor: false,
        bounceOnHit: true,
        size: { min: 2, max: 6, chanceGrow: 0.8 }
    },
    snow: {
        images: [
            "snow1.png",
            "snow2.png",
            "snow3.png"
        ],
        gravity: 0.03,
        wind: 0.01,
        weight: 1,
        repelCursor: true,
        cursorSize: 40,
        decayOnHit: true,
        bounceOnHit: false,
        size: { min: 4, max: 14, chanceGrow: 0.6 }
    }
};

// --- Particle Class ---
class Particle {
    constructor(x, y, typeId) {
        this.id = typeId;
        this.config = particleTypes[typeId];
        this.x = x;
        this.y = y;
        this.vx = this.config.wind * (Math.random() * 2 - 1);
        this.vy = 0;
        this.alpha = 1;
        this.dead = false;

        // Texture selection
        const textureList = this.config.images;
        this.image = new Image();
        this.image.src = textureList[Math.floor(Math.random() * textureList.length)];

        // Splash for rain
        this.splashImage = null;
        if (this.config.splashImage) {
            this.splashImage = new Image();
            this.splashImage.src = this.config.splashImage;
        }

        // Size control
        const sizeConf = this.config.size || {};
        const growChance = sizeConf.chanceGrow ?? 0.5;
        const grow = Math.random() < growChance;
        const min = sizeConf.min ?? 10;
        const max = sizeConf.max ?? 20;
        this.size = grow ? min + Math.random() * (max - min) : min;
    }

    update() {
        if (this.config.repelCursor) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.config.cursorSize) {
                this.vx += dx / dist;
                this.vy += dy / dist;
            }
        }

        this.vy += this.config.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= canvas.height) {
            if (this.config.decayOnHit) {
                this.vx = 0;
                this.vy = 0;
                this.alpha -= 0.01;
                if (this.alpha <= 0) this.dead = true;
            } else if (this.config.bounceOnHit) {
                if (this.splashImage) this.image = this.splashImage;
                this.vy *= -0.3;
                this.vx *= 0.5;
            } else {
                this.dead = true;
            }
        }
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// --- Main Loop ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].dead) particles.splice(i, 1);
    }

    requestAnimationFrame(animate);
}

// --- Spawn Logic ---
function spawnParticlesFromElement(id, typeId, amount = 3) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    for (let i = 0; i < amount; i++) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        particles.push(new Particle(x, y, typeId));
    }
}

function startSpawning(id, typeId, interval = 200, amount = 3) {
    const timer = setInterval(() => {
        if (spawning) spawnParticlesFromElement(id, typeId, amount);
    }, interval);
    spawnTimers.push(timer);
}

function stopSpawning() {
    spawnTimers.forEach(t => clearInterval(t));
    spawnTimers.length = 0;
}

// --- Toggle Spawning Button ---
document.getElementById("spawnToggle").addEventListener("click", () => {
    spawning = !spawning;
});

// --- Auto-start Detection ---
window.addEventListener("load", () => {
    const spawners = document.querySelectorAll(".spawner.auto-start");
    if (spawners.length > 0) {
        spawning = true;
        spawners.forEach(spawner => {
            const id = spawner.id;
            const type = id.includes("leaf") ? "leaf" : id.includes("rain") ? "rain" : "snow";
            startSpawning(id, type, 150);
        });
    }
    animate();
});

// --- Cursor for repelling ---
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});