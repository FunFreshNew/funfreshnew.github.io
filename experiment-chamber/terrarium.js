document.addEventListener("DOMContentLoaded", () => {
    class Tinipix {
        static instances = [];
        constructor(element, settings = {}) {
            this.element = element;
            this.velocity = { x: Math.random() > 0.5 ? 2 : -2, y: 0 };
            this.position = { x: Math.random() * window.innerWidth, y: ground.offsetTop - this.element.offsetHeight };
            this.gravity = 0.3;
            this.isJumping = false;
            this.isStaying = false;
            this.onGround = false;
            this.isDragging = false;
            this.dragThreshold = 30;
            this.justRanAway = false;
            this.dragDisabledUntil = 0;
            this.lastDblClickTime = 0;
            this.lastRunEndTime = 0;
            Tinipix.seedDelay = Math.random() * 2000;
            Tinipix.instances.push(this);



            this.settings = {

                avoidCollision: settings.avoidCollision ?? false, // ✅ Move it inside
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

            this.init();
        }

        init() {
            this.move();
            this.element.addEventListener("dblclick", (event) => this.runAway(event.clientX));
            this.element.addEventListener("mousedown", (event) => this.prepareDrag(event));

            this.element.style.imageRendering = "pixelated";
            this.element.style.transformOrigin = "bottom center";
            this.element.style.userSelect = "none";
            this.element.style.pointerEvents = "auto";
            this.element.draggable = false;

            this.setScale(1);
        }


        setScale(direction) {
            if (!this.isDragging) {
                this.element.style.transform = `scale(${direction * this.settings.pixelScale}, ${this.settings.pixelScale})`;
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

        move() {
            if (this.isDragging) {
                requestAnimationFrame(() => this.move());
                return;
            }

            if (!this.isStaying && this.onGround && !this.isJumping) {
                this.startHop();
            }

            if (!this.isStaying) {
                this.position.x += this.velocity.x * this.settings.walkSpeed;
            }

            this.velocity.y += this.gravity;
            this.position.y += this.velocity.y;
            this.onGround = false;

            if (this.position.y >= ground.offsetTop - this.element.offsetHeight) {
                this.position.y = ground.offsetTop - this.element.offsetHeight;
                this.velocity.y = 0;
                this.onGround = true;
            }

            if (this.position.x <= 0) {
                this.position.x = 1;
                this.velocity.x = Math.abs(this.velocity.x);
            } else if (this.position.x >= window.innerWidth - this.element.offsetWidth) {
                this.position.x = window.innerWidth - this.element.offsetWidth - 1;
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
                let count = 0;

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

                setTimeout(flip, Math.random() * 2000);
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

            // ✅ Get terrain position
            const terrainRect = document.getElementById("terrain").getBoundingClientRect();
            const tinipixRect = this.element.getBoundingClientRect();

            // ✅ If Tinipix is dropped outside the terrain, return it back
            if (tinipixRect.bottom > terrainRect.bottom || tinipixRect.top < terrainRect.top) {
                this.position.x = Math.max(terrainRect.left, Math.min(terrainRect.right - this.element.offsetWidth, this.position.x));
                this.position.y = terrainRect.top - this.element.offsetHeight; // Reset to terrain
                this.updatePosition();
            }

            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("mouseup", this.stopDrag);
            document.removeEventListener("mouseleave", this.stopDrag);
        };


        updatePosition() {
            this.element.style.left = `${this.position.x}px`;
            this.element.style.top = `${this.position.y}px`;
        }
    }

    const ground = document.querySelector(".ground");
    // Creating Tinipix instances with walk speed customization
    const tinipix = [
        new Tinipix(document.getElementById("favian"), {
            stayChance: 0.5,
            stayDurationMin: 500,
            stayDurationMax: 3000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.009,
            avoidCollision: true, // Enable collision

            asymmetric: true, // Enable asymmetry
            textures: {
                left: "source/tinipix/tinipix_favian_left.png",
                right: "source/tinipix/tinipix_favian_right.png"
            }
        }),
        new Tinipix(document.getElementById("kikan"), {
            stayChance: 0.05,
            stayDurationMin: 1500,
            stayDurationMax: 50000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.05
        }),
        new Tinipix(document.getElementById("fyn"), {
            stayChance: 0.09,
            stayDurationMin: 1500,
            stayDurationMax: 50000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.06
        }),
        new Tinipix(document.getElementById("liner"), {
            stayChance: 0.8,
            stayDurationMin: 150,
            stayDurationMax: 50000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.04,

            asymmetric: true, // Enable asymmetry
            textures: {
                left: "source/tinipix/tinipix_liner_left.png",
                right: "source/tinipix/tinipix_liner_right.png"
            }
        }),
        new Tinipix(document.getElementById("mega"), {
            stayChance: 0.05,
            stayDurationMin: 20000,
            stayDurationMax: 50000,
            pixelScale: 1,
            walkSpeed: 0.5,
            stayFlipChance: 0.03,

            asymmetric: true, // Enable asymmetry
            textures: {
                left: "source/tinipix/tinipix_mega_left.png",
                right: "source/tinipix/tinipix_mega_right.png"
            }
        })
    ];
    const INTERACTION_MIN_DISTANCE = 10; // Minimum distance to interact
    const INTERACTION_MAX_DISTANCE = 50; // Maximum distance to interact
    const HITBOX_SIZE = 10; // Debug hitbox size

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

    function checkInteractions() {
        const stayingTinipix = tinipix.filter(t => t.isStaying);
        if (stayingTinipix.length < 2) {
            requestAnimationFrame(checkInteractions);
            return;
        }

        let closestPair = null;
        let bestDistance = Infinity;

        // Remove old debug boxes
        document.querySelectorAll(".debug-box").forEach(box => box.remove());

        for (let i = 0; i < stayingTinipix.length - 1; i++) {
            for (let j = i + 1; j < stayingTinipix.length; j++) {
                const t1 = stayingTinipix[i];
                const t2 = stayingTinipix[j];

                // Determine "front" position
                const t1FacingRight = t1.velocity.x >= 0; // Right is front
                const t2FacingLeft = t2.velocity.x <= 0;  // Left is front
                const t1FrontX = t1FacingRight ? t1.position.x + t1.element.offsetWidth : t1.position.x;
                const t2FrontX = t2FacingLeft ? t2.position.x : t2.position.x + t2.element.offsetWidth;

                const distance = Math.abs(t1FrontX - t2FrontX);
                const facingEachOther = t1FrontX < t2FrontX && t1FacingRight && t2FacingLeft;

                // Draw Debug Hitboxes
                drawDebugBox(t1FrontX, t1.position.y, INTERACTION_MAX_DISTANCE);
                drawDebugBox(t2FrontX, t2.position.y, INTERACTION_MAX_DISTANCE);

                // Debugging Logs
                console.log(`Tinipix ${i} & ${j} - Distance: ${distance}, Facing: ${facingEachOther}`);

                if (distance >= INTERACTION_MIN_DISTANCE && distance <= INTERACTION_MAX_DISTANCE && facingEachOther) {
                    if (distance < bestDistance) {
                        closestPair = [t1, t2];
                        bestDistance = distance;
                    }
                }
            }
        }

        if (closestPair) {
            const [t1, t2] = closestPair;
            console.log("Interaction Triggered!", t1, t2);
            showParticle((t1FrontX + t2FrontX) / 2, t1.position.y + t1.element.offsetHeight);
        }

        requestAnimationFrame(checkInteractions);
    }


    function checkInteractions() {
        const stayingTinipix = tinipix.filter(t => t.isStaying);
        if (stayingTinipix.length < 2) {
            requestAnimationFrame(checkInteractions);
            return;
        }

        let closestPair = null;
        let bestDistance = Infinity;

        document.querySelectorAll(".debug-box").forEach(box => box.remove());

        for (let i = 0; i < stayingTinipix.length - 1; i++) {
            for (let j = i + 1; j < stayingTinipix.length; j++) {
                const t1 = stayingTinipix[i];
                const t2 = stayingTinipix[j];

                // Get "front" position
                const t1FacingRight = t1.velocity.x >= 0; // Right is front
                const t2FacingLeft = t2.velocity.x <= 0;  // Left is front
                const t1FrontX = t1FacingRight ? t1.position.x + t1.element.offsetWidth : t1.position.x;
                const t2FrontX = t2FacingLeft ? t2.position.x : t2.position.x + t2.element.offsetWidth;

                const distance = Math.abs(t1FrontX - t2FrontX);
                const facingEachOther = t1FrontX < t2FrontX && t1FacingRight && t2FacingLeft;

                drawDebugBox(t1FrontX, t1.position.y, INTERACTION_MAX_DISTANCE);
                drawDebugBox(t2FrontX, t2.position.y, INTERACTION_MAX_DISTANCE);

                console.log(`Tinipix ${i} & ${j} - Distance: ${distance}, Facing: ${facingEachOther}`);

                if (distance >= INTERACTION_MIN_DISTANCE && distance <= INTERACTION_MAX_DISTANCE && facingEachOther) {
                    if (distance < bestDistance) {
                        closestPair = [t1, t2];
                        bestDistance = distance;
                    }
                }
            }
        }

        if (closestPair) {
            const [t1, t2] = closestPair;

            // 🛠 FIXED: Center particle effect correctly
            const interactionX = (t1.position.x + t1.element.offsetWidth + t2.position.x) / 2;
            const interactionY = Math.min(t1.position.y, t2.position.y) - 20; // Appear slightly above them

            console.log("Interaction Triggered!", t1, t2);
            showParticle(interactionX, interactionY);
        }

        requestAnimationFrame(checkInteractions);
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



    checkInteractions();
});