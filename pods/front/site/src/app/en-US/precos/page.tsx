import type { Metadata } from "next";

import { PrecosContent } from "../../precos/page";

export const metadata: Metadata = {
  title: "Teron — Plans and pricing",
  description: "How Teron billing works for storage, network, and compute, with plans for teams of any size.",
};

export default function EnglishPricingPage() {
  return <PrecosContent locale="en-US" />;
}
