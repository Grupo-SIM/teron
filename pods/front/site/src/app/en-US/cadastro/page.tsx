import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Teron — Create account",
  description: "Create your Teron account.",
  robots: { index: false, follow: false },
};

export default function EnglishSignUpPage() {
  return <AuthPage variant="signup" locale="en-US" />;
}
