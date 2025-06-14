'use client'

import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Heading } from '@tiptap/extension-heading'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { Bold } from '@tiptap/extension-bold'
import { Italic } from '@tiptap/extension-italic'
import { Underline } from '@tiptap/extension-underline'
import { Strike } from '@tiptap/extension-strike'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { HardBreak } from '@tiptap/extension-hard-break'
import { TextAlign } from '@tiptap/extension-text-align'
import { FiBold, FiItalic, FiUnderline, FiType, FiLink, FiImage, FiList, FiAlignLeft, FiDroplet, FiAlignCenter, FiAlignRight, FiAlignJustify } from 'react-icons/fi'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, className }) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Bold,
      Italic,
      Underline,
      Strike,
      TextStyle,
      Color,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[150px] max-h-[300px] overflow-y-auto w-full p-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty string was set -> unset link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  const setColor = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return
    editor.chain().focus().setColor(event.target.value).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={`border rounded-md border-input ${className || ''}`}>
      <div className="flex flex-wrap items-center p-2 border-b border-input gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          title="Gras"
        >
          <FiBold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent' : ''}`}
          title="Italique"
        >
          <FiItalic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('underline') ? 'bg-accent' : ''}`}
          title="Souligné"
        >
          <FiUnderline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('strike') ? 'bg-accent' : ''}`}
          title="Barré"
        >
          <FiType className="h-4 w-4" />
        </button>
        <input
          type="color"
          onInput={setColor}
          value={editor.isActive('textStyle') ? editor.getAttributes('textStyle').color : '#000000'}
          className="h-8 w-8 cursor-pointer rounded-md overflow-hidden p-0 m-0 border-none bg-transparent"
          title="Couleur du texte"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}
          title="Titre 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}
          title="Titre 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`}
          title="Titre 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}
          title="Aligner à gauche"
        >
          <FiAlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}
          title="Centrer"
        >
          <FiAlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}
          title="Aligner à droite"
        >
          <FiAlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}`}
          title="Justifier"
        >
          <FiAlignJustify className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
          title="Liste à puces"
        >
          <FiList className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
          title="Liste numérotée"
        >
          <FiAlignLeft className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-accent ${editor.isActive('link') ? 'bg-accent' : ''}`}
          title="Ajouter un lien"
        >
          <FiLink className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-2 rounded hover:bg-accent"
          title="Supprimer le lien"
        >
          <FiLink className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL de l\'image')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          className="p-2 rounded hover:bg-accent"
          title="Ajouter une image"
        >
          <FiImage className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor 