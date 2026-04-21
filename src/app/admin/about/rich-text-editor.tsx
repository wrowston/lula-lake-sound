"use client";

/**
 * Tiptap-based rich text editor for the About page (INF-98).
 *
 * UX target: Linear / Notion — inline formatting (bold, italic, headings 1-3,
 * blockquotes, lists, links) applied via a toolbar OR markdown shortcuts
 * shipped with `StarterKit` (e.g. typing `## ` converts the line to H2,
 * `**bold**` → bold, `> ` → blockquote, `- ` → bullet list).
 *
 * ### Safety
 *
 * Tiptap only emits nodes/marks from its configured schema, so the HTML
 * produced by `editor.getHTML()` cannot contain `<script>`, event handlers,
 * or unknown tags regardless of what the owner pastes. The only residual
 * vector is `<a href="javascript:…">`, which we neutralize by passing
 * `protocols: ['http', 'https', 'mailto', 'tel']` + `isAllowedUri` to the
 * Link extension (see `makeExtensions`).
 *
 * ### SSR / Next.js
 *
 * `immediatelyRender: false` is required to avoid hydration mismatches; see
 * https://tiptap.dev/docs/editor/getting-started/install/nextjs#integrating-editor-with-nextjs.
 */

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useMemo, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Strikethrough,
  Code,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Tiptap extensions for the About body editor. */
function makeExtensions(placeholder?: string) {
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

interface RichTextEditorProps {
  /** Initial HTML. Editor is uncontrolled internally; parent reads updates via `onChange`. */
  readonly initialHtml: string;
  readonly placeholder?: string;
  readonly onChange: (html: string) => void;
  /** Increment to force-remount (e.g. after discard). */
  readonly resetToken?: number;
}

/**
 * Editable Tiptap instance with a static toolbar. Reports HTML via `onChange`
 * on every transaction; the parent owns draft state + autosave.
 */
export function RichTextEditor({
  initialHtml,
  placeholder,
  onChange,
  resetToken,
}: RichTextEditorProps) {
  const extensions = useMemo(() => makeExtensions(placeholder), [placeholder]);

  const editor = useEditor(
    {
      extensions,
      content: initialHtml,
      editable: true,
      immediatelyRender: false,
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
      editorProps: {
        attributes: {
          class: cn(
            "prose-editor relative z-10 min-h-[18rem] w-full px-5 py-6 text-base md:px-8 md:py-8",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-sand/40",
          ),
        },
      },
    },
    // Passing resetToken in the deps array forces useEditor to re-create the
    // editor instance when we want to discard external state.
    [resetToken],
  );

  if (!editor) {
    return <EditorSkeleton />;
  }

  return (
    <div className="dark overflow-hidden rounded-lg border border-border bg-washed-black">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-texture-stone opacity-[0.22]"
          aria-hidden
        />
        <div className="relative z-10">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="dark overflow-hidden rounded-lg border border-border bg-washed-black">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-texture-stone opacity-[0.22]"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex h-10 flex-wrap items-center gap-0.5 border-b border-sand/15 bg-black/35 px-1 py-1" />
          <div className="min-h-[18rem] px-5 py-6 md:px-8 md:py-8" />
        </div>
      </div>
    </div>
  );
}

interface EditorToolbarProps {
  readonly editor: Editor;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  const promptLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-sand/15 bg-black/35 px-1 py-1">
      <ToolbarButton
        label="Bold (⌘B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Italic (⌘I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
      >
        <Code className="size-3.5" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Heading 1"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive("heading", { level: 1 })}
      >
        <Heading1 className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 className="size-3.5" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-3.5" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Link"
        onClick={promptLink}
        active={editor.isActive("link")}
      >
        <LinkIcon className="size-3.5" aria-hidden />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          label="Undo (⌘Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Redo (⌘⇧Z)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-3.5" aria-hidden />
        </ToolbarButton>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
}

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active ?? undefined}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-ivory/70 transition-colors",
        "hover:bg-white/10 hover:text-warm-white",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sand/35",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ivory/70",
        active && "bg-white/15 text-warm-white",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-sand/25" />;
}
