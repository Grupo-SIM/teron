"use client";

import { useEffect } from "react";

/**
 * Revela os elementos marcados com `data-reveal` ao entrarem na viewport.
 * Montado uma única vez na página; observa também os nós inseridos depois
 * (menu mobile, estado enviado do formulário).
 */
export function RevealObserver() {
  useEffect(() => {
    const observed = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () => {
      for (const el of document.querySelectorAll("[data-reveal]")) {
        if (observed.has(el)) continue;
        observed.add(el);
        io.observe(el);
      }
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
