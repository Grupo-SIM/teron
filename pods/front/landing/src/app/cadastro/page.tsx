import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Teron — Criar conta",
  description: "Crie sua conta Teron.",
  // Tela de acesso não tem por que aparecer em busca.
  robots: { index: false, follow: false },
};

export default function CadastroPage() {
  return <AuthPage variant="signup" />;
}
