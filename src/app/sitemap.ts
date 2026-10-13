import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return [];
  return ["", "/calculator", "/guide", "/privacy", "/contact"].map((path) => ({
    url: `${url.replace(/\/$/, "")}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "/calculator" ? 0.9 : 0.5,
  }));
}
