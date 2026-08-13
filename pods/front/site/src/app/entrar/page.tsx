import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Teron — Entrar",
  description: "Acesse sua conta Teron.",
  // Tela de acesso não tem por que aparecer em busca.
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  return <AuthPage variant="login" />;
}
