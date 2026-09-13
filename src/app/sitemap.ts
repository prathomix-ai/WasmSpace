import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://masmspace.online";
  const currentDate = new Date();

  // Dynamic public route definitions with SEO priority and indexing frequency
  const routes = [
    {
      path: "",
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      path: "/canvas",
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      path: "/features",
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      path: "/pricing",
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      path: "/login",
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      path: "/terms",
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      path: "/privacy",
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      path: "/cookies",
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
