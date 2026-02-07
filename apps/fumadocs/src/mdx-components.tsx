import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Frame } from "@/components/mdx/frame";
import { Mermaid } from "@/components/mdx/mermaid";
import { YouTube } from "@/components/mdx/youtube";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    img: (props) => <ImageZoom {...(props as any)} />,
    Card,
    Cards,
    Step,
    Steps,
    ...TabsComponents,
    Mermaid,
    YouTube,
    Frame,
    Warning: (p: any) => <Callout type="warn" {...p} />,
    Note: (p: any) => <Callout type="info" {...p} />,
    Check: (p: any) => <Callout type="success" {...p} />,
    ...components,
  };
}
