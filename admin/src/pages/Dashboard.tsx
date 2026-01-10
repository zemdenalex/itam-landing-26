import { Link } from 'react-router-dom';
import { Trophy, FolderKanban, Users, Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent, Loading, Badge, getResultBadgeVariant } from '@/components/ui';
import { useWinsStats, useWins, useLogs } from '@/hooks';
import { formatMoney, formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="mt-1 h-9 w-24 animate-pulse rounded bg-gray-200" />
            ) : (
              <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'mt-1 text-sm',
                  trendUp ? 'text-accent-green' : 'text-accent-red'
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  // Fetch data
  const { data: stats, isLoading: statsLoading } = useWinsStats();
  const { data: recentWins, isLoading: winsLoading } = useWins({ page: 1, page_size: 10 });
  const { data: recentLogs, isLoading: logsLoading } = useLogs({ page: 1, page_size: 10 });

  const actionLabels: Record<string, string> = {
    CREATE: 'Создал',
    UPDATE: 'Обновил',
    DELETE: 'Удалил',
  };

  const entityLabels: Record<string, string> = {
    win: 'победу',
    project: 'проект',
    team_member: 'участника',
    news: 'новость',
    partner: 'партнёра',
    club: 'клуб',
    blog_post: 'пост',
    user: 'пользователя',
    stat: 'статистику',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-500">Обзор статистики ITAM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего побед"
          value={stats?.total_wins ?? 0}
          icon={Trophy}
          isLoading={statsLoading}
        />
        <StatCard
          title="Призовых за год"
          value={formatMoney(stats?.prize_this_year ?? 0)}
          icon={Wallet}
          isLoading={statsLoading}
        />
        <StatCard
          title="Побед в этом году"
          value={stats?.wins_this_year ?? 0}
          icon={FolderKanban}
          isLoading={statsLoading}
        />
        <StatCard
          title="Всего призовых"
          value={formatMoney(stats?.total_prize ?? 0)}
          icon={Users}
          isLoading={statsLoading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent wins - takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Последние победы</h2>
              <Link
                to="/wins"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Смотреть все
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {winsLoading ? (
              <Loading text="Загрузка побед..." />
            ) : !recentWins?.items?.length ? (
              <p className="text-gray-500 text-sm py-8 text-center">Побед пока нет</p>
            ) : (
              <div className="space-y-3">
                {recentWins.items.slice(0, 5).map((win) => (
                  <div
                    key={win.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {win.team_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {win.hackathon_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant={getResultBadgeVariant(win.result)}>
                        {win.result}
                      </Badge>
                      {win.prize > 0 && (
                        <span className="text-sm font-medium text-gray-700">
                          {formatMoney(win.prize)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Последние действия</h2>
            </div>

            {logsLoading ? (
              <Loading text="Загрузка..." />
            ) : !recentLogs?.items?.length ? (
              <p className="text-gray-500 text-sm py-8 text-center">Действий пока нет</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.items.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                        log.action === 'CREATE' && 'bg-accent-green',
                        log.action === 'UPDATE' && 'bg-primary',
                        log.action === 'DELETE' && 'bg-accent-red'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{log.user_name || 'Система'}</span>{' '}
                        {actionLabels[log.action] || log.action}{' '}
                        {entityLabels[log.entity_type] || log.entity_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
