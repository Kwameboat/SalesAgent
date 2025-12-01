import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Product, GeneratedContent } from '@/types';
import { ArrowLeft, Copy, RefreshCw, Loader2, AlertCircle, Facebook, Instagram, MessageCircle, Music, Youtube, Clock, Hash, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    if (!id) return;

    console.log('Fetching product and content for ID:', id);
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      toast.error('Failed to load product');
      setLoading(false);
      return;
    }

    const { data: contentData } = await supabase
      .from('generated_content')
      .select('*')
      .eq('product_id', id)
      .order('date_generated', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Product loaded:', productData.product_name);
    console.log('Content found:', !!contentData);

    setProduct(productData);
    setContent(contentData);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied! 📋`);
  };

  const handleCopyAll = (items: string[], label: string) => {
    const combined = items.join('\n\n');
    navigator.clipboard.writeText(combined);
    toast.success(`All ${label} copied! 📋`);
  };

  const handleDownloadFlyer = async () => {
    if (!content?.flyer_image_url) return;

    try {
      const response = await fetch(content.flyer_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product?.product_name || 'flyer'}-sales-flyer.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Flyer downloaded! 🎉');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download flyer');
    }
  };

  const handleRegenerate = async () => {
    if (!id) return;

    setGenerating(true);
    setError(null);
    console.log('🚀 Starting content generation for product:', id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session valid:', !!sessionData.session);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { productId: id },
      });

      console.log('Function response:', { hasData: !!data, hasError: !!error });

      if (error) {
        let errorMessage = 'Failed to generate content';
        
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            console.error('Function error details:', { statusCode, textContent });
            
            try {
              const errorJson = JSON.parse(textContent || '{}');
              errorMessage = errorJson.error || textContent || error.message;
            } catch {
              errorMessage = textContent || error.message;
            }
            
            errorMessage = `Error (${statusCode}): ${errorMessage}`;
          } catch (e) {
            console.error('Error parsing error context:', e);
            errorMessage = error.message || 'Unknown error occurred';
          }
        } else {
          errorMessage = error.message || 'Unknown error';
        }
        
        console.error('❌ Generation failed:', errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setGenerating(false);
        return;
      }

      console.log('✅ Content generated successfully');
      console.log('Flyer URL from response:', data.flyerImageUrl);
      
      if (data.flyerImageUrl) {
        toast.success('Sales content and flyer design generated! 🎉');
      } else {
        toast.success('Sales content generated! (Flyer generation in progress...)');
      }
      
      // Refresh content immediately
      console.log('Refreshing content...');
      await fetchContent();
      setGenerating(false);
      
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      const errorMsg = err.message || 'Unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-ghana-green border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you're looking for doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ContentCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-ghana-green" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const CopyableItem = ({ text, label, onCopy }: { text: string; label?: string; onCopy?: () => void }) => (
    <div className="p-4 bg-muted rounded-lg relative group hover:bg-muted/80 transition-colors">
      <p className="text-sm pr-12 whitespace-pre-wrap leading-relaxed">{text}</p>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onCopy ? onCopy() : handleCopy(text, label || 'Content')}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Product Info */}
          <Card className="border-2 border-ghana-green/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                {product.image_url && (
                  <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border-2 border-ghana-gold/20">
                    <img 
                      src={product.image_url} 
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{product.product_name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-ghana-green mb-4">
                    GH₵{product.price}
                  </CardDescription>
                  {product.description && (
                    <p className="text-muted-foreground">{product.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-ghana-green hover:bg-ghana-green/90"
                onClick={handleRegenerate}
                disabled={generating}
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating AI-Powered Content & Professional Flyer...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {content ? 'Generate Fresh Content & New Flyer' : 'Generate Sales Content & Flyer Design'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={handleRegenerate}
                  disabled={generating}
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* AI-Generated Flyer */}
          {content?.flyer_image_url && (
            <Card className="border-2 border-ghana-gold/30 bg-gradient-to-br from-ghana-green/5 to-ghana-gold/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-ghana-green" />
                    <CardTitle className="text-lg">🎨 Your Professional Sales Flyer</CardTitle>
                  </div>
                  <Button onClick={handleDownloadFlyer} className="bg-ghana-green hover:bg-ghana-green/90">
                    <Download className="w-4 h-4 mr-2" />
                    Download Flyer
                  </Button>
                </div>
                <CardDescription>AI-generated professional design ready to use on all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden border-2 border-ghana-green/20 bg-white">
                  <img 
                    src={content.flyer_image_url} 
                    alt="Sales Flyer" 
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Use this flyer on Facebook, Instagram, WhatsApp Status, and all social media platforms
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generated Content */}
          {content && content.facebook_content ? (
            <Tabs defaultValue="facebook" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  <span className="hidden sm:inline">Facebook</span>
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <span className="hidden sm:inline">Instagram</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span className="hidden sm:inline">TikTok</span>
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  <span className="hidden sm:inline">YouTube</span>
                </TabsTrigger>
              </TabsList>

              {/* Facebook Content */}
              <TabsContent value="facebook" className="space-y-4">
                <ContentCard title="Detailed Facebook Posts" icon={Facebook}>
                  <div className="flex justify-end mb-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopyAll(content.facebook_content.posts, 'Facebook posts')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All Posts
                    </Button>
                  </div>
                  {content.facebook_content.posts.map((post, idx) => (
                    <CopyableItem key={idx} text={post} label={`Facebook post ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Hashtags" icon={Hash}>
                  <div className="flex flex-wrap gap-2">
                    {content.facebook_content.hashtags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-ghana-green/20"
                        onClick={() => handleCopy(tag, 'Hashtag')}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => handleCopy(content.facebook_content.hashtags.join(' '), 'All hashtags')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Hashtags
                  </Button>
                </ContentCard>

                <ContentCard title="Best Posting Time" icon={Clock}>
                  <p className="text-sm font-medium">{content.facebook_content.bestTime}</p>
                </ContentCard>
              </TabsContent>

              {/* Instagram Content */}
              <TabsContent value="instagram" className="space-y-4">
                <ContentCard title="Detailed Instagram Captions" icon={Instagram}>
                  <div className="flex justify-end mb-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopyAll(content.instagram_content.captions, 'Instagram captions')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                  {content.instagram_content.captions.map((caption, idx) => (
                    <CopyableItem key={idx} text={caption} label={`Caption ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Reels Scripts" icon={Music}>
                  {content.instagram_content.reels.map((reel, idx) => (
                    <CopyableItem key={idx} text={reel} label={`Reel script ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Story Ideas" icon={MessageCircle}>
                  {content.instagram_content.stories.map((story, idx) => (
                    <CopyableItem key={idx} text={story} label={`Story idea ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Hashtags" icon={Hash}>
                  <div className="flex flex-wrap gap-2">
                    {content.instagram_content.hashtags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-ghana-green/20"
                        onClick={() => handleCopy(tag, 'Hashtag')}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => handleCopy(content.instagram_content.hashtags.join(' '), 'All hashtags')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Hashtags
                  </Button>
                </ContentCard>

                <ContentCard title="Best Posting Time" icon={Clock}>
                  <p className="text-sm font-medium">{content.instagram_content.bestTime}</p>
                </ContentCard>
              </TabsContent>

              {/* WhatsApp Content */}
              <TabsContent value="whatsapp" className="space-y-4">
                <ContentCard title="Status Updates" icon={MessageCircle}>
                  {content.whatsapp_content.statusUpdates.map((status, idx) => (
                    <CopyableItem key={idx} text={status} label={`Status ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Detailed Broadcast Messages" icon={MessageCircle}>
                  {content.whatsapp_content.broadcastMessages.map((msg, idx) => (
                    <CopyableItem key={idx} text={msg} label={`Broadcast ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Quick Replies" icon={MessageCircle}>
                  {content.whatsapp_content.quickReplies.map((reply, idx) => (
                    <CopyableItem key={idx} text={reply} label={`Reply ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Best Posting Time" icon={Clock}>
                  <p className="text-sm font-medium">{content.whatsapp_content.bestTime}</p>
                </ContentCard>
              </TabsContent>

              {/* TikTok Content */}
              <TabsContent value="tiktok" className="space-y-4">
                <ContentCard title="Detailed Video Scripts" icon={Music}>
                  {content.tiktok_content.videoScripts.map((script, idx) => (
                    <CopyableItem key={idx} text={script} label={`Script ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Attention Hooks" icon={AlertCircle}>
                  {content.tiktok_content.hooks.map((hook, idx) => (
                    <CopyableItem key={idx} text={hook} label={`Hook ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Viral Hashtags" icon={Hash}>
                  <div className="flex flex-wrap gap-2">
                    {content.tiktok_content.hashtags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-ghana-green/20"
                        onClick={() => handleCopy(tag, 'Hashtag')}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => handleCopy(content.tiktok_content.hashtags.join(' '), 'All hashtags')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Hashtags
                  </Button>
                </ContentCard>

                <ContentCard title="Trending Ideas" icon={Music}>
                  <p className="text-sm text-muted-foreground leading-relaxed">{content.tiktok_content.trends}</p>
                </ContentCard>

                <ContentCard title="Best Posting Time" icon={Clock}>
                  <p className="text-sm font-medium">{content.tiktok_content.bestTime}</p>
                </ContentCard>
              </TabsContent>

              {/* YouTube Content */}
              <TabsContent value="youtube" className="space-y-4">
                <ContentCard title="Video Ideas" icon={Youtube}>
                  {content.youtube_content.videoIdeas.map((idea, idx) => (
                    <CopyableItem key={idx} text={idea} label={`Video idea ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="SEO-Optimized Descriptions" icon={Youtube}>
                  {content.youtube_content.descriptions.map((desc, idx) => (
                    <CopyableItem key={idx} text={desc} label={`Description ${idx + 1}`} />
                  ))}
                </ContentCard>

                <ContentCard title="Thumbnail Design Tips" icon={ImageIcon}>
                  <p className="text-sm text-muted-foreground leading-relaxed">{content.youtube_content.thumbnailTips}</p>
                </ContentCard>

                <ContentCard title="Hashtags" icon={Hash}>
                  <div className="flex flex-wrap gap-2">
                    {content.youtube_content.hashtags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-ghana-green/20"
                        onClick={() => handleCopy(tag, 'Hashtag')}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => handleCopy(content.youtube_content.hashtags.join(' '), 'All hashtags')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Hashtags
                  </Button>
                </ContentCard>

                <ContentCard title="Best Upload Time" icon={Clock}>
                  <p className="text-sm font-medium">{content.youtube_content.bestTime}</p>
                </ContentCard>
              </TabsContent>
            </Tabs>
          ) : content ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Old Content Format Detected</AlertTitle>
              <AlertDescription>
                This content was generated with the old format. Click "Generate Fresh Content & New Flyer" above to create new platform-specific content with professional AI-generated flyer design.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Overall Strategy */}
          {content && content.strategy && (
            <Card className="border-2 border-ghana-gold/30">
              <CardHeader>
                <CardTitle>📊 Comprehensive Cross-Platform Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content.strategy}</p>
              </CardContent>
            </Card>
          )}

          {/* No Content State */}
          {!content && !generating && (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <div className="text-6xl">🎯</div>
                <h3 className="text-xl font-semibold">No content generated yet</h3>
                <p className="text-muted-foreground">Click the button above to generate AI-powered sales content with professional flyer design</p>
              </CardContent>
            </Card>
          )}

          {/* Generating State */}
          {generating && (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-ghana-green" />
                <h3 className="text-xl font-semibold">Generating Content & Professional Flyer...</h3>
                <p className="text-muted-foreground">Creating customized content for Facebook, Instagram, WhatsApp, TikTok, and YouTube, plus designing your professional sales flyer with AI</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
