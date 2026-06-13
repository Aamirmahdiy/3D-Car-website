import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CITY_ENV } from './cityEnv';
import '../styles/whySection.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Tunables ─────────────────────────────────────────── */
const FOV_WHY      = 45;
const CAM_Y        = 14;
const CAM_Z        = 5;
const COVERAGE     = 0.50;
// clip-path diagonal: (0%,94%) → (100%,8%) — height drop = 86% per 100% width
const DIAG_DROP    = 0.86;
// total extra px the canvas has vs 0.7*vh: 160px above section + 80px section padding
const CANVAS_EXTRA = 240;
// world-Z offset shifting the car down to match the lowered diagonal position
const Z_DROP       = 2.0;

// zScale: Z-per-unit-X so the car's screen trajectory is parallel to the CSS diagonal.
// Solved from: dCSS_y/dCSS_x = (CAM_Y/camMag) * zScale * canvasAspect = -DIAG_DROP
function computeZScale() {
  const canvasH      = 0.7 * window.innerHeight + CANVAS_EXTRA;
  const canvasAspect = window.innerWidth / canvasH;
  const camMag       = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
  return -DIAG_DROP / ((CAM_Y / camMag) * canvasAspect);
}

// Travel distance: world X where the car centre sits exactly at the canvas right edge (NDC_x = 1).
// Solved from: x / (d(x) * canvasAspect * tan(vFov/2)) = 1, where d(x) = camMag − (CAM_Z/camMag)*zScale*x
function computeTravel(zScale) {
  const canvasH      = 0.7 * window.innerHeight + CANVAS_EXTRA;
  const canvasAspect = window.innerWidth / canvasH;
  const camMag       = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
  const A            = canvasAspect * Math.tan(((FOV_WHY * Math.PI) / 180) / 2);
  return (camMag * A) / (1 + (CAM_Z / camMag) * zScale * A);
}

function TopCarModel({ animRef }) {
  const { scene } = useGLTF('/porsche911.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const groupRef  = useRef();
  const [geom, setGeom] = useState(null);

  useEffect(() => {
    if (!clonedScene) return;

    const box  = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const cent = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(cent);

    // diagRot = atan(zScale): car nose faces the travel direction (-X, +|zScale|*Z)
    const zScale   = animRef.current.zScale;
    const diagRot  = Math.atan(zScale);
    const baseRotY = size.z > size.x ? Math.PI / 2 : 0;
    const rotY     = -(baseRotY + diagRot);

    // Auto-scale: car occupies COVERAGE fraction of viewport width
    const aspect  = window.innerWidth / window.innerHeight;
    const fovV    = (FOV_WHY * Math.PI) / 180;
    const camDist = Math.sqrt(CAM_Y ** 2 + CAM_Z ** 2);
    const hFov    = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const viewW   = 2 * camDist * Math.tan(hFov / 2);
    const carLen  = Math.max(size.x, size.z);
    const scale   = carLen > 0 ? (viewW * COVERAGE) / carLen : 1;

    setGeom({ scale, rotY, center: [-cent.x, -cent.y, -cent.z] });
  }, [clonedScene]);

  useFrame(() => {
    if (!groupRef.current || !geom) return;
    const x      = animRef.current.carX;
    const zScale = animRef.current.zScale;
    groupRef.current.position.set(x, 0, zScale * x + Z_DROP);
  });

  if (!geom) return null;

  return (
    <group ref={groupRef}>
      {/* Right-side up, viewed from above — no flip */}
      <group rotation={[0, geom.rotY, 0]} scale={geom.scale}>
        <primitive object={clonedScene} position={geom.center} />
      </group>
    </group>
  );
}

export default function WhySection() {
  const sectionRef = useRef();
  const isMobile   = typeof window !== 'undefined' && window.innerWidth < 768;
  const _z0        = computeZScale();
  const animRef    = useRef({ carX: computeTravel(_z0), zScale: _z0 });
  // Scoped render trigger for this canvas (frameloop="demand").
  const invalidateRef = useRef(null);
  // Whether the scene is on screen — gates the render loop entirely.
  const [inView, setInView] = useState(true);

  // Pause rendering completely while the section is scrolled out of view.
  useEffect(() => {
    const el = sectionRef.current;
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

  // Keep zScale in sync with window size so useFrame always has the right slope
  useEffect(() => {
    const onResize = () => {
      animRef.current.zScale = computeZScale();
      invalidateRef.current?.();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const anim = animRef.current;
    anim.carX  = computeTravel(anim.zScale); // car starts half-visible at canvas right edge

    const ctx = gsap.context(() => {
      gsap.to(anim, {
        carX: 0,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 57%',
          end:   'center center',
          scrub: 1,
          onUpdate: () => invalidateRef.current?.(),
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="why-section" ref={sectionRef}>
      {/* 1 — background overlay (painted first = bottom) */}
      <div className="why-dark" />

      {/* 2 — 3D canvas (DOM order puts it above dark without relying on z-index) */}
      <Canvas
        className="why-canvas"
        frameloop={inView ? 'demand' : 'never'}
        dpr={[1, 2]}
        camera={{ fov: FOV_WHY, position: [0, CAM_Y, CAM_Z] }}
        onCreated={({ camera, invalidate }) => {
          camera.position.set(0, CAM_Y, CAM_Z);
          camera.lookAt(0, 0, 0);
          invalidateRef.current = invalidate;
        }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[5, 10, 5]} intensity={3} castShadow />
        <Environment files={CITY_ENV} background={false} />

        <Suspense fallback={null}>
          <TopCarModel animRef={animRef} />
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
        <div>
          <div className="why-feature-title">امنیت</div>
          <div className="why-feature-desc">ما فقط خودروهایی را می‌خریم که کارکرد آن‌ها با اسناد نمایندگی مجاز قابل تأیید باشد.</div>
        </div>
      </div>
    </section>
  );
}
