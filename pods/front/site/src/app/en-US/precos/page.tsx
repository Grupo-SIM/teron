import type { Metadata } from "next";

import { PrecosContent } from "../../precos/page";

export const metadata: Metadata = {
  title: "Teron — Plans and pricing",
  description: "How each company contributes to Teron and the plans available for teams of any size.",
};

export default function EnglishPricingPage() {
  return <PrecosContent locale="en-US" />;
}
