import { RefreshCw, Users, FileText, Eye, MessageCircle, Heart, Share2, ExternalLink } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Loading,
  EmptyState,
  Badge,
} from '@/components/ui';
import { useTelegramData, useRefreshTelegram } from '@/hooks';
import { formatNumber } from '@/utils/formatters';
import type { ChannelPost } from '@/api/telegram';

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: 'primary' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    primary: 'bg-primary-light text-primary',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: ChannelPost }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalReactions = post.reactions_total || Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{formatDate(post.date)}</span>
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Text preview */}
        <p className="text-gray-700 text-sm line-clamp-3 mb-4">
          {post.text || <span className="italic text-gray-400">Медиа без текста</span>}
        </p>

        {/* Media indicator */}
        {post.has_media && (
          <Badge variant="outline" className="mb-3">
            {post.media_type || 'Медиа'}
          </Badge>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1" title="Просмотры">
            <Eye className="h-4 w-4" />
            {formatNumber(post.views)}
          </div>
          {totalReactions > 0 && (
            <div className="flex items-center gap-1" title="Реакции">
              <Heart className="h-4 w-4" />
              {formatNumber(totalReactions)}
            </div>
          )}
          {post.comments_count > 0 && (
            <div className="flex items-center gap-1" title="Комментарии">
              <MessageCircle className="h-4 w-4" />
              {formatNumber(post.comments_count)}
            </div>
          )}
          {post.forwards > 0 && (
            <div className="flex items-center gap-1" title="Репосты">
              <Share2 className="h-4 w-4" />
              {formatNumber(post.forwards)}
            </div>
          )}
        </div>

        {/* Reactions breakdown */}
        {Object.keys(post.reactions || {}).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-0.5 rounded"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TelegramPage() {
  const { data, isLoading, isError, refetch } = useTelegramData();
  const refreshMutation = useRefreshTelegram();

  const handleRefresh = async () => {
    await refreshMutation.mutateAsync();
    // Also refetch local data
    setTimeout(() => refetch(), 1000);
  };

  const formatLastUpdate = (dateStr: string | null) => {
    if (!dateStr) return 'Неизвестно';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram</h1>
          <p className="text-gray-500">Статистика канала @itatmisis</p>
        </div>
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram</h1>
          <p className="text-gray-500">Статистика канала @itatmisis</p>
        </div>
        <EmptyState
          title="Ошибка загрузки"
          description="Не удалось загрузить данные Telegram"
          action={
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Повторить
            </Button>
          }
        />
      </div>
    );
  }

  const { stats, posts, last_update } = data || {};
  const hasData = stats || (posts && posts.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram</h1>
          <p className="text-gray-500">
            Статистика канала{' '}
            <a
              href="https://t.me/itatmisis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @itatmisis
            </a>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Обновлено: {formatLastUpdate(last_update || null)}
          </span>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="Данные недоступны"
          description="Telegram worker ещё не собрал данные. Попробуйте обновить через несколько минут."
          action={
            <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
              <RefreshCw className="h-4 w-4" />
              Запросить обновление
            </Button>
          }
        />
      ) : (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Подписчиков"
                value={formatNumber(stats.subscribers_count)}
                color="primary"
              />
              <StatCard
                icon={FileText}
                label="Всего постов"
                value={formatNumber(stats.posts_count)}
                color="green"
              />
              <StatCard
                icon={Eye}
                label="Ср. просмотры"
                value={
                  posts && posts.length > 0
                    ? formatNumber(Math.round(posts.reduce((a, p) => a + p.views, 0) / posts.length))
                    : '—'
                }
                color="orange"
              />
              <StatCard
                icon={Heart}
                label="Ср. реакции"
                value={
                  posts && posts.length > 0
                    ? formatNumber(
                        Math.round(
                          posts.reduce((a, p) => a + (p.reactions_total || 0), 0) / posts.length
                        )
                      )
                    : '—'
                }
                color="purple"
              />
            </div>
          )}

          {/* Channel info */}
          {stats && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{stats.title}</h3>
                    <p className="text-sm text-gray-500">@{stats.username}</p>
                  </div>
                  <a
                    href={`https://t.me/${stats.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Открыть канал
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent posts */}
          {posts && posts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Последние посты
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
