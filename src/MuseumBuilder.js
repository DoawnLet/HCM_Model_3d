import * as THREE from "three";

// Static Geometry Cache for Leaf meshes to prevent recreation
let cachedLeafGeo = null;
let cachedStalkGeo = null;

// Helper function to wrap text on a 2D canvas
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2 + lineHeight / 2;
  
  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i].trim(), x, startY + i * lineHeight);
  }
}


// 1. Procedural Lotus Mesh Generator (Kept as fallback)
export function createLotusMesh(size, color, petalScale = 1) {
  const group = new THREE.Group();
  const podMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.1,
  });

  const podBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.17, 0.12, 12),
    podMat,
  );
  podBase.scale.set(size, size, size);
  podBase.position.y = size * 0.06;
  group.add(podBase);

  const podTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.5),
    podMat,
  );
  podTop.scale.set(size, size * 0.35, size);
  podTop.position.y = size * 0.11;
  group.add(podTop);

  const petalMat = new THREE.MeshPhysicalMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.22,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.45,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  const petalGeo = new THREE.SphereGeometry(
    0.5,
    12,
    12,
    0,
    Math.PI,
    0.12,
    Math.PI - 0.24,
  );
  petalGeo.center();

  const layers = [
    {
      count: 6,
      radius: 0.15,
      y: 0.11,
      sx: 0.44,
      sy: 0.75,
      sz: 0.16,
      tilt: 0.32,
    },
    {
      count: 8,
      radius: 0.26,
      y: 0.07,
      sx: 0.52,
      sy: 0.85,
      sz: 0.18,
      tilt: 0.58,
    },
    {
      count: 10,
      radius: 0.38,
      y: 0.02,
      sx: 0.6,
      sy: 0.95,
      sz: 0.2,
      tilt: 0.84,
    },
    {
      count: 12,
      radius: 0.48,
      y: -0.02,
      sx: 0.68,
      sy: 1.05,
      sz: 0.22,
      tilt: 1.1,
    },
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
        Math.sin(angle) * size * radius * petalScale,
      );

      petal.rotation.x = -tilt;
      petal.rotation.y = angle + Math.PI / 2;
      petal.rotation.z = (Math.random() - 0.5) * 0.03;

      group.add(petal);
    }
  });

  return group;
}

// 2. Procedural Lotus Leaf (Optimized with static geometries caching)
export function createLotusLeaf(size) {
  const group = new THREE.Group();

  if (!cachedLeafGeo) {
    cachedLeafGeo = new THREE.CircleGeometry(1.0, 16, 0, Math.PI * 1.85);
  }
  const leaf = new THREE.Mesh(
    cachedLeafGeo,
    new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  leaf.scale.set(size, size, size);
  leaf.rotation.x = -Math.PI / 2;
  group.add(leaf);

  if (!cachedStalkGeo) {
    cachedStalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
  }
  const stalk = new THREE.Mesh(
    cachedStalkGeo,
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 }),
  );
  stalk.position.y = -0.3;
  group.add(stalk);

  return group;
}

// 3. Create textures for water and Dong Son drum
function createWaterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(64, 64);
  const data = imgData.data;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const val1 = Math.sin(x * 0.3) * Math.cos(y * 0.3);
      const val2 = Math.sin((x + y) * 0.16) * 0.4;
      const noise = (val1 + val2) / 1.4;
      const gray = Math.floor((noise + 1) * 127.5);
      const idx = (y * 64 + x) * 4;
      data[idx] = gray;
      data[idx + 1] = gray;
      data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createDongSonDrumTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Bright premium polished brass-bronze background
  ctx.fillStyle = "#dfb877";
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;

  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 2.5;

  // Central sunburst star (12 points)
  const points = 12;
  const outerRadius = 45;
  const innerRadius = 15;
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Concentric circles
  const rings = [55, 75, 95, 125, 155, 185, 220, 245];
  rings.forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Outer dots pattern
  ctx.fillStyle = "#b45309";
  const dotCount = 72;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * Math.PI * 2) / dotCount;
    const x = cx + Math.cos(angle) * 202;
    const y = cy + Math.sin(angle) * 202;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// 4. Main Museum Builder Class
export class MuseumBuilder {
  constructor(scene, lotusModel = null) {
    this.scene = scene;
    this.lotusModel = lotusModel; // Loaded GLB lotus model
    this.pavilions = []; // Reused structure to store exhibition rooms
    this.materials = this.initMaterials();
    this.geometries = this.initGeometries();

    this.buildStructure();
  }

  initMaterials() {
    return {
      floor: new THREE.MeshStandardMaterial({
        color: 0xf3f4f6,
        roughness: 0.15,
        metalness: 0.05,
      }),
      walls: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0.0,
      }),
      accentRed: new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        roughness: 0.45,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.85,
        roughness: 0.25,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        roughness: 0.5,
      }),
      water: new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.05,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5,
        bumpMap: createWaterTexture(),
        bumpScale: 0.04,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        transmission: 0.9,
        roughness: 0.1,
        thickness: 0.2,
        side: THREE.DoubleSide,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.7,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    };
  }

  initGeometries() {
    return {
      floor: new THREE.CylinderGeometry(38, 38, 0.8, 48),
      roomShellWall: new THREE.CylinderGeometry(37.6, 37.6, 12.0, 64, 1, true),
      roomShellCeiling: new THREE.CircleGeometry(37.6, 64),
      pillar: new THREE.CylinderGeometry(0.4, 0.4, 12, 10),
      pillarCap: new THREE.CylinderGeometry(0.46, 0.46, 0.3, 10),
      waterSurface: new THREE.CylinderGeometry(9.6, 9.6, 0.1, 24),
      pondBottom: new THREE.CylinderGeometry(9.58, 9.58, 0.05, 24),
      pondRim: new THREE.TorusGeometry(9.7, 0.18, 8, 24),
      bannerPanel: new THREE.BoxGeometry(10.0, 1.4, 0.08),
      bannerFrame: new THREE.BoxGeometry(10.1, 0.08, 0.12),
      flagPole: new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6),
      flagCloth: new THREE.BoxGeometry(1.6, 1.0, 0.02),
      flagStar: new THREE.ConeGeometry(0.18, 0.1, 5),

      // Room Geometries
      roomWall: new THREE.BoxGeometry(6.4, 5.0, 0.25),
      roomTrimHorizontal: new THREE.BoxGeometry(6.5, 0.15, 0.35),
      contentBoard: new THREE.BoxGeometry(4.0, 2.5, 0.08),
      contentBoardFrame: new THREE.BoxGeometry(4.1, 0.06, 0.12),
      titleBar: new THREE.BoxGeometry(2.4, 0.4, 0.06),
      beaconRing: new THREE.RingGeometry(1.6, 1.8, 20),

      // Subsystems
      screenMount: new THREE.BoxGeometry(0.8, 1.4, 0.15),
      ledPanel: new THREE.BoxGeometry(3.6, 2.0, 0.1),
      ledBorder: new THREE.BoxGeometry(3.7, 0.08, 0.14),
    };
  }

  buildStructure() {
    // 1. Museum Ground Floor
    const floorMesh = new THREE.Mesh(
      this.geometries.floor,
      this.materials.floor,
    );
    floorMesh.position.y = -0.4;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    const roomWall = new THREE.Mesh(
      this.geometries.roomShellWall,
      this.materials.walls,
    );
    roomWall.position.y = 6.0;
    roomWall.receiveShadow = true;
    this.scene.add(roomWall);

    const roomCeiling = new THREE.Mesh(
      this.geometries.roomShellCeiling,
      this.materials.ceiling,
    );
    roomCeiling.rotation.x = Math.PI / 2;
    roomCeiling.position.y = 12.0;
    roomCeiling.receiveShadow = true;
    this.scene.add(roomCeiling);

    // 2. Pillars
    const roofColumnsGroup = new THREE.Group();
    const columnCount = 12;
    const R_columns = 35;
    for (let i = 0; i < columnCount; i++) {
      const angle = (i * Math.PI * 2) / columnCount;
      const x = Math.cos(angle) * R_columns;
      const z = Math.sin(angle) * R_columns;

      const pillar = new THREE.Mesh(
        this.geometries.pillar,
        this.materials.walls,
      );
      pillar.position.set(x, 6, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;

      const capLower = new THREE.Mesh(
        this.geometries.pillarCap,
        this.materials.gold,
      );
      capLower.position.y = -5.8;
      pillar.add(capLower);

      const capUpper = new THREE.Mesh(
        this.geometries.pillarCap,
        this.materials.gold,
      );
      capUpper.position.y = 5.8;
      pillar.add(capUpper);

      roofColumnsGroup.add(pillar);
    }
    this.scene.add(roofColumnsGroup);

    // 3. Central Lotus Pond
    const pondGroup = new THREE.Group();
    pondGroup.position.set(0, 0.02, 0);

    const waterSurface = new THREE.Mesh(
      this.geometries.waterSurface,
      this.materials.water,
    );
    waterSurface.position.y = -0.05;
    pondGroup.add(waterSurface);

    const pondBottom = new THREE.Mesh(
      this.geometries.pondBottom,
      new THREE.MeshStandardMaterial({
        map: createDongSonDrumTexture(),
        roughness: 0.6,
        metalness: 0.2,
      }),
    );
    pondBottom.position.y = -0.09;
    pondGroup.add(pondBottom);

    const rimMesh = new THREE.Mesh(
      this.geometries.pondRim,
      this.materials.gold,
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = -0.02;
    pondGroup.add(rimMesh);

    this.scene.add(pondGroup);
    this.centralPond = waterSurface;

    // Floating leaves
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 2.5 + Math.random() * 6.0;
      const leaf = createLotusLeaf(0.5 + Math.random() * 0.7);
      leaf.position.set(
        Math.cos(angle) * rad,
        0.02 + Math.random() * 0.04,
        Math.sin(angle) * rad,
      );
      pondGroup.add(leaf);
    }

    // Giant floating Central Lotus (GLB model used if available, fallback to procedural)
    if (this.lotusModel) {
      const centerLotus = this.lotusModel.clone();
      const maxDim = this.lotusModel.userData.maxDim || 1.0;

      // Scale dynamically to fit 5.2 units wide in the pond
      const scale = 5.2 / maxDim;
      centerLotus.scale.set(scale, scale, scale);
      centerLotus.position.set(0, -0.15, 0); // slightly offset down to float naturally in water
      centerLotus.rotation.set(0, 0, 0);

      // Keep the natural artistic textures of the original GLB file
      this.scene.add(centerLotus);
      this.centralLotus = centerLotus;
    } else {
      this.centralLotus = createLotusMesh(5.2, 0xec4899, 0.9);
      this.centralLotus.position.set(0, 0.35, 0);
      this.scene.add(this.centralLotus);
    }

    // 4. Lobby Golden Quote Banner
    const bannerGroup = new THREE.Group();
    bannerGroup.position.set(0, 6.5, -9.0);

    const bannerPanel = new THREE.Mesh(
      this.geometries.bannerPanel,
      this.materials.glass,
    );
    bannerPanel.castShadow = true;
    bannerGroup.add(bannerPanel);

    const frameTop = new THREE.Mesh(
      this.geometries.bannerFrame,
      this.materials.accentRed,
    );
    frameTop.position.y = 0.7;
    const frameBottom = new THREE.Mesh(
      this.geometries.bannerFrame,
      this.materials.accentRed,
    );
    frameBottom.position.y = -0.7;
    bannerGroup.add(frameTop, frameBottom);

    // Write the quote on the glass banner below the flag
    const textCanvas = document.createElement("canvas");
    textCanvas.width = 1024;
    textCanvas.height = 256;
    const ctx = textCanvas.getContext("2d");
    ctx.clearRect(0, 0, 1024, 256);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = 'bold 56px "Playfair Display", "Times New Roman", serif';
    ctx.fillStyle = "#db1f1f"; // Traditional Red for quote
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText("Đoàn kết, đoàn kết, đại đoàn kết.", 512, 128 - 36);
    ctx.fillText("Thành công, thành công, đại thành công.", 512, 128 + 36);

    const textTexture = new THREE.CanvasTexture(textCanvas);
    const textMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 1.2),
      textMat,
    );
    textPlane.position.set(0, 0, 0.05); // Place slightly in front of glass banner
    bannerGroup.add(textPlane);

    // Duplicate text plane on the back side of the glass board, rotated 180 degrees
    // so it reads correctly from left-to-right from behind
    const textPlaneBack = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 1.2),
      textMat,
    );
    textPlaneBack.position.set(0, 0, -0.05); // Place slightly behind glass banner
    textPlaneBack.rotation.y = Math.PI; // Face the back
    bannerGroup.add(textPlaneBack);

    // Flag decoration
    const flagGroup = new THREE.Group();
    flagGroup.position.set(0, 8.5, -9.0);

    // Polished silver/chrome flagpole
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.9,
      roughness: 0.1,
    });
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4.8, 12),
      poleMat,
    );
    pole.position.set(-2.0, 1.1, 0); // Positioned at the left edge of the centered flag

    // Gold ball on top of flagpole
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      this.materials.gold,
    );
    ball.position.set(-2.0, 3.5, 0);
    flagGroup.add(pole, ball);

    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });

    // Load the image and process it via canvas to key out the grey background
    const imgLoader = new THREE.ImageLoader();
    imgLoader.load("./assets/vietnam-flag.png", (image) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate max difference between channels
        const maxDiff = Math.max(
          Math.abs(r - g),
          Math.abs(r - b),
          Math.abs(g - b),
        );

        // If the color is grey/white (small channel difference and bright enough), make it transparent
        const avg = (r + g + b) / 3;
        if (maxDiff < 20 && avg > 100) {
          data[i + 3] = 0; // alpha = 0
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const flagTexture = new THREE.CanvasTexture(canvas);
      flagTexture.colorSpace = THREE.SRGBColorSpace;
      flagMat.map = flagTexture;
      flagMat.needsUpdate = true;
    });

    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.5), flagMat);
    cloth.position.set(0, 2.05, 0); // Centered relative to group (left edge at x = -2.0)
    flagGroup.add(cloth);
    this.scene.add(flagGroup);

    this.scene.add(bannerGroup);
  }

  buildRooms(classData) {
    const radius = 26;

    classData.forEach((classInfo, idx) => {
      const startAngle = Math.PI; // 180 degrees (far left)
      const angleStep = Math.PI / 4; // 45 degrees step (semicircle)
      const angle = startAngle + idx * angleStep;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const roomGroup = new THREE.Group();
      roomGroup.name = classInfo.id;
      roomGroup.userData.classId = classInfo.id;
      roomGroup.position.set(x, 0, z);
      roomGroup.rotation.y = -angle - Math.PI / 2;

      // 1. Curved Exhibit Backwall
      const wall = new THREE.Mesh(
        this.geometries.roomWall,
        this.materials.walls,
      );
      wall.position.set(0, 2.5, -2.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      roomGroup.add(wall);

      const trimBottom = new THREE.Mesh(
        this.geometries.roomTrimHorizontal,
        this.materials.gold,
      );
      trimBottom.position.set(0, 0.075, -2.4);
      roomGroup.add(trimBottom);

      // 2. Glassmorphic content board
      const board = new THREE.Mesh(
        this.geometries.contentBoard,
        this.materials.glass,
      );
      board.position.set(0, 2.8, -2.2);
      board.castShadow = true;
      roomGroup.add(board);

      // boardFrame removed to prevent drawing the gold horizontal frame bar that blocked the text

      const titleBarMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Dark slate background for premium contrast
        roughness: 0.25,
        metalness: 0.8,
      });
      const titleBar = new THREE.Mesh(
        this.geometries.titleBar,
        titleBarMat,
      );
      titleBar.position.set(0, 5.15, -2.1);
      roomGroup.add(titleBar);

      // Create title text on the bar dynamically
      const titleCanvas = document.createElement("canvas");
      titleCanvas.width = 512;
      titleCanvas.height = 96;
      const titleCtx = titleCanvas.getContext("2d");
      titleCtx.clearRect(0, 0, 512, 96);
      titleCtx.textAlign = "center";
      titleCtx.textBaseline = "middle";
      titleCtx.font = "bold 32px 'Outfit', 'Arial', sans-serif";
      
      let shortTitle = "PHẦN " + (idx + 1);
      if (classInfo.id === 'vai_tro_dai_doan_ket') shortTitle += ": VAI TRÒ";
      else if (classInfo.id === 'luc_luong_dai_doan_ket') shortTitle += ": LỰC LƯỢNG";
      else if (classInfo.id === 'dieu_kien_phuong_thuc') shortTitle += ": ĐIỀU KIỆN";
      else if (classInfo.id === 'mat_tran_dan_toc_thong_nhat') shortTitle += ": MẶT TRẬN";
      else if (classInfo.id === 'ket_luan') shortTitle += ": PHƯƠNG THỨC";

      // Draw premium glowing text shadow (matching the room's accent color)
      titleCtx.shadowColor = classInfo.hexColor || "#ffffff";
      titleCtx.shadowBlur = 10;
      titleCtx.fillStyle = "#ffffff";
      titleCtx.fillText(shortTitle, 256, 48);

      // Also add a clean dark outline for double contrast
      titleCtx.shadowBlur = 0;
      titleCtx.strokeStyle = "rgba(15, 23, 42, 0.9)";
      titleCtx.lineWidth = 2;
      titleCtx.strokeText(shortTitle, 256, 48);

      const titleTexture = new THREE.CanvasTexture(titleCanvas);
      const titleTextMat = new THREE.MeshBasicMaterial({
        map: titleTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const titlePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 0.38),
        titleTextMat,
      );
      titlePlane.position.set(0, 5.15, -2.05); // Exactly centered inside the titleBar
      titlePlane.userData.classId = classInfo.id;
      roomGroup.add(titlePlane);

      // Create board text canvas
      const boardCanvas = document.createElement("canvas");
      boardCanvas.width = 512;
      boardCanvas.height = 320;
      const boardCtx = boardCanvas.getContext("2d");
      boardCtx.clearRect(0, 0, 512, 320);
      
      // Draw decorative gold frame
      boardCtx.strokeStyle = "rgba(217, 119, 6, 0.4)";
      boardCtx.lineWidth = 4;
      boardCtx.strokeRect(15, 15, 482, 290);
      
      // Draw section label
      boardCtx.textAlign = "center";
      boardCtx.textBaseline = "middle";
      boardCtx.fillStyle = "#b45309";
      boardCtx.font = "bold 24px 'Outfit', sans-serif";
      boardCtx.fillText("BÀI HỌC " + (idx + 1), 256, 50);

      // Draw full title (wrapped)
      boardCtx.fillStyle = "#1e293b";
      boardCtx.font = "bold 28px 'Playfair Display', serif";
      const titleText = classInfo.title.replace(/^\d+\.\s*/, "");
      wrapText(boardCtx, titleText, 256, 170, 440, 36);

      const boardTexture = new THREE.CanvasTexture(boardCanvas);
      const boardTextMat = new THREE.MeshBasicMaterial({
        map: boardTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const boardTextPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 2.55),
        boardTextMat,
      );
      boardTextPlane.position.set(0, 3.95, -2.14); // Raise near the top of the exhibit wall
      boardTextPlane.userData.classId = classInfo.id;
      roomGroup.add(boardTextPlane);

      if (classInfo.image) {
        const exhibitFrame = new THREE.Mesh(
          new THREE.BoxGeometry(3.45, 1.9, 0.08),
          new THREE.MeshStandardMaterial({
            color: 0xf5f1e8,
            roughness: 0.75,
            metalness: 0.02,
          }),
        );
        exhibitFrame.position.set(0, 2.05, -2.02);
        exhibitFrame.userData.classId = classInfo.id;
        roomGroup.add(exhibitFrame);

        const exhibitTexture = new THREE.TextureLoader().load(
          classInfo.image,
        );
        exhibitTexture.colorSpace = THREE.SRGBColorSpace;
        exhibitTexture.anisotropy = 8;

        const exhibitImage = new THREE.Mesh(
          new THREE.PlaneGeometry(3.18, 1.76),
          new THREE.MeshBasicMaterial({
            map: exhibitTexture,
            transparent: false,
            side: THREE.DoubleSide,
          }),
        );
        exhibitImage.position.set(0, 2.05, -1.98);
        exhibitImage.userData.classId = classInfo.id;
        roomGroup.add(exhibitImage);
      }

      // 3. (REMOVED Pedestals/Cylinders to keep space clean)

      // 4. Floor Glowing Beacon Ring (REMOVED: delete floor circles)


      // 5. floating 3D symbol
      const symbolGroup = this.createSymbol3D(classInfo, classInfo.color);
      symbolGroup.position.set(0, 1.5, -0.6);
      symbolGroup.name = "symbol";
      roomGroup.add(symbolGroup);

      // 6. Floating Top Lotus on roof (spawns when milestone completed)
      let topLotus;
      const maxDim = this.lotusModel
        ? this.lotusModel.userData.maxDim || 1.0
        : 1.0;
      const targetScale = this.lotusModel ? 1.3 / maxDim : 1.0;

      if (this.lotusModel) {
        topLotus = this.lotusModel.clone();
        topLotus.scale.set(0, 0, 0);
        topLotus.position.set(0, 4.5, -2.4);

        // Color the cloned GLB petals to match room color
        this.colorLotus(topLotus, classInfo.color);
      } else {
        topLotus = createLotusMesh(1.3, classInfo.color, 0.95);
        topLotus.position.set(0, 4.5, -2.4);
        topLotus.scale.set(0, 0, 0);
      }

      topLotus.name = "topLotus";
      topLotus.userData = { targetScale }; // Save targeted scale for game.js interpolation

      const topLotusLight = new THREE.PointLight(classInfo.color, 0, 8);
      topLotusLight.position.set(0, 0.2, 0);
      topLotusLight.name = "topLotusLight";
      topLotus.add(topLotusLight);

      roomGroup.add(topLotus);

      // 7. Spotlight illuminating the exhibit from ceiling
      const spotLightTarget = new THREE.Object3D();
      spotLightTarget.position.set(0, 0.5, -0.6);
      roomGroup.add(spotLightTarget);

      const spotLight = new THREE.SpotLight(
        0xfffbeb,
        1.3,
        10,
        Math.PI / 5,
        0.5,
        1,
      );
      spotLight.position.set(0, 4.5, 0.8);
      spotLight.target = spotLightTarget;
      spotLight.castShadow = false;
      roomGroup.add(spotLight);

      // Specialize Room 3: Glowing 3D Timeline
      if (classInfo.id === "dieu_kien_phuong_thuc") {
        this.buildRoom3Timeline(roomGroup);
      }

      // Specialize Room 4: Virtual LED Screen (REMOVED: to prevent blocking the p_4.jpg image)

      this.scene.add(roomGroup);
      this.pavilions.push({
        id: classInfo.id,
        group: roomGroup,
        color: classInfo.color,
        x,
        z,
      });
    });
  }

  createSymbol3D(classInfo) {
    const group = new THREE.Group();

    // Create canvas for the floating signboard
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, 512, 160);

    // 1. Draw rounded rectangle background (semi-transparent dark slate)
    const x = 10;
    const y = 10;
    const width = 492;
    const height = 140;
    const radius = 24;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    // Background color: semi-transparent slate
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fill();

    // Border color: room color
    ctx.strokeStyle = classInfo.hexColor || "#d97706";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 2. Draw Text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Find index of this room in CLASS_DATA to write PHẦN X
    const idx = [
      'vai_tro_dai_doan_ket',
      'luc_luong_dai_doan_ket',
      'dieu_kien_phuong_thuc',
      'mat_tran_dan_toc_thong_nhat',
      'ket_luan'
    ].indexOf(classInfo.id);
    
    // Draw part label
    ctx.fillStyle = classInfo.hexColor || "#d97706";
    ctx.font = "bold 34px 'Outfit', sans-serif";
    ctx.fillText("PHẦN " + (idx + 1), 256, 50);

    // Draw title label (shortened/adapted full title)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Outfit', sans-serif";
    
    let displayTitle = "";
    if (classInfo.id === 'vai_tro_dai_doan_ket') displayTitle = "VAI TRÒ ĐẠI ĐOÀN KẾT";
    else if (classInfo.id === 'luc_luong_dai_doan_ket') displayTitle = "LỰC LƯỢNG ĐOÀN KẾT";
    else if (classInfo.id === 'dieu_kien_phuong_thuc') displayTitle = "ĐIỀU KIỆN XÂY DỰNG";
    else if (classInfo.id === 'mat_tran_dan_toc_thong_nhat') displayTitle = "MẶT TRẬN DÂN TỘC";
    else if (classInfo.id === 'ket_luan') displayTitle = "PHƯƠNG THỨC XÂY DỰNG";

    ctx.fillText(displayTitle, 256, 108);

    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Create a double-sided plane mesh
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.92), material);
    group.add(plane);

    return group;
  }

  // Material traverser to dynamically color the GLB model's petals
  colorLotus(model, colorHex) {
    model.traverse((child) => {
      if (child.isMesh) {
        // Clone materials to prevent overriding colors across instances
        child.material = child.material.clone();

        const matName = child.material.name.toLowerCase();
        const nodeName = child.name.toLowerCase();

        // Match petal names or common non-green non-stem names
        if (
          matName.includes("petal") ||
          matName.includes("cánh") ||
          matName.includes("flower") ||
          nodeName.includes("petal") ||
          nodeName.includes("cánh") ||
          nodeName.includes("flower") ||
          matName.includes("lotus") ||
          nodeName.includes("lotus") ||
          (!matName.includes("stem") &&
            !matName.includes("stalk") &&
            !matName.includes("leaf") &&
            !matName.includes("lá") &&
            !matName.includes("green") &&
            !matName.includes("cọng"))
        ) {
          child.material.color.setHex(colorHex);
          if (child.material.emissive) {
            child.material.emissive.setHex(colorHex);
            child.material.emissiveIntensity = 0.25;
          }
        }
      }
    });
  }

  buildRoom3Timeline(roomGroup) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 0.02, -0.2),
      new THREE.Vector3(-0.9, 0.03, -0.8),
      new THREE.Vector3(0.0, 0.02, -0.5),
      new THREE.Vector3(0.9, 0.03, -1.0),
      new THREE.Vector3(1.8, 0.02, -0.4),
    ]);

    const points = curve.getPoints(24);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 3,
    });
    const line = new THREE.Line(pathGeo, pathMat);
    roomGroup.add(line);

    const nodeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
    });

    points.forEach((pt, i) => {
      if (i % 6 === 0) {
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.copy(pt);
        roomGroup.add(node);
      }
    });
  }

  buildRoom4VirtualScreen(roomGroup) {
    const screenMount = new THREE.Mesh(
      this.geometries.screenMount,
      this.materials.gold,
    );
    screenMount.position.set(0, 0.7, -2.1);
    roomGroup.add(screenMount);

    const ledPanel = new THREE.Mesh(
      this.geometries.ledPanel,
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.1,
        metalness: 0.8,
      }),
    );
    ledPanel.position.set(0, 2.4, -2.0);
    roomGroup.add(ledPanel);

    const borderMat = this.materials.gold;
    const bTop = new THREE.Mesh(this.geometries.ledBorder, borderMat);
    bTop.position.set(0, 3.42, -1.95);
    const bBot = new THREE.Mesh(this.geometries.ledBorder, borderMat);
    bBot.position.set(0, 1.38, -1.95);
    roomGroup.add(bTop, bBot);
  }
}
