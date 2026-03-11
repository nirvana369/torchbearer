import { useParams, useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useGetArticleById } from '../hooks/useQueries';
import { ChevronLeft } from 'lucide-react';

export default function ArticleDetailPage() {
  const { id } = useParams({ from: '/article/$id' });
  const navigate = useNavigate();
  const articleId = id ? parseInt(id, 10) : null;

  const { data: article, isLoading, isError, error } = useGetArticleById(articleId);

  const handleGoBack = () => {
    navigate({ to: '/article' });
  };

  const renderContent = (article: any) => {
    if (!article.content || article.content.length === 0) {
      return <p className="text-foreground/60">Không có nội dung</p>;
    }

    return article.content.map((item: any, index: number) => {
      // If there's a title, render it as a heading
      if (item.title) {
        return (
          <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
            {item.title}
          </h2>
        );
      }

      // If there's a media URL, render media based on mediaType
      if (item.mediaUrl) {
        const isVideo = item.mediaType && (item.mediaType.toLowerCase().includes('video') || item.mediaUrl.endsWith('.mp4'));

        if (isVideo) {
          return (
            <div key={index} className="my-8">
              <video
                src={item.mediaUrl}
                controls
                className="w-full rounded-lg max-h-96"
              />
              {item.description && (
                <p className="text-sm text-foreground/60 mt-2 text-center">
                  {item.description}
                </p>
              )}
            </div>
          );
        } else {
          // Default to image
          return (
            <figure key={index} className="my-8">
              <img
                src={item.mediaUrl}
                alt={item.title || 'Article content'}
                className="w-full rounded-lg object-cover max-h-96"
              />
              {item.description && (
                <figcaption className="text-sm text-foreground/60 mt-2 text-center">
                  {item.description}
                </figcaption>
              )}
            </figure>
          );
        }
      }

      // If there's only description (text content), render as paragraph
      if (item.description) {
        return (
          <p key={index} className="text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap">
            {item.description}
          </p>
        );
      }

      return null;
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-lg text-foreground/60">Đang tải bài viết...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center max-w-2xl mx-auto">
              <p className="text-destructive font-semibold">Lỗi khi tải bài viết</p>
              <p className="text-foreground/60 mt-2">{error?.message || 'Bài viết không tồn tại'}</p>
            </div>
          )}

          {/* Article Content */}
          {!isLoading && !isError && article && (
            <article className="max-w-3xl mx-auto">
              {/* Article Header */}
              <header className="mb-12">
                <h1 className="text-5xl font-bold text-foreground mb-6">
                  {article.title}
                </h1>

                {/* Metadata */}
                <div className="flex flex-col gap-4 text-sm text-foreground/60 border-b border-border pb-6">
                  <div>
                    <span className="font-semibold">Ngày đăng:</span>{' '}
                    {new Date(Number(article.publishTime) / 1000000).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {article.updateTime && Number(article.updateTime) > 0 && (
                    <div>
                      <span className="font-semibold">Cập nhật:</span>{' '}
                      {new Date(Number(article.updateTime) / 1000000).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </header>

              {/* Article Body */}
              <div className="prose prose-invert max-w-none">
                {renderContent(article)}
              </div>
            </article>
          )}

          {/* Not Found State */}
          {!isLoading && !isError && !article && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/60">Bài viết không tồn tại</p>
            </div>
          )}

          {/* Back Button */}
            <div className="flex justify-end mb-8">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại
            </button>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
