// API Response Types

export interface Win {
  id: number;
  team_name: string;
  hackathon_name: string;
  result: string;
  prize: number;
  award_date: string | null;
  year: number;
  link: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string | null;
  photo: string | null;
  club_id: number | null;
  club_name: string | null;
  badge: string | null;
  telegram_link: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  source_link: string | null;
  image: string | null;
  published_date: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: number;
  name: string;
  logo_svg: string | null;
  website: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  cover_image: string | null;
  chat_link: string | null;
  channel_link: string | null;
  members_count: number;
  events_count: number;
  wins_count: number;
  images: ClubImage[];
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content_json: unknown;
  content_html: string | null;
  cover_image: string | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  [key: string]: string;
}

export interface TelegramStats {
  channel_id: number;
  username: string;
  title: string;
  subscribers_count: number;
  posts_count: number;
  last_post_date: string | null;
}

export interface TelegramPost {
  id: number;
  text: string;
  date: string;
  views: number;
  forwards: number;
  reactions: Record<string, number>;
  comments_count: number;
  link: string;
}

export interface TelegramData {
  stats: TelegramStats | null;
  posts: TelegramPost[];
  last_update: string | null;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error: string | null;
}
