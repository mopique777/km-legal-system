import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileData, setProfileData] = useState({
    avatar_url: user?.avatar_url || '',
    full_name_ar: user?.full_name_ar || '',
    full_name_en: user?.full_name_en || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, profileData);
      toast.success('تم تحديث الملف الشخصي بنجاح');
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-6 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Cairo' }} data-testid="profile-heading">
            الملف الشخصي
          </h1>

          <div className="max-w-3xl">
            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Cairo' }}>
                  <User className="w-6 h-6 text-[#D4AF37]" />
                  معلومات الحساب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <Avatar className="w-32 h-32" data-testid="profile-avatar">
                      <AvatarImage src={profileData.avatar_url || 'https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?crop=entropy&cs=srgb&fm=jpg&q=85'} />
                      <AvatarFallback>{profileData.full_name_ar?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <Label className="text-right text-gray-300">رابط الصورة الشخصية</Label>
                      <Input
                        value={profileData.avatar_url}
                        onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                        placeholder="https://example.com/avatar.jpg"
                        data-testid="avatar-url-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الاسم الكامل (عربي)</Label>
                    <Input
                      value={profileData.full_name_ar}
                      onChange={(e) => setProfileData({...profileData, full_name_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      required
                      data-testid="fullname-ar-input"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الاسم الكامل (English)</Label>
                    <Input
                      value={profileData.full_name_en}
                      onChange={(e) => setProfileData({...profileData, full_name_en: e.target.value})}
                      className="bg-black/20 border-white/10 text-white"
                      placeholder="Full Name"
                      data-testid="fullname-en-input"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">البريد الإلكتروني</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-black/20 border-white/10 text-gray-400 text-right"
                      data-testid="email-display"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">لا يمكن تغيير البريد الإلكتروني</p>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الصلاحية</Label>
                    <Input
                      value={user?.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                      disabled
                      className="bg-black/20 border-white/10 text-gray-400 text-right"
                      data-testid="role-display"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                    data-testid="save-profile-button"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;