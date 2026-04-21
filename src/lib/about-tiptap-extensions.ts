import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

/** Shared Tiptap schema for About body HTML (admin editor + public read-only view). */
export function makeAboutTiptapExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto", "tel"],
      defaultProtocol: "https",
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    ...(placeholder
      ? [Placeholder.configure({ placeholder, emptyEditorClass: "is-editor-empty" })]
      : []),
  ];
}
