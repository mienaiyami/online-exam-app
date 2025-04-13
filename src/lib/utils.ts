import { Content, Editor } from "@tiptap/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date?: Date): string {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr${hours > 1 ? "s" : ""}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""}`;
};

// tiptap utils
export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME =
    "node-handles-selected-style";

export function isValidUrl(url: string) {
    return /^https?:\/\/\S+$/.test(url);
}

export const duplicateContent = (editor: Editor) => {
    const { view } = editor;
    const { state } = view;
    const { selection } = state;

    editor
        .chain()
        .insertContentAt(
            selection.to,
            selection.content().content.firstChild?.toJSON() as Content,
            {
                updateSelection: true,
            },
        )
        .focus(selection.to)
        .run();
};

export function getUrlFromString(str: string) {
    if (isValidUrl(str)) {
        return str;
    }
    try {
        if (str.includes(".") && !str.includes(" ")) {
            return new URL(`https://${str}`).toString();
        }
    } catch {
        return null;
    }
}

//-----

export const minifyHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const imgs = doc.querySelectorAll("img");
    const replaceNode = document.createElement("span");
    replaceNode.innerHTML = "&lt;Image&gt;";
    imgs.forEach((img) => {
        const parent = img.parentElement;
        if (parent) {
            parent.replaceChild(replaceNode, img);
        }
    });
    return doc.body.innerHTML;
};
export const cleanHtmlForDisplay = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const imgs = doc.querySelectorAll("img");
    imgs.forEach((img) => {
        img.setAttribute("draggable", "false");
        const align = img.getAttribute("align");
        img.removeAttribute("align");
        if (align === "left")
            img.classList?.add("relative", "left-0", "-translate-x-0");
        if (align === "center")
            img.classList?.add("relative", "left-1/2", "-translate-x-1/2");
        if (align === "right")
            img.classList?.add("relative", "left-full", "-translate-x-full");
    });
    return doc.body.innerHTML;
};
