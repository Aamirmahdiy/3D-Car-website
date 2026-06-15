import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CITY_ENV } from './cityEnv';
import { optimizeCarModel, disposeOptimized } from './optimizeCarModel';
import '../styles/reviewsCarScene.css';

gsap.registerPlugin(ScrollTrigger);

const CAM_DIST    = 12;
const FOV         = 35;
const COVERAGE        = 1.0;           // desktop: car width as fraction of viewport width
const COVERAGE_MOBILE = 1.6;           // phones: bigger car (tune independently of desktop)
const FLIP_FACING = true;
const TRAVEL      = 6;                  // car drifts from +TRAVEL (right) to 0 (centre)
const Z_CAR       = -2.5;              // car sits slightly behind the z=0 plane
const Y_OFFSET    = 0.1;               // desktop: world-unit nudge (keeps the laptop look as-is)
// Mobile: place the wheel line (top of the flipped car) as a fraction DOWN from
// the top black/grey line. 0 = wheels exactly on the line; increase → car drops
// lower into the grey; negative → wheels poke up into the black.
const WHEEL_FRAC_MOBILE = 0.03;
// Frustum half-height (world units) at the car's actual depth. Camera is straight
// on (no tilt), so this maps a screen fraction to a world Y exactly. Using the
// car's depth (not z=0) is what makes "wheels on the line" land precisely.
const FRUSTUM_HALF_AT_CAR = (CAM_DIST - Z_CAR) * Math.tan(((FOV * Math.PI) / 180) / 2);
// Mobile: how fast carX eases toward the live scroll position. Higher = snappier,
// lower = smoother. The easing damps scroll-position jitter so the car can't dart.
const SCROLL_SMOOTH = 10;

function PorscheModel({ animRef, measureRef, sectionRef, isMobile }) {
  const { scene }       = useGLTF('/porsche911.glb');
  const groupRef        = useRef();
  const [geom, setGeom] = useState(null);

  // Collapse the 1664-draw-call model into a handful of merged meshes, keeping
  // the 4 wheels as spinnable pivots and swapping the costly transmission glass
  // for plain transparent. Done once when the GLB resolves.
  const { group, wheelPivots, wheelRadius } = useMemo(
    () => optimizeCarModel(scene.clone(true), { keepWheels: true, neutralizeTransmission: true }),
    [scene]
  );

  // Wheel rolling state (wheelPivots/wheelRadius are stable from useMemo).
  const prevCarX = useRef(null);

  // Free merged geometry buffers when this scene unmounts.
  useEffect(() => () => disposeOptimized(group), [group]);

  // Static, transform-independent model metrics — measured ONCE while `group` is
  // still detached (identity world matrix), so the box is the car's NATIVE size.
  // Re-measuring this on each resize is the bug it replaces: once <primitive> is
  // mounted inside the rotation/scale wrapper groups, setFromObject(group) returns
  // the box of the already-rotated/scaled car — swapped X/Z extents flip
  // `size.z > size.x` (→ wrong sideRotY, car turns to face front) and the inflated
  // length corrupts the scale. `group` is stable (useMemo), so this never re-runs.
  const modelMetrics = useMemo(() => {
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    let sideRotY = size.z > size.x ? Math.PI / 2 : 0;
    if (FLIP_FACING) sideRotY += Math.PI;
    return {
      sizeY: size.y,
      carLength: Math.max(size.x, size.z),
      sideRotY,
      center: [-center.x, -center.y, -center.z],
    };
  }, [group]);

  // Measure framing from the cached model metrics + current viewport. Re-run on
  // resize (via measureRef, owned by the parent) so the car stays correctly framed
  // after a window resize or device rotation.
  useEffect(() => {
    if (!group) return;

    const measure = () => {
      // Native model metrics measured once (never the mounted/transformed box).
      const { sizeY, carLength, sideRotY, center } = modelMetrics;

      const fovV       = (FOV * Math.PI) / 180;
      const aspect     = window.innerWidth / window.innerHeight;
      const viewH      = 2 * CAM_DIST * Math.tan(fovV / 2);
      const viewW      = viewH * aspect;
      const coverage   = window.innerWidth < 768 ? COVERAGE_MOBILE : COVERAGE;
      const scale      = carLength > 0 ? (viewW * coverage) / carLength : 1;
      const halfHeight = (sizeY * scale) / 2;
      const halfH      = viewH / 2;

      // Sync framing into state; runs on mount + resize.
      setGeom({ scale, sideRotY, center, halfHeight, halfH });
    };

    measureRef.current = measure;
    measure();
    return () => { measureRef.current = null; };
  }, [group, measureRef, modelMetrics]);

  useFrame((_, delta) => {
    if (!groupRef.current || !geom) return;

    // Mobile: frameloop is always-on, so derive carX from scroll here every frame
    // instead of GSAP. On phones the address bar show/hide fires resize mid-scroll
    // and ScrollTrigger goes stale, leaving the car off-screen ("disappears when
    // scrolling back"). Reading scroll live each frame is self-correcting.
    if (isMobile && sectionRef.current) {
      const rect  = sectionRef.current.getBoundingClientRect();
      const vh    = window.innerHeight;
      // Mirror the GSAP trigger: start 'top 60%' (p=0) → end 'center center' (p=1).
      const denom = 0.10 * vh + rect.height / 2;
      const p     = denom > 0 ? Math.min(1, Math.max(0, (0.60 * vh - rect.top) / denom)) : 0;
      const eased = 1 - (1 - p) ** 3;        // power3.out, matching the desktop tween
      // Ease toward the scroll target instead of snapping to it, so scroll jitter
      // can't dart the car and the motion stays smooth (matches the hero car).
      const target = TRAVEL * (1 - eased);
      animRef.current.carX += (target - animRef.current.carX) * Math.min(1, delta * SCROLL_SMOOTH);
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

    // ── position ───────────────────────────────────────────────────────────
    let yCenter;
    if (isMobile) {
      // Anchor the wheel line (bbox top after the flip) to WHEEL_FRAC_MOBILE below
      // the top line, depth-corrected so it lands exactly where intended on screen.
      const ndcY = 1 - 2 * WHEEL_FRAC_MOBILE;          // 0 frac → NDC top (+1)
      yCenter = ndcY * FRUSTUM_HALF_AT_CAR - geom.halfHeight;
    } else {
      yCenter = geom.halfH - geom.halfHeight + Y_OFFSET;
    }
    groupRef.current.position.set(x, yCenter, Z_CAR);
  });

  if (!geom) return null;

  return (
    <group ref={groupRef}>
      <group rotation={[Math.PI, 0, 0]}>
        <group rotation={[0, geom.sideRotY, 0]} scale={geom.scale}>
          <primitive object={group} position={geom.center} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/porsche911.glb');

export default function ReviewsCarScene() {
  const sectionRef = useRef();
  const isMobile   = typeof window !== 'undefined' && window.innerWidth < 768;
  const animRef    = useRef({ carX: TRAVEL });
  // Scoped render trigger for this canvas (frameloop="demand").
  const invalidateRef = useRef(null);
  // Re-measure handle, set by PorscheModel; called on resize.
  const measureRef = useRef(null);
  // Whether the scene is on screen — gates the render loop entirely.
  const [inView, setInView] = useState(true);

  // Pause rendering completely while the section is scrolled out of view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Render one frame once the section is back in view. Done in an effect (not in
  // the IO callback) so the Canvas has already re-rendered with frameloop='demand'
  // — calling invalidate() while frameloop is still 'never' is a no-op, which is
  // what left the car missing after scrolling away and back.
  useEffect(() => {
    if (!inView) return;
    const id = requestAnimationFrame(() => invalidateRef.current?.());
    return () => cancelAnimationFrame(id);
  }, [inView]);

  // Re-measure framing on resize / rotation so the car stays correctly framed.
  useEffect(() => {
    let t;
    let lastW = window.innerWidth;
    const onResize = () => {
      // The mobile address bar show/hide fires resize with only the HEIGHT changed.
      // The canvas is sized in vh (locked to the large viewport), so it doesn't
      // actually change — re-measuring then recomputes a slightly different scale
      // from window.innerHeight and snaps the car's size mid-scroll. Ignore those
      // height-only events; act only on a real width change (rotation / true
      // resize). Desktop has no address bar, so it still reacts to any resize.
      if (isMobile && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => {
        measureRef.current?.();
        invalidateRef.current?.();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [isMobile]);

  useEffect(() => {
    const anim = animRef.current;
    anim.carX  = TRAVEL;

    // Mobile drives carX from scroll inside useFrame (frameloop="always"); no GSAP,
    // so the address-bar resize storm can't leave the car stranded off-screen.
    if (isMobile) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(anim,
        { carX: TRAVEL },
        {
          carX: 0,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end:   'center center',
            scrub: 0.5,
            onUpdate: () => invalidateRef.current?.(),
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <div className="reviews-car-section" ref={sectionRef}>
      <Canvas
        className="reviews-car-canvas"
        frameloop={inView ? (isMobile ? 'always' : 'demand') : 'never'}
        dpr={[1, 1.5]}
        camera={{ fov: FOV, position: [0, 0, CAM_DIST] }}
        onCreated={({ camera, invalidate }) => {
          camera.position.set(0, 0, CAM_DIST);
          camera.lookAt(0, 0, 0);
          invalidateRef.current = invalidate;
        }}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[6, 8, 10]} intensity={2.5} />
        <directionalLight position={[-6, 4, -8]} intensity={0.8} />
        <Environment files={CITY_ENV} background={false} />

        <Suspense fallback={null}>
          <PorscheModel animRef={animRef} measureRef={measureRef} sectionRef={sectionRef} isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
