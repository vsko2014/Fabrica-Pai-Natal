import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FPN — Fábrica do Pai Natal",
    short_name: "FPN",
    description: "Fábrica do Pai Natal — gestão de prendas e logística do Pólo Norte.",
    theme_color: "#1a472a",
    background_color: "#0d2818",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
