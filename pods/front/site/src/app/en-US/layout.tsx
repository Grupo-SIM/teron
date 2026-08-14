import type { ReactNode } from "react";

import { DocumentLocale } from "@/i18n/document-locale";

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocumentLocale locale="en-US" />
      {children}
    </>
  );
}
