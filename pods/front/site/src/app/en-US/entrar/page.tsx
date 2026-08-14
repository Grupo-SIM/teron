import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Teron — Sign in",
  description: "Access your Teron account.",
  robots: { index: false, follow: false },
};

export default function EnglishSignInPage() {
  return <AuthPage variant="login" locale="en-US" />;
}
