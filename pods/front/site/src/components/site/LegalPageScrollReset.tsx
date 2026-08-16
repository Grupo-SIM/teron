"use client";

import { useLayoutEffect } from "react";

/**
 * As páginas legais sempre começam no título. Sem isso, uma navegação a partir
 * do fim da landing pode manter a rolagem anterior e abrir o documento no
 * rodapé.
 */
export function LegalPageScrollReset() {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  return null;
}
