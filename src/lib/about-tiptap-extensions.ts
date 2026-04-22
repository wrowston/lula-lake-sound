import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

export type AboutTiptapExtensionsOptions = {
  /**
   * When true (default), typed/pasted URLs become links via an `appendTransaction`
   * hook that runs linkify on every doc change — noticeably expensive while typing.
   * The admin editor turns this off; links still work via the toolbar and paste rules.
   */
  readonly autolink?: boolean;
};

/** Shared Tiptap schema for About body HTML (admin editor + public read-only view). */
export function makeAboutTiptapExtensions(
  placeholder?: string,
  options?: AboutTiptapExtensionsOptions,
) {
  const autolink = options?.autolink ?? true;
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      autolink,
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
