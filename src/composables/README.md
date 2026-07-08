# Motion Pattern

All landing-page motion should flow through `useMotion.js`.

- Use `useScrollReveal` for entrance animation. It is IntersectionObserver-based and only toggles classes.
- Use `subscribeMotionFrame` or `useMotionFrame` for scroll-driven effects. This keeps the page on one shared `requestAnimationFrame` loop.
- Animate only `transform` and `opacity`. Do not animate `top`, `left`, `width`, `height`, `margin`, `filter`, or background position.
- Keep pointer-following effects hover-scoped. Do not add global `mousemove` or `pointermove` listeners for decoration.
- Set `will-change` only while an element is actively animating, then clear it.
