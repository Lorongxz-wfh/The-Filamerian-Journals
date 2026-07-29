import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const toggleBtnClass = (isActive: boolean) =>
    `p-1.5 shrink-0 rounded transition-colors ${isActive ? 'bg-primary text-white' : 'text-primary/70 hover:bg-secondary/30'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface p-1.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={toggleBtnClass(editor.isActive('paragraph'))}
        title="Normal Text (Paragraph)"
      >
        <span className="w-4 h-4 text-[12px] font-bold flex items-center justify-center font-sans">P</span>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={toggleBtnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={toggleBtnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={toggleBtnClass(editor.isActive('bold'))}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={toggleBtnClass(editor.isActive('italic'))}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-border mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={toggleBtnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={toggleBtnClass(editor.isActive('orderedList'))}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={toggleBtnClass(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={toggleBtnClass(false) + ' disabled:opacity-30 disabled:hover:bg-transparent'}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={toggleBtnClass(false) + ' disabled:opacity-30 disabled:hover:bg-transparent'}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] max-h-[400px] overflow-y-auto p-4 text-[14px] prose-headings:font-display prose-headings:font-normal prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-primary prose-p:text-primary/90 prose-p:leading-relaxed prose-blockquote:border prose-blockquote:border-border prose-blockquote:bg-primary/5 prose-blockquote:p-4 prose-blockquote:italic prose-blockquote:text-primary/80',
      },
    },
  });

  // Update editor content if value changes externally (e.g., loading data)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="space-y-1">
      {label && <label className="block text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">{label}</label>}
      <div className="border border-border bg-background focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition-all rounded-sm overflow-hidden">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
