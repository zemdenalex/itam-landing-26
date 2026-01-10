import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
} from 'lucide-react';
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
  useBlogPosts,
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
} from '@/hooks';
import { formatDate } from '@/utils/formatters';
import type { BlogPost } from '@/types';

export function BlogPage() {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Queries
  const { data, isLoading, isError } = useBlogPosts({ page_size: 100 });

  // Mutations
  const deletePost = useDeleteBlogPost();
  const publishPost = usePublishBlogPost();
  const unpublishPost = useUnpublishBlogPost();

  const posts = data?.items || [];

  // Handlers
  const handleCreate = () => {
    navigate('/blog/new');
  };

  const handleEdit = (post: BlogPost) => {
    navigate(`/blog/${post.id}/edit`);
  };

  const handleDelete = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPost) {
      await deletePost.mutateAsync(selectedPost.id);
      setIsDeleteOpen(false);
      setSelectedPost(null);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    if (post.is_published) {
      await unpublishPost.mutateAsync(post.id);
    } else {
      await publishPost.mutateAsync(post.id);
    }
  };

  const getStatusBadge = (post: BlogPost) => {
    if (post.is_published) {
      return <Badge variant="success">Опубликован</Badge>;
    }
    return <Badge variant="gray">Черновик</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Блог</h1>
          <p className="text-gray-500">Всего постов: {posts.length}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Создать пост
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
              description="Не удалось загрузить список постов"
            />
          ) : posts.length === 0 ? (
            <EmptyState
              title="Постов нет"
              description="Создайте первый пост в блоге"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Создать пост
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Обложка</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Дата публикации</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[140px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded bg-gray-100">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium text-gray-900 truncate">
                          {post.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {post.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {post.published_at
                        ? formatDate(post.published_at)
                        : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(post)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(post)}
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTogglePublish(post)}
                          title={post.is_published ? 'Снять с публикации' : 'Опубликовать'}
                        >
                          {post.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {post.is_published && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            title="Открыть на сайте"
                          >
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent-red hover:text-accent-red"
                          onClick={() => handleDelete(post)}
                          title="Удалить"
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

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedPost?.title}
        isLoading={deletePost.isPending}
      />
    </div>
  );
}
