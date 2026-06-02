import * as THREE from 'three';

export function createLotusMesh(size, color, petalScale = 1) {
    const group = new THREE.Group();

    // 1. Receptacle (Gương sen)
    const podMat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        roughness: 0.45, 
        metalness: 0.1 
    });
    
    // Cylinder base
    const podBase = new THREE.Mesh(
        new THREE.CylinderGeometry(size * 0.22, size * 0.17, size * 0.12, 16),
        podMat
    );
    podBase.position.y = size * 0.06;
    group.add(podBase);
    
    // Dome top cap
    const podTop = new THREE.Mesh(
        new THREE.SphereGeometry(size * 0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5),
        podMat
    );
    podTop.scale.set(1, 0.35, 1); // Flatten the dome
    podTop.position.y = size * 0.11;
    group.add(podTop);

    // 2. Petals (Cánh sen chất liệu Ngọc bích/Thủy tinh xuyên sáng cao cấp)
    const petalMat = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.16,
        roughness: 0.2,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transmission: 0.36, // Semi-translucent jade look
        thickness: 0.4,     // Thickness for refraction depth
        side: THREE.DoubleSide
    });

    // Create a curved hemisphere segment for realistic petal curvature
    const petalGeo = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI, 0.12, Math.PI - 0.24);
    petalGeo.center();
    // Keep cup facing +Z in local geometry space, no rotateY needed

    const layers = [
        // Inner layer (small, upright)
        { count: 6, radius: 0.15, y: 0.11, sx: 0.44, sy: 0.75, sz: 0.16, tilt: 0.32 },
        // Middle layer (medium, slightly tilted)
        { count: 8, radius: 0.26, y: 0.07, sx: 0.52, sy: 0.85, sz: 0.18, tilt: 0.58 },
        // Outer layer (large, tilted further)
        { count: 10, radius: 0.38, y: 0.02, sx: 0.60, sy: 0.95, sz: 0.20, tilt: 0.84 },
        // Bottom layer (flatter outer petals)
        { count: 12, radius: 0.48, y: -0.02, sx: 0.68, sy: 1.05, sz: 0.22, tilt: 1.1 }
    ];

    layers.forEach(({ count, radius, y, sx, sy, sz, tilt }) => {
        for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const scale = petalScale * (size / 1.4);
            
            petal.scale.set(sx * scale, sy * scale, sz * scale);
            petal.position.set(
                Math.cos(angle) * size * radius * petalScale,
                size * y * petalScale,
                Math.sin(angle) * size * radius * petalScale
            );
            
            // Mathematically verified angles:
            // x rotation tilts the tip outward (towards negative Z in local space)
            // y rotation rotates local Z to point directly towards the center of the lotus
            petal.rotation.x = -tilt;
            petal.rotation.y = angle + Math.PI / 2;
            petal.rotation.z = (Math.random() - 0.5) * 0.05; // Organic slight variation
            
            group.add(petal);
        }
    });

    return group;
}


export function createLotusLeaf(size) {
    const group = new THREE.Group();
    const leaf = new THREE.Mesh(
        new THREE.CircleGeometry(size, 24, 0, Math.PI * 1.85),
        new THREE.MeshStandardMaterial({
            color: 0x1d5c2e,
            roughness: 0.7,
            metalness: 0.05,
            side: THREE.DoubleSide,
        })
    );
    leaf.rotation.x = -Math.PI / 2;
    group.add(leaf);

    const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x143f20, roughness: 0.8 })
    );
    stalk.position.y = -0.3;
    group.add(stalk);

    return group;
}

export function createCharacterModel() {
    const character = new THREE.Group();
    character.userData = { vy: 0, isJumping: false, speed: 8.5, radius: 0.45 };

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.85 });
    const aoDaiRed = new THREE.MeshStandardMaterial({ color: 0x9b1c1c, roughness: 0.55 });
    const aoDaiGold = new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 0.45, emissive: 0x3a2200, emissiveIntensity: 0.12 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd8c08a, roughness: 0.95, side: THREE.DoubleSide });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2d1f16, roughness: 0.9 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.75 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 16), skinMat);
    head.position.y = 1.45;
    character.add(head);

    const headWrap = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 20), hatMat);
    headWrap.rotation.x = Math.PI / 2;
    headWrap.position.y = 1.53;
    character.add(headWrap);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.28, 16), hatMat);
    hat.position.set(0, 1.72, -0.02);
    hat.rotation.x = 0.12;
    character.add(hat);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.95, 12), aoDaiRed);
    body.position.y = 0.88;
    character.add(body);

    const innerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.88, 0.06), aoDaiGold);
    innerPanel.position.set(0.08, 0.88, 0.24);
    character.add(innerPanel);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), aoDaiGold);
    belt.position.set(0, 0.78, 0.16);
    character.add(belt);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8), aoDaiRed);
    leftArm.position.set(-0.43, 1.0, 0.05);
    leftArm.rotation.z = 0.35;
    character.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8), aoDaiRed);
    rightArm.position.set(0.43, 1.0, 0.05);
    rightArm.rotation.z = -0.35;
    character.add(rightArm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMat);
    leftHand.position.set(-0.57, 0.72, 0.08);
    character.add(leftHand);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMat);
    rightHand.position.set(0.57, 0.72, 0.08);
    character.add(rightHand);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8), blackMat);
    leftLeg.position.set(-0.15, 0.24, 0);
    leftLeg.name = 'leftLeg';
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.55, 8), blackMat);
    rightLeg.position.set(0.15, 0.24, 0);
    rightLeg.name = 'rightLeg';
    character.add(rightLeg);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoeMat);
    leftShoe.position.set(-0.15, -0.03, 0.04);
    character.add(leftShoe);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoeMat);
    rightShoe.position.set(0.15, -0.03, 0.04);
    character.add(rightShoe);

    const shadow = new THREE.Mesh(
        new THREE.RingGeometry(0, 0.48, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    shadow.rotation.x = Math.PI / 2;
    shadow.position.y = 0.01;
    shadow.name = 'shadow';
    character.add(shadow);

    return character;
}

export function createPavilionModel(classInfo, materials) {
    const pavilion = new THREE.Group();
    pavilion.name = classInfo.id;

    // Premium Materials
    const matBronze = new THREE.MeshStandardMaterial({ color: 0x8c6239, metalness: 0.8, roughness: 0.3 });
    const _matGold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
    const matLanternRed = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff0000, emissiveIntensity: 0.45, roughness: 0.5 });
    
    // 1. Two-Tiered Stone Pedestal (Bệ đá cổ kính nhiều tầng)
    const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 16), materials.stone);
    baseLower.position.y = 0.15;
    pavilion.add(baseLower);
    
    const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 0.25, 16), materials.stone);
    baseUpper.position.y = 0.425;
    pavilion.add(baseUpper);
    
    // Add stone steps (Bậc thềm đá dẫn lên) facing the center (local +Z direction)
    for (let j = 0; j < 3; j++) {
        const stepWidth = 1.4 - j * 0.2;
        const stepHeight = 0.12;
        const stepDepth = 0.3;
        const step = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth), materials.stone);
        step.position.set(0, 0.06 + j * stepHeight, 3.0 + j * 0.2);
        pavilion.add(step);
    }
    
    // 2. Interactive Glowing Ring Beacon (Vòng tròn chỉ hướng)
    const beacon = new THREE.Mesh(
        new THREE.RingGeometry(2.3, 2.5, 32),
        new THREE.MeshBasicMaterial({ color: classInfo.color, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.56;
    beacon.name = 'beacon';
    pavilion.add(beacon);

    // 3. Central Altar (Bàn thờ/Án thư đá cổ)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0.55, 0);
    
    const altarBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.5), materials.stone);
    altarBody.position.y = 0.3;
    altarGroup.add(altarBody);
    
    const altarTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.6), matBronze);
    altarTop.position.y = 0.64;
    altarGroup.add(altarTop);
    pavilion.add(altarGroup);

    // 4. Columns (4 Cột gỗ có chân đế đá, đầu cột mạ đồng)
    const colOffsets = [
        { px: 1.6, pz: 1.6 },
        { px: -1.6, pz: 1.6 },
        { px: 1.6, pz: -1.6 },
        { px: -1.6, pz: -1.6 }
    ];
    
    colOffsets.forEach(o => {
        const pillarGroup = new THREE.Group();
        pillarGroup.position.set(o.px, 0.55, o.pz);
        
        // Pillar stone base
        const pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.15, 8), materials.stone);
        pBase.position.y = 0.075;
        pillarGroup.add(pBase);
        
        // Pillar wooden shaft
        const pShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.3, 8), materials.wood);
        pShaft.position.y = 1.25;
        pillarGroup.add(pShaft);
        
        // Pillar bronze cap
        const pCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.15, 8), matBronze);
        pCap.position.y = 2.425;
        pillarGroup.add(pCap);
        
        pavilion.add(pillarGroup);
    });

    // 5. Curved Double-Deck Roof (Mái Chồng Diêm cong vút kiểu Việt Nam)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 2.9, 0);
    
    // Lower flat roof deck
    const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 0.8, 4), materials.roof);
    lowerRoof.position.y = 0.4;
    lowerRoof.rotation.y = Math.PI / 4;
    roofGroup.add(lowerRoof);
    
    // Middle wood neck (Cổ chồng diêm)
    const roofNeck = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.35, 4), materials.wood);
    roofNeck.position.y = 0.955;
    roofNeck.rotation.y = Math.PI / 4;
    roofGroup.add(roofNeck);
    
    // Upper roof deck
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.9, 4), materials.roof);
    upperRoof.position.y = 1.55;
    upperRoof.rotation.y = Math.PI / 4;
    roofGroup.add(upperRoof);
    
    // Traditional curved corner swoops (Mái đao)
    const swoopGeo = new THREE.TorusGeometry(0.6, 0.08, 6, 12, Math.PI / 2);
    const swoopOffsets = [
        { px: 2.5, pz: 2.5, rotY: Math.PI / 4 },
        { px: -2.5, pz: 2.5, rotY: (3 * Math.PI) / 4 },
        { px: -2.5, pz: -2.5, rotY: -(3 * Math.PI) / 4 },
        { px: 2.5, pz: -2.5, rotY: -Math.PI / 4 }
    ];
    swoopOffsets.forEach(s => {
        const swoop = new THREE.Mesh(swoopGeo, materials.roof);
        swoop.position.set(s.px, 0.15, s.pz);
        swoop.rotation.y = s.rotY;
        swoop.rotation.z = -0.4;
        roofGroup.add(swoop);
    });

    // 6. Swaying Glowing Lanterns (Đèn lồng cổ kính phát sáng)
    const lanterns = new THREE.Group();
    lanterns.name = 'lanterns';
    
    const lanternGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
    const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 8);
    
    const latPositions = [
        { x: 1.8, z: 1.8 },
        { x: -1.8, z: 1.8 },
        { x: 1.8, z: -1.8 },
        { x: -1.8, z: -1.8 }
    ];
    
    latPositions.forEach((pos, idx) => {
        const latUnit = new THREE.Group();
        latUnit.position.set(pos.x, 2.7, pos.z);
        latUnit.name = `lantern_${idx}`;
        
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), materials.wood);
        string.position.y = -0.15;
        latUnit.add(string);
        
        const lCap = new THREE.Mesh(capGeo, matBronze);
        lCap.position.y = -0.325;
        latUnit.add(lCap);
        
        const lBody = new THREE.Mesh(lanternGeo, matLanternRed);
        lBody.position.y = -0.5;
        latUnit.add(lBody);
        
        const lLight = new THREE.PointLight(0xff3b30, 0.6, 3);
        lLight.position.set(0, -0.5, 0);
        lLight.name = 'light';
        latUnit.add(lLight);
        
        lanterns.add(latUnit);
    });
    
    pavilion.add(lanterns);
    pavilion.add(roofGroup);

    // 7. Expose Symbol Group (Floats and rotates above Altar)
    const symbolGroup = new THREE.Group();
    symbolGroup.position.set(0, 1.45, 0);
    symbolGroup.name = 'symbol';
    
    const symbolMat = new THREE.MeshStandardMaterial({
        color: classInfo.color,
        emissive: classInfo.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.1
    });
    
    if (classInfo.id === 'vai_tro_dai_doan_ket') {
        // Linked Rings representing Unity
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 16), symbolMat);
        ring1.position.x = -0.14;
        ring1.rotation.y = 0.3;
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 16), symbolMat);
        ring2.position.x = 0.14;
        ring2.rotation.y = -0.3;
        symbolGroup.add(ring1, ring2);
    } else if (classInfo.id === 'dieu_kien_phuong_thuc') {
        // Torch representing conditions and methods
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.4, 8), symbolMat);
        handle.position.y = -0.15;
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.15, 8), symbolMat);
        cup.position.y = 0.08;
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 8), new THREE.MeshStandardMaterial({
            color: 0xff4500, emissive: 0xff3300, emissiveIntensity: 0.9, roughness: 0.1
        }));
        flame.position.y = 0.28;
        symbolGroup.add(handle, cup, flame);
    } else if (classInfo.id === 'ket_luan') {
        // Star representing the conclusion and final goal
        const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), symbolMat);
        symbolGroup.add(star);
    } else if (classInfo.id === 'luc_luong_dai_doan_ket') {
        // Alliance of Workers, Farmers, and Intellectuals - Stalk of rice and Book
        const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.02), symbolMat);
        pageL.position.set(-0.11, -0.08, 0.04);
        pageL.rotation.y = 0.35;
        const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.02), symbolMat);
        pageR.position.set(0.11, -0.08, 0.04);
        pageR.rotation.y = -0.35;
        symbolGroup.add(pageL, pageR);
        
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), symbolMat);
        stem.position.set(0, 0.12, -0.04);
        symbolGroup.add(stem);
        for (let j = 0; j < 3; j++) {
            const leafL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), symbolMat);
            leafL.position.set(-0.05, 0.04 + j * 0.1, -0.04);
            leafL.rotation.z = 0.8;
            const leafR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), symbolMat);
            leafR.position.set(0.05, 0.04 + j * 0.1, -0.04);
            leafR.rotation.z = -0.8;
            symbolGroup.add(leafL, leafR);
        }
    } else if (classInfo.id === 'mat_tran_dan_toc_thong_nhat') {
        // Lotus symbol for the United Front
        const petalGeo = new THREE.SphereGeometry(0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const petal = new THREE.Mesh(petalGeo, symbolMat);
        petal.rotation.x = Math.PI;
        petal.scale.set(0.48, 0.95, 0.48);
        symbolGroup.add(petal);
    } else {
        symbolGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), symbolMat));
    }
    
    pavilion.add(symbolGroup);

    // 8. Top Lotus (spawns on roof when milestone completed)
    const topLotus = createLotusMesh(1.4, classInfo.color, 0.92);
    topLotus.position.set(0, 5.0, 0); // Positioned above the upper roof cone
    topLotus.rotation.set(0, 0, 0);
    topLotus.scale.set(0, 0, 0);
    topLotus.name = 'topLotus';
    
    const topLotusLight = new THREE.PointLight(classInfo.color, 0, 8);
    topLotusLight.position.set(0, 0.2, 0);
    topLotusLight.name = 'topLotusLight';
    topLotus.add(topLotusLight);
    
    pavilion.add(topLotus);

    return pavilion;
}
