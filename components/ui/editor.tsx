"use client"

import React from 'react'
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react'

interface EditorProps {
  value: string
  onChange?: (value: string) => void
  height?: number
}

export default function Editor({ value, onChange, height = 400 }: EditorProps) {
  return (
    <div className="w-full editor-container shadow-sm border border-slate-200 rounded-md overflow-hidden">
      <TinyMCEEditor
        apiKey="lkl0pqp7n17wo3tk2pfhla1ick07i94t634q6nb8yk4yyok1"
        // We will use the Cloud CDN version by default
        init={{
          height: height,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'emoticons', 'pagebreak'
          ],
          toolbar1: 'undo redo | fontfamily fontsize blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | link image media table | emoticons charmap | pagebreak code fullscreen preview',
          content_style: 'body { font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size:14px }',
          skin: 'oxide',
          branding: false,
          promotion: false
        }}
        value={value}
        onEditorChange={(content) => {
          if (onChange) {
            onChange(content)
          }
        }}
      />
    </div>
  )
}
