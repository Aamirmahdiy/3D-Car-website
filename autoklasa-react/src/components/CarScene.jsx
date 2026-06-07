import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import '../styles/carScene.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Tunables ───────────────────────────────────────────────
   Tweak these if the framing needs nudging.                     */
const CAM_DIST = 12;          // camera distance on +Z (straight-on side view)
const FOV = 35;               // desktop field of view
const FOV_MOBILE = 50;
const COVERAGE = 0.62;        // car width as fraction of viewport width (desktop)
const COVERAGE_MOBILE = 0.82;
const TRAVEL = 6;             // car drifts from +TRAVEL (right) to -TRAVEL (left)
const FLIP_FACING = true;     // true → nose leads the direction of travel (left)
const HANG = 1.1;             // how far below the band the car hangs (×half-height)
const LINE_OFFSET = 0;        // extra vertical nudge in world units

/* Band edge top-fractions — MUST match the clip-path in carScene.css */
const BAND_RIGHT = 0.16, BAND_LEFT = 0.40;
const BAND_RIGHT_M = 0.12, BAND_LEFT_M = 0.30;

function PorscheModel({ animRef }) {
  const { scene } = useGLTF('/porsche911.glb');
  const groupRef = useRef();
  const [geom, setGeom] = useState(null);

  useEffect(() => {
    if (!scene) return;

    const isMobile = window.innerWidth < 768;
    const bandTop = isMobile ? BAND_RIGHT_M : BAND_RIGHT;
    const bandLeft = isMobile ? BAND_LEFT_M : BAND_LEFT;

    // Measure the model in its native orientation
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // A car is longest along its driving axis. Rotate so length lands on
    // world X (screen horizontal) for a clean side profile.
    let sideRotY = size.z > size.x ? Math.PI / 2 : 0;
    if (FLIP_FACING) sideRotY += Math.PI;

    const carLength = Math.max(size.x, size.z);

    // Viewport in world units at the z=0 plane
    const fovV = ((isMobile ? FOV_MOBILE : FOV) * Math.PI) / 180;
    const aspect = window.innerWidth / window.innerHeight;
    const viewH = 2 * CAM_DIST * Math.tan(fovV / 2);
    const viewW = viewH * aspect;

    // Auto-scale: fit car to COVERAGE of the viewport width
    const coverage = isMobile ? COVERAGE_MOBILE : COVERAGE;
    const scale = carLength > 0 ? (viewW * coverage) / carLength : 1;

    // Tilt the car so its long axis lies along the band line.
    // Line drops toward the left → positive slope in world Y per world X.
    const slope = (bandLeft - bandTop) / aspect;
    const tilt = Math.atan(slope);

    setGeom({
      scale,
      sideRotY,
      tilt,
      center: [-center.x, -center.y, -center.z],
      halfHeight: (size.y * scale) / 2,
      viewH,
      viewW,
      halfW: viewW / 2,
      halfH: viewH / 2,
      bandTop,
      bandLeft,
    });
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current || !geom) return;

    const x = animRef.current.carX;
    // Where the band line sits (world Y) directly above this x
    const fx = (x + geom.halfW) / geom.viewW;            // 0 (left) → 1 (right)
    const bandFrac = geom.bandLeft + (geom.bandTop - geom.bandLeft) * fx;
    const yLine = geom.halfH - bandFrac * geom.viewH;    // camera looks at origin
    const y = yLine - geom.halfHeight * HANG + LINE_OFFSET;

    groupRef.current.position.set(x, y, 0);
    groupRef.current.rotation.z = geom.tilt;
  });

  if (!geom) return null;

  return (
    <group ref={groupRef}>
      {/* Flip upside-down about the screen-horizontal axis (true vertical mirror,
          stays a proper rotation so lighting/normals remain correct) */}
      <group rotation={[Math.PI, 0, 0]}>
        {/* Orient to side profile + scale about the model's centre */}
        <group rotation={[0, geom.sideRotY, 0]} scale={geom.scale}>
          <primitive object={scene} position={geom.center} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/porsche911.glb');

export default function CarScene() {
  const wrapperRef = useRef();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Shared state tweened by GSAP, read by useFrame — no React re-renders.
  const animRef = useRef({ carX: TRAVEL });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const anim = animRef.current;

    const ctx = gsap.context(() => {
      gsap.to(anim, {
        carX: -TRAVEL, // right → left, following the line down
        ease: 'none',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="car-scene-wrapper" ref={wrapperRef}>
      <div className="car-scene-sticky">
        <Canvas
          className="car-canvas"
          camera={{ fov: isMobile ? FOV_MOBILE : FOV, position: [0, 0, CAM_DIST] }}
          onCreated={({ camera }) => {
            camera.position.set(0, 0, CAM_DIST);
            camera.lookAt(0, 0, 0);
          }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[6, 8, 10]} intensity={2.5} />
          <Environment preset="city" background={false} />

          <Suspense fallback={null}>
            <PorscheModel animRef={animRef} />
          </Suspense>
        </Canvas>

        {/* Black diagonal band — tilts down toward the left, car rides beneath */}
        <div className="car-scene-band" />
      </div>
    </div>
  );
}
