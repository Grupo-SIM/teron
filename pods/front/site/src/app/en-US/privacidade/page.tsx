import type { Metadata } from "next";

import { PrivacidadeContent } from "../../privacidade/page";

export const metadata: Metadata = {
  title: "Teron — Privacy Policy",
  description: "How Teron collects, uses, shares, and protects personal data, and how you can exercise your privacy rights.",
};

export default function EnglishPrivacyPage() {
  return <PrivacidadeContent locale="en-US" />;
}
