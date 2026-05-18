import React from "react";
import { 
  Undo, Redo, Heading1, Heading2, Heading3, 
  Bold, Italic, Strikethrough, Code, List, 
  ListOrdered, CheckSquare, Quote, Minus, 
  Link2, Image as ImageIcon, Type, Table,
  Search
} from "lucide-react";

export type ToolbarAction = {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement, set: (v: string) => void) => void;
  divider?: boolean;
};

export function wrapSelection(
  textarea: HTMLTextAreaElement,
  setValue: (v: string) => void,
  before: string,
  after: string = before,
  placeholder = "Text"
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const newValue =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  setValue(newValue);
  setTimeout(() => {
    textarea.focus();
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    textarea.setSelectionRange(newStart, newEnd);
  }, 0);
}

export function prependLine(
  textarea: HTMLTextAreaElement,
  setValue: (v: string) => void,
  prefix: string,
  placeholder = "Text"
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const line = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const selected = line.trim() || placeholder;
  const alreadyHas = line.startsWith(prefix);
  const newLine = alreadyHas ? selected.slice(prefix.length) : prefix + selected;
  const newValue = value.slice(0, lineStart) + newLine + (lineEnd === -1 ? "" : value.slice(lineEnd));
  setValue(newValue);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
  }, 0);
}

export function insertBlock(
  textarea: HTMLTextAreaElement,
  setValue: (v: string) => void,
  block: string
) {
  const start = textarea.selectionStart;
  const value = textarea.value;
  const before = value.slice(0, start);
  const after = value.slice(start);
  const needsNewlineBefore = before.length > 0 && !before.endsWith("\n\n");
  const needsNewlineAfter = after.length > 0 && !after.startsWith("\n");
  const insertion =
    (needsNewlineBefore ? "\n\n" : "") +
    block +
    (needsNewlineAfter ? "\n\n" : "");
  const newValue = before + insertion + after;
  setValue(newValue);
  setTimeout(() => {
    textarea.focus();
    const pos = before.length + insertion.length;
    textarea.setSelectionRange(pos, pos);
  }, 0);
}

interface CustomActionProps {
  onOpenTableGenerator: () => void;
  onOpenMediaPicker: () => void;
}

export const buildToolbarActions = (props?: CustomActionProps): ToolbarAction[] => [
  {
    icon: <Undo className="w-3.5 h-3.5" />,
    label: "Rückgängig (Strg+Z)",
    action: (ta) => { ta.focus(); document.execCommand("undo"); },
  },
  {
    icon: <Redo className="w-3.5 h-3.5" />,
    label: "Wiederholen (Strg+Y)",
    action: (ta) => { ta.focus(); document.execCommand("redo"); },
    divider: true,
  },
  {
    icon: <Heading1 className="w-3.5 h-3.5" />,
    label: "Überschrift 1",
    action: (ta, set) => prependLine(ta, set, "# "),
  },
  {
    icon: <Heading2 className="w-3.5 h-3.5" />,
    label: "Überschrift 2",
    action: (ta, set) => prependLine(ta, set, "## "),
  },
  {
    icon: <Heading3 className="w-3.5 h-3.5" />,
    label: "Überschrift 3",
    action: (ta, set,) => prependLine(ta, set, "### "),
    divider: true,
  },
  {
    icon: <Bold className="w-3.5 h-3.5" />,
    label: "Fett (Strg+B)",
    action: (ta, set) => wrapSelection(ta, set, "**", "**", "Fetter Text"),
  },
  {
    icon: <Italic className="w-3.5 h-3.5" />,
    label: "Kursiv (Strg+I)",
    action: (ta, set) => wrapSelection(ta, set, "_", "_", "Kursiver Text"),
  },
  {
    icon: <Strikethrough className="w-3.5 h-3.5" />,
    label: "Durchgestrichen",
    action: (ta, set) => wrapSelection(ta, set, "~~", "~~", "Text"),
  },
  {
    icon: <Code className="w-3.5 h-3.5" />,
    label: "Inline Code",
    action: (ta, set) => wrapSelection(ta, set, "`", "`", "code"),
    divider: true,
  },
  {
    icon: <List className="w-3.5 h-3.5" />,
    label: "Aufzählung",
    action: (ta, set) => prependLine(ta, set, "- "),
  },
  {
    icon: <ListOrdered className="w-3.5 h-3.5" />,
    label: "Nummerierte Liste",
    action: (ta, set) => prependLine(ta, set, "1. "),
  },
  {
    icon: <CheckSquare className="w-3.5 h-3.5" />,
    label: "Aufgabenliste",
    action: (ta, set) => prependLine(ta, set, "- [ ] "),
    divider: true,
  },
  {
    icon: <Quote className="w-3.5 h-3.5" />,
    label: "Zitat",
    action: (ta, set) => prependLine(ta, set, "> "),
  },
  {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: "Trennlinie",
    action: (ta, set) => insertBlock(ta, set, "---"),
  },
  {
    icon: <Link2 className="w-3.5 h-3.5" />,
    label: "Link einfügen",
    action: (ta, set) => wrapSelection(ta, set, "[", "](https://)", "Linktext"),
  },
  {
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    label: "Bild aus Mediathek",
    action: (ta) => { 
      if (props?.onOpenMediaPicker) props.onOpenMediaPicker();
      else insertBlock(ta, (v) => {}, "![Bildbeschreibung](https://)"); 
    },
    divider: true,
  },
  {
    icon: <Type className="w-3.5 h-3.5" />,
    label: "Codeblock",
    action: (ta, set) => insertBlock(ta, set, "```javascript\n// Code hier...\n```"),
  },
  {
    icon: <Table className="w-3.5 h-3.5" />,
    label: "Tabelle generieren",
    action: (ta, set) => {
      if (props?.onOpenTableGenerator) props.onOpenTableGenerator();
      else insertBlock(ta, set, "| Kopf | Kopf |\n|---|---|\n| Zelle | Zelle |");
    },
  },
];
