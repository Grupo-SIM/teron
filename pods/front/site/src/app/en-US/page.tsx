import type { Metadata } from "next";

import { HomeContent } from "../page";

export const metadata: Metadata = {
  title: "Teron — Everything your team needs to work better.",
  description: "A more organized company, a more productive team. Organize your people, centralize the work, and simplify your company's routine.",
};

export default function EnglishHomePage() {
  return <HomeContent locale="en-US" />;
}
