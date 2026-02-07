import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { FileText, Rocket } from "lucide-react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        tabs: [
          {
            title: "Project Setup",
            description: "Set up Yugen and start building",
            url: "/docs/setup",
            icon: <Rocket className="h-5 w-5" />,
          },
          {
            title: "Project Documentation",
            description: "Document your idea and technical decisions",
            url: "/docs/product-docs",
            icon: <FileText className="h-5 w-5" />,
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
