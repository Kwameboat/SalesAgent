import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useSeller } from '@/hooks/useSeller';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { Plus, ShoppingBag, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { seller } = useSeller();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seller) {
      navigate('/onboarding');
      return;
    }

    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [seller, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ghana-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {seller?.name}! 👋</h1>
            <p className="text-muted-foreground">{seller?.shop_name} · {seller?.city}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/insights')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Insights
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No products yet</h3>
              <p className="text-muted-foreground">Add your first product to start generating sales content</p>
              <Button 
                className="bg-ghana-green hover:bg-ghana-green/90"
                onClick={() => navigate('/add-product')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                    <CardDescription className="text-xl font-bold text-ghana-green">
                      GH₵{product.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || 'No description'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              className="w-full bg-ghana-green hover:bg-ghana-green/90"
              onClick={() => navigate('/add-product')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
