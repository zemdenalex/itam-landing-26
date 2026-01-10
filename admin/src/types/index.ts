// API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// User
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Win
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

// Project
export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  tags: Tag[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Tag
export interface Tag {
  id: number;
  name: string;
}

// Team Member
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

// News
export interface News {
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

// Partner
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

// Club
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
  club_id: number;
  image_url: string;
  sort_order: number;
}

// Blog Post
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content_json: Record<string, unknown> | null;
  content_html: string | null;
  cover_image: string | null;
  published_at: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Stats
export interface Stat {
  key: string;
  value: string;
  label: string | null;
  updated_at: string;
}

// Audit Log
export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: number | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Wins Stats (for dashboard)
export interface WinsStats {
  total_wins: number;
  total_prize: number;
  wins_this_year: number;
  prize_this_year: number;
}

// Navigation item
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}
