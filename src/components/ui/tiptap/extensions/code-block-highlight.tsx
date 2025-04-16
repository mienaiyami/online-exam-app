"use client";

import {
    NodeViewContent,
    type NodeViewRendererProps,
    NodeViewWrapper,
} from "@tiptap/react";
import { ReactNode, useEffect, useState } from "react";
import { common, createStarryNight } from "@wooorm/starry-night";
import { toHtml } from "hast-util-to-html";
import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";

interface CodeBlockProps {
    node: NodeViewRendererProps["node"];
    updateAttributes: (attrs: Record<string, unknown>) => void;
}

export const CodeBlockView = ({ node, updateAttributes }: CodeBlockProps) => {
    const [highlightedCode, setHighlightedCode] = useState<string>("");
    const language = (node.attrs.language as string) || "text";
    const code = node.textContent || "";

    useEffect(() => {
        const highlight = async () => {
            try {
                const starryNight = await createStarryNight(common);
                const scope = starryNight.flagToScope(language);

                if (scope) {
                    const tree = starryNight.highlight(code, scope);
                    const html = toHtml(tree);
                    setHighlightedCode(html);
                } else {
                    setHighlightedCode(
                        `<pre><code>${escapeHtml(code)}</code></pre>`,
                    );
                }
            } catch (error) {
                console.error("Syntax highlighting error:", error);
                setHighlightedCode(
                    `<pre><code>${escapeHtml(code)}</code></pre>`,
                );
            }
        };

        void highlight();
    }, [code, language]);

    return (
        <NodeViewWrapper className="code-block relative">
            <select
                className="absolute right-2 top-2 z-10 rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                contentEditable={false}
                defaultValue={language}
                onChange={(event) =>
                    updateAttributes({ language: event.target.value })
                }
            >
                <option value="text">Plain text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="jsx">JSX</option>
                <option value="tsx">TSX</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="shell">Shell</option>
                <option value="sql">SQL</option>
                <option value="markdown">Markdown</option>
            </select>

            <pre className="overflow-auto rounded-md bg-primary p-4 text-sm text-primary-foreground">
                {highlightedCode ? (
                    <div
                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />
                ) : (
                    <NodeViewContent as="code" />
                )}
            </pre>
        </NodeViewWrapper>
    );
};

const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const CodeBlockHighlight = CodeBlock.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            language: {
                default: "text",
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-language") || "text",
                renderHTML: (attributes: Record<string, unknown>) => {
                    return {
                        "data-language": attributes.language,
                    };
                },
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },
});
