import type {
  Win,
  Project,
  TeamMember,
  NewsItem,
  Partner,
  Club,
  BlogPost,
  Stats,
  TelegramData,
} from './types';

// API base URL - can be set via environment variable or defaults to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both wrapped {data: ...} and unwrapped responses
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data;
      }
      
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Public API endpoints
  async getWins(): Promise<Win[]> {
    return this.fetch<Win[]>('/api/public/wins');
  }

  async getProjects(): Promise<Project[]> {
    return this.fetch<Project[]>('/api/public/projects');
  }

  async getTeam(): Promise<TeamMember[]> {
    return this.fetch<TeamMember[]>('/api/public/team');
  }

  async getNews(): Promise<NewsItem[]> {
    return this.fetch<NewsItem[]>('/api/public/news');
  }

  async getPartners(): Promise<Partner[]> {
    return this.fetch<Partner[]>('/api/public/partners');
  }

  async getClubs(): Promise<Club[]> {
    return this.fetch<Club[]>('/api/public/clubs');
  }

  async getClubBySlug(slug: string): Promise<Club> {
    return this.fetch<Club>(`/api/public/clubs/${slug}`);
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return this.fetch<BlogPost[]>('/api/public/blog');
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost> {
    return this.fetch<BlogPost>(`/api/public/blog/${slug}`);
  }

  async getStats(): Promise<Stats> {
    return this.fetch<Stats>('/api/public/stats');
  }

  async getTelegram(): Promise<TelegramData> {
    return this.fetch<TelegramData>('/api/public/telegram');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
