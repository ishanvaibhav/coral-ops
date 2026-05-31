import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ExecutiveCopilot } from "@/components/copilot/executive-copilot";

export const metadata: Metadata = {
  title: "Coral.Ops — AI Engineering Command Center",
  description:
    "Federated engineering intelligence powered by Coral. Incidents, releases, sprint health, security, and analytics across GitHub, Slack, Sentry, Datadog, Jira, Notion, and PagerDuty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-hidden">
        <div className="flex h-screen w-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
            <TopBar />
            <main className="flex-1 overflow-y-auto relative z-10">{children}</main>
          </div>
        </div>
        <ExecutiveCopilot />
      </body>
    </html>
  );
}
