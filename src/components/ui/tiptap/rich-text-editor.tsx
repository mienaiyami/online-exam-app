"use client";

import { Separator } from "@/components/ui/separator";
import { BlockquoteToolbar } from "@/components/ui/tiptap/toolbars/blockquote";
import { BoldToolbar } from "@/components/ui/tiptap/toolbars/bold";
import { BulletListToolbar } from "@/components/ui/tiptap/toolbars/bullet-list";
import { CodeToolbar } from "@/components/ui/tiptap/toolbars/code";
import { CodeBlockToolbar } from "@/components/ui/tiptap/toolbars/code-block";
import { HardBreakToolbar } from "@/components/ui/tiptap/toolbars/hard-break";
import { HorizontalRuleToolbar } from "@/components/ui/tiptap/toolbars/horizontal-rule";
import { ItalicToolbar } from "@/components/ui/tiptap/toolbars/italic";
import { OrderedListToolbar } from "@/components/ui/tiptap/toolbars/ordered-list";
import { RedoToolbar } from "@/components/ui/tiptap/toolbars/redo";
import { StrikeThroughToolbar } from "@/components/ui/tiptap/toolbars/strikethrough";
import { ToolbarProvider } from "@/components/ui/tiptap/toolbars/toolbar-provider";
// import { UndoToolbar } from "@/components/ui/tiptap/toolbars/undo";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ImageExtension } from "./extensions/image";
import { ImagePlaceholderToolbar } from "./toolbars/image-placeholder-toolbar";
import { ImagePlaceholder } from "./extensions/image-placeholder";
import { UndoToolbar } from "./toolbars/undo";
import { RefCallBack } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
// import { CodeBlockHighlight } from "./extensions/code-block-highlight";
// import "./extensions/syntax-highlight.css";
import "./extensions/tiptap.css";

const extensions = [
    StarterKit.configure({
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal",
            },
        },
        bulletList: {
            HTMLAttributes: {
                class: "list-disc",
            },
        },
        horizontalRule: {
            HTMLAttributes: {
                class: "my-2",
            },
        },
        heading: {
            levels: [1, 2, 3, 4],
            HTMLAttributes: {
                class: "tiptap-heading",
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: "tiptap-code-block",
            },
        },
        code: {
            HTMLAttributes: {
                class: "tiptap-code",
            },
        },
    }),
    // CodeBlockHighlight as unknown as Extension,
    ImageExtension,
    ImagePlaceholder.configure({
        allowedMimeTypes: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/gif": [".gif"],
            "image/svg": [".svg"],
            "image/webp": [".webp"],
        },
    }),
] satisfies Extension[];

export default function RichTextEditor({
    value,
    onChange,
    name,
    ref,
    onBlur,
    disabled,
    resizeable = true,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    name?: string;
    ref?: RefCallBack;
    onBlur?: () => void;
    disabled?: boolean;
    resizeable?: boolean;
    className?: string;
}) {
    const editor = useEditor({
        extensions: extensions,
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            if (editor.getText().trim() === "") {
                onChange("");
            } else {
                onChange(editor.getHTML());
            }
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }
    return (
        <div className="relative w-full overflow-hidden rounded-md border pb-3">
            <div className="left-0 top-0 z-10 flex w-full items-center justify-between border-b bg-background px-2 py-2">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-0">
                        <UndoToolbar />
                        <RedoToolbar />
                        <Separator orientation="vertical" className="h-7" />
                        <BoldToolbar />
                        <ItalicToolbar />
                        <StrikeThroughToolbar />
                        <BulletListToolbar />
                        <OrderedListToolbar />
                        <CodeToolbar />
                        <CodeBlockToolbar />
                        <HorizontalRuleToolbar />
                        <BlockquoteToolbar />
                        <HardBreakToolbar />
                        <ImagePlaceholderToolbar />
                    </div>
                </ToolbarProvider>
            </div>
            <div
                onClick={() => {
                    editor?.chain().focus().run();
                }}
                className={cn(
                    "max-h-[30rem] min-h-24 cursor-text overflow-y-auto bg-background",
                    resizeable && "resize-y",
                    className,
                )}
            >
                <EditorContent
                    className="focus:outline-none"
                    editor={editor}
                    ref={ref}
                    onBlur={onBlur}
                    name={name}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
