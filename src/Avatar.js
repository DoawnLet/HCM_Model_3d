import * as THREE from 'three';

export class Avatar {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.buildModel();
        this.scene.add(this.mesh);

        // Movement state
        this.position = this.mesh.position;
        this.position.set(0, 0, 18); // Start position in front of lobby
        
        this.vy = 0;
        this.isJumping = false;
        this.speed = 9.0; // Slightly faster movement speed
        this.radius = 0.5;
        this.boundsLimit = 33.0; // Keeps character inside the circular museum gallery
        
        // Control states
        this.keys = { w: false, a: false, s: false, d: false, space: false };
        this.joystick = { x: 0, y: 0, active: false };

        // Cached Vector3 variables to prevent GC allocation spikes in animation tick
        this.camDir = new THREE.Vector3();
        this.camRight = new THREE.Vector3();
        this.moveVec = new THREE.Vector3();

        this.setupEventListeners();
    }

    buildModel() {
        const group = new THREE.Group();
        group.name = 'player_avatar';

        // Materials (Optimized standard materials)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.85 });
        const aoDaiRed = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });
        const aoDaiGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.95, side: THREE.DoubleSide }); // Light hat
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2d1f16, roughness: 0.9 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); // White traditional pants

        // 1. Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), skinMat);
        head.position.y = 1.45;
        group.add(head);

        // 2. Head wrap (Khăn vấn)
        const headWrap = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 20), aoDaiGold);
        headWrap.rotation.x = Math.PI / 2;
        headWrap.position.y = 1.52;
        group.add(headWrap);

        // 3. Conical Hat (Nón Lá)
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.28, 18), hatMat);
        hat.position.set(0, 1.70, -0.01);
        hat.rotation.x = 0.08;
        group.add(hat);

        // 4. Body (Ao Dai)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.38, 0.95, 12), aoDaiRed);
        body.position.y = 0.88;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 5. Traditional gold chest panel
        const innerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.06), aoDaiGold);
        innerPanel.position.set(0.08, 0.88, 0.24);
        group.add(innerPanel);

        // 6. Belt/Sash (Đai lưng)
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), aoDaiGold);
        belt.position.set(0, 0.78, 0.16);
        group.add(belt);

        // 7. Arms
        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8), aoDaiRed);
        leftArm.position.set(-0.43, 1.0, 0.05);
        leftArm.rotation.z = 0.35;
        leftArm.name = 'leftArm';
        group.add(leftArm);

        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8), aoDaiRed);
        rightArm.position.set(0.43, 1.0, 0.05);
        rightArm.rotation.z = -0.35;
        rightArm.name = 'rightArm';
        group.add(rightArm);

        // Hands
        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), skinMat);
        leftHand.position.set(-0.57, 0.72, 0.08);
        group.add(leftHand);

        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), skinMat);
        rightHand.position.set(0.57, 0.72, 0.08);
        group.add(rightHand);

        // 8. Legs (traditional pants)
        const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8), pantsMat);
        leftLeg.position.set(-0.15, 0.24, 0);
        leftLeg.name = 'leftLeg';
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8), pantsMat);
        rightLeg.position.set(0.15, 0.24, 0);
        rightLeg.name = 'rightLeg';
        group.add(rightLeg);

        // Shoes
        const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoeMat);
        leftShoe.position.set(-0.15, -0.03, 0.04);
        group.add(leftShoe);

        const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoeMat);
        rightShoe.position.set(0.15, -0.03, 0.04);
        group.add(rightShoe);

        // 9. Flat Circle Ground Shadow
        const shadow = new THREE.Mesh(
            new THREE.RingGeometry(0, 0.46, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0x000000, 
                transparent: true, 
                opacity: 0.25, 
                side: THREE.DoubleSide 
            })
        );
        shadow.rotation.x = Math.PI / 2;
        shadow.position.y = 0.01;
        shadow.name = 'shadow';
        group.add(shadow);

        return group;
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.keys.w = true;
            if (key === 's' || key === 'arrowdown') this.keys.s = true;
            if (key === 'a' || key === 'arrowleft') this.keys.a = true;
            if (key === 'd' || key === 'arrowright') this.keys.d = true;
            if (e.key === ' ' || key === 'spacebar') this.keys.space = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.keys.w = false;
            if (key === 's' || key === 'arrowdown') this.keys.s = false;
            if (key === 'a' || key === 'arrowleft') this.keys.a = false;
            if (key === 'd' || key === 'arrowright') this.keys.d = false;
            if (e.key === ' ' || key === 'spacebar') this.keys.space = false;
        });
    }

    setJoystick(x, y, active) {
        this.joystick.x = x;
        this.joystick.y = y;
        this.joystick.active = active;
    }

    update(delta, camera, isFrozen) {
        if (isFrozen) return;

        // 1. Calculate camera-relative movement vectors (using cached member variables to save allocations)
        camera.getWorldDirection(this.camDir);
        this.camDir.y = 0;
        this.camDir.normalize();

        this.camRight.crossVectors(this.camDir, camera.up);
        this.camRight.y = 0;
        this.camRight.normalize();

        let moveX = 0;
        let moveZ = 0;

        if (this.keys.w) { moveX += this.camDir.x; moveZ += this.camDir.z; }
        if (this.keys.s) { moveX -= this.camDir.x; moveZ -= this.camDir.z; }
        if (this.keys.a) { moveX -= this.camRight.x; moveZ -= this.camRight.z; }
        if (this.keys.d) { moveX += this.camRight.x; moveZ += this.camRight.z; }

        if (this.joystick.active) {
            moveX = this.camDir.x * this.joystick.y + this.camRight.x * this.joystick.x;
            moveZ = this.camDir.z * this.joystick.y + this.camRight.z * this.joystick.x;
        }

        this.moveVec.set(moveX, 0, moveZ);
        const isMoving = this.moveVec.lengthSq() > 0.001;

        if (isMoving) {
            this.moveVec.normalize();
            const step = this.speed * delta;
            
            // Move character position
            this.position.x += this.moveVec.x * step;
            this.position.z += this.moveVec.z * step;

            // Rotate character to face movement direction smoothly
            const targetRotation = Math.atan2(this.moveVec.x, this.moveVec.z);
            this.mesh.rotation.y = targetRotation;
        }

        // 2. Physics & Jump calculation
        if (this.keys.space && !this.isJumping) {
            this.vy = 5.8;
            this.isJumping = true;
        }

        if (this.isJumping) {
            this.vy -= 18.0 * delta; // Gravity acceleration
            this.position.y += this.vy * delta;

            if (this.position.y <= 0) {
                this.position.y = 0;
                this.vy = 0;
                this.isJumping = false;
            }
        }

        // 3. Keep character outside the central pond
        let distance = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
        const minPondRadius = 9.7 + this.radius; // Pond rim is at 9.7, plus player radius
        if (distance < minPondRadius) {
            this.position.normalize().multiplyScalar(minPondRadius);
            distance = minPondRadius;
        }

        // 4. Keep character within circular wall boundaries
        if (distance > this.boundsLimit) {
            this.position.normalize().multiplyScalar(this.boundsLimit);
        }

        // 5. Collision with the 6 room exhibition backwalls
        this.checkWallCollisions();

        // 6. Update shadow scale and opacity based on altitude
        const shadow = this.mesh.getObjectByName('shadow');
        if (shadow) {
            shadow.position.y = -this.position.y + 0.01;
            const factor = Math.max(0.1, 1.0 - this.position.y * 0.25);
            shadow.scale.set(factor, factor, factor);
            shadow.material.opacity = 0.25 * factor;
        }

        // 7. Leg-swing animation during movement
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        
        if (leftLeg && rightLeg) {
            if (isMoving) {
                const time = Date.now() * 0.012;
                leftLeg.rotation.x = Math.sin(time) * 0.55;
                rightLeg.rotation.x = -Math.sin(time) * 0.55;
            } else {
                leftLeg.rotation.x = 0;
                rightLeg.rotation.x = 0;
            }
        }
    }

    checkWallCollisions() {
        const radius = 26.0;
        const wallHalfWidth = 3.2;   // BoxGeometry(6.4, 5.0, 0.25) -> half width = 3.2
        const wallHalfDepth = 0.125; // half depth = 0.125
        const wallLocalZ = -2.5;     // centered at local Z = -2.5
        
        // Bounding box in local coordinates including player radius
        const minX = -wallHalfWidth - this.radius;
        const maxX = wallHalfWidth + this.radius;
        const minZ = wallLocalZ - wallHalfDepth - this.radius;
        const maxZ = wallLocalZ + wallHalfDepth + this.radius;

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const roomX = radius * Math.cos(angle);
            const roomZ = radius * Math.sin(angle);
            const rot = -angle + Math.PI / 2;

            // Translate player position to room local coordinates
            const dx = this.position.x - roomX;
            const dz = this.position.z - roomZ;

            // Rotate to local space
            const x_l = dx * Math.cos(rot) - dz * Math.sin(rot);
            const z_l = dx * Math.sin(rot) + dz * Math.cos(rot);

            // Check if player is inside the local AABB of the wall
            if (x_l >= minX && x_l <= maxX && z_l >= minZ && z_l <= maxZ) {
                // Collision detected! Push the player out to the nearest edge
                const distLeft = x_l - minX;
                const distRight = maxX - x_l;
                const distBottom = z_l - minZ;
                const distTop = maxZ - z_l;

                const minDist = Math.min(distLeft, distRight, distBottom, distTop);

                let new_xl = x_l;
                let new_zl = z_l;

                if (minDist === distLeft) {
                    new_xl = minX;
                } else if (minDist === distRight) {
                    new_xl = maxX;
                } else if (minDist === distBottom) {
                    new_zl = minZ;
                } else {
                    new_zl = maxZ;
                }

                // Transform back to world coordinates
                this.position.x = roomX + new_xl * Math.cos(rot) + new_zl * Math.sin(rot);
                this.position.z = roomZ - new_xl * Math.sin(rot) + new_zl * Math.cos(rot);
            }
        }
    }
}
