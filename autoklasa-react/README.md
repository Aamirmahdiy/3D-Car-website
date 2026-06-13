# Autoklasa — Car Import Landing Page

A Persian-language single-page marketing site for a car import/brokerage service. Built with React 19, Three.js (via `@react-three/fiber`), and GSAP ScrollTrigger. Three interactive 3D car models animate in sync with scroll position.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | React 19 + Vite 8 |
| 3D rendering | Three.js 0.184, @react-three/fiber 9, @react-three/drei 10 |
| Scroll animation | GSAP 3.15 + ScrollTrigger |
| Styling | Plain CSS (RTL, Vazirmatn font) |
| Linting | ESLint 10 + react-hooks + react-refresh |

---

## Project Structure

```
autoklasa-react/
├── public/
│   ├── mercedes-_benz_w206_c220.glb   # Hero car (348 meshes)
│   ├── porsche911.glb                 # Used in two scenes (1664 meshes)
│   ├── icons.svg
│   └── favicon.svg
└── src/
    ├── App.jsx                        # Root — section order, lazy loading
    ├── main.jsx
    ├── components/
    │   ├── optimizeCarModel.js        # Shared GLB merge/optimization helper
    │   ├── CarScene.jsx               # Hero — Mercedes side-profile sweep
    │   ├── WhySection.jsx             # Why section — Porsche top-down glide
    │   ├── ReviewsCarScene.jsx        # Reviews — Porsche side-profile roll-in
    │   ├── DeferUntilNear.jsx         # IntersectionObserver lazy-mount wrapper
    │   ├── cityEnv.js                 # Shared HDR environment (inline base64)
    │   ├── Header.jsx
    │   ├── Hero.jsx
    │   ├── StatsBar.jsx
    │   ├── Categories.jsx
    │   ├── HowItWorks.jsx
    │   ├── Benefits.jsx
    │   ├── ProofTicker.jsx
    │   ├── Reviews.jsx
    │   ├── Faq.jsx
    │   ├── CtaBanner.jsx
    │   ├── Contact.jsx
    │   └── Footer.jsx
    └── styles/
        ├── global.css
        ├── carScene.css
        ├── whySection.css
        ├── reviewsCarScene.css
        └── *.css                      # One file per component
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build → dist/
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

Node 18+ is required.

---

## Page Sections (top to bottom)

| Component | Description |
|---|---|
| `Header` | Sticky nav, logo, CTA |
| `Hero` | Full-screen headline, three service checkmarks |
| `CarScene` | **3D** — Mercedes C220 sweeps in from the right on load, drifts left as you scroll |
| `StatsBar` | Key numbers (cars sourced, satisfied clients, etc.) |
| `Categories` | Car category grid |
| `WhySection` | **3D** — Porsche 911 top-down glides diagonally across a dark section; two feature cards |
| `ReviewsCarScene` | **3D** — Porsche 911 side-profile rolls in from the right as the reviews section enters |
| `Reviews` | Scrolling marquee of Google review cards |
| `Faq` | Accordion |
| `CtaBanner` | Full-width call-to-action |
| `Contact` | Contact form |
| `Footer` | Links, social, legal |

---

## 3D Architecture

### GLB models

Both Porsche scenes share `/porsche911.glb`. The Mercedes hero uses `/mercedes-_benz_w206_c220.glb`.

Both GLBs use **`KHR_mesh_quantization`** (vertex positions stored as packed integers) and **`EXT_meshopt_compression`** (interleaved, integer-typed `BufferAttribute`s). You cannot call `geometry.clone().applyMatrix4()` directly on these — writing float world-coordinates back into an integer array silently truncates them, producing completely mangled geometry.

### `optimizeCarModel.js`

The shared helper called once per scene inside `useMemo`:

```js
const { group, wheelPivots, wheelRadius } =
  optimizeCarModel(scene.clone(true), {
    keepWheels: true,             // false in WhySection (top-down, never rolls)
    neutralizeTransmission: true  // replaces costly glass with plain transparent
  });
```

**What it does:**

1. **`toFloatGeometry(geo)`** — rebuilds every `BufferAttribute` as a plain `Float32Array` using `getComponent(i, c)` (which honours the normalised flag and dequantizes integer-packed attributes). This is the required pre-step before any transform is applied to a KHR_mesh_quantization GLB.

2. **Body merge** — bakes each mesh's world transform into the geometry, groups baked geometries by `material.uuid`, then merges with `mergeGeometries`. Reduces the Porsche from 1,664 draw calls/frame down to ~20.

3. **Wheel pivots** (`keepWheels: true`) — clusters the ~1,138 Porsche wheel-fragment meshes into 4 groups (Front/Back × Left/Right) by model-space quadrant, computes each hub centre, re-centres the merged geometry so local X is the axle, and wraps each cluster in a `THREE.Group` pivot. `wheelRadius` is derived from the first cluster's bounding box for accurate roll speed.

4. **Transmission neutralization** (`neutralizeTransmission: true`) — the Porsche window and red-glass materials use `KHR_materials_transmission`, which forces Three.js to render the entire scene twice every frame. The helper clones those materials and sets `transmission = 0; transparent = true; opacity = 0.6`, eliminating the extra render pass.

5. **Cache safety** — `scene.clone(true)` shares geometry and material refs with the `useGLTF` cache. The helper never disposes source geometries. Only freshly merged geometries and material clones (flagged `userData.optimizedClone = true`) are freed on unmount via `disposeOptimized(group)`.

### Scroll animation

Each scene drives a single `animRef.current.carX` value via GSAP ScrollTrigger with `scrub: 0.5`. `useFrame` reads that value every render and sets `group.position`. The canvas uses `frameloop="demand"` with `invalidate()` called from the `onUpdate` callback, so WebGL only renders when GSAP actually moves the car.

### Visibility gating

An `IntersectionObserver` on each scene's wrapper switches `frameloop` between `"demand"` and `"never"` when the section leaves/enters the viewport (200 px root margin). Off-screen canvases cost zero GPU time.

### Lazy loading

`WhySection` and `ReviewsCarScene` are `React.lazy`-imported and wrapped in `DeferUntilNear` — an IntersectionObserver that only mounts the component when it is within ~400 px of the viewport. The Porsche GLB is never downloaded until it is needed.

---

## Performance Summary

| Optimization | Effect |
|---|---|
| Geometry merge (`optimizeCarModel`) | Porsche: 1,664 → ~20 draw calls/frame |
| Transmission neutralization | Eliminates extra full-scene render pass on both Porsche canvases |
| `dpr={[1, 1.5]}` | Caps pixel ratio on all three canvases; no 4× pixel cost on Retina/HiDPI |
| `frameloop="demand"` + `invalidate()` | WebGL renders only when GSAP moves the car |
| IntersectionObserver frameloop gate | Off-screen canvases cost zero GPU time |
| `DeferUntilNear` lazy mount | Below-fold 3D sections are not mounted until they near the viewport |
| `content-visibility: auto` | Applied to static sections (Reviews, Faq, etc.) to skip layout/paint until visible |
| `scroll-behavior: auto` | Prevents double-easing from `smooth` + GSAP scrub |

---

## CSS Conventions

- RTL layout — the site is entirely in Persian (`direction: rtl`).
- Design tokens in `:root` inside `global.css`: `--gold`, `--dark`, `--black`, `--orange`, etc.
- Each component imports its own CSS file directly.
- The diagonal black band in `CarScene` and the clip-path overlay in `WhySection` are pure CSS (`clip-path: polygon(…)`). The clip-path coordinates are tightly coupled to the camera-framing constants at the top of each JSX file — changing one without the other will misalign the car relative to the band.

---

## Key Constants

### `CarScene.jsx` (Mercedes hero)

| Constant | Default | Purpose |
|---|---|---|
| `CAM_DIST` | `12` | Camera Z distance |
| `FOV` / `FOV_MOBILE` | `35` / `50` | Field of view |
| `COVERAGE` | `0.62` | Car width as fraction of viewport width |
| `TRAVEL` | `6` | World-X sweep distance |
| `BAND_RIGHT` / `BAND_LEFT` | `0.16` / `0.40` | Must match `clip-path` in `carScene.css` |

### `WhySection.jsx` (Porsche top-down)

| Constant | Default | Purpose |
|---|---|---|
| `FOV_WHY` | `45` | Camera field of view |
| `CAM_Y` / `CAM_Z` | `14` / `5` | Camera position (looking down at the car) |
| `COVERAGE` | `0.50` | Car width as fraction of viewport width |
| `DIAG_DROP` | `0.86` | Must match `why-dark` clip-path slope |
| `Z_DROP` | `2.0` | World-Z offset aligning car to the diagonal |

### `ReviewsCarScene.jsx` (Porsche side)

| Constant | Default | Purpose |
|---|---|---|
| `CAM_DIST` | `12` | Camera Z distance |
| `FOV` | `35` | Field of view |
| `COVERAGE` | `1.0` | Car fills full viewport width |
| `TRAVEL` | `6` | Roll-in distance from the right edge |
