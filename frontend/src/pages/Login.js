import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1671722294182-ed01cbe66bd1?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Legal Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
        <div className="absolute bottom-12 right-12 text-white">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Cairo' }}>
            KM Legal System
          </h1>
          <p className="text-xl text-gray-200">نظام إدارة قانوني احترافي</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0B0F19] p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Scale className="w-10 h-10 text-[#D4AF37]" />
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Cairo' }}>
              KM Legal System
            </h2>
          </div>

          <div className="glass-effect rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-6 text-white text-center" style={{ fontFamily: 'Cairo' }}>
              تسجيل الدخول
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-right block mb-2 text-gray-300">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border-white/10 text-white text-right"
                  placeholder="example@email.com"
                  required
                  data-testid="email-input"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-right block mb-2 text-gray-300">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border-white/10 text-white text-right"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)] mt-6"
                data-testid="login-button"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                ليس لديك حساب؟{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-[#D4AF37] hover:text-[#B5952F] font-semibold"
                  data-testid="register-link"
                >
                  إنشاء حساب
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;