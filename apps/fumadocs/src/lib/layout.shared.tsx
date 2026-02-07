import { config } from "@root/config";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Image
            alt={config.metadata.siteName}
            className="h-6 w-6"
            height={24}
            src={config.metadata.logo}
            width={24}
          />
          <span>{config.metadata.siteName}</span>
        </div>
      ),
    },
  };
}
