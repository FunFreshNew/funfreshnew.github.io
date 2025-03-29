// FunFreshNew © //
/* Tinipix Stable MIX*/

document.addEventListener("DOMContentLoaded", () => {
    class Tinipix {
        static instances = [];
        static fpsScale = 1;
        static fpsDetected = false;
        static fpsPopup = null;
        static fpsDetectionEnabled = true; // Toggle for FPS detection
    
        constructor(element, settings = {}) {
            this.element = element;
            if (!element) return;
            this.element.removeAttribute("id");
    
            this.velocity = { x: Math.random() > 0.5 ? 2 : -2, y: 0 };
    
            this.ground = document.querySelector("#ground");
    
            this.position = {
                x: this.ground.clientLeft + Math.random() * this.ground.clientWidth,
                y: this.ground.offsetTop - this.element.offsetHeight
            };
    
            this.gravity = 0.25;
            this.isJumping = false;
            this.isStaying = false;
            this.onGround = true;
            this.isDragging = false;
            this.dragThreshold = 30;
            this.justRanAway = false;
            this.dragDisabledUntil = 0;
            this.lastDblClickTime = 0;
            this.lastRunEndTime = 0;
            Tinipix.seedDelay = Math.random() * 2000;
            Tinipix.instances.push(this);
    
            this.settings = {
                avoidCollision: settings.avoidCollision ?? false,
                staySpacing: settings.staySpacing ?? 0,
                jumpStrength: settings.jumpStrength ?? 2,
                jumpInterval: settings.jumpInterval ?? 1,
                stayChance: settings.stayChance ?? 0.1,
                stayDurationMin: settings.stayDurationMin ?? 2000,
                stayDurationMax: settings.stayDurationMax ?? 5000,
                pixelScale: settings.pixelScale ?? 2,
                walkSpeed: settings.walkSpeed ?? 0.5,
                walkFlipChance: settings.walkFlipChance ?? 0.01,
                stayFlipChance: settings.stayFlipChance ?? 0.02,
                lookAroundInterval: settings.lookAroundInterval ?? [1000, 3000],
                asymmetric: settings.asymmetric ?? false,
                textures: settings.textures ?? { left: element.src, right: element.src }
            };
    
            Tinipix.instances.push(this);
            this.init();
        }
    
        updatePosition() {
            const offsetY = -this.ground.getBoundingClientRect().top - window.scrollY + 69; //Nice
            this.element.style.left = `${this.position.x}px`;
            this.element.style.top = `${this.position.y + offsetY}px`;
        }

        move() {
            if (this.isDragging) {
                requestAnimationFrame(() => this.move());
                return;
            }
    
            let now = performance.now();
            let dt = (now - (this.lastUpdateTime || now)) / 16.67; // Normalize to 60 FPS
            this.lastUpdateTime = now;
    
            if (!this.isStaying && this.onGround && !this.isJumping) {
                this.startHop();
            }
    
            if (!this.isStaying) {
                this.position.x += (this.velocity.x * this.settings.walkSpeed) * Tinipix.fpsScale;
            }
    
            this.velocity.y += this.gravity * Tinipix.fpsScale;
            this.position.y += this.velocity.y * Tinipix.fpsScale;
    
            this.onGround = false;
    
            if (this.position.y >= this.ground.offsetTop - this.element.offsetHeight) {
                this.position.y = this.ground.offsetTop - this.element.offsetHeight;
                this.velocity.y = 0;
                this.onGround = true;
            }
    
            const minX = this.ground.clientLeft;
            const maxX = this.ground.clientLeft + this.ground.clientWidth - this.element.offsetWidth;
    
            if (this.position.x <= minX) {
                this.position.x = minX + 1;
                this.velocity.x = Math.abs(this.velocity.x);
            } else if (this.position.x >= maxX) {
                this.position.x = maxX - 1;
                this.velocity.x = -Math.abs(this.velocity.x);
            }
    
            this.setScale(this.velocity.x > 0 ? 1 : -1);
    
            if (this.onGround && Math.random() < this.settings.stayChance && !this.isStaying) {
                this.startStay();
            }
    
            this.updatePosition();
            this.avoidStacking();
    
            requestAnimationFrame(() => this.move());
        }

    
        init() {
            this.move();
            this.element.addEventListener("dblclick", (event) => this.runAway(event.clientX));
            this.element.addEventListener("mousedown", (event) => this.prepareDrag(event));
    
            this.element.style.backfaceVisibility = "visible";
            this.element.style.imageRendering = "pixelated";
    
            this.element.style.userSelect = "none";
            this.element.style.pointerEvents = "auto";
            this.element.draggable = false;
    
            this.setScale(0);
        }
    
        setScale(direction) {
            if (!this.isDragging) {
                this.element.style.transform = `scale(${direction}, 1)`;
                if (this.settings.asymmetric) {
                    this.setTexture(direction > 0 ? "right" : "left");
                }
            }
        }
    
        setTexture(direction) {
            if (this.settings.asymmetric) {
                this.element.src = this.settings.textures[direction];
            }
        }
    
        


        avoidStacking() {
            if (!this.settings.avoidCollision) return; // Skip if collision is disabled for this Tinipix

            for (let other of Tinipix.instances) {
                if (other !== this && other.settings.avoidCollision) { // Only interact if the other Tinipix has collision enabled
                    const dx = other.position.x - this.position.x;
                    const dy = other.position.y - this.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = this.element.offsetWidth * 1.2;

                    if (distance < minDistance) {
                        const angle = Math.atan2(dy, dx);
                        const pushX = Math.cos(angle) * (minDistance - distance) * 0.5;
                        const pushY = Math.sin(angle) * (minDistance - distance) * 0.5;

                        this.position.x -= pushX;
                        this.position.y -= pushY;
                        other.position.x += pushX;
                        other.position.y += pushY;
                    }
                }
            }
        }

        startHop() {
            if (this.onGround && !this.isStaying) {
                this.velocity.y = -this.settings.jumpStrength;
                this.isJumping = true;
                setTimeout(() => {
                    this.isJumping = false;
                }, 100);
            }
        }

        startStay() {
            this.isStaying = true;
            this.lookAround();
            const stayTime = Math.random() * (this.settings.stayDurationMax - this.settings.stayDurationMin) + this.settings.stayDurationMin;

            for (let other of Tinipix.instances) {
                if (other !== this) {
                    const dx = Math.abs(other.position.x - this.position.x);
                    if (dx < this.element.offsetWidth * this.settings.staySpacing) {
                        this.position.x += (Math.random() > 0.5 ? 1 : -1) * this.element.offsetWidth;
                    }
                }
            }

            setTimeout(() => {
                this.isStaying = false;
            }, stayTime);
        }


        lookAround() {
            // Only 70% chance to actually look around
            if (Math.random() < 0.7) {
                const lookTimes = Math.random() < 0.85 ? 1 : 2;
                let count = 0.5;

                const flip = () => {
                    if (count < lookTimes) {
                        this.velocity.x *= -1;
                        this.setScale(this.velocity.x > 0 ? 1 : -1);
                        count++;

                        setTimeout(flip,
                            Math.random() * (this.settings.lookAroundInterval[1] - this.settings.lookAroundInterval[0])
                            + this.settings.lookAroundInterval[0]
                        );
                    }
                };

                setTimeout(flip, Math.random());
            }
        }

        runAway(clickX) {
            if (this.onGround) {
                this.isStaying = false;
                this.velocity.y = -this.settings.jumpStrength * 1.5;
                this.justRanAway = true;
                this.lastDblClickTime = Date.now();
                this.dragDisabledUntil = Date.now() + 500; // Disable dragging for 500ms

                setTimeout(() => {
                    const direction = clickX < this.position.x ? 1 : -1;
                    this.velocity.x = direction * 6;

                    setTimeout(() => {
                        this.velocity.x = Math.random() > 0.5 ? 2 : -2;
                        this.justRanAway = false;
                        this.lastRunEndTime = Date.now(); // Mark end of runaway event
                    }, 1500);
                }, 150);
            }
        }

        prepareDrag(event) {
            const timeSinceLastDblClick = Date.now() - this.lastDblClickTime;
            const timeSinceRunEnd = Date.now() - this.lastRunEndTime;

            // Block dragging if too soon after a dblclick OR if still recovering from running
            if (timeSinceLastDblClick < 500 || timeSinceRunEnd < 500 || Date.now() < this.dragDisabledUntil) return;

            this.dragTimeout = setTimeout(() => {
                this.startDrag(event);
            }, 150); // 👈 User must hold the mouse down for 150ms to start dragging

            document.addEventListener("mouseup", this.cancelDrag); // Listen for quick releases
            document.addEventListener(event.type.includes("touch") ? "touchend" : "mouseup", this.cancelDrag);
        }

        cancelDrag = () => {
            clearTimeout(this.dragTimeout); // Prevent drag if mouse was released quickly
            document.removeEventListener("mouseup", this.cancelDrag);
        };

        startDrag(event) {
            event.preventDefault();
            this.isDragging = true;
            this.isStaying = true;
            this.velocity.x = 0;
            this.velocity.y = 0;

            // ✅ Store offset relative to Tinipix's position
            this.dragOffsetX = event.clientX - this.position.x;
            this.dragOffsetY = event.clientY - this.position.y;

            document.addEventListener("mousemove", this.dragMove);
            document.addEventListener("mouseup", this.stopDrag);
            document.addEventListener("mouseleave", this.stopDrag);

        }

        dragMove = (event) => {
            if (!this.isDragging) return;

            // ✅ New position, keeping cursor alignment with slight offset above
            let newX = event.clientX - this.dragOffsetX;
            let newY = event.clientY - this.dragOffsetY - 10; // ⬆ Slightly above cursor

            this.position.x = newX;
            this.position.y = newY;
            this.updatePosition();
        };

        stopDrag = () => {
            this.isDragging = false;
            this.isStaying = false;

            // ✅ Ensure it lands properly on the ground
            const groundY = ground.offsetTop - this.element.offsetHeight;
            if (this.position.y >= groundY) {
                this.position.y = groundY;
                this.onGround = true;
                this.velocity.y = -this.settings.jumpStrength * 1.2; // 👈 Extra boost to restore normal hop
            } else {
                this.onGround = false;
            }

            // ✅ Restore natural walking speed
            this.velocity.x = (Math.random() > 0.5 ? 2 : -2) * (this.settings.walkSpeed * 2); // 👈 Speed boost to normalize walk

            this.updatePosition();

            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("mouseup", this.stopDrag);
            document.removeEventListener("mouseleave", this.stopDrag);
        };

        

        static detectFPS() {
            if (!Tinipix.fpsDetectionEnabled || Tinipix.fpsDetected) return;
    
            let lastTime = performance.now();
            let frameCount = 0;
    
            const measureFPS = () => {
                frameCount++;
                let now = performance.now();
                let elapsed = now - lastTime;
    
                if (elapsed >= 1500) { // Measure over 0.5s
                    let detectedFPS = Math.round((frameCount / elapsed) * 1000);
                    Tinipix.assignFPSTemplate(detectedFPS);
                    Tinipix.showFPSPopup(detectedFPS);
                    Tinipix.fpsDetected = true;
                    return;
                }
                requestAnimationFrame(measureFPS);
            };
    
            requestAnimationFrame(measureFPS);
        }
    
        static assignFPSTemplate(fps) {
            let scaleMap = {
                60: 1.5,  // Increase values (slower)
                75: 1.2,  // Slight increase
                90: 1.0,  // Baseline
                120: 0.75, // Reduce values
                144: 0.625,
                165: 0.545,
                240: 0.375  // Fastest movement reduction
            };
    
            let closestFPS = Object.keys(scaleMap).reduce((prev, curr) => 
                Math.abs(curr - fps) < Math.abs(prev - fps) ? curr : prev
            );
    
            Tinipix.fpsScale = scaleMap[closestFPS];
            console.log(`Detected FPS: ${fps}, Applying scale: ${Tinipix.fpsScale}`);
        }
    
        static showFPSPopup(fps) {
            if (Tinipix.fpsPopup) return; // Prevent duplicate popups
    
            let popup = document.createElement("div");
            popup.innerText = `Detected Refresh Rate: ${fps} Hz`;
            popup.style.position = "fixed";
            popup.style.top = "10px";
            popup.style.left = "50%";
            popup.style.transform = "translateX(-50%)";
            popup.style.backgroundColor = "black";
            popup.style.color = "white";
            popup.style.padding = "10px";
            popup.style.borderRadius = "5px";
            popup.style.zIndex = "9999";
            document.body.appendChild(popup);
    
            setTimeout(() => {
                popup.remove();
                Tinipix.fpsPopup = null;
            }, 3000);
            
            Tinipix.fpsPopup = popup;
        }
    
        static disableFPSDetection() {
            Tinipix.fpsDetectionEnabled = false;
        }
    }
    const tinipixSettings = {
        favian: {
            stayChance: 0.5,
            stayDurationMin: 500,
            stayDurationMax: 3000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.02,
            avoidCollision: false,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_favian_left.png",
                right: "../source/tinipix/tinipix_favian_right.png"
            }
        },
        olen: {
            stayChance: 0.5,
            stayDurationMin: 150,
            stayDurationMax: 2000,
            pixelScale: 1,
            walkSpeed: 0.3,
            stayFlipChance: 0.04,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_olen_left.png",
                right: "../source/tinipix/tinipix_olen_right.png"
            }
        },
        tennuqi: {
            stayChance: 0.8,
            stayDurationMin: 150,
            stayDurationMax: 9000,
            pixelScale: 1,
            walkSpeed: 0.4,
            stayFlipChance: 0.04,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_tennuqi_left.png",
                right: "../source/tinipix/tinipix_tennuqi_right.png"
            }
        },
        kikan: {
            stayChance: 0.05,
            stayDurationMin: 1500,
            stayDurationMax: 2000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.05,
            walkDistanceMin: 10,
            walkDistanceMax: 50
        },
        duck: {
            stayChance: 0.05,
            stayDurationMin: 1500,
            stayDurationMax: 2000,
            pixelScale: 1,
            walkSpeed: 0.25,
            stayFlipChance: 0.05,
            walkDistanceMin: 10,
            walkDistanceMax: 50
        },
        fyn: {
            stayChance: 0.09,
            stayDurationMin: 1500,
            stayDurationMax: 5000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.06,
            walkDistanceMin: 10,
            walkDistanceMax: 50
        },
        liner: {
            stayChance: 0.8,
            stayDurationMin: 150,
            stayDurationMax: 9000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.04,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_liner_left.png",
                right: "../source/tinipix/tinipix_liner_right.png"
            }
        },
        mega: {
            stayChance: 0.06,
            stayDurationMin: 200,
            stayDurationMax: 9000,
            pixelScale: 1,
            walkSpeed: 0.4,
            stayFlipChance: 0.03,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_mega_left.png",
                right: "../source/tinipix/tinipix_mega_right.png"
            }
        },
        debug: {
            stayChance: 0.06,
            stayDurationMin: 200,
            stayDurationMax: 9000,
            pixelScale: 1,
            walkSpeed: 0.4,
            stayFlipChance: 0.03,
            asymmetric: true,
            walkDistanceMin: 10,
            walkDistanceMax: 50,
            textures: {
                left: "../source/tinipix/tinipix_debug_left.png",
                right: "../source/tinipix/tinipix_debug_right.png"
            }
        }
    };

    document.querySelectorAll(".tinipix").forEach((img) => {
        if (img.style.visibility !== "collapse") {
            const id = img.id; // Get unique ID
            const settings = tinipixSettings[id] || {}; // Load custom settings

            // Find the specific ground for this Tinipix
            const ground = document.getElementById(`${id}:ground`);

           
            new Tinipix(img, settings);
        }
    });



    function decideToStay(tinipix) {
        let stayChance = tinipix.settings.stayChance || 0.3;

        if (Math.random() < stayChance) {
            let delay = tinipix.seedDelay; // Each tinipix has a different delay

            setTimeout(() => {
                let targetSpot = findEmptySpot(tinipix); // Find an empty location

                if (targetSpot) {
                    tinipix.moveTo(targetSpot.x, targetSpot.y, () => {
                        occupiedPositions.push({ x: targetSpot.x, y: targetSpot.y });

                        // After staying, remove from occupied positions and allow movement again
                        setTimeout(() => {
                            occupiedPositions = occupiedPositions.filter(pos =>
                                !(pos.x === targetSpot.x && pos.y === targetSpot.y)
                            );
                            tinipix.resumeWalking();
                        }, tinipix.settings.stayDuration || 2000);
                    });
                }
            }, delay); // Apply random delay
        }
    }

    function decideNextAction(tinipix) {
        setTimeout(() => {
            if (Math.random() < 0.5) {
                decideToStay(tinipix);
            } else {
                tinipix.walkRandomly();
            }
        }, tinipix.seedDelay); // Add delay so they don’t all move at once
    }

    function findEmptySpot(tinipix, searchRadius = 50, maxTries = 10) {
        for (let i = 0; i < maxTries; i++) {
            let newX = tinipix.x + (Math.random() * searchRadius * 2 - searchRadius);
            let newY = tinipix.y + (Math.random() * searchRadius * 2 - searchRadius);

            // Check if the spot is occupied
            let isOccupied = occupiedPositions.some(pos => {
                return Math.abs(pos.x - newX) < 10 && Math.abs(pos.y - newY) < 10;
            });

            if (!isOccupied) {
                return { x: newX, y: newY };
            }
        }
        return null; // No free spot found
    }

    function decideToStay(tinipix) {
        let stayChance = tinipix.settings.stayChance || 0.3;

        if (Math.random() < stayChance) {
            let targetSpot = findEmptySpot(tinipix);

            if (targetSpot) {
                tinipix.moveTo = function (x, y, onArrive) {
                    let speed = tinipix.settings.walkSpeed || 2;
                    let dx = x - tinipix.x;
                    let dy = y - tinipix.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let steps = distance / speed;

                    let stepCount = 0;
                    let moveInterval = setInterval(() => {
                        if (stepCount >= steps) {
                            clearInterval(moveInterval);
                            tinipix.x = x;
                            tinipix.y = y;
                            if (onArrive) onArrive();
                        } else {
                            tinipix.x += dx / steps;
                            tinipix.y += dy / steps;
                            stepCount++;
                        }
                    }, 16);
                };
            }
        }
    }

    function showParticle(x, y) {
        const particle = document.getElementById("particle");
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.opacity = 1;
        setTimeout(() => {
            particle.style.opacity = 0;
        }, 500);
    }


 // ✅ Start FPS detection when the page loads
window.onload = () => Tinipix.detectFPS();
});

// FunFreshNew © //