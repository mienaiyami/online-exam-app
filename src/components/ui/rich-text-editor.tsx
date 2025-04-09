"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// !temp only till i find a gud editor

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
};

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Type your content here...",
    className,
    minHeight = "150px",
}: RichTextEditorProps) {
    return (
        <div className="w-full rounded-md border border-input">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                    className,
                )}
                style={{ minHeight }}
            />
        </div>
    );
}
