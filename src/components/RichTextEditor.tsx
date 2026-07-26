"use client";

import { useEffect, useRef, useState } from "react";

type ToolbarItem = { cmd: string; arg?: string; label: string; title: string };

const TOOLBAR: ToolbarItem[] = [
  { cmd: "bold", label: "B", title: "Bold" },
  { cmd: "italic", label: "I", title: "Italic" },
  { cmd: "underline", label: "U", title: "Underline" },
  { cmd: "formatBlock", arg: "H3", label: "H", title: "Heading" },
  { cmd: "insertUnorderedList", label: "• List", title: "Bulleted list" },
  { cmd: "insertOrderedList", label: "1. List", title: "Numbered list" },
  { cmd: "removeFormat", label: "Clear", title: "Clear formatting" },
];

/**
 * Dependency-free WYSIWYG editor built on contentEditable + execCommand.
 * The current HTML is mirrored into a hidden input so it posts with the form.
 * Initial content is set imperatively once, so React never re-reconciles the
 * editable node's children (which would fight the browser's caret handling).
 */
export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = defaultValue;
    // Intentionally run once on mount; defaultValue is an initializer only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    if (ref.current) setHtml(ref.current.innerHTML);
  }

  function exec(item: ToolbarItem) {
    ref.current?.focus();
    document.execCommand(item.cmd, false, item.arg);
    sync();
  }

  const isEmpty = !html || html === "<br>" || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim() === "";

  return (
    <div className="overflow-hidden rounded-[11px] border border-white/10 bg-black/30 focus-within:border-[#7c5cff]">
      <div className="flex flex-wrap gap-1 border-b border-white/10 bg-black/20 p-1.5">
        {TOOLBAR.map((item) => (
          <button
            key={item.cmd + (item.arg ?? "")}
            type="button"
            title={item.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(item)}
            className="min-w-[30px] rounded-md px-2 py-1 text-xs font-semibold text-[#cabfff] hover:bg-white/10"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          role="textbox"
          aria-multiline="true"
          className="g6-prose min-h-[150px] px-4 py-3 text-sm text-[#ece9f5] focus:outline-none"
        />
        {isEmpty && placeholder ? (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-[#5c5770]">{placeholder}</span>
        ) : null}
      </div>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
