"use client";

import { useEffect, useState } from "react";
import { common, createStarryNight } from "@wooorm/starry-night";
import { toHtml } from "hast-util-to-html";
import DOMPurify from "dompurify";
import "./extensions/syntax-highlight.css";
import "./extensions/tiptap.css";
import { cn } from "@/lib/utils";

export function RichTextPreview({
    content,
    className,
}: {
    content: string;
    className?: string;
}) {
    const [processedContent, setProcessedContent] = useState(content);

    useEffect(() => {
        const processCodeBlocks = async () => {
            try {
                const starryNight = await createStarryNight(common);

                const parser = new DOMParser();
                const doc = parser.parseFromString(content, "text/html");

                const codeBlocks = doc.querySelectorAll("pre code");
                console.log(codeBlocks);

                for (const codeBlock of codeBlocks) {
                    const preElement = codeBlock.parentElement;
                    if (!preElement) continue;

                    const language =
                        preElement.getAttribute("data-language") ||
                        "typescript";
                    const code = codeBlock.textContent || "";

                    const scope = starryNight.flagToScope(language);

                    if (scope) {
                        const tree = starryNight.highlight(code, scope);
                        const html = toHtml(tree);
                        console.log(html);

                        const wrapper = document.createElement("div");
                        wrapper.innerHTML = html;

                        codeBlock.innerHTML = "";
                        codeBlock.appendChild(wrapper);
                    }
                }

                const sanitizedContent = DOMPurify.sanitize(doc.body.innerHTML);
                setProcessedContent(sanitizedContent);
            } catch (error) {
                console.error("Error processing code blocks:", error);
                setProcessedContent(content);
            }
        };

        if (content) {
            void processCodeBlocks();
        } else {
            setProcessedContent("");
        }
    }, [content]);

    if (!processedContent) return null;

    return (
        <div
            className={cn("tiptap", className)}
            dangerouslySetInnerHTML={{ __html: processedContent }}
        />
    );
}
