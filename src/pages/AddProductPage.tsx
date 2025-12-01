import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '@/hooks/useSeller';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';

export default function AddProductPage() {
  const { seller } = useSeller();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    description: '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !seller) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${seller.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName || !formData.price) {
      toast.error('Please enter product name and price');
      return;
    }

    if (!seller) {
      toast.error('Seller profile not found. Please complete onboarding first.');
      navigate('/onboarding');
      return;
    }

    setLoading(true);
    console.log('Creating product for seller:', seller.id);

    try {
      // Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: seller.id,
          product_name: formData.productName,
          price: parseFloat(formData.price),
          description: formData.description || null,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (productError) {
        console.error('Product creation error:', productError);
        toast.error('Failed to add product: ' + productError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Product created successfully:', product.id);
      toast.success('Product added! Now generate your sales content 🎉');

      // Navigate to product page where user can generate content
      navigate(`/product/${product.id}`);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')} 
          className="mb-6"
          disabled={loading || uploading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🛍️ Add Your Product</CardTitle>
            <CardDescription>Tell us what you sell and we'll create powerful sales content for you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g., African Print Dress"
                  disabled={loading || uploading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (GH₵) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 150"
                  disabled={loading || uploading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us more about your product... (optional)"
                  disabled={loading || uploading}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">The more details you provide, the better the AI-generated content!</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-ghana-green/50 transition-colors">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={loading || uploading}
                    />
                    <label htmlFor="image" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload product image</p>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP up to 5MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border-2 border-ghana-green/20">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="w-full h-64 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={loading || uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imageFile ? `Selected: ${imageFile.name}` : 'Add a product image to generate better designs'}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-ghana-green hover:bg-ghana-green/90"
                disabled={loading || uploading}
                size="lg"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {uploading ? 'Uploading Image...' : 'Adding Product...'}
                  </>
                ) : (
                  '✨ Add Product'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
