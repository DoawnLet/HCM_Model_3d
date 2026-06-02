import * as THREE from "three";
import { CLASS_DATA } from "./data.js";
import { createAudioSystem } from "./audio.js";
import { SceneManager } from "./SceneManager.js";
import { Avatar } from "./Avatar.js";
import { MuseumBuilder } from "./MuseumBuilder.js";
import { ParticleSystem } from "./ParticleSystem.js";
import { UIManager } from "./UIManager.js";
import { ChatManager } from "./chat/ChatManager.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const lotusUrl = "./assets/lotus_flower_by_geometry_nodes.glb";

const QUALITY_PRESETS = {
  low: {
    scene: {
      pixelRatioCap: 1.0,
      interactionPixelRatioCap: 0.8,
      shadows: false,
      shadowMapSize: 512,
      shadowMapType: THREE.BasicShadowMap,
    },
    particles: {
      dustCount: 120,
      dustSize: 0.22,
      dustRadius: 28,
    },
  },
  medium: {
    scene: {
      pixelRatioCap: 1.5,
      interactionPixelRatioCap: 1.0,
      shadows: true,
      shadowMapSize: 768,
      shadowMapType: THREE.PCFShadowMap,
    },
    particles: {
      dustCount: 220,
      dustSize: 0.26,
      dustRadius: 32,
    },
  },
  high: {
    scene: {
      pixelRatioCap: 2.0,
      interactionPixelRatioCap: 1.25,
      shadows: true,
      shadowMapSize: 1024,
      shadowMapType: THREE.PCFSoftShadowMap,
    },
    particles: {
      dustCount: 380,
      dustSize: 0.3,
      dustRadius: 36,
    },
  },
};

export function createGame() {
  const audio = createAudioSystem();

  // Core module references
  let sceneMgr, avatar, museum, particles, ui, chat;
  let clock;

  let activePedestalId = null;
  let lastCharPos = new THREE.Vector3();
  let camDisplacement = new THREE.Vector3();
  let tempScale = new THREE.Vector3();
  let qualityKey = "medium";
  let particleAccumulator = 0;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let pointerStartX = 0;
  let pointerStartY = 0;

  let gameState = {
    score: 0,
    completedCount: 0,
    completed: {
      vai_tro_dai_doan_ket: false,
      luc_luong_dai_doan_ket: false,
      dieu_kien_phuong_thuc: false,
      mat_tran_dan_toc_thong_nhat: false,
      ket_luan: false,
    },
    isPlaying: false,
    victoryTriggered: false,
  };

  function init() {
    clock = new THREE.Clock();

    // 1. Initialize scene manager
    sceneMgr = new SceneManager("game-canvas");
    sceneMgr.applyQuality(QUALITY_PRESETS[qualityKey].scene);

    // Register 3D click interactions on the window using capturing phase (true)
    // to prevent OrbitControls from intercepting the click events.
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);

    // 2. Initialize UI Manager with action callbacks
    ui = new UIManager({
      onStartGame: startGame,
      onReplay: resetGame,
      onAudioToggle: toggleAudio,
      onChatToggle: openChatLauncher,
      onQualityChange: setQuality,
    });
    ui.setQualityValue(qualityKey);
    chat = new ChatManager({
      sceneManager: sceneMgr,
      onOpenQuiz: triggerQuizOverlay,
    });

    // Add click listeners to HUD checklist items
    CLASS_DATA.forEach((c) => {
      const item = document.getElementById(`chk-${c.id}`);
      if (item) {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          if (gameState.isPlaying) {
            triggerQuizOverlay(c.id);
          }
        });
      }
    });

    // 3. Set up GLTFLoader to load the Lotus model asynchronously
    const loader = new GLTFLoader();
    const statusText = document.getElementById("loading-status");
    const progressFill = document.getElementById("loading-progress");

    if (statusText) statusText.innerText = "Đang tải mô hình Hoa Sen 3D...";

    loader.load(
      lotusUrl,
      (gltf) => {
        const lotusModel = gltf.scene;

        // Calculate bounding box size to dynamically normalize scale factor
        const box = new THREE.Box3().setFromObject(lotusModel);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
        lotusModel.userData.maxDim = maxDim;

        // Build museum with the loaded model
        museum = new MuseumBuilder(sceneMgr.scene, lotusModel);
        avatar = new Avatar(sceneMgr.scene);
        particles = new ParticleSystem(
          sceneMgr.scene,
          QUALITY_PRESETS[qualityKey].particles,
        );

        // Build exhibition rooms
        museum.buildRooms(CLASS_DATA);

        // Synchronize initial state
        lastCharPos.copy(avatar.position);
        ui.updateHUD(
          gameState.score,
          gameState.completedCount,
          CLASS_DATA.length,
        );

        // Hide loader and activate canvas thread
        ui.hideLoader();
        updateQuestText();

        // Register window interaction trigger for E key / tap click
        window.addEventListener("keydown", handleKeyInteraction);

        const interactionPrompt = document.getElementById("interaction-prompt");
        if (interactionPrompt) {
          interactionPrompt.addEventListener("click", () => {
            if (activePedestalId !== null) {
              triggerQuizOverlay(activePedestalId);
            }
          });
        }

        // Expose debug helpers on window object
        window.gameState = gameState;
        window.avatar = avatar;
        window.sceneMgr = sceneMgr;
        window.museum = museum;
        window.THREE = THREE;

        animate();
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          if (statusText)
            statusText.innerText = `Đang tải mô hình Hoa Sen 3D (29MB): ${percent}%`;
          if (progressFill) progressFill.style.width = `${percent}%`;
        } else {
          const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
          if (statusText)
            statusText.innerText = `Đang tải mô hình Hoa Sen 3D: ${loadedMb} MB...`;
        }
      },
      (error) => {
        console.error(
          "Failed to load GLB lotus model, falling back to procedural:",
          error,
        );
        if (statusText)
          statusText.innerText = "Đang khởi chạy cấu hình dự phòng...";

        // Fallback: build with procedural model
        museum = new MuseumBuilder(sceneMgr.scene, null);
        avatar = new Avatar(sceneMgr.scene);
        particles = new ParticleSystem(
          sceneMgr.scene,
          QUALITY_PRESETS[qualityKey].particles,
        );

        museum.buildRooms(CLASS_DATA);
        lastCharPos.copy(avatar.position);
        ui.updateHUD(
          gameState.score,
          gameState.completedCount,
          CLASS_DATA.length,
        );
        ui.hideLoader();
        updateQuestText();
        window.addEventListener("keydown", handleKeyInteraction);

        animate();
      },
    );
  }

  function startGame() {
    audio.playClickSound();
    audio.setEnabled(true);
    audio.resume();

    ui.hideMainMenu();
    gameState.isPlaying = true;
    updateQuestText();
    lastCharPos.copy(avatar.position);
    audio.startBackgroundMusic();
  }

  function setQuality(nextQuality) {
    if (!QUALITY_PRESETS[nextQuality]) return;
    qualityKey = nextQuality;
    sceneMgr.applyQuality(QUALITY_PRESETS[qualityKey].scene);
    if (particles)
      particles.applyQuality(QUALITY_PRESETS[qualityKey].particles);
  }

  function toggleAudio() {
    audio.setEnabled(!audio.enabled);
    audio.playClickSound();
    const btn = document.getElementById("audio-toggle-btn");
    if (audio.enabled) {
      btn.innerHTML = '<span class="icon">🔊</span>';
      audio.startBackgroundMusic();
      audio.resume();
    } else {
      btn.innerHTML = '<span class="icon">🔇</span>';
      audio.stopBackgroundMusic();
    }
  }

  function handleKeyInteraction(e) {
    if (
      e.key.toLowerCase() === "e" &&
      activePedestalId !== null &&
      gameState.isPlaying
    ) {
      triggerQuizOverlay(activePedestalId);
    }
  }

  function openChatOverlay(classId) {
    if (!museum || !chat) return;

    const classInfo = CLASS_DATA.find((item) => item.id === classId);
    const pavilion = museum.pavilions.find((item) => item.id === classId);
    if (!classInfo) return;

    chat.open(classInfo, pavilion?.group || null);
  }

  function openChatLauncher() {
    if (activePedestalId !== null) {
      openChatOverlay(activePedestalId);
      return;
    }

    if (CLASS_DATA.length > 0) {
      openChatOverlay(CLASS_DATA[0].id);
    }
  }

  function triggerQuizOverlay(classId) {
    const classInfo = CLASS_DATA.find((c) => c.id === classId);
    if (!classInfo) return;

    // Freeze avatar movement when studying
    avatar.setJoystick(0, 0, false);

    ui.openQuiz(classInfo, (isCorrect) => {
      if (isCorrect) {
        // Mark completed in game state
        gameState.completed[classId] = true;
        gameState.score += 100;
        gameState.completedCount++;
        updateQuestText();

        // Trigger visual bursts
        const pavilion = museum.pavilions.find((p) => p.id === classId);
        if (pavilion) {
          particles.spawnRoomBurst(pavilion.x, 0.5, pavilion.z, pavilion.color);

          // Flash beacon floor ring
          const beacon = pavilion.group.getObjectByName("beacon");
          if (beacon) {
            beacon.material.color.setHex(0xffffff);
            setTimeout(() => {
              beacon.material.color.setHex(pavilion.color);
              beacon.scale.set(1.15, 1.15, 1.15);
            }, 250);
          }
        }

        ui.markChecklistCompleted(classId);
        ui.updateHUD(
          gameState.score,
          gameState.completedCount,
          CLASS_DATA.length,
        );

        // Animate central point light intensity based on unity level
        const centerGlow = sceneMgr.scene.getObjectByName("centerGlow");
        if (centerGlow) {
          centerGlow.intensity = 1.2 + gameState.completedCount * 0.9;
          centerGlow.distance = 35 + gameState.completedCount * 4;
        }

        // Autoclose panel and check victory
        setTimeout(() => {
          ui.closeQuiz();
          checkVictoryCondition();
        }, 1900);
      }
    });
  }

  function checkVictoryCondition() {
    if (
      gameState.completedCount === CLASS_DATA.length &&
      !gameState.victoryTriggered
    ) {
      gameState.victoryTriggered = true;
      gameState.isPlaying = false;

      // Camera rotates around the beautiful central pond/lotus
      sceneMgr.controls.autoRotate = true;
      sceneMgr.controls.autoRotateSpeed = 1.5;

      // Blast all dust particles outwards
      particles.blastVictoryParticles();

      // Display victory menu with a nice delay
      setTimeout(() => {
        ui.showVictoryScreen(gameState.score);
      }, 2400);
    }
  }

  function updateQuestText() {
    const total = CLASS_DATA.length;
    const completed = gameState.completedCount;
    if (completed < total) {
      ui.updateQuest(
        `Hãy học và hoàn thành cả 5 phần bài học (Đã hoàn thành ${completed}/${total})`,
      );
    } else {
      ui.updateQuest("Hành trình hoàn tất! Chiêm ngưỡng Vườn Sen.");
    }
  }

  function resetGame() {
    audio.playClickSound();

    // 1. Reset variables
    gameState.score = 0;
    gameState.completedCount = 0;
    gameState.victoryTriggered = false;
    Object.keys(gameState.completed).forEach(
      (k) => (gameState.completed[k] = false),
    );

    // 2. Reset 3D models scales
    museum.pavilions.forEach((p) => {
      const topLotus = p.group.getObjectByName("topLotus");
      if (topLotus) topLotus.scale.set(0, 0, 0);
    });

    const centerGlow = sceneMgr.scene.getObjectByName("centerGlow");
    if (centerGlow) {
      centerGlow.intensity = 1.2;
      centerGlow.distance = 35;
    }

    // 3. Reset Avatar position
    avatar.position.set(0, 0, 18);
    avatar.mesh.rotation.set(0, 0, 0);
    avatar.vy = 0;
    avatar.isJumping = false;
    lastCharPos.copy(avatar.position);

    // 4. Reset camera and controls
    sceneMgr.camera.position.set(0, 16, 28);
    sceneMgr.controls.target.set(0, 2, 0);
    sceneMgr.controls.autoRotate = false;

    // 5. Reset UI components
    ui.hideVictoryScreen();
    if (chat) chat.close();
    ui.resetChecklist(CLASS_DATA);
    ui.updateHUD(gameState.score, 0, CLASS_DATA.length);

    gameState.isPlaying = true;
    updateQuestText();
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    if (chat) chat.update(sceneMgr.camera, sceneMgr.renderer);

    // 1. Update character and inputs (freeze movement if in quiz dialog)
    const isDialogActive = document
      .getElementById("quiz-dialog")
      .classList.contains("active");
    const isChatActive = chat ? chat.isOpen() : false;
    const isFrozen = !gameState.isPlaying || isDialogActive || isChatActive;
    avatar.update(delta, sceneMgr.camera, isFrozen);

    // 2. Camera following character
    updateCameraFollow();

    // 3. Update scene rendering managers
    sceneMgr.update();
    clampCameraPosition();
    const shouldAnimateEffects =
      gameState.isPlaying || gameState.victoryTriggered;
    const isInteracting = sceneMgr.isUserInteracting();
    if (shouldAnimateEffects) {
      if (isInteracting) {
        particleAccumulator += delta;
        if (particleAccumulator >= 1 / 30) {
          particles.update(particleAccumulator, time);
          particleAccumulator = 0;
        }
      } else {
        particleAccumulator = 0;
        particles.update(delta, time);
      }
    }

    // 4. Animate Central Lotus in pond
    if (shouldAnimateEffects && museum.centralLotus) {
      museum.centralLotus.rotation.y += 0.16 * delta;
      museum.centralLotus.position.y = Math.sin(time * 1.5) * 0.08 + 0.35;
    }

    // 5. Animate Water Ripples
    if (
      shouldAnimateEffects &&
      museum.centralPond &&
      museum.centralPond.material.bumpMap
    ) {
      museum.centralPond.material.bumpMap.offset.x = time * 0.012;
      museum.centralPond.material.bumpMap.offset.y = time * 0.016;
    }

    // 6. Animate Room structures
    if (shouldAnimateEffects)
      museum.pavilions.forEach((p) => {
        // Rotate the floating 3D symbols
        const symbol = p.group.getObjectByName("symbol");
        if (symbol) {
          symbol.rotation.y += 0.9 * delta;
          symbol.position.y = Math.sin(time * 2.2 + p.x) * 0.08 + 1.5;
        }

        // Pulsing beacons on floor
        const beacon = p.group.getObjectByName("beacon");
        if (beacon) {
          if (!gameState.completed[p.id]) {
            const sc = 1.0 + Math.sin(time * 3 + p.z) * 0.08;
            beacon.scale.set(sc, sc, sc);
            beacon.material.opacity = 0.38 + Math.sin(time * 3 + p.z) * 0.12;
          } else {
            beacon.scale.set(1.02, 1.02, 1.02);
            beacon.material.opacity = 0.65;
          }
        }

        // Lerp scale top roof lotus if completed
        const topLotus = p.group.getObjectByName("topLotus");
        if (topLotus) {
          if (gameState.completed[p.id]) {
            const targetScale = topLotus.userData.targetScale || 1.0;
            tempScale.set(targetScale, targetScale, targetScale);
            topLotus.scale.lerp(tempScale, 0.06);
            topLotus.rotation.y += 0.22 * delta;
            const light = topLotus.getObjectByName("topLotusLight");
            if (light) light.intensity = 2.0 + Math.sin(time * 5.0) * 0.6;
          } else {
            topLotus.scale.set(0, 0, 0);
            const light = topLotus.getObjectByName("topLotusLight");
            if (light) light.intensity = 0;
          }
        }
      });

    // 7. Check player proximity trigger
    checkProximity();

    // 8. Render WebGL scene
    sceneMgr.render();
  }

  function updateCameraFollow() {
    if (!gameState.isPlaying || sceneMgr.isUserInteracting()) return;

    // Translate camera linearly along with player translation
    camDisplacement.subVectors(avatar.position, lastCharPos);
    sceneMgr.camera.position.add(camDisplacement);

    // Face player center (offset y by 0.8 to focus on head)
    sceneMgr.controls.target.set(
      avatar.position.x,
      avatar.position.y + 0.8,
      avatar.position.z,
    );

    lastCharPos.copy(avatar.position);
  }

  function clampCameraPosition() {
    if (!sceneMgr || !sceneMgr.camera) return;

    // 1. Clamp horizontal radius (XZ plane) inside the outer wall (radius 37.6)
    const camX = sceneMgr.camera.position.x;
    const camZ = sceneMgr.camera.position.z;
    const camDistSq = camX * camX + camZ * camZ;
    const maxCamRadius = 36.6; // 1 unit margin from the 37.6 outer wall
    if (camDistSq > maxCamRadius * maxCamRadius) {
      const camDist = Math.sqrt(camDistSq);
      sceneMgr.camera.position.x = (camX / camDist) * maxCamRadius;
      sceneMgr.camera.position.z = (camZ / camDist) * maxCamRadius;
    }

    // 2. Clamp height (Y) inside the ceiling (12.0) and above the floor (0.0)
    if (sceneMgr.camera.position.y < 0.6) {
      sceneMgr.camera.position.y = 0.6;
    } else if (sceneMgr.camera.position.y > 11.2) {
      sceneMgr.camera.position.y = 11.2;
    }
  }

  function handlePointerDown(e) {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    console.log(
      "[DigitalTwin 3D] Pointer Down:",
      pointerStartX,
      pointerStartY,
      e.target,
    );
  }

  function handlePointerUp(e) {
    console.log(
      "[DigitalTwin 3D] Pointer Up. Target:",
      e.target,
      "Playing:",
      gameState.isPlaying,
    );
    if (!gameState.isPlaying) return;

    // Ignore clicks on UI overlay elements instead of restricting to exact canvas target
    if (
      e.target &&
      (e.target.tagName === "BUTTON" ||
        (typeof e.target.closest === "function" &&
          (e.target.closest("#quiz-dialog") ||
            e.target.closest("#chat-dialog") ||
            e.target.closest("#game-hud") ||
            e.target.closest("#main-menu"))))
    ) {
      console.log(
        "[DigitalTwin 3D] Pointer Up ignored: Clicked on UI element",
        e.target,
      );
      return;
    }

    // Distinguish click from drag (allowing a safe 10-pixel threshold)
    const diffX = Math.abs(e.clientX - pointerStartX);
    const diffY = Math.abs(e.clientY - pointerStartY);
    console.log("[DigitalTwin 3D] Pointer movement diff:", diffX, diffY);
    if (diffX > 10 || diffY > 10) {
      console.log("[DigitalTwin 3D] Pointer Up ignored: Drag detected");
      return;
    }

    // Map pointer to normalized device coordinates
    const rect = sceneMgr.renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, sceneMgr.camera);

    console.log("[DigitalTwin 3D] Active room/pedestal ID:", activePedestalId);
    // Only allow clicking if player is standing in front of the room
    if (activePedestalId === null) return;
    const activePavilion = museum.pavilions.find(
      (p) => p.id === activePedestalId,
    );
    if (!activePavilion) return;

    // Intersect the entire scene to ensure we pick up all geometries
    const intersects = raycaster.intersectObjects(
      sceneMgr.scene.children,
      true,
    );
    console.log(
      "[DigitalTwin 3D] Raycast total intersects in scene:",
      intersects.length,
    );

    let clickedExhibit = false;
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      let parent = obj;
      // Traverse up parent hierarchy to see if this object belongs to the active room group
      while (parent) {
        if (parent === activePavilion.group) {
          clickedExhibit = true;
          console.log(
            "[DigitalTwin 3D] Intersected active room element:",
            obj.name || obj.type,
            "Parent group matched!",
          );
          break;
        }
        parent = parent.parent;
      }
      if (clickedExhibit) break;
    }

    if (clickedExhibit) {
      console.log(
        "[DigitalTwin 3D] Opening slide for exhibit:",
        activePedestalId,
      );
      triggerQuizOverlay(activePedestalId);
    } else {
      console.log("[DigitalTwin 3D] Click did not hit the active room group.");
    }
  }

  function checkProximity() {
    if (!gameState.isPlaying || gameState.victoryTriggered) return;

    let nearAny = false;
    for (const pavilion of museum.pavilions) {
      const dx = avatar.position.x - pavilion.x;
      const dz = avatar.position.z - pavilion.z;
      const distSq = dx * dx + dz * dz;

      // Check if player is standing next to exhibition pedestal
      if (distSq < 4.2 * 4.2) {
        if (gameState.completed[pavilion.id]) continue; // skip completed rooms

        nearAny = true;
        activePedestalId = pavilion.id;

        const classInfo = CLASS_DATA.find((c) => c.id === pavilion.id);
        if (classInfo) {
          ui.showInteractionPrompt(classInfo.title);
        }
        break;
      }
    }

    if (!nearAny) {
      activePedestalId = null;
      ui.hideInteractionPrompt();
    }
  }

  // Connect touch events on mobile virtual joystick to avatar controller
  const joyContainer = document.getElementById("joystick-container");
  if (joyContainer) {
    const joyDot = document.getElementById("joystick-dot");
    let startX = 0,
      startY = 0;
    const maxDist = 45;

    joyContainer.addEventListener(
      "touchstart",
      () => {
        const rect = joyContainer.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        avatar.joystick.active = true;
      },
      { passive: true },
    );

    joyContainer.addEventListener(
      "touchmove",
      (e) => {
        if (!avatar.joystick.active) return;
        const touch = e.touches[0];
        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        joyDot.style.left = `calc(50% + ${dx}px)`;
        joyDot.style.top = `calc(50% + ${dy}px)`;

        avatar.setJoystick(dx / maxDist, -dy / maxDist, true);
      },
      { passive: true },
    );

    joyContainer.addEventListener("touchend", () => {
      avatar.setJoystick(0, 0, false);
      joyDot.style.left = "50%";
      joyDot.style.top = "50%";
    });
  }

  return { init };
}
