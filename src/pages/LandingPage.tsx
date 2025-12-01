import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, TrendingUp, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ghana-gold/10 border border-ghana-gold/20">
            <Sparkles className="w-4 h-4 text-ghana-gold" />
            <span className="text-sm font-medium text-foreground">AI-Powered Sales Assistant for Ghana</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-balance">
            Your Personal{' '}
            <span className="bg-ghana-gradient bg-clip-text text-transparent">
              Sales Agent
            </span>
            {' '}for Small Business
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop wasting time creating posts. Get daily Facebook captions, WhatsApp status lines, 
            customer replies, and sales strategies—all generated automatically for your products.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-ghana-green hover:bg-ghana-green/90 text-white"
              onClick={() => navigate('/auth')}
            >
              Start Free Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-3 animate-fade-in">
            <div className="w-12 h-12 bg-ghana-green/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-ghana-green" />
            </div>
            <h3 className="font-semibold text-lg">Daily Content Generated</h3>
            <p className="text-muted-foreground text-sm">
              Wake up to fresh Facebook posts, WhatsApp status updates, and customer reply scripts—ready to copy and use.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-3 animate-fade-in delay-100">
            <div className="w-12 h-12 bg-ghana-gold/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-ghana-gold" />
            </div>
            <h3 className="font-semibold text-lg">Sales Strategies</h3>
            <p className="text-muted-foreground text-sm">
              Get weekly mini strategies tailored to your products, with tips on MoMo promos, urgency, and trust-building.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-3 animate-fade-in delay-200">
            <div className="w-12 h-12 bg-ghana-red/10 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-ghana-red" />
            </div>
            <h3 className="font-semibold text-lg">Zero Effort Setup</h3>
            <p className="text-muted-foreground text-sm">
              Just tell us what you sell. The AI handles everything—creating posts, scheduling reminders, and tracking insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
