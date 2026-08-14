import type { Metadata } from "next";

import { TermosContent } from "../../termos/page";

export const metadata: Metadata = {
  title: "Teron — Terms of Service",
  description: "Terms for using Teron, including accounts, plans, billing, acceptable use, content ownership, and termination.",
};

export default function EnglishTermsPage() {
  return <TermosContent locale="en-US" />;
}
