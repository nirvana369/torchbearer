import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetProducts, useGetProductPriceVisibility } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ShoppingCart } from 'lucide-react';

const Products = () => {
  const navigate = useNavigate();
  const { data: productsData, isLoading, isError, error } = useGetProducts();
  const { data: showPrices = true } = useGetProductPriceVisibility();

  const products = productsData?.map(([_, product]) => product) || [];

  // Show only first 3 products as featured
  const featuredProducts = products.slice(0, 3);

  const displayWines = featuredProducts.map(p => ({
    name: p.name,
    type: 'Sản phẩm',
    description: p.description,
    image: p.imageUrl.startsWith('/') ? p.imageUrl : `/assets/generated/${p.imageUrl}`,
    price: p.price,
  }));

  if (isError) {
    console.error('Error loading products:', error);
  }

  const handleOrderClick = (productName: string) => {
    navigate({ to: `/order/${encodeURIComponent(productName)}` });
  };

  return (
    <section id="products" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 fade-in-section">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sản phẩm nổi bật
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Khám phá những sản phẩm rượu vang đặc biệt của chúng tôi
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayWines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/60 text-lg">
              Chưa có sản phẩm nào. Vui lòng quay lại sau.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {displayWines.map((wine, index) => (
                <Card
                  key={`${wine.name}-${index}`}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 fade-in-section flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={wine.image}
                      alt={wine.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/generated/wine-bottles-premium.dim_800x600.jpg';
                      }}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{wine.name}</CardTitle>
                    <CardDescription className="text-base">{wine.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-foreground/70 mb-4 flex-1">{wine.description}</p>
                    {showPrices && wine.price > 0n && (
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-primary font-semibold text-lg">
                          {Number(wine.price).toLocaleString('vi-VN')} VNĐ
                        </p>
                        <Badge variant="outline">Nổi bật</Badge>
                      </div>
                    )}
                    <Button
                      onClick={() => handleOrderClick(wine.name)}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Đặt hàng
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View More Button */}
            <div className="text-center mt-12 fade-in-section">
              <Button
                size="lg"
                onClick={() => navigate({ to: '/product' })}
                className="text-lg px-8 py-6"
              >
                Xem thêm
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
