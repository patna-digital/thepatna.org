"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import { useEffect, useRef } from "react";

/**
 * RichTextEditor — TipTap-powered WYSIWYG editor for publication body content.
 *
 * Renders the editor and keeps a hidden <textarea> in sync so the value
 * is submitted with the surrounding form as HTML.
 *
 * Props:
 *  - name: form field name (default "body")
 *  - defaultValue: initial HTML string
 *  - placeholder: placeholder text
 *  - required: mark field required
 */
export function RichTextEditor({
  name = "body",
  defaultValue = "",
  placeholder = "Write the full content of this publication...",
  required = false,
}) {
  const textareaRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // we use our own heading extension
        codeBlock: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue || "",
    onUpdate({ editor }) {
      if (textareaRef.current) {
        textareaRef.current.value = editor.getHTML();
      }
    },
    immediatelyRender: false,
  });

  // Sync initial value
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = defaultValue || "";
    }
  }, [defaultValue]);

  return (
    <div className="rte-wrapper">
      {/* Hidden textarea carries the HTML value in form submission */}
      <textarea
        defaultValue={defaultValue}
        name={name}
        ref={textareaRef}
        required={required}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
        <ToolbarGroup>
          <ToolbarButton
            active={editor?.isActive("bold")}
            disabled={!editor}
            label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            disabled={!editor}
            label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("underline")}
            disabled={!editor}
            label="Underline"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("strike")}
            disabled={!editor}
            label="Strikethrough"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <span style={{ textDecoration: "line-through" }}>S</span>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor}
            label="Heading 2"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 3 })}
            disabled={!editor}
            label="Heading 3"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "left" })}
            disabled={!editor}
            label="Align left"
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            ≡
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "center" })}
            disabled={!editor}
            label="Align centre"
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            ≡
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            label="Numbered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            active={editor?.isActive("blockquote")}
            disabled={!editor}
            label="Blockquote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            ❝
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor}
            label="Insert link"
            onClick={() => handleLink(editor)}
          >
            Link
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor || !editor.isActive("link")}
            label="Remove link"
            onClick={() => editor?.chain().focus().unsetLink().run()}
          >
            Unlink
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            disabled={!editor?.can().undo()}
            label="Undo"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            ↩
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor?.can().redo()}
            label="Redo"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            ↪
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      <EditorContent className="rte-content" editor={editor} />
    </div>
  );
}

function ToolbarGroup({ children }) {
  return <div className="rte-toolbar-group">{children}</div>;
}

function ToolbarButton({ children, onClick, active, disabled, label }) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`rte-toolbar-btn${active ? " rte-toolbar-btn-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function handleLink(editor) {
  if (!editor) return;
  const prev = editor.getAttributes("link").href || "";
  const raw = window.prompt("Link URL", prev);
  if (raw === null) return;
  if (raw === "") {
    editor.chain().focus().unsetLink().run();
  } else {
    const href = normaliseUrl(raw);
    editor.chain().focus().setLink({ href }).run();
  }
}

function normaliseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  // Leave anchors, mailto, tel, and already-protocolled URLs as-is
  if (/^(#|https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
