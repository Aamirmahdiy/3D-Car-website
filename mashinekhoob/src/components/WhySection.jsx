import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CITY_ENV } from './cityEnv';
import { optimizeCarModel, disposeOptimized } from './optimizeCarModel';
import '../styles/whySection.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Tunables ─────────────────────────────────────────── */
const FOV_WHY      = 45;
const CAM_Y        = 14;
const CAM_Z        = 5;
const CAM_MAG      = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);  // camera distance to the origin
const COVERAGE     = 0.45;       // desktop: car width as fraction of viewport width
const COVERAGE_MOBILE = 1.09;   // phones: car spans more of the narrow viewport — change this to resize the mobile car
// clip-path diagonal: (0%,82%) → (100%,32%) — height drop = 50% per 100% width
const DIAG_DROP    = 0.50;
// total extra px the canvas has vs 0.7*vh: 160px above section + 80px section padding
const CANVAS_EXTRA = 240;
// world-Z offset shifting the car down to match the diagonal position
const Z_DROP       = 2.0;
// Mobile: how fast carX eases toward the live scroll position. Higher = snappier,
// lower = smoother. The easing damps scroll-position jitter so the car can't dart.
const SCROLL_SMOOTH = 10;

// zScale: Z-per-unit-X so the car's screen trajectory is parallel to the CSS diagonal.
// Solved from: dCSS_y/dCSS_x = (CAM_Y/camMag) * zScale * canvasAspect = -DIAG_DROP
function canvasHeight() {
  // Mobile (.why-section height:55vh, no 80px padding contribution to border-box total):
  //   canvas = 55vh + 160px above section
  // Desktop (.why-section height:calc(70vh+80px) border-box, padding:80px already inside):
  //   canvas = (70vh+80px) + 160px above = 0.7*vh + 240
  return window.innerWidth < 768
    ? 0.55 * window.innerHeight + 160
    : 0.7 * window.innerHeight + CANVAS_EXTRA;
}

function computeZScale() {
  const canvasH      = canvasHeight();
  const canvasAspect = window.innerWidth / canvasH;
  const camMag       = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
  // The clip-path drop is a fraction of .why-dark (= the section), but the car
  // projects into the canvas, which is 160px taller (top:-160px). The same world
  // slope renders steeper in the taller canvas, so scale the drop by darkH/canvasH
  // to keep the car's on-screen trajectory truly parallel to the line.
  const darkH        = canvasH - 160;
  const effDrop      = DIAG_DROP * (darkH / canvasH);
  return -effDrop / ((CAM_Y / camMag) * canvasAspect);
}

// Travel distance: world X where the car centre sits exactly at the canvas right edge (NDC_x = 1).
// Solved from: x / (d(x) * canvasAspect * tan(vFov/2)) = 1, where d(x) = camMag − (CAM_Z/camMag)*zScale*x
function computeTravel(zScale) {
  const canvasH      = canvasHeight();
  const canvasAspect = window.innerWidth / canvasH;
  const camMag       = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
  const A            = canvasAspect * Math.tan(((FOV_WHY * Math.PI) / 180) / 2);
  return (camMag * A) / (1 + (CAM_Z / camMag) * zScale * A);
}

function TopCarModel({ animRef, measureRef, sectionRef, isMobile }) {
  const { scene } = useGLTF('/porsche911.glb');
  const groupRef  = useRef();
  const [geom, setGeom] = useState(null);

  // Top-down view never rolls the wheels, so merge everything (wheels included)
  // by material for the maximum draw-call collapse, and drop the costly
  // transmission glass.
  const { group } = useMemo(
    () => optimizeCarModel(scene.clone(true), { keepWheels: false, neutralizeTransmission: true }),
    [scene]
  );

  // Free merged geometry buffers when this scene unmounts.
  useEffect(() => () => disposeOptimized(group), [group]);

  // Static, transform-independent model metrics — measured ONCE while `group` is
  // still detached (identity world matrix), so the box is the car's NATIVE size.
  // Re-measuring this on each resize is the bug it replaces: once <primitive> is
  // mounted inside the rotation/scale wrapper group, setFromObject(group) returns
  // the box of the already-rotated/scaled car — swapped X/Z extents flip
  // `size.z > size.x` (→ wrong baseRotY, car spins ~90°) and the inflated length
  // corrupts the scale. `group` is stable (useMemo), so this never re-runs.
  const modelMetrics = useMemo(() => {
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const cent = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(cent);
    return {
      carLength: Math.max(size.x, size.z),
      baseRotY: size.z > size.x ? Math.PI / 2 : 0,
      center: [-cent.x, -cent.y, -cent.z],
    };
  }, [group]);

  // Measure framing from the cached model metrics + current viewport. Re-run on
  // resize (via measureRef, owned by the parent) so the car stays correctly
  // sized/aligned after a window resize or device rotation.
  useEffect(() => {
    if (!group) return;

    const measure = () => {
      // Native model metrics measured once (never the mounted/transformed box).
      const { carLength, baseRotY, center } = modelMetrics;

      // diagRot = atan(zScale): car nose faces the travel direction (-X, +|zScale|*Z).
      // It tracks the live zScale, so it's recomputed here each resize (not cached).
      const zScale  = animRef.current.zScale;
      const diagRot = Math.atan(zScale);
      const rotY    = -(baseRotY + diagRot);

      // Auto-scale: car occupies COVERAGE fraction of viewport width
      const aspect  = window.innerWidth / window.innerHeight;
      const fovV    = (FOV_WHY * Math.PI) / 180;
      const camDist = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
      const hFov    = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
      const viewW   = 2 * camDist * Math.tan(hFov / 2);
      const coverage = window.innerWidth < 768 ? COVERAGE_MOBILE : COVERAGE;
      const scale   = carLength > 0 ? (viewW * coverage) / carLength : 1;

      // Sync framing into state; runs on mount + resize.
      setGeom({ scale, rotY, center });
    };

    measureRef.current = measure;
    measure();
    return () => { measureRef.current = null; };
  }, [group, animRef, measureRef, modelMetrics]);

  useFrame((_, delta) => {
    if (!groupRef.current || !geom) return;

    // Mobile: frameloop is always-on, so we derive carX from scroll here every
    // frame instead of GSAP. On phones the address bar show/hide fires resize
    // mid-scroll, which used to reset the GSAP tween's start and strand the car
    // off-screen ("car disappears when scrolling back up"). Reading scroll live
    // each frame is self-correcting and matches the hero CarScene approach.
    if (isMobile && sectionRef.current) {
      const rect  = sectionRef.current.getBoundingClientRect();
      const vh    = window.innerHeight;
      // Mirror the GSAP trigger: start 'top 57%' (p=0) → end 'center center' (p=1).
      const denom = 0.07 * vh + rect.height / 2;
      const p     = denom > 0 ? Math.min(1, Math.max(0, (0.57 * vh - rect.top) / denom)) : 0;
      const eased = 1 - (1 - p) * (1 - p);   // power2.out, matching the desktop tween
      // Use the cached travel (refreshed only on a real resize), not a live
      // computeTravel that reads the address-bar-jittery window.innerHeight. Ease
      // toward the target instead of snapping to it, so scroll jitter can't dart
      // the car and the motion stays smooth (matches the hero car).
      const target = animRef.current.travel * (1 - eased);
      animRef.current.carX += (target - animRef.current.carX) * Math.min(1, delta * SCROLL_SMOOTH);
    }

    const x      = animRef.current.carX;
    const zScale = animRef.current.zScale;
    const z      = zScale * x + Z_DROP;
    groupRef.current.position.set(x, 0, z);

    // Keep the car's on-screen size constant as it drives along the diagonal.
    // Moving in Z changes its distance from the camera, and perspective makes the
    // projected size ∝ 1/depth — so the car visibly grew/shrank as it travelled.
    // Counter-scaling by depth cancels that exactly: at depth = CAM_MAG (where
    // geom.scale is calibrated to COVERAGE) the factor is 1, and the car holds a
    // constant COVERAGE_MOBILE of the viewport for its whole run. Mobile only —
    // the desktop scene keeps its tuned perspective.
    if (isMobile) {
      const depth = CAM_MAG - (CAM_Z / CAM_MAG) * z;
      groupRef.current.scale.setScalar(depth / CAM_MAG);
    }
  });

  if (!geom) return null;

  return (
    <group ref={groupRef}>
      {/* Right-side up, viewed from above — no flip */}
      <group rotation={[0, geom.rotY, 0]} scale={geom.scale}>
        <primitive object={group} position={geom.center} />
      </group>
    </group>
  );
}

export default function WhySection() {
  const sectionRef = useRef();
  const isMobile   = typeof window !== 'undefined' && window.innerWidth < 768;
  const _z0        = computeZScale();
  const _t0        = computeTravel(_z0);
  // `travel` is cached here (and refreshed only on a real resize) so the per-frame
  // scroll mapping never reads the live window.innerHeight, which jitters as the
  // mobile address bar shows/hides.
  const animRef    = useRef({ carX: _t0, zScale: _z0, travel: _t0 });
  // Scoped render trigger for this canvas (frameloop="demand").
  const invalidateRef = useRef(null);
  // Re-measure handle, set by TopCarModel; called on resize.
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
  // what left the car missing after scrolling away and back (desktop/demand path).
  useEffect(() => {
    if (!inView) return;
    const id = requestAnimationFrame(() => invalidateRef.current?.());
    return () => cancelAnimationFrame(id);
  }, [inView]);

  // Keep zScale AND the car framing (scale/rotation) in sync with window size so
  // a resize or device rotation doesn't leave the car mis-sized or off the diagonal.
  useEffect(() => {
    let t;
    let lastW = window.innerWidth;
    const onResize = () => {
      // The mobile address bar show/hide fires resize with only the HEIGHT changed.
      // The canvas is sized in vh (locked to the large viewport), so it doesn't
      // actually change — but re-measuring then recomputes a slightly different
      // scale from window.innerHeight and snaps the car's size mid-scroll. Ignore
      // those height-only events; act only on a real width change (rotation / true
      // resize). Desktop has no address bar, so it still reacts to any resize.
      if (isMobile && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => {
        animRef.current.zScale = computeZScale();
        animRef.current.travel = computeTravel(animRef.current.zScale);
        measureRef.current?.();          // recompute scale + diagonal rotation
        // On mobile useFrame recomputes carX from scroll every frame, so don't
        // reset it here — doing so (on the address-bar resize) is what stranded
        // the car off-screen. Desktop still needs the start position refreshed.
        if (!isMobile) animRef.current.carX = animRef.current.travel;
        invalidateRef.current?.();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [isMobile]);

  useEffect(() => {
    const anim = animRef.current;
    anim.travel = computeTravel(anim.zScale);
    anim.carX   = anim.travel; // car starts half-visible at canvas right edge

    // Mobile drives carX from scroll inside useFrame (frameloop="always"); no GSAP,
    // so the address-bar resize storm can't strand the car off-screen.
    if (isMobile) return;

    const ctx = gsap.context(() => {
      gsap.to(anim, {
        carX: 0,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 57%',
          end:   'center center',
          scrub: 0.5,
          onUpdate: () => invalidateRef.current?.(),
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section className="why-section" ref={sectionRef}>
      {/* 1 — background overlay (painted first = bottom) */}
      <div className="why-dark" />

      {/* 2 — 3D canvas (DOM order puts it above dark without relying on z-index) */}
      <Canvas
        className="why-canvas"
        frameloop={inView ? (isMobile ? 'always' : 'demand') : 'never'}
        dpr={[1, 1.5]}
        camera={{ fov: FOV_WHY, position: [0, CAM_Y, CAM_Z] }}
        onCreated={({ camera, invalidate }) => {
          camera.position.set(0, CAM_Y, CAM_Z);
          camera.lookAt(0, 0, 0);
          invalidateRef.current = invalidate;
        }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[5, 10, 5]} intensity={3} />
        <Environment files={CITY_ENV} background={false} />

        <Suspense fallback={null}>
          <TopCarModel animRef={animRef} measureRef={measureRef} sectionRef={sectionRef} isMobile={isMobile} />
        </Suspense>
      </Canvas>

      {/* 3 — text (DOM order puts it above canvas without relying on z-index) */}
      <div className="why-text">
        <div><span className="why-black">چرا </span><span className="why-gold">ارزشش را</span></div>
        <div><span className="why-gold">دارد؟</span></div>
      </div>

      {/* 4 — saving time — lower-right */}
      <div className="why-feature why-feature--right">
        <div className="why-feature-icon">
          <svg viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
          </svg>
        </div>
        <div>
          <div className="why-feature-title">صرفه‌جویی در زمان</div>
          <div className="why-feature-desc">وقت خود را برای گشتن میان آگهی‌های مشکوک هدر ندهید – ما بهترین گزینه‌ها را برای شما پیدا می‌کنیم و تمام تشریفات اداری را انجام می‌دهیم.</div>
        </div>
      </div>

      {/* 5 — security — lower-left */}
      <div className="why-feature why-feature--left">
        <div className="why-feature-icon">
          {/* Outlined shield + key — fill:none via inline style overrides the
              stylesheet's solid fill so it stays line-art (keeps the gold glow). */}
          <svg viewBox="0 0 24 24" style={{ fill: 'none', stroke: '#c99e4d', strokeWidth: 1.6 }} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5 19.5 5.3 V11 C19.5 15.9 16.2 19.3 12 21.5 C7.8 19.3 4.5 15.9 4.5 11 V5.3 Z" />
            <circle cx="12" cy="9" r="2.4" />
            <circle cx="12" cy="9" r="0.7" />
            <path d="M12 11.4 V16.6" />
            <path d="M12 14 H14" />
            <path d="M12 16 H13.4" />
          </svg>
        </div>
        <div>
          <div className="why-feature-title">امنیت</div>
          <div className="why-feature-desc">ما خودروهایی را انتخاب می‌کنیم که اصالت کارکرد آن‌ها توسط کارشناس تأیید شده باشد.</div>
        </div>
      </div>
    </section>
  );
}
