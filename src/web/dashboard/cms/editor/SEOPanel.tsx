import React, { useState, useMemo, useEffect } from "react";
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Search, 
  ChevronDown, ChevronUp, TrendingUp 
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Post } from "../cmsTypes";

export type SeoStatus = "green" | "yellow" | "red";

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoStatus;
  value: string;
  hint: string;
  detail?: string;
}

export interface SeoResult {
  score: number;
  checks: SeoCheck[];
}

// ─── SEO Analysis Engine ──────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, " ")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(md: string): { level: number; text: string }[] {
  return md.split("\n")
    .map((line) => { const m = line.match(/^(#{1,6})\s+(.+)/); return m ? { level: m[1].length, text: m[2].trim() } : null; })
    .filter(Boolean) as { level: number; text: string }[];
}

function getKeywordDensity(text: string, kw: string): number {
  if (!kw || !text) return 0;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const count = words.filter((w) => w.includes(kw.toLowerCase())).length;
  return words.length > 0 ? (count / words.length) * 100 : 0;
}

function countSentences(text: string): number {
  return Math.max(1, (text.match(/[.!?]+/g) || []).length);
}

function readingEase(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 5) return 100;
  const sentences = countSentences(text);
  const syllables = words.reduce((a, w) => a + Math.max(1, (w.match(/[aeiouäöüy]/gi) || []).length), 0);
  return Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length))));
}

export function analyzeSeo(title: string, content: string, excerpt: string, slug: string, coverImage: string, focusKeyword: string): SeoResult {
  const plain = stripMarkdown(content);
  const words = plain.split(/\s+/).filter(Boolean);
  const headings = extractHeadings(content);
  const h1s = headings.filter((h) => h.level === 1);
  const h2s = headings.filter((h) => h.level === 2);
  const kw = focusKeyword.toLowerCase().trim();
  const density = getKeywordDensity(plain, kw);
  const ease = readingEase(plain);
  const awps = Math.round(words.length / countSentences(plain));
  const hasLinks = /\[.+?\]\(.+?\)/.test(content);
  const hasImage = !!coverImage || /!\[.+?\]\(.+?\)/.test(content);
  const tLow = title.toLowerCase();
  const eLow = excerpt.toLowerCase();
  const sLow = slug.toLowerCase().replace(/-/g, " ");

  const checks: SeoCheck[] = [];

  const tLen = title.length;
  checks.push({ id: "title_length", label: "Titel-Länge", status: tLen >= 30 && tLen <= 60 ? "green" : tLen > 0 && tLen < 70 ? "yellow" : "red", value: tLen > 0 ? `${tLen} Zeichen` : "Kein Titel", hint: tLen < 30 ? "Titel zu kurz (min. 30 Zeichen)" : tLen > 60 ? "Titel zu lang (max. 60 für Snippet)" : "Optimale Titellänge", detail: "Google zeigt ca. 50–60 Zeichen im Suchergebnis. Darüber wird der Titel abgeschnitten." });

  if (kw) checks.push({ id: "title_kw", label: "Keyword im Titel", status: tLow.includes(kw) ? "green" : "red", value: tLow.includes(kw) ? "Vorhanden" : "Fehlt", hint: tLow.includes(kw) ? "Keyword im Titel gefunden" : `„${focusKeyword}" fehlt im Titel`, detail: "Das Fokus-Keyword möglichst am Anfang des Titels platzieren." });

  const eLen = excerpt.length;
  checks.push({ id: "meta_desc", label: "Meta-Beschreibung", status: eLen >= 120 && eLen <= 160 ? "green" : eLen > 0 && eLen <= 200 ? "yellow" : "red", value: eLen > 0 ? `${eLen} Zeichen` : "Leer", hint: eLen === 0 ? "Kurzfassung fehlt" : eLen < 120 ? "Zu kurz (120–160 Zeichen ideal)" : eLen > 160 ? "Zu lang, wird abgeschnitten" : "Perfekte Länge", detail: "Die Meta-Beschreibung erscheint unter dem Titel in Google-Suchergebnissen und beeinflusst die Klickrate." });

  if (kw && excerpt) checks.push({ id: "meta_kw", label: "Keyword in Meta", status: eLow.includes(kw) ? "green" : "yellow", value: eLow.includes(kw) ? "Vorhanden" : "Fehlt", hint: eLow.includes(kw) ? "Keyword in Kurzfassung gefunden" : "Keyword in die Kurzfassung einbauen" });

  const wc = words.length;
  checks.push({ id: "content_len", label: "Inhaltslänge", status: wc >= 600 ? "green" : wc >= 300 ? "yellow" : "red", value: `${wc} Wörter`, hint: wc < 300 ? "Zu kurz (min. 300 W. empfohlen)" : wc < 600 ? "Gut – 600+ Wörter noch besser" : "Gute Inhaltslänge", detail: "Artikel mit 1000–2000 Wörtern ranken im Schnitt besser. Qualität vor Quantität." });

  if (kw) checks.push({ id: "kw_density", label: "Keyword-Dichte", status: density >= 0.5 && density <= 2.5 ? "green" : density > 0 ? "yellow" : "red", value: kw ? `${density.toFixed(1)}%` : "–", hint: density === 0 ? `Keyword nie verwendet` : density < 0.5 ? "Zu selten (0.5–2.5% ideal)" : density > 2.5 ? "Zu häufig – Keyword-Stuffing-Risiko" : "Optimale Keyword-Dichte", detail: "0.5–2.5% gilt als ideal. Darüber kann Google es als Spam werten." });

  checks.push({ id: "h1", label: "H1-Überschrift", status: h1s.length === 1 ? "green" : h1s.length === 0 ? "yellow" : "yellow", value: h1s.length === 0 ? "Keine" : `${h1s.length}×`, hint: h1s.length === 0 ? "Keine H1 im Inhalt (# Titel)" : h1s.length > 1 ? "Nur eine H1 verwenden" : "Genau eine H1 vorhanden", detail: "Eine einzige H1 pro Seite ist SEO-Standard. Der Post-Titel agiert oft bereits als H1." });

  checks.push({ id: "headings", label: "Überschriften-Struktur", status: h2s.length >= 2 ? "green" : h2s.length === 1 ? "yellow" : "red", value: headings.length > 0 ? `${headings.length} gesamt` : "Keine", hint: h2s.length === 0 ? "Keine H2-Abschnitte – Struktur fehlt" : h2s.length === 1 ? "Mehr H2-Abschnitte für bessere Struktur" : `${h2s.length} H2-Abschnitte – gut`, detail: "H2 und H3 strukturieren den Inhalt für Leser und Crawler. Mindestens 2 H2 empfohlen." });

  if (kw && headings.length > 0) checks.push({ id: "kw_headings", label: "Keyword in Überschriften", status: headings.some((h) => h.text.toLowerCase().includes(kw)) ? "green" : "yellow", value: headings.some((h) => h.text.toLowerCase().includes(kw)) ? "Vorhanden" : "Fehlt", hint: headings.some((h) => h.text.toLowerCase().includes(kw)) ? "Keyword in Überschrift gefunden" : "Keyword in mindestens einer H2/H3 verwenden" });

  checks.push({ id: "images", label: "Bilder vorhanden", status: hasImage ? "green" : "yellow", value: hasImage ? "Ja" : "Nein", hint: hasImage ? "Bild(er) im Beitrag vorhanden" : "Mindestens ein Bild empfohlen", detail: "Bilder erhöhen die Verweildauer. Alt-Texte verbessern Barrierefreiheit und Bild-SEO." });

  checks.push({ id: "links", label: "Links im Text", status: hasLinks ? "green" : "yellow", value: hasLinks ? "Vorhanden" : "Keine", hint: hasLinks ? "Links gefunden" : "Interne oder externe Links einbauen", detail: "Interne Links verbessern das Crawling. Externe Links zu Quellen stärken die Glaubwürdigkeit." });

  checks.push({ id: "slug", label: "URL-Slug", status: slug && slug.length > 3 && slug.length < 75 ? "green" : slug ? "yellow" : "red", value: slug ? `/${slug}` : "Leer", hint: !slug ? "Slug fehlt" : slug.length > 75 ? "Slug zu lang" : "Slug vorhanden", detail: "Kurze, keyword-reiche Slugs sind ideal. Keine Sonderzeichen, nur Kleinbuchstaben und Bindestriche." });

  if (kw && slug) checks.push({ id: "slug_kw", label: "Keyword im Slug", status: sLow.includes(kw) ? "green" : "yellow", value: sLow.includes(kw) ? "Vorhanden" : "Fehlt", hint: sLow.includes(kw) ? "Keyword im Slug gefunden" : "Keyword im URL-Slug verwenden" });

  if (plain.length > 100) checks.push({ id: "readability", label: "Lesbarkeit (Flesch)", status: ease >= 60 ? "green" : ease >= 40 ? "yellow" : "red", value: `Score ${ease}/100`, hint: ease >= 60 ? "Leicht lesbar" : ease >= 40 ? "Mittel – vereinfachen empfohlen" : "Schwer lesbar", detail: `Ø ${awps} Wörter pro Satz. Kürzere Sätze und einfachere Wörter erhöhen den Score. Ziel: 60+.` });

  const green = checks.filter((c) => c.status === "green").length;
  const yellow = checks.filter((c) => c.status === "yellow").length;
  const score = Math.round((green * 100 + yellow * 50) / checks.length);
  return { score, checks };
}

// ─── SEO Panel ────────────────────────────────────────────────────────────────

interface SeoPanelProps {
  formData: Partial<Post>;
  onScoreChange?: (score: number) => void;
}

export function SeoPanel({ formData, onScoreChange }: SeoPanelProps) {
  const [focusKeyword, setFocusKeyword] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const result = useMemo(
    () => analyzeSeo(formData.title || "", formData.content || "", formData.excerpt || "", formData.slug || "", formData.cover_image || "", focusKeyword),
    [formData.title, formData.content, formData.excerpt, formData.slug, formData.cover_image, focusKeyword]
  );

  useEffect(() => { onScoreChange?.(result.score); }, [result.score, onScoreChange]);

  const scoreColor = result.score >= 70 ? "text-emerald-400" : result.score >= 40 ? "text-amber-400" : "text-red-400";
  const scoreBg = result.score >= 70 ? "bg-emerald-400/10 border-emerald-400/20" : result.score >= 40 ? "bg-amber-400/10 border-amber-400/20" : "bg-red-400/10 border-red-400/20";
  const scoreLabel = result.score >= 70 ? "Gut" : result.score >= 40 ? "Verbesserbar" : "Kritisch";

  const statusIcon = (s: SeoStatus) => {
    if (s === "green") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (s === "yellow") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    return <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  };

  const statusBorder = (s: SeoStatus) => {
    if (s === "green") return "border-emerald-400/20 bg-emerald-400/5";
    if (s === "yellow") return "border-amber-400/20 bg-amber-400/5";
    return "border-red-400/20 bg-red-400/5";
  };

  const green = result.checks.filter((c) => c.status === "green").length;
  const yellow = result.checks.filter((c) => c.status === "yellow").length;
  const red = result.checks.filter((c) => c.status === "red").length;
  const total = result.checks.length;
  const circumference = 2 * Math.PI * 22;

  return (
    <div className="space-y-4">
      {/* Score donut */}
      <div className={cn("rounded-2xl border p-4 flex items-center gap-4", scoreBg)}>
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
            <circle cx="28" cy="28" r="22" fill="none" strokeWidth="4" className="stroke-white/5" />
            <circle
              cx="28" cy="28" r="22" fill="none" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - result.score / 100)}
              className={result.score >= 70 ? "stroke-emerald-400" : result.score >= 40 ? "stroke-amber-400" : "stroke-red-400"}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className={cn("absolute inset-0 flex items-center justify-center text-sm font-black", scoreColor)}>
            {result.score}
          </div>
        </div>
        <div>
          <div className={cn("text-base font-black italic", scoreColor)}>{scoreLabel}</div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">SEO-Score</div>
          <div className="flex items-center gap-2.5 mt-1.5 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" />{green}</span>
            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-2.5 h-2.5" />{yellow}</span>
            <span className="flex items-center gap-1 text-red-400"><AlertCircle className="w-2.5 h-2.5" />{red}</span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden flex bg-white/5">
        <div className="bg-emerald-400/70 transition-all duration-500" style={{ width: `${(green / total) * 100}%` }} />
        <div className="bg-amber-400/70 transition-all duration-500" style={{ width: `${(yellow / total) * 100}%` }} />
        <div className="bg-red-400/70 transition-all duration-500" style={{ width: `${(red / total) * 100}%` }} />
      </div>

      {/* Focus keyword input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Search className="w-3 h-3" /> Fokus-Keyword
        </label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => setFocusKeyword(e.target.value)}
          placeholder="z.B. React Tutorial..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 transition-colors"
        />
        {!focusKeyword && (
          <p className="text-[10px] text-muted-foreground/50">Keyword eingeben für Dichte- & Positionierungs-Checks</p>
        )}
      </div>

      {/* Checks list */}
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-0.5">Analyse</div>
        {result.checks.map((check) => (
          <div key={check.id}>
            <button
              onClick={() => setExpanded(expanded === check.id ? null : check.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:brightness-110",
                statusBorder(check.status),
                expanded === check.id ? "rounded-b-none" : ""
              )}
            >
              {statusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white/80 truncate">{check.label}</div>
                <div className="text-[10px] text-muted-foreground truncate leading-tight">{check.hint}</div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/70 shrink-0 mr-1 max-w-[60px] truncate text-right">{check.value}</span>
              {check.detail && (
                expanded === check.id
                  ? <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" />
                  : <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
            </button>
            {expanded === check.id && check.detail && (
              <div className={cn("px-3 py-2.5 text-[10px] text-muted-foreground leading-relaxed rounded-b-xl border border-t-0", statusBorder(check.status))}>
                {check.detail}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Google SERP preview */}
      {(formData.title || formData.excerpt) && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google-Vorschau</div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
            <div className="text-[12px] text-blue-400 font-medium truncate leading-snug">
              {(formData.title || "Kein Titel").slice(0, 60)}{(formData.title || "").length > 60 ? "..." : ""}
            </div>
            <div className="text-[10px] text-emerald-600/80 font-mono truncate">
              deine-domain.de/{formData.slug || "url-slug"}
            </div>
            <div className="text-[10px] text-white/35 leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {(formData.excerpt || "Keine Beschreibung hinterlegt. Google wählt dann einen Textausschnitt aus dem Inhalt.").slice(0, 160)}{(formData.excerpt || "").length > 160 ? "..." : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
