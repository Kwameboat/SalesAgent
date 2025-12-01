import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSellerStore } from '@/stores/sellerStore';
import { Loader2 } from 'lucide-react';

const GHANA_CITIES = ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Sunyani', 'Koforidua', 'Ho', 'Wa'];
const TONES = ['Friendly', 'Professional', 'Energetic', 'Trustworthy'];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setSeller } = useSellerStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shopName: '',
    city: '',
    preferredTone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.shopName || !formData.city || !formData.preferredTone) {
      toast.error('Please fill all fields');
      return;
    }

    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);

    const { data: newSeller, error } = await supabase.from('sellers').insert({
      user_id: user.id,
      name: formData.name,
      phone: formData.phone,
      shop_name: formData.shopName,
      city: formData.city,
      preferred_tone: formData.preferredTone,
    }).select().single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      setSeller(newSeller);
      toast.success('Profile created!');
      navigate('/add-product');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set Up Your Shop</CardTitle>
          <CardDescription>Tell us about your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kwame Mensah"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., 0244123456"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="e.g., Mensah Fashion Store"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {GHANA_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Preferred Tone</Label>
              <Select value={formData.preferredTone} onValueChange={(value) => setFormData({ ...formData, preferredTone: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="How should your content sound?" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((tone) => (
                    <SelectItem key={tone} value={tone.toLowerCase()}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-ghana-green hover:bg-ghana-green/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
