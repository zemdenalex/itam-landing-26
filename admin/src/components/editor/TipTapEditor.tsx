import { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';
import { useUploadImage } from '@/hooks/useUpload';
import { cn } from '@/utils/cn';

export interface EditorContent {
  json: Record<string, unknown>;
  html: string;
}

interface TipTapEditorProps {
  content?: Record<string, unknown> | null;
  onChange?: (content: EditorContent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Начните писать...',
  disabled = false,
  className,
  minHeight = '400px',
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          json: editor.getJSON() as Record<string, unknown>,
          html: editor.getHTML(),
        });
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-bold prose-headings:text-gray-900',
          'prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4',
          'prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3',
          'prose-p:text-gray-700 prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'prose-blockquote:border-l-primary prose-blockquote:text-gray-600',
          'prose-code:text-primary prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded',
          'prose-pre:bg-gray-900 prose-pre:text-gray-100',
          'prose-img:rounded-lg prose-img:shadow-md',
          'prose-ul:list-disc prose-ol:list-decimal',
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      // Validate
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      try {
        const result = await uploadImage.mutateAsync(file);
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch {
        // Error handled in mutation
      }

      // Reset input
      e.target.value = '';
    },
    [editor, uploadImage]
  );

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Export editor hook for external access if needed
export { useEditor };
