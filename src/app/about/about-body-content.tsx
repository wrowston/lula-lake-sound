"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { makeAboutTiptapExtensions } from "@/lib/about-tiptap-extensions";

/**
 * Renders stored About `bodyHtml` through the same Tiptap schema as the admin
 * editor so markup is constrained (no raw `dangerouslySetInnerHTML`).
 */
export function AboutBodyContent({ html }: { readonly html: string }) {
  const editor = useEditor(
    {
      extensions: makeAboutTiptapExtensions(),
      content: html,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose-editor max-w-none",
        },
      },
    },
    [html],
  );

  if (!editor) {
    return <div className="prose-editor max-w-none min-h-[1rem]" aria-hidden />;
  }

  return <EditorContent editor={editor} />;
}
