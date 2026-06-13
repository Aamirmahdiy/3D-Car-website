import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CITY_ENV } from './cityEnv';
import '../styles/reviewsCarScene.css';

gsap.registerPlugin(ScrollTrigger);

const CAM_DIST    = 12;
const FOV         = 35;
const COVERAGE    = 1;
const FLIP_FACING = true;
const TRAVEL      = 6;                  // car drifts from +TRAVEL (right) to 0 (centre)

function PorscheModel({ animRef }) {
  const { scene }       = useGLTF('/porsche911.glb');
  const clonedScene     = useMemo(() => scene.clone(true), [scene]);
  const groupRef        = useRef();
  const [geom, setGeom] = useState(null);

  // Wheel rolling state
  const wheelsRef      = useRef([]);
  const wheelRadius    = useRef(1);   // model-space radius, set once geometry loads
  const prevCarX       = useRef(null);

  useEffect(() => {
    if (!clonedScene) return;

    // ── find wheel meshes ──────────────────────────────────────────────────
    const found = [];
    clonedScene.traverse(obj => {
      if (!obj.isMesh) return;
      const n = obj.name;
      // Match only when the keyword is a whole word — prevents "rim" matching inside "trim", etc.
      if (!(/(?:^|[^a-zA-Z])(wheel|tire|tyre|rim)(?:[^a-zA-Z]|$)/i.test(n))) return;
      // Exclude non-rotating body parts by name (incl. brake calipers/discs)
      if (/door|arch|well|fender|panel|liner|housing|trim|sill|skirt|rocker|call?iper|brake|disc/i.test(n)) return;
      // Exclude if any ancestor is a door object
      for (let p = obj.parent; p; p = p.parent) {
        if (/door/i.test(p.name)) return;
      }
      found.push(obj);
    });

    // ── build one spin pivot per wheel ─────────────────────────────────────
    // This model's wheels are a single combined node of hundreds of fragment
    // meshes, each sitting at its own local offset around a shared hub. Spinning
    // the fragments individually makes them fly apart and scrambles the radius.
    // So cluster the fragments into wheels by model-space position
    // (front/rear × left/right) and spin a single pivot centred on each hub.
    const pivots = [];
    let radius = 1;
    if (found.length > 0) {
      clonedScene.updateWorldMatrix(true, true);
      const toModel = new THREE.Matrix4().copy(clonedScene.matrixWorld).invert();
      const tmp     = new THREE.Vector3();

      const clusters = new Map();   // "FR" | "FL" | "BR" | "BL" → { meshes, sum, n, box }
      found.forEach(m => {
        const box = new THREE.Box3().setFromObject(m);      // world space
        const cWorld = box.getCenter(new THREE.Vector3());
        const cModel = cWorld.clone().applyMatrix4(toModel);
        const key = `${cModel.z >= 0 ? 'F' : 'B'}${cModel.x >= 0 ? 'R' : 'L'}`;
        let c = clusters.get(key);
        if (!c) { c = { meshes: [], sum: new THREE.Vector3(), n: 0, box: new THREE.Box3() }; clusters.set(key, c); }
        c.meshes.push(m);
        c.sum.add(cModel);
        c.n++;
        c.box.union(box);
      });

      clusters.forEach(c => {
        const center = c.sum.multiplyScalar(1 / c.n);       // model-space wheel centre
        const pivot  = new THREE.Group();
        pivot.position.copy(center);
        clonedScene.add(pivot);
        // Reparent the wheel's fragments under the pivot, preserving world transform.
        c.meshes.forEach(m => pivot.attach(m));
        pivots.push(pivot);
      });

      // Wheel radius (model space) from one wheel's in-plane extent (axle = X).
      const first = clusters.values().next().value;
      first.box.getSize(tmp);
      radius = Math.max(tmp.y, tmp.z) / 2 || 1;
    }

    wheelsRef.current  = pivots;
    wheelRadius.current = radius;

    // ── geometry / scale setup (unchanged) ────────────────────────────────
    const box    = new THREE.Box3().setFromObject(clonedScene);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    let sideRotY = size.z > size.x ? Math.PI / 2 : 0;
    if (FLIP_FACING) sideRotY += Math.PI;

    const fovV       = (FOV * Math.PI) / 180;
    const aspect     = window.innerWidth / window.innerHeight;
    const viewH      = 2 * CAM_DIST * Math.tan(fovV / 2);
    const viewW      = viewH * aspect;
    const carLen     = Math.max(size.x, size.z);
    const scale      = carLen > 0 ? (viewW * COVERAGE) / carLen : 1;
    const halfHeight = (size.y * scale) / 2;
    const halfH      = viewH / 2;

    setGeom({ scale, sideRotY, center: [-center.x, -center.y, -center.z], halfHeight, halfH });
  }, [clonedScene]);

  useFrame(() => {
    if (!groupRef.current || !geom) return;
    const x = animRef.current.carX;

    // ── wheel rolling ──────────────────────────────────────────────────────
    if (prevCarX.current !== null && wheelsRef.current.length > 0) {
      const deltaX = x - prevCarX.current;
      // World distance = model distance × scale  →  angle = worldDelta / (radius × scale)
      const angle = -deltaX / (wheelRadius.current * geom.scale);
      wheelsRef.current.forEach(w => { w.rotation.x += angle; });
    }
    prevCarX.current = x;

    // ── position ───────────────────────────────────────────────────────────
    groupRef.current.position.set(x, geom.halfH - geom.halfHeight, -2.5);
  });

  if (!geom) return null;

  return (
    <group ref={groupRef}>
      <group rotation={[Math.PI, 0, 0]}>
        <group rotation={[0, geom.sideRotY, 0]} scale={geom.scale}>
          <primitive object={clonedScene} position={geom.center} />
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

  useEffect(() => {
    const anim = animRef.current;
    anim.carX  = TRAVEL;

    const ctx = gsap.context(() => {
      gsap.fromTo(anim,
        { carX: TRAVEL },
        {
          carX: 0,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end:   'center center',
            scrub: 1,
            onUpdate: () => invalidateRef.current?.(),
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="reviews-car-section" ref={sectionRef}>
      <Canvas
        className="reviews-car-canvas"
        frameloop={inView ? 'demand' : 'never'}
        dpr={[1, 2]}
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
          <PorscheModel animRef={animRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
