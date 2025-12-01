import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, Package, FileText, Calendar } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface InsightsData {
  stats: {
    productCount: number;
    contentCount: number;
    daysSincePost: number | null;
    lastPostedAt: string | null;
  };
  insights: {
    summary: string;
    strength: string;
    improvement: string;
    action: string;
  };
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const { data: insightsData, error } = await supabase.functions.invoke('generate-insights');

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to load insights'}`;
          }
        }
        toast.error(errorMessage);
      } else {
        setData(insightsData);
      }

      setLoading(false);
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ghana-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">Your Business Insights</h1>

        {data && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.stats.productCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Content Sets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.stats.contentCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last Posted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {data.stats.daysSincePost !== null ? `${data.stats.daysSincePost}d` : 'Never'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-ghana-green" />
                  AI Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{data.insights.summary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">✅ Strength</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">{data.insights.strength}</p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">💡 Improvement</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{data.insights.improvement}</p>
                  </div>
                </div>

                <div className="p-4 bg-ghana-green/10 rounded-lg border border-ghana-green/20">
                  <h4 className="font-semibold text-ghana-green mb-1">🎯 Action This Week</h4>
                  <p className="text-sm">{data.insights.action}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
