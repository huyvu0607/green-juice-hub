import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "@/api/cloudinaryApi";

// ── Toolbar button ─────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-7 w-7 flex items-center justify-center rounded text-sm transition-colors
        ${active
          ? "bg-green-100 text-green-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />;
}

// ── Main Editor ────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync giá trị ngoài vào editor (lần đầu load edit)
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  // Upload ảnh từ file
  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "products");
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">

        {/* Heading */}
        <select
          value={
            editor.isActive("heading", { level: 1 }) ? "h1"
            : editor.isActive("heading", { level: 2 }) ? "h2"
            : editor.isActive("heading", { level: 3 }) ? "h3"
            : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v[1]) }).run();
          }}
          className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus:outline-none mr-1"
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <Divider />

        {/* Bold / Italic / Underline / Strike */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="In đậm (Ctrl+B)">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="In nghiêng (Ctrl+I)">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Gạch chân (Ctrl+U)">
          <u>U</u>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Gạch ngang">
          <s>S</s>
        </ToolBtn>

        <Divider />

        {/* Align */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Căn trái">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Căn giữa">
          ☰
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Căn phải">
          ≡
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Danh sách">
          •≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Danh sách số">
          1≡
        </ToolBtn>

        <Divider />

        {/* Color */}
        <div className="relative flex items-center" title="Màu chữ">
          <input
            type="color"
            className="h-7 w-7 cursor-pointer rounded border border-gray-200 p-0.5"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            defaultValue="#000000"
          />
        </div>

        <Divider />

        {/* Image upload */}
        <ToolBtn
          onClick={() => fileRef.current?.click()}
          title="Chèn ảnh"
          active={false}
        >
          {uploading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </ToolBtn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Làm lại">↪</ToolBtn>
      </div>

      {/* ── Editor area ── */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[200px] px-4 py-3
          focus-within:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[200px]
          [&_.ProseMirror_img]:max-w-full
          [&_.ProseMirror_img]:rounded-lg
          [&_.ProseMirror_img]:my-2"
      />
    </div>
  );
}