const callbacks = new Map();

const observer = typeof window !== "undefined"
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbacks.get(entry.target)?.();
            callbacks.delete(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    )
  : null;

export const sharedObserver = {
  observe:   (el, cb) => { callbacks.set(el, cb); observer?.observe(el); },
  unobserve: (el)     => { callbacks.delete(el);  observer?.unobserve(el); },
};