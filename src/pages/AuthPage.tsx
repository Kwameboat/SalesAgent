import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Check your email for the verification code');
      setStep('otp');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else if (data.user) {
      // Check if user already has a password (existing user)
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        login({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.email!.split('@')[0],
        });
        navigate('/onboarding');
      } else {
        setStep('password');
        setLoading(false);
      }
    }
  };

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const username = email.split('@')[0];
    const { error } = await supabase.auth.updateUser({
      password,
      data: { username },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        login({
          id: user.id,
          email: user.email!,
          username,
        });
        navigate('/onboarding');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghana-green/5 via-background to-ghana-gold/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to SalesAgent</CardTitle>
          <CardDescription>Your Ghanaian marketing assistant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' && (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button 
                className="w-full bg-ghana-green hover:bg-ghana-green/90"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <Input
                type="text"
                placeholder="Enter 4-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                maxLength={4}
              />
              <Button 
                className="w-full bg-ghana-green hover:bg-ghana-green/90"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
              </Button>
            </>
          )}

          {step === 'password' && (
            <>
              <Input
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button 
                className="w-full bg-ghana-green hover:bg-ghana-green/90"
                onClick={handleSetPassword}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useAuthStore } from '@/stores/authStore';
