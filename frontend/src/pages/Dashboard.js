import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, company } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي القضايا',
      value: stats?.total_cases || 0,
      icon: FileText,
      color: 'text-blue-500',
      testId: 'total-cases-stat'
    },
    {
      title: 'القضايا النشطة',
      value: stats?.active_cases || 0,
      icon: Clock,
      color: 'text-[#D4AF37]',
      testId: 'active-cases-stat'
    },
    {
      title: 'الفواتير المعلقة',
      value: stats?.pending_invoices || 0,
      icon: DollarSign,
      color: 'text-yellow-500',
      testId: 'pending-invoices-stat'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${(stats?.total_revenue || 0).toLocaleString('en-US')} AED`,
      icon: TrendingUp,
      color: 'text-green-500',
      testId: 'total-revenue-stat'
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="welcome-heading">
              مرحباً {user?.full_name_ar}
            </h1>
            <p className="text-gray-400">
              إليك نظرة عامة على نظامك القانوني
            </p>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-grid">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="bg-[#111827] border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                    data-testid={stat.testId}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">لا توجد أنشطة حديثة</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                  الجلسات القادمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">لا توجد جلسات مجدولة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;