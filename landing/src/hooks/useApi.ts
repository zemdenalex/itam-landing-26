import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type {
  Win,
  Project,
  TeamMember,
  NewsItem,
  Partner,
  Club,
  Stats,
  TelegramData,
} from '../api/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useApi<T>(fetchFn: () => Promise<T>, deps: unknown[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Wins
export function useWins(): UseApiState<Win[]> {
  return useApi(() => api.getWins(), []);
}

// Projects
export function useProjects(): UseApiState<Project[]> {
  return useApi(() => api.getProjects(), []);
}

// Team
export function useTeam(): UseApiState<TeamMember[]> {
  return useApi(() => api.getTeam(), []);
}

// News
export function useNews(): UseApiState<NewsItem[]> {
  return useApi(() => api.getNews(), []);
}

// Partners
export function usePartners(): UseApiState<Partner[]> {
  return useApi(() => api.getPartners(), []);
}

// Clubs
export function useClubs(): UseApiState<Club[]> {
  return useApi(() => api.getClubs(), []);
}

export function useClub(slug: string): UseApiState<Club> {
  return useApi(() => api.getClubBySlug(slug), [slug]);
}

// Stats
export function useStats(): UseApiState<Stats> {
  return useApi(() => api.getStats(), []);
}

// Telegram
export function useTelegram(): UseApiState<TelegramData> {
  return useApi(() => api.getTelegram(), []);
}

// Export types for convenience
export type { Win, Project, TeamMember, NewsItem, Partner, Club, Stats, TelegramData };
