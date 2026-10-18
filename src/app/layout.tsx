import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPN — Fábrica do Pai Natal",
  description:
    "Fábrica do Pai Natal — gestão de brinquedos, cartas e logística do Pólo Norte.",
};

const snowflakes = [
  { left: "5%", size: "10px", duration: "12s", delay: "0s" },
  { left: "15%", size: "6px", duration: "18s", delay: "2s" },
  { left: "30%", size: "8px", duration: "14s", delay: "1s" },
  { left: "45%", size: "12px", duration: "20s", delay: "4s" },
  { left: "60%", size: "7px", duration: "16s", delay: "3s" },
  { left: "75%", size: "11px", duration: "11s", delay: "5s" },
  { left: "88%", size: "6px", duration: "19s", delay: "2.5s" },
];

const stars = [
  { left: "10%", top: "12%" },
  { left: "25%", top: "28%" },
  { left: "40%", top: "8%" },
  { left: "55%", top: "35%" },
  { left: "70%", top: "15%" },
  { left: "85%", top: "22%" },
  { left: "95%", top: "40%" },
  { left: "5%", top: "50%" },
  { left: "50%", top: "6%" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-screen">
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        >
          {snowflakes.map((flake, i) => (
            <span
              key={`snow-${i}`}
              className="animate-snow absolute top-0 block rounded-full bg-fpn-snow"
              style={{
                left: flake.left,
                width: flake.size,
                height: flake.size,
                animationDuration: flake.duration,
                animationDelay: flake.delay,
              }}
            />
          ))}
          {stars.map((star, i) => (
            <span
              key={`star-${i}`}
              className="animate-twinkle absolute block h-1 w-1 rounded-full bg-fpn-gold"
              style={{
                left: star.left,
                top: star.top,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
