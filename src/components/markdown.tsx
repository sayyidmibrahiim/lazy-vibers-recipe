import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { MermaidBlock } from "./mermaid-block";

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("");
}

export function Markdown({ content, allowImages = true }: { content: string; allowImages?: boolean }) {
  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={allowImages ? undefined : ["img"]}
        components={{
          pre: ({ children, node, ...rest }) => {
            void node;
            const child = Children.toArray(children)[0];
            if (isValidElement(child)) {
              const code = child as ReactElement<{ className?: string; children?: ReactNode }>;
              if (/\blanguage-mermaid\b/.test(code.props.className ?? "")) {
                return <MermaidBlock code={textOf(code.props.children).replace(/\n$/, "")} />;
              }
            }
            return <pre {...rest}>{children}</pre>;
          },
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer noopener" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
