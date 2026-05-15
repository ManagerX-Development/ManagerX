# CMS Editor Module

Dieses Verzeichnis enthält die modularisierten Komponenten des `CMSPostEditor`.

## Struktur

- `EditorHeader.tsx` (In Arbeit): Der obere Bereich des Editors.
- `EditorToolbar.tsx`: Enthält alle Markdown-Aktionen und Textmanipulations-Logik.
- `EditorSidebar.tsx` (In Arbeit): Die rechte Seitenleiste für Einstellungen.
- `SEOPanel.tsx`: Die komplette SEO-Analyse-Engine und das SEO-UI-Panel.
- `SidebarPanel.tsx`: Die Steuerung für Publishing, Tags und Meta-Daten.

## Warum Modularisierung?

Der ursprüngliche `CMSPostEditor.tsx` war über 1200 Zeilen lang. Durch die Aufteilung in diese Module:
1. **Wartbarkeit**: Fehler können schneller in der jeweiligen Komponente gefunden werden.
2. **Wiederverwendbarkeit**: Das `SEOPanel` oder die `EditorToolbar` können nun auch in anderen Teilen der App (z.B. einem Quick-Editor) genutzt werden.
3. **Übersichtlichkeit**: Die Hauptdatei konzentriert sich nur noch auf das State-Management und das Layout.
