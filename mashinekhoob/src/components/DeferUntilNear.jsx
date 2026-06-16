import { useEffect, useRef, useState } from 'react';

/* Renders a reserved-height placeholder until it scrolls within `rootMargin`
   of the viewport, then mounts `children` (and disconnects). Used to keep the
   heavy below-the-fold 3D scenes — their WebGL context, HDR environment, and
   multi-MB model download — out of the hero car's critical load window. */
export default function DeferUntilNear({ children, placeholderClassName, rootMargin = '150% 0px' }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
    // `rootMargin` is expected to be a stable string literal (see prop default).
    // `show` is intentionally omitted: the effect only ever runs while false,
    // and the early return above guards the post-reveal render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (show) return children;
  return <div ref={ref} className={placeholderClassName} aria-hidden="true" />;
}
