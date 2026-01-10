import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Loading,
  EmptyState,
  Badge,
  DeleteConfirmDialog,
} from '@/components/ui';
import {
  useNews,
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
} from '@/hooks';
import { NewsFormModal, type NewsFormData } from './NewsFormModal';
import { formatDate } from '@/utils/formatters';
import type { News } from '@/types';

export function NewsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Queries
  const { data, isLoading, isError } = useNews({ page_size: 100 });

  // Mutations
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();

  const newsList = data?.items || [];

  // Handlers
  const handleCreate = () => {
    setSelectedNews(null);
    setIsFormOpen(true);
  };

  const handleEdit = (news: News) => {
    setSelectedNews(news);
    setIsFormOpen(true);
  };

  const handleDelete = (news: News) => {
    setSelectedNews(news);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: NewsFormData) => {
    if (selectedNews) {
      await updateNews.mutateAsync({ id: selectedNews.id, data: formData });
    } else {
      await createNews.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedNews(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedNews) {
      await deleteNews.mutateAsync(selectedNews.id);
      setIsDeleteOpen(false);
      setSelectedNews(null);
    }
  };

  const handleToggleVisible = useCallback(
    async (news: News) => {
      await updateNews.mutateAsync({
        id: news.id,
        data: { ...news, is_visible: !news.is_visible },
      });
    },
    [updateNews]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">СМИ о нас</h1>
          <p className="text-gray-500">Всего публикаций: {newsList.length}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <EmptyState
              title="Ошибка загрузки"
              description="Не удалось загрузить список новостей"
            />
          ) : newsList.length === 0 ? (
            <EmptyState
              title="Публикаций нет"
              description="Добавьте первую публикацию СМИ"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить публикацию
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Фото</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsList.map((news) => (
                  <TableRow key={news.id}>
                    <TableCell>
                      {news.image ? (
                        <img
                          src={news.image}
                          alt={news.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded bg-gray-100" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium text-gray-900 truncate">
                          {news.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {news.source}
                        {news.source_link && (
                          <a
                            href={news.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(news.published_date)}</TableCell>
                    <TableCell>
                      <Badge variant={news.is_visible ? 'success' : 'gray'}>
                        {news.is_visible ? 'Виден' : 'Скрыт'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(news)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleVisible(news)}
                        >
                          {news.is_visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent-red hover:text-accent-red"
                          onClick={() => handleDelete(news)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewsFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createNews.isPending || updateNews.isPending}
        news={selectedNews}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedNews?.title}
        isLoading={deleteNews.isPending}
      />
    </div>
  );
}
