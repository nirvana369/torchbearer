import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetProducts, useGetCategories, useGetProductPriceVisibility } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default function ProductPage() {
  const navigate = useNavigate();
  const { isFetching } = useActor();
  const { data: productsData, isLoading, isError, error } = useGetProducts();
  const { data: categories } = useGetCategories();
  const { data: showPrices = true } = useGetProductPriceVisibility();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const products = productsData?.map(([_, product]) => product) || [];

  // Calculate max price for slider
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 1000000;
    return Math.max(...products.map(p => Number(p.price)), 1000000);
  }, [products]);

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const price = Number(product.price);
      // Only apply price filter if prices are visible
      const inPriceRange = !showPrices || (price >= priceRange[0] && price <= priceRange[1]);
      // product.categories is an array of Category objects, compare by id string
      const inCategory = selectedCategory === 'all' || product.categories.some(cat => String(cat.id) === String(selectedCategory));
      return inPriceRange && inCategory;
    });
  }, [products, priceRange, selectedCategory, showPrices]);

  const getCategoryName = (categoryId: string): string => {
    // categories returned from actor have numeric/bigint ids — compare as strings
    const category = categories?.find(cat => String(cat.id) === String(categoryId));
    return category?.name || String(categoryId);
  };

  if (isError) {
    console.error('Error loading products:', error);
  }

  // Only show loading during initial actor fetch
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-foreground/60">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/' })}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang chủ
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Sản phẩm của chúng tôi
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl">
              Khám phá bộ sưu tập rượu vang đặc biệt của chúng tôi
            </p>
          </div>

          {/* Filters Section */}
          <div className="mb-8 p-6 bg-muted/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Bộ lọc</h2>
            <div className={`grid ${showPrices ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Danh mục</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter - Only show if prices are visible */}
              {showPrices && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Khoảng giá: {priceRange[0].toLocaleString('vi-VN')} - {priceRange[1].toLocaleString('vi-VN')} VNĐ
                  </label>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={10000}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Clear Filters */}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPriceRange([0, maxPrice]);
                  setSelectedCategory('all');
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60 text-lg">
                Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-foreground/70">
                Hiển thị {filteredProducts.length} sản phẩm
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {filteredProducts.map((product, index) => {
                  const imageUrl = product.imageUrl.startsWith('/') 
                    ? product.imageUrl 
                    : `/assets/${product.imageUrl}`;
                  
                  return (
                    <Card
                      key={`${product.name}-${index}`}
                      className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/wine-bottles-premium.dim_800x600.jpg';
                          }}
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-2xl">{product.name}</CardTitle>
                        <CardDescription className="text-base">
                          {product.categories && product.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.categories.map((cat) => (
                                <Badge key={String(cat.id)} variant="outline" className="text-xs">
                                  {cat.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            'Rượu Vang'
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/70 mb-4 line-clamp-2">{product.description}</p>
                        <div className="space-y-3">
                          {showPrices && product.price > 0n && (
                            <div className="flex items-center justify-between">
                              <p className="text-primary font-semibold text-lg">
                                {Number(product.price).toLocaleString('vi-VN')} VNĐ
                              </p>
                              <Badge variant="outline">Có sẵn</Badge>
                            </div>
                          )}
                          <Button
                            className="w-full"
                            onClick={() => navigate({ to: `/order/${encodeURIComponent(product.id.toString())}` })}
                          >
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Đặt hàng
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
