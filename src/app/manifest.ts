import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notre rituel",
    short_name: "Rituel",
    description: "Un moment à deux, chaque semaine.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b1420",
    theme_color: "#1b1420",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
