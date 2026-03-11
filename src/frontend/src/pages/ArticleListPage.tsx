import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useGetArticles, useGetTotalArticleCount } from '../hooks/useQueries';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to extract first thumbnail and description from article content
function getArticleThumb(content: any[]) {
  const result = {
    imageUrl: '',
    description: '',
  };

  if (!content || content.length === 0) {
    return result;
  }

  for (const item of content) {
    if (item.mediaUrl && item.mediaType && !result.imageUrl) {
      result.imageUrl = item.mediaUrl;
    }
    if (item.description && !result.description) {
      result.description = item.description;
    }
    
    // If we have both, stop searching
    if (result.imageUrl && result.description) {
      break;
    }
  }

  return result;
}

export default function ArticleListPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  
  const { data: articles = [], isLoading, isError, error } = useGetArticles(currentPage);
  const { data: totalCount = BigInt(0) } = useGetTotalArticleCount();

  const totalPages = Math.ceil(Number(totalCount) / 10);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handleArticleClick = (articleId: number) => {
    navigate({ to: `/article/${articleId}` });
  };

  const handlePreviousPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Page Title */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Bài Viết</h1>
            <p className="text-lg text-foreground/60">Khám phá các bài viết và tin tức mới nhất</p>
          </div>

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
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <p className="text-destructive font-semibold">Lỗi khi tải bài viết</p>
              <p className="text-foreground/60 mt-2">{error?.message || 'Vui lòng thử lại sau'}</p>
            </div>
          )}

          {/* Articles Grid */}
          {!isLoading && !isError && articles.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {articles.map((article) => {
                  const { imageUrl, description } = getArticleThumb(article.content);
                  
                  return (
                    <article
                      key={article.id}
                      onClick={() => handleArticleClick(Number(article.id))}
                      className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                    >
                      {/* Thumbnail Image */}
                      {imageUrl && (
                        <div className="relative w-full h-48 bg-muted overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-grow">
                        {/* Title */}
                        <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>

                        {/* Publish Date */}
                        <div className="text-sm text-foreground/60 mb-4">
                          {new Date(Number(article.publishTime) / 1000000).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>

                        {/* Description from content */}
                        {description && (
                          <div className="text-foreground/70 line-clamp-2 mb-4">
                            {description}
                          </div>
                        )}

                        {/* Preview of content (fallback if no description) */}
                        {!description && article.content && article.content.length > 0 && (
                          <div className="text-foreground/70 line-clamp-3 mb-4">
                            {article.content
                              .filter(item => 'text' in item)
                              .map(item => (item as any).text)
                              .join(' ')
                              .substring(0, 150)}
                            ...
                          </div>
                        )}

                        {/* Read More Link */}
                        <div className="inline-flex items-center text-primary font-semibold group-hover:gap-2 transition-all mt-auto">
                          Đọc tiếp
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={!hasPrevPage}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-foreground/70 font-medium">
                  Trang {currentPage + 1} / {totalPages}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !isError && articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/60">Chưa có bài viết nào</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
