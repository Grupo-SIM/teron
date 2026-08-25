import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";
import { defaultLocale, getDictionary } from "@/i18n/site";

const metadataCopy = getDictionary(defaultLocale).metadata.signup;

export const metadata: Metadata = {
  title: metadataCopy.title,
  description: metadataCopy.description,
  // Tela de acesso não tem por que aparecer em busca.
  robots: { index: false, follow: false },
};

export default function CadastroPage() {
  return <AuthPage variant="signup" />;
}
