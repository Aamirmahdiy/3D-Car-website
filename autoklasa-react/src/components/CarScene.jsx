import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
const ENTRANCE_TRAVEL = 14.5;   // entrance starts here — past the right viewport edge
const FLIP_FACING = true;     // true → nose leads the direction of travel (left)
const HANG = 1.1;             // how far below the band the car hangs (×half-height)
const LINE_OFFSET = 0;        // extra vertical nudge in world units
const ENTRANCE_DURATION = 2.0;   // seconds — slow, graceful sweep-in
const SCROLL_RANGE_VH = 1.4;     // scroll distance (×viewport height) that maps carX 0 → -TRAVEL

// Gentle slow-in / slow-out: no sudden velocity at either end, so there's
// nothing for a dropped frame to judder against.
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - ((-2 * p + 2) ** 3) / 2);

/* Band edge top-fractions — MUST match the clip-path in carScene.css */
const BAND_RIGHT = 0.16, BAND_LEFT = 0.40;
const BAND_RIGHT_M = 0.12, BAND_LEFT_M = 0.30;

function MercedesModel({ animRef, entranceRef, startEntranceRef, warmupRef, measureRef, onEntranceDone }) {
  const { scene } = useGLTF('/mercedes-_benz_w206_c220.glb');
  const groupRef = useRef();
  const [geom, setGeom] = useState(null);

  // R3F renderer/scene/camera for the one-shot GPU warm-up before the sweep.
  const gl = useThree(s => s.gl);
  const r3fScene = useThree(s => s.scene);
  const camera = useThree(s => s.camera);

  // Expose a warm-up that synchronously links shaders + processes the
  // environment (the expensive, blocking part of the first render). We don't
  // present a frame here — that's left to the first "always"-loop render, which
  // draws the car correctly off-screen at carX=TRAVEL before the tween starts,
  // so the compile hitch lands on a stationary frame with no positional flash.
  useEffect(() => {
    warmupRef.current = () => { gl.compile(r3fScene, camera); };
    return () => { warmupRef.current = null; };
  }, [gl, r3fScene, camera, warmupRef]);

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

  // Measure the model + viewport into `geom`. Re-run on resize (via measureRef,
  // owned by the parent) so the car stays sized and aligned to the band after a
  // window resize or device rotation.
  useEffect(() => {
    if (!group) return;

    const measure = () => {
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

      // Sync the Three.js Box3 measurement into state; runs on mount + resize.
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
    };

    measureRef.current = measure;
    measure();
    return () => { measureRef.current = null; };
  }, [group, measureRef]);

  // Once geom is set the <primitive> is committed to the scene graph, so the
  // car's materials/buffers exist for the warm-up to compile. Kick off the
  // sweep-in here (not in the measure effect, where the primitive isn't mounted
  // yet). carX is still TRAVEL, so the first rendered frame sits off-screen.
  useEffect(() => {
    if (!geom) return;
    startEntranceRef.current?.();
  }, [geom, startEntranceRef]);

  useFrame((_, delta) => {
    if (!groupRef.current || !geom) return;

    // ── entrance sweep, driven on R3F's own clock ──────────────────────────
    // Advancing carX here (instead of via a GSAP tween on a separate ticker)
    // keeps motion and rendering on one clock, so the sweep can't micro-judder.
    const e = entranceRef.current;
    if (e.active) {
      e.elapsed += Math.min(delta, 0.05);   // clamp: ignore a long first/stall frame
      const p = Math.min(e.elapsed / ENTRANCE_DURATION, 1);

      // Rest position the sweep eases into: 0 if the user hasn't scrolled,
      // otherwise the live scroll-mapped carX. Smoothed so a fast scroll can't
      // snap the car. With no scroll this stays 0 → a plain centre sweep.
      const range = window.innerHeight * SCROLL_RANGE_VH;
      const liveTarget = -TRAVEL * Math.min(Math.max(window.scrollY / range, 0), 1);
      e.target += (liveTarget - e.target) * Math.min(1, delta * 8);

      // One continuous eased move from off-screen to that rest position, so a
      // scroll mid-sweep flows the car through centre to the scroll spot with no
      // dead stop in the middle.
      animRef.current.carX = ENTRANCE_TRAVEL + (e.target - ENTRANCE_TRAVEL) * easeInOutCubic(p);

      if (p >= 1) {
        e.active = false;
        animRef.current.carX = e.target;
        onEntranceDone();
      }
    }

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
  // The R3F camera, captured on create — so a resize can refresh its FOV.
  const cameraRef = useRef(null);
  // Re-measure handle, set by MercedesModel; called on resize.
  const measureRef = useRef(null);
  // Whether the scene is on screen — gates the render loop entirely.
  const [inView, setInView] = useState(true);
  // While the sweep-in plays, render in "always" so the per-frame useFrame step
  // runs at a steady cadence. Drops back to "demand" the moment it finishes.
  const [entranceActive, setEntranceActive] = useState(false);
  // Entrance progress, advanced inside useFrame on R3F's clock. `target` is the
  // (smoothed) carX the sweep eases into — 0, or the scroll position if scrolled.
  const entranceRef = useRef({ active: false, elapsed: 0, target: 0 });
  // Guards against the entrance restarting (e.g. hot reload re-running effects).
  const entranceStartedRef = useRef(false);
  // Called by MercedesModel once its geometry is ready; starts the sweep-in.
  const startEntranceRef = useRef(null);
  // Warm-up handle set by MercedesModel: compiles shaders + uploads buffers on a
  // stationary frame so the first visible motion frame is already warm.
  const warmupRef = useRef(null);
  // Deferred scroll trigger — created only after the entrance completes so the
  // two animations can never fight over carX.
  const scrollCtxRef = useRef(null);
  const createScrollTriggerRef = useRef(null);

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

  // Re-measure framing on resize / rotation. R3F already keeps the camera aspect
  // in sync; we only need to refresh the FOV (mobile breakpoint) + the car framing.
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.fov = window.innerWidth < 768 ? FOV_MOBILE : FOV;
          cameraRef.current.updateProjectionMatrix();
        }
        measureRef.current?.();
        invalidateRef.current?.();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    const anim = animRef.current;
    const entrance = entranceRef.current;   // captured for the cleanup closure
    anim.carX = ENTRANCE_TRAVEL;

    const SCROLL_RANGE = window.innerHeight * SCROLL_RANGE_VH;

    // Scroll trigger — created only after the entrance completes (called from
    // onEntranceDone) so it can never override carX while the car is still moving in.
    createScrollTriggerRef.current = () => {
      if (scrollCtxRef.current) return;
      scrollCtxRef.current = gsap.context(() => {
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
              onUpdate: () => invalidateRef.current?.(),
            },
          }
        );
      });
    };

    // Entrance: called by MercedesModel once the GLB geometry is ready.
    startEntranceRef.current = () => {
      if (entranceStartedRef.current) return;
      entranceStartedRef.current = true;
      warmupRef.current?.();
      entrance.elapsed = 0;
      entrance.target = 0;
      entrance.active = true;
      setEntranceActive(true);
    };

    return () => {
      startEntranceRef.current = null;
      createScrollTriggerRef.current = null;
      entrance.active = false;
      scrollCtxRef.current?.revert();
      scrollCtxRef.current = null;
    };
  }, []);

  return (
    <div className="car-scene-wrapper" ref={wrapperRef}>
      <div className="car-scene-sticky">
        <Canvas
          className="car-canvas"
          frameloop={inView ? (entranceActive ? 'always' : 'demand') : 'never'}
          dpr={[1, 1.5]}
          camera={{ fov: isMobile ? FOV_MOBILE : FOV, position: [0, 0, CAM_DIST] }}
          onCreated={({ camera, invalidate }) => {
            camera.position.set(0, 0, CAM_DIST);
            camera.lookAt(0, 0, 0);
            invalidateRef.current = invalidate;
            cameraRef.current = camera;
          }}
          gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[6, 8, 10]} intensity={2.5} />
          <Environment files={CITY_ENV} background={false} />

          <Suspense fallback={null}>
            <MercedesModel
              animRef={animRef}
              entranceRef={entranceRef}
              startEntranceRef={startEntranceRef}
              warmupRef={warmupRef}
              measureRef={measureRef}
              onEntranceDone={() => {
                setEntranceActive(false);
                createScrollTriggerRef.current?.();
              }}
            />
          </Suspense>
        </Canvas>

        {/* Black diagonal band — tilts down toward the left, car rides beneath */}
        <div className="car-scene-band" />
      </div>
    </div>
  );
}
