import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name_ar: '',
    full_name_en: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إنشاء الحساب');
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
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0B0F19] p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Scale className="w-10 h-10 text-[#D4AF37]" />
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Cairo' }}>
              LegalCore
            </h2>
          </div>

          <div className="glass-effect rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-6 text-white text-center" style={{ fontFamily: 'Cairo' }}>
              إنشاء حساب جديد
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name_ar" className="text-right block mb-2 text-gray-300">
                  الاسم الكامل (عربي)
                </Label>
                <Input
                  id="full_name_ar"
                  name="full_name_ar"
                  value={formData.full_name_ar}
                  onChange={handleChange}
                  className="w-full bg-black/20 border-white/10 text-white text-right"
                  required
                  data-testid="full-name-ar-input"
                />
              </div>

              <div>
                <Label htmlFor="full_name_en" className="text-right block mb-2 text-gray-300">
                  الاسم الكامل (English)
                </Label>
                <Input
                  id="full_name_en"
                  name="full_name_en"
                  value={formData.full_name_en}
                  onChange={handleChange}
                  className="w-full bg-black/20 border-white/10 text-white"
                  placeholder="Full Name"
                  data-testid="full-name-en-input"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-right block mb-2 text-gray-300">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black/20 border-white/10 text-white text-right"
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black/20 border-white/10 text-white text-right"
                  required
                  data-testid="password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)] mt-6"
                data-testid="register-button"
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                لديك حساب بالفعل؟{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#D4AF37] hover:text-[#B5952F] font-semibold"
                  data-testid="login-link"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;