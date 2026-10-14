import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LifeOS BD | আপনার দৈনন্দিন সহকারী",
    template: "%s · LifeOS BD",
  },
  description: "বাংলাদেশের জন্য দৈনন্দিন সহকারী — ডকুমেন্টের মেয়াদ, খরচ, সরকারি সেবা ও কাজ একসাথে।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full font-sans text-cream">
        {children}
      </body>
    </html>
  );
}
