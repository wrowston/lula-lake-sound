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

import {
  useEditor,
  EditorContent,
  type Editor,
  useEditorState,
} from "@tiptap/react";
import {
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
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
import { makeAboutTiptapExtensions } from "@/lib/about-tiptap-extensions";

export interface RichTextEditorHandle {
  getHTML: () => string;
  /** Replace document HTML without emitting `onDirty` (e.g. discard). */
  reset: (html: string) => void;
}

interface RichTextEditorProps {
  /** Initial HTML on first mount. Editor is uncontrolled; parent reads via ref. */
  readonly initialHtml: string;
  readonly placeholder?: string;
  /** Called on each transaction so the parent can restart autosave debounce. */
  readonly onDirty?: () => void;
}

type ToolbarMarkState = {
  readonly isBold: boolean;
  readonly isItalic: boolean;
  readonly isStrike: boolean;
  readonly isCode: boolean;
  readonly isH1: boolean;
  readonly isH2: boolean;
  readonly isH3: boolean;
  readonly isQuote: boolean;
  readonly isBullet: boolean;
  readonly isOrdered: boolean;
  readonly isLink: boolean;
};

function toolbarMarkStateEqual(
  a: ToolbarMarkState,
  b: ToolbarMarkState | null,
): boolean {
  if (b === null) return false;
  return (
    a.isBold === b.isBold &&
    a.isItalic === b.isItalic &&
    a.isStrike === b.isStrike &&
    a.isCode === b.isCode &&
    a.isH1 === b.isH1 &&
    a.isH2 === b.isH2 &&
    a.isH3 === b.isH3 &&
    a.isQuote === b.isQuote &&
    a.isBullet === b.isBullet &&
    a.isOrdered === b.isOrdered &&
    a.isLink === b.isLink
  );
}

const RichTextEditorImpl = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor({ initialHtml, placeholder, onDirty }, ref) {
  const extensions = useMemo(
    () => makeAboutTiptapExtensions(placeholder, { autolink: false }),
    [placeholder],
  );

  const editor = useEditor(
    {
      extensions,
      content: initialHtml,
      editable: true,
      immediatelyRender: false,
      onUpdate: () => onDirty?.(),
      editorProps: {
        attributes: {
          class: cn(
            "prose-editor relative z-10 min-h-[18rem] w-full px-5 py-6 text-base md:px-8 md:py-8",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-sand/40",
          ),
        },
      },
    },
    [extensions],
  );

  useImperativeHandle(
    ref,
    () => ({
      getHTML: () => editor?.getHTML() ?? "",
      reset: (html: string) => {
        editor?.commands.setContent(html, { emitUpdate: false });
      },
    }),
    [editor],
  );

  if (!editor) {
    return <EditorSkeleton />;
  }

  return (
    <div className="dark overflow-hidden rounded-lg border border-border bg-washed-black">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 translate-z-0 bg-texture-stone opacity-[0.22]"
          aria-hidden
        />
        <div className="relative z-10">
          <EditorToolbar editor={editor} />
          <div className="min-w-0 [contain:paint]">
            <EditorContent editor={editor} className="min-w-0" />
          </div>
        </div>
      </div>
    </div>
  );
});

RichTextEditorImpl.displayName = "RichTextEditor";

/**
 * Editable Tiptap instance with a static toolbar. Parent reads HTML via ref.
 */
export const RichTextEditor = memo(RichTextEditorImpl);
RichTextEditor.displayName = "RichTextEditor";

function EditorSkeleton() {
  return (
    <div className="dark overflow-hidden rounded-lg border border-border bg-washed-black">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 translate-z-0 bg-texture-stone opacity-[0.22]"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex h-10 flex-wrap items-center gap-0.5 border-b border-sand/15 bg-black/35 px-1 py-1" />
          <div className="min-h-[18rem] [contain:paint] px-5 py-6 md:px-8 md:py-8" />
        </div>
      </div>
    </div>
  );
}

interface EditorToolbarProps {
  readonly editor: Editor;
}

const EditorToolbar = memo(function EditorToolbar({
  editor,
}: EditorToolbarProps) {
  const t = useEditorState({
    editor,
    selector: (snapshot): ToolbarMarkState => ({
      isBold: snapshot.editor.isActive("bold"),
      isItalic: snapshot.editor.isActive("italic"),
      isStrike: snapshot.editor.isActive("strike"),
      isCode: snapshot.editor.isActive("code"),
      isH1: snapshot.editor.isActive("heading", { level: 1 }),
      isH2: snapshot.editor.isActive("heading", { level: 2 }),
      isH3: snapshot.editor.isActive("heading", { level: 3 }),
      isQuote: snapshot.editor.isActive("blockquote"),
      isBullet: snapshot.editor.isActive("bulletList"),
      isOrdered: snapshot.editor.isActive("orderedList"),
      isLink: snapshot.editor.isActive("link"),
    }),
    equalityFn: toolbarMarkStateEqual,
  });

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
        active={t.isBold}
      >
        <Bold className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Italic (⌘I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={t.isItalic}
      >
        <Italic className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={t.isStrike}
      >
        <Strikethrough className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={t.isCode}
      >
        <Code className="size-3.5" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Heading 1"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={t.isH1}
      >
        <Heading1 className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={t.isH2}
      >
        <Heading2 className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={t.isH3}
      >
        <Heading3 className="size-3.5" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={t.isQuote}
      >
        <Quote className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={t.isBullet}
      >
        <List className="size-3.5" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={t.isOrdered}
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

      <ToolbarButton label="Link" onClick={promptLink} active={t.isLink}>
        <LinkIcon className="size-3.5" aria-hidden />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          label="Undo (⌘Z)"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Redo (⌘⇧Z)"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-3.5" aria-hidden />
        </ToolbarButton>
      </div>
    </div>
  );
});

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
