import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface PremiumMarkdownProps {
  content: string;
  className?: string;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-8">
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all"
          title="Code kopieren"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/70" />}
        </button>
      </div>
      {match && (
        <div className="absolute left-6 -top-3 px-3 py-1 rounded-lg bg-primary text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 z-10 italic">
          {match[1]}
        </div>
      )}
      <pre className={cn("overflow-x-auto rounded-[2rem] border border-white/10 bg-[#0d1117] p-8 pt-10 font-mono text-sm leading-relaxed", className)}>
        <code {...props}>{children}</code>
      </pre>
    </div>
  );
};

const CustomTable = ({ children }: any) => (
  <div className="my-10 overflow-hidden rounded-[2rem] border border-white/10 glass-strong shadow-2xl">
    <table className="w-full border-collapse text-left text-sm">
      {children}
    </table>
  </div>
);

const CustomTh = ({ children }: any) => (
  <th className="border-b border-white/10 bg-white/5 px-6 py-4 font-black uppercase tracking-widest text-primary italic">
    {children}
  </th>
);

const CustomTd = ({ children }: any) => (
  <td className="border-b border-white/5 px-6 py-4 text-muted-foreground font-medium transition-colors hover:bg-white/[0.02]">
    {children}
  </td>
);

const CustomBlockquote = ({ children }: any) => (
  <blockquote className="my-10 border-l-4 border-primary bg-primary/5 px-8 py-6 rounded-r-[2rem] italic relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
    <div className="relative z-10 prose-p:m-0 prose-p:text-white/90 font-medium leading-relaxed">
      {children}
    </div>
  </blockquote>
);

export function PremiumMarkdown({ content, className }: PremiumMarkdownProps) {
  return (
    <div className={cn(
      "prose prose-invert prose-primary max-w-none",
      "prose-headings:font-black prose-headings:tracking-tighter prose-headings:italic prose-headings:uppercase",
      "prose-h1:text-4xl md:prose-h1:text-6xl prose-h1:mb-12 prose-h1:bg-gradient-to-b prose-h1:from-white prose-h1:to-white/40 prose-h1:bg-clip-text prose-h1:text-transparent",
      "prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4",
      "prose-p:text-muted-foreground prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-bold",
      "prose-strong:text-white prose-strong:font-black",
      "prose-img:rounded-[2.5rem] prose-img:border prose-img:border-white/10 prose-img:shadow-2xl prose-img:my-12",
      "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
      "prose-li:text-muted-foreground prose-li:font-medium prose-li:my-2",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkToc, { heading: "Inhaltsverzeichnis", tight: true }], remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append", content: { type: "element", tagName: "span", properties: { className: ["ml-2 opacity-0 group-hover:opacity-100 transition-opacity"] }, children: [{ type: "text", value: "#" }] } }]
        , rehypeKatex]}
        components={{
          code: CodeBlock,
          table: CustomTable,
          th: CustomTh,
          td: CustomTd,
          blockquote: CustomBlockquote,
          h1: ({ children, ...props }) => <h1 className="group flex items-center" {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 className="group flex items-center" {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 className="group flex items-center" {...props}>{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
