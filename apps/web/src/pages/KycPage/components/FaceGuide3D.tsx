import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

export type FaceChallenge =
  | 'idle'
  | 'look_straight'
  | 'look_left'
  | 'look_right'
  | 'look_up'
  | 'look_down'
  | 'open_mouth';

interface FaceGuide3DProps {
  challenge: FaceChallenge;
  size?: number;
}

// Target rotations per challenge
const TARGET_ROTATIONS: Record<FaceChallenge, { x: number; y: number }> = {
  idle:          { x: 0,     y: 0 },
  look_straight: { x: 0,     y: 0 },
  look_left:     { x: 0,     y: 0.65 },
  look_right:    { x: 0,     y: -0.65 },
  look_up:       { x: -0.45, y: 0 },
  look_down:     { x: 0.45,  y: 0 },
  open_mouth:    { x: 0,     y: 0 },
};

const CHALLENGE_COLORS: Record<FaceChallenge, number> = {
  idle:          0x3b82f6,
  look_straight: 0x22c55e,
  look_left:     0x3b82f6,
  look_right:    0x3b82f6,
  look_up:       0x3b82f6,
  look_down:     0x3b82f6,
  open_mouth:    0x3b82f6,
};

function FaceGuide3D({ challenge, size = 120 }: FaceGuide3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    headGroup: THREE.Group;
    animFrame: number;
  } | null>(null);

  const challengeRef = useRef<FaceChallenge>(challenge);
  challengeRef.current = challenge;

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
    rimLight.position.set(-2, -1, -2);
    scene.add(rimLight);

    // --- Build Head Group ---
    const headGroup = new THREE.Group();

    // Head (slightly flattened sphere)
    const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
    headGeo.scale(1, 1.15, 0.9);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.15,
      wireframe: false,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);

    // Wireframe overlay
    const wireGeo = new THREE.SphereGeometry(0.87, 14, 10);
    wireGeo.scale(1, 1.15, 0.9);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      opacity: 0.18,
      transparent: true,
    });
    headGroup.add(new THREE.Mesh(wireGeo, wireMat));

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.28, 0.18, 0.75);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.28, 0.18, 0.75);
    headGroup.add(leftEye, rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.28, 0.18, 0.84);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.28, 0.18, 0.84);
    headGroup.add(leftPupil, rightPupil);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.07, 0.25, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.05, 0.86);
    headGroup.add(nose);

    // Mouth
    const mouthGeo = new THREE.PlaneGeometry(0.18, 0.04);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.name = 'mouth';
    mouth.position.set(0, -0.32, 0.82);
    mouth.rotation.x = -0.15; // match head curve slightly
    headGroup.add(mouth);

    // Direction arrow (shows which way to turn)
    const arrowDir = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.4,
      0x22c55e,
      0.35,
      0.2
    );
    arrowDir.name = 'arrow';
    arrowDir.visible = false;
    headGroup.add(arrowDir);

    scene.add(headGroup);
    sceneRef.current = { renderer, scene, camera, headGroup, animFrame: 0 };

    // --- Animation Loop ---
    let currentX = 0;
    let currentY = 0;

    const animate = () => {
      const ref = sceneRef.current;
      if (!ref) return;

      const target = TARGET_ROTATIONS[challengeRef.current];
      // Lerp toward target
      currentX += (target.x - currentX) * 0.08;
      currentY += (target.y - currentY) * 0.08;
      ref.headGroup.rotation.x = currentX;
      ref.headGroup.rotation.y = currentY;

      // Update head color
      const color = CHALLENGE_COLORS[challengeRef.current];
      (headMesh.material as THREE.MeshStandardMaterial).color.setHex(color);

      // Animate mouth
      const mouthMesh = ref.headGroup.getObjectByName('mouth');
      if (mouthMesh) {
        const targetScaleY = challengeRef.current === 'open_mouth' ? 4.5 : 1.0;
        mouthMesh.scale.y += (targetScaleY - mouthMesh.scale.y) * 0.15;
      }

      // Arrow visibility
      const arrow = ref.headGroup.getObjectByName('arrow') as THREE.ArrowHelper;
      if (arrow) {
        const ch = challengeRef.current;
        arrow.visible = ch !== 'idle' && ch !== 'look_straight' && ch !== 'open_mouth';
        if (arrow.visible) {
          let dir = new THREE.Vector3(0, 0, 0);
          if (ch === 'look_left')  dir.set(-1, 0, 0);
          if (ch === 'look_right') dir.set(1, 0, 0);
          if (ch === 'look_up')   dir.set(0, 1, 0);
          if (ch === 'look_down') dir.set(0, -1, 0);
          // Arrow in world space offset from head
          arrow.position.set(dir.x * 0.6, dir.y * 0.6, 0);
          arrow.setDirection(dir);
        }
      }

      ref.renderer.render(ref.scene, ref.camera);
      ref.animFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animFrame);
        sceneRef.current.renderer.dispose();
        if (mountRef.current && sceneRef.current.renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current = null;
      }
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden"
    />
  );
}

export default memo(FaceGuide3D);
