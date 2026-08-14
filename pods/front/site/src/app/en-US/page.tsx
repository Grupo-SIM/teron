import type { Metadata } from "next";

import { HomeContent } from "../page";

export const metadata: Metadata = {
  title: "Teron — Everything your team needs. All in one place.",
  description: "Bring projects, tasks, meetings, and communication into one platform so your team can accomplish more.",
};

export default function EnglishHomePage() {
  return <HomeContent locale="en-US" />;
}
