import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Triggers visibility flag when element scrolls into view.
 * One-shot — disconnects observer after first intersection.
 *
 * Threshold default 0.3 matches Sub-epic 8b About section behavior.
 * Native IntersectionObserver — falls back to immediate visibility for
 * environments without API support (older browsers, SSR-degraded).
 *
 * @param {import('vue').Ref<HTMLElement|null>} elementRef - Template ref to observe
 * @param {Object} [options]
 * @param {number} [options.threshold=0.3] - IntersectionObserver threshold (0-1)
 * @returns {{ visible: import('vue').Ref<boolean> }}
 *
 * @example
 *   const sectionRef = ref(null);
 *   const { visible } = useScrollFadeIn(sectionRef);
 *   // Use visible.value in template :class binding
 */
export function useScrollFadeIn(elementRef, options = {}) {
  const { threshold = 0.3 } = options;
  const visible = ref(false);
  let observer = null;

  onMounted(() => {
    if (!elementRef.value) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: immediately visible for environments without API
      visible.value = true;
      return;
    }

    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visible.value = true;
            if (observer) {
              observer.disconnect();
              observer = null;
            }
          }
        });
      },
      { threshold }
    );
    observer.observe(elementRef.value);
  });

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return { visible };
}
