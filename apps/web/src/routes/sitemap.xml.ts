import { config } from "@root/config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: () => {
        const baseUrl = config.metadata.siteUrl;
        const routes = [
          { path: "/", priority: "1.0", changefreq: "daily" },
          { path: "/dashboard", priority: "0.8", changefreq: "weekly" },
          { path: "/todos", priority: "0.7", changefreq: "weekly" },
          { path: "/pricing", priority: "0.9", changefreq: "monthly" },
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
