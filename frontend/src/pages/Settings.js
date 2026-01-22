import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Palette, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const Settings = () => {
  const { user, company, checkAuth } = useAuth();
  const [companyData, setCompanyData] = useState({
    name_ar: '',
    name_en: '',
    logo_url: '',
    primary_color: '#D4AF37',
    secondary_color: '#334155'
  });
  const [apiKeys, setApiKeys] = useState({
    openai_key: '',
    gemini_key: '',
    google_drive_client_id: '',
    google_drive_client_secret: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    if (company) {
      setCompanyData({
        name_ar: company.name_ar || '',
        name_en: company.name_en || '',
        logo_url: company.logo_url || '',
        primary_color: company.primary_color || '#D4AF37',
        secondary_color: company.secondary_color || '#334155'
      });
    }
    fetchApiKeys();
  }, [company]);

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/settings/api-keys');
      setApiKeys(response.data);
    } catch (error) {
      console.error('Failed to fetch API keys');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      toast.error('فقط المسؤولين يمكنهم تعديل الإعدادات');
      return;
    }

    setLoading(true);
    try {
      if (company) {
        await api.put(`/companies/${company.id}`, companyData);
        toast.success('تم تحديث الإعدادات بنجاح');
      } else {
        await api.post('/companies', companyData);
        toast.success('تم إنشاء ملف الشركة بنجاح');
      }
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل التحديث');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeysSubmit = async (e) => {
    e.preventDefault();
    setLoadingKeys(true);
    try {
      await api.post('/settings/api-keys', apiKeys);
      toast.success('تم حفظ مفاتيح API بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل حفظ المفاتيح');
    } finally {
      setLoadingKeys(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Cairo' }} data-testid="settings-heading">
            الإعدادات
          </h1>

          <div className="max-w-3xl">
            <Card className="bg-[#111827] border-white/5 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Cairo' }}>
                  <Building2 className="w-6 h-6 text-[#D4AF37]" />
                  معلومات الشركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="text-right text-gray-300">اسم الشركة (عربي)</Label>
                    <Input
                      value={companyData.name_ar}
                      onChange={(e) => setCompanyData({...companyData, name_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      required
                      data-testid="company-name-ar-input"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">اسم الشركة (English)</Label>
                    <Input
                      value={companyData.name_en}
                      onChange={(e) => setCompanyData({...companyData, name_en: e.target.value})}
                      className="bg-black/20 border-white/10 text-white"
                      placeholder="Company Name"
                      data-testid="company-name-en-input"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">رابط الشعار (Logo URL)</Label>
                    <Input
                      value={companyData.logo_url}
                      onChange={(e) => setCompanyData({...companyData, logo_url: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      placeholder="https://example.com/logo.png"
                      data-testid="logo-url-input"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || user?.role !== 'admin'}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                    data-testid="save-settings-button"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Cairo' }}>
                  <Palette className="w-6 h-6 text-[#D4AF37]" />
                  معلومات المستخدم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-right text-gray-300">البريد الإلكتروني</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-black/20 border-white/10 text-gray-400 text-right"
                      data-testid="user-email-display"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الاسم الكامل</Label>
                    <Input
                      value={user?.full_name_ar || ''}
                      disabled
                      className="bg-black/20 border-white/10 text-gray-400 text-right"
                      data-testid="user-fullname-display"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الصلاحية</Label>
                    <Input
                      value={user?.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                      disabled
                      className="bg-black/20 border-white/10 text-gray-400 text-right"
                      data-testid="user-role-display"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;