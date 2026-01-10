import { cn } from '@/utils/cn';

interface BlogPreviewProps {
  title: string;
  coverImage?: string | null;
  contentHtml?: string | null;
  publishedAt?: string | null;
  className?: string;
}

export function BlogPreview({
  title,
  coverImage,
  contentHtml,
  publishedAt,
  className,
}: BlogPreviewProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('blog-preview', className)}>
      {/* Simulated landing page styles */}
      <div
        className="min-h-screen p-8 rounded-lg"
        style={{
          backgroundColor: 'var(--bg-primary)',
          fontFamily: "'NTSomic', system-ui, sans-serif",
        }}
      >
        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {publishedAt && (
              <time
                className="block text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                {formatDate(publishedAt)}
              </time>
            )}
            <h1
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              {title || 'Без заголовка'}
            </h1>
          </header>

          {/* Cover Image */}
          {coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content"
            style={{ color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{
              __html: contentHtml || '<p style="color: var(--text-secondary)">Контент отсутствует...</p>',
            }}
          />
        </article>
      </div>

      {/* Blog content styles */}
      <style>{`
        .blog-preview {
          --bg-primary: rgba(14, 13, 15, 1);
          --text-primary: #FAFAFA;
          --text-secondary: rgba(250, 250, 250, 0.6);
          --text-brand: #8174E2;
          --bg-tertiary-block: rgba(250, 250, 250, 0.09);
        }
        
        .blog-content {
          line-height: 1.75;
        }
        
        .blog-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
        
        .blog-content h3 {
          font-size: 1.375rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }
        
        .blog-content p {
          margin-bottom: 1.25rem;
          color: rgba(250, 250, 250, 0.88);
        }
        
        .blog-content a {
          color: var(--text-brand);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        
        .blog-content a:hover {
          border-bottom-color: var(--text-brand);
        }
        
        .blog-content strong {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .blog-content em {
          font-style: italic;
        }
        
        .blog-content u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        
        .blog-content ul {
          list-style-type: disc;
        }
        
        .blog-content ol {
          list-style-type: decimal;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
          color: rgba(250, 250, 250, 0.88);
        }
        
        .blog-content blockquote {
          border-left: 3px solid var(--text-brand);
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--text-secondary);
        }
        
        .blog-content code {
          background: var(--bg-tertiary-block);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'SF Mono', Monaco, 'Courier New', monospace;
          font-size: 0.875em;
        }
        
        .blog-content pre {
          background: var(--bg-tertiary-block);
          padding: 1rem 1.25rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
        }
        
        .blog-content hr {
          border: none;
          border-top: 1px solid var(--bg-tertiary-block);
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
