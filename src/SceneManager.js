import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.lights = {};
    this.quality = null;
    this.maxPixelRatio = 2;
    this.basePixelRatioCap = 2;
    this.interactionPixelRatioCap = 1.0;
    this.isInteracting = false;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    // Pearl white bright museum atmosphere
    this.scene.background = new THREE.Color(0xf1f3f6);
    this.scene.fog = new THREE.FogExp2(0xf1f3f6, 0.012);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    // Start at lobby looking down the hallway
    this.camera.position.set(0, 16, 28);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.maxPixelRatio),
    );
    this.renderer.colorManagement = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Orbit Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.28;
    this.controls.zoomSpeed = 0.55;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Block looking under floor
    this.controls.minDistance = 3;
    this.controls.maxDistance = 75;
    this.controls.target.set(0, 2, 0);

    this.controls.addEventListener("start", () => {
      this.isInteracting = true;
      this.setInteractionMode(true);
    });
    this.controls.addEventListener("end", () => {
      this.isInteracting = false;
      this.setInteractionMode(false);
    });

    // 5. Lights setup
    this.setupLights();

    // 6. Window resize listener
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  applyQuality(preset) {
    if (!preset) return;

    this.quality = {
      pixelRatioCap: 1.5,
      interactionPixelRatioCap: 1.0,
      shadows: true,
      shadowMapSize: 1024,
      shadowMapType: THREE.PCFShadowMap,
      ...preset,
    };

    this.basePixelRatioCap = this.quality.pixelRatioCap;
    this.interactionPixelRatioCap = this.quality.interactionPixelRatioCap;
    this.maxPixelRatio = this.basePixelRatioCap;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.maxPixelRatio),
    );
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = this.quality.shadowMapType;

    if (this.lights.sunLight) {
      this.lights.sunLight.castShadow = this.quality.shadows;
      if (this.quality.shadowMapSize) {
        this.lights.sunLight.shadow.mapSize.width = this.quality.shadowMapSize;
        this.lights.sunLight.shadow.mapSize.height = this.quality.shadowMapSize;
      }
      this.lights.sunLight.shadow.needsUpdate = true;
    }
  }

  setupLights() {
    // Soft white ambient light to prevent pitch-black shadows
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);
    this.lights.ambient = ambient;

    // Warm directional "sunlight" coming through sky skylight windows
    const sunLight = new THREE.DirectionalLight(0xfffaf0, 1.1);
    sunLight.position.set(20, 30, -15);
    sunLight.castShadow = true;

    // Shadow configuration for optimal performance & softness
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);
    this.lights.sunLight = sunLight;

    // Secondary soft blue/cool light reflection from walls
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.35);
    fillLight.position.set(-20, 15, 20);
    this.scene.add(fillLight);
    this.lights.fillLight = fillLight;

    // Central yellow spotlight over Ao Sen / Lobby
    const lobbyGlow = new THREE.PointLight(0xd97706, 1.2, 35);
    lobbyGlow.position.set(0, 4, 0);
    lobbyGlow.name = "centerGlow";
    this.scene.add(lobbyGlow);
    this.lights.lobbyGlow = lobbyGlow;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.maxPixelRatio),
    );
  }

  update() {
    if (
      this.controls.autoRotate ||
      this.controls.enableDamping ||
      this.isInteracting
    ) {
      this.controls.update();
    }
  }

  setInteractionMode(active) {
    this.maxPixelRatio = active
      ? this.interactionPixelRatioCap
      : this.basePixelRatioCap;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.maxPixelRatio),
    );
  }

  isUserInteracting() {
    return this.isInteracting;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
