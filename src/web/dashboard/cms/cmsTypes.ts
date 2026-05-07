// CMS shared types and constants

export const POST_TYPES = [
  { value: 'dev',          label: 'Dev Blog',      color: 'blue',   bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  { value: 'tutorial',     label: 'Tutorial',      color: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { value: 'changelog',    label: 'Changelog',     color: 'amber',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
  { value: 'announcement', label: 'Announcement',  color: 'rose',   bg: 'bg-rose-500/10',   text: 'text-rose-400' },
  { value: 'news',         label: 'News',          color: 'cyan',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400' },
] as const;

export type PostType = typeof POST_TYPES[number]['value'];

export interface Post {
  id: number;
  post_type: PostType;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_id: string;
  author_name: string;
  tags: string;
  is_published: boolean;
  scheduled_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Revision {
  id: number;
  post_id: number;
  title: string;
  changed_by_name: string;
  change_note: string | null;
  changed_at: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploader_name: string;
  uploaded_at: string;
  url: string;
}

export function getPostType(value: string) {
  return POST_TYPES.find(t => t.value === value) ?? POST_TYPES[0];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
