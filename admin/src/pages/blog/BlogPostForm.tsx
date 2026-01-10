import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Save, Send, Loader2 } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, ImageUpload } from '@/components/ui';
import { TipTapEditor, type EditorContent } from '@/components/editor';
import { BlogPreview } from './BlogPreview';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
} from '@/hooks';
import { generateSlug } from '@/utils/formatters';
import { cn } from '@/utils/cn';

type ViewMode = 'edit' | 'preview';

export function BlogPostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const postId = id ? parseInt(id, 10) : null;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState<Record<string, unknown> | null>(null);
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Queries & Mutations
  const { data: post, isLoading: isLoadingPost } = useBlogPost(postId);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  // Initialize form with existing post data
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setSlugManuallyEdited(true); // Don't auto-generate for existing posts
      setCoverImage(post.cover_image);
      setContentJson(post.content_json);
      setContentHtml(post.content_html);
    }
  }, [post]);

  // Auto-generate slug from title (only if not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManuallyEdited]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // Handle slug change (manual edit)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  // Handle editor content change
  const handleEditorChange = useCallback((content: EditorContent) => {
    setContentJson(content.json);
    setContentHtml(content.html);
  }, []);

  // Save as draft
  const handleSaveDraft = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const data = {
        title: title.trim(),
        slug: slug || generateSlug(title),
        content_json: contentJson,
        content_html: contentHtml,
        cover_image: coverImage,
        is_published: false,
      };

      if (isEditing && postId) {
        await updatePost.mutateAsync({ id: postId, data });
      } else {
        await createPost.mutateAsync(data);
      }
      navigate('/blog');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const data = {
        title: title.trim(),
        slug: slug || generateSlug(title),
        content_json: contentJson,
        content_html: contentHtml,
        cover_image: coverImage,
        is_published: true,
        published_at: new Date().toISOString(),
      };

      if (isEditing && postId) {
        await updatePost.mutateAsync({ id: postId, data });
      } else {
        await createPost.mutateAsync(data);
      }
      navigate('/blog');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state for edit mode
  if (isEditing && isLoadingPost) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Редактирование поста' : 'Новый пост'}
            </h1>
            {post?.is_published && (
              <p className="text-sm text-green-600">Опубликован</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'edit'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              Редактор
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                viewMode === 'preview'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Eye className="h-4 w-4" />
              Превью
            </button>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Сохранить черновик
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Опубликовать
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Заголовок *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Введите заголовок поста"
                      className="text-lg font-medium mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">
                      URL (slug)
                      <span className="text-gray-400 font-normal ml-2">
                        /blog/{slug || 'url-posta'}
                      </span>
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="url-posta"
                      className="mt-1.5 font-mono text-sm"
                    />
                    {!slugManuallyEdited && title && (
                      <p className="text-xs text-gray-500 mt-1">
                        Автоматически сгенерирован из заголовка
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card>
              <CardContent className="p-0">
                <TipTapEditor
                  content={contentJson}
                  onChange={handleEditorChange}
                  placeholder="Начните писать содержимое поста..."
                  minHeight="500px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cover Image */}
            <Card>
              <CardContent className="p-6">
                <Label className="mb-3 block">Обложка</Label>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  aspectRatio="video"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Рекомендуемый размер: 1200×630px
                </p>
              </CardContent>
            </Card>

            {/* Meta Info */}
            {isEditing && post && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-gray-900 mb-3">Информация</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Создан:</dt>
                      <dd className="text-gray-900">
                        {new Date(post.created_at).toLocaleDateString('ru-RU')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Изменён:</dt>
                      <dd className="text-gray-900">
                        {new Date(post.updated_at).toLocaleDateString('ru-RU')}
                      </dd>
                    </div>
                    {post.published_at && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Опубликован:</dt>
                        <dd className="text-gray-900">
                          {new Date(post.published_at).toLocaleDateString('ru-RU')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <Card className="overflow-hidden">
          <BlogPreview
            title={title}
            coverImage={coverImage}
            contentHtml={contentHtml}
            publishedAt={post?.published_at || new Date().toISOString()}
          />
        </Card>
      )}
    </div>
  );
}
