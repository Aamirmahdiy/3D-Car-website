import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CITY_ENV } from './cityEnv';
import { optimizeCarModel, disposeOptimized } from './optimizeCarModel';
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

function MercedesModel({ animRef }) {
  const { scene } = useGLTF('/mercedes-_benz_w206_c220.glb');
  const groupRef = useRef();
  const [geom, setGeom] = useState(null);

  // Collapse the model's hundreds of draw calls into a few merged meshes, with
  // the 4 wheels kept as spinnable pivots. (Mercedes glass is plain BLEND, so no
  // transmission pass to neutralize.)
  const { group, wheelPivots, wheelRadius } = useMemo(
    () => optimizeCarModel(scene.clone(true), { keepWheels: true, neutralizeTransmission: false }),
    [scene]
  );

  // Wheel rolling state (wheelPivots/wheelRadius are stable from useMemo).
  const prevCarX = useRef(null);

  // Free merged geometry buffers when this scene unmounts.
  useEffect(() => () => disposeOptimized(group), [group]);

  useEffect(() => {
    if (!group) return;

    const isMobile = window.innerWidth < 768;
    const bandTop = isMobile ? BAND_RIGHT_M : BAND_RIGHT;
    const bandLeft = isMobile ? BAND_LEFT_M : BAND_LEFT;

    // Measure the model in its native orientation
    const box = new THREE.Box3().setFromObject(group);
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

  }, [group]);

  useFrame(() => {
    if (!groupRef.current || !geom) return;

    const x = animRef.current.carX;

    // ── wheel rolling ──────────────────────────────────────────────────────
    if (prevCarX.current !== null && wheelPivots.length > 0) {
      const deltaX = x - prevCarX.current;
      // World distance = model distance × scale  →  angle = worldDelta / (radius × scale)
      const angle = -deltaX / (wheelRadius * geom.scale);
      wheelPivots.forEach(w => { w.rotation.x += angle; });
    }
    prevCarX.current = x;

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
          <primitive object={group} position={geom.center} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/mercedes-_benz_w206_c220.glb');

export default function CarScene() {
  const wrapperRef = useRef();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Shared animation state — tweened by GSAP, read by useFrame every frame.
  const animRef = useRef({ carX: TRAVEL });
  // Scoped render trigger for this canvas (frameloop="demand").
  const invalidateRef = useRef(null);
  // Whether the scene is on screen — gates the render loop entirely.
  const [inView, setInView] = useState(true);

  // Pause rendering completely while the section is scrolled out of view.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) invalidateRef.current?.();
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const anim = animRef.current;
    anim.carX = TRAVEL;

    const SCROLL_RANGE = window.innerHeight * 1.4;

    // Entrance: car sweeps right → centre on page load (before any scroll)
    let entrance = gsap.to(anim, {
      carX: 0,
      duration: 1.4,
      ease: 'power3.out',
      delay: 0.3,
      onUpdate: () => invalidateRef.current?.(),
    });

    // Scroll: drive carX 0 → -TRAVEL with smooth scrub (mirrors WhySection approach)
    const ctx = gsap.context(() => {
      gsap.fromTo(anim,
        { carX: 0 },
        {
          carX: -TRAVEL,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: `+=${SCROLL_RANGE}`,
            scrub: 0.5,
            onUpdate: (self) => {
              invalidateRef.current?.();
              if (entrance && self.progress > 0) {
                entrance.kill();
                entrance = null;
              }
            },
          },
        }
      );
    });

    return () => {
      entrance?.kill();
      ctx.revert();
    };
  }, []);

  return (
    <div className="car-scene-wrapper" ref={wrapperRef}>
      <div className="car-scene-sticky">
        <Canvas
          className="car-canvas"
          frameloop={inView ? 'demand' : 'never'}
          dpr={[1, 1.5]}
          camera={{ fov: isMobile ? FOV_MOBILE : FOV, position: [0, 0, CAM_DIST] }}
          onCreated={({ camera, invalidate }) => {
            camera.position.set(0, 0, CAM_DIST);
            camera.lookAt(0, 0, 0);
            invalidateRef.current = invalidate;
          }}
          gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[6, 8, 10]} intensity={2.5} />
          <Environment files={CITY_ENV} background={false} />

          <Suspense fallback={null}>
            <MercedesModel animRef={animRef} />
          </Suspense>
        </Canvas>

        {/* Black diagonal band — tilts down toward the left, car rides beneath */}
        <div className="car-scene-band" />
      </div>
    </div>
  );
}
