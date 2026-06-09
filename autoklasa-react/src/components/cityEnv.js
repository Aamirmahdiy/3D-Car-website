import { useEnvironment } from '@react-three/drei';

/* Self-hosted copy of drei's "city" preset HDR (potsdamer_platz_1k).
   All three 3D scenes reference this one local file instead of drei's default
   external CDN (raw.githack.com), so the environment map is fetched and decoded
   once — from our own origin — and shared across scenes via drei's loader cache.
   Per-context GPU processing still happens per canvas; eliminating that would
   require merging the canvases into one. */
export const CITY_ENV = '/hdri/potsdamer_platz_1k.hdr';

// Warm the cache as early as the first scene's module evaluates (CarScene is
// eager), so the HDR is ready by the time any canvas needs it.
useEnvironment.preload({ files: CITY_ENV });
