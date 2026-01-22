import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, FileText, Search } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    case_number: '',
    title_ar: '',
    title_en: '',
    type: 'civil',
    court: '',
    priority: 'medium',
    plaintiff: '',
    defendant: '',
    description_ar: ''
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (error) {
      toast.error('فشل تحميل القضايا');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cases', formData);
      toast.success('تم إضافة القضية بنجاح');
      setShowDialog(false);
      fetchCases();
      setFormData({
        case_number: '',
        title_ar: '',
        title_en: '',
        type: 'civil',
        court: '',
        priority: 'medium',
        plaintiff: '',
        defendant: '',
        description_ar: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إضافة القضية');
    }
  };

  const filteredCases = cases.filter(c =>
    c.title_ar.includes(searchTerm) ||
    c.case_number.includes(searchTerm) ||
    c.plaintiff.includes(searchTerm) ||
    c.defendant.includes(searchTerm)
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  const getCaseTypeLabel = (type) => {
    const types = {
      'civil': 'مدني',
      'criminal': 'جنائي',
      'commercial': 'تجاري',
      'family': 'أحوال شخصية',
      'labor': 'عمالي'
    };
    return types[type] || type;
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar />
      
      <div className="flex-1 md:mr-64">
        <div className="p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="cases-heading">
                إدارة القضايا
              </h1>
              <p className="text-gray-400">عرض وإدارة جميع القضايا</p>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="add-case-button">
                  <Plus className="w-5 h-5 ml-2" />
                  قضية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111827] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white text-right" style={{ fontFamily: 'Cairo' }}>
                    إضافة قضية جديدة
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-right text-gray-300">رقم القضية</Label>
                      <Input
                        value={formData.case_number}
                        onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                        required
                        data-testid="case-number-input"
                      />
                    </div>
                    <div>
                      <Label className="text-right text-gray-300">نوع القضية</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="case-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-white/10">
                          <SelectItem value="civil">مدني</SelectItem>
                          <SelectItem value="criminal">جنائي</SelectItem>
                          <SelectItem value="commercial">تجاري</SelectItem>
                          <SelectItem value="family">أحوال شخصية</SelectItem>
                          <SelectItem value="labor">عمالي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">عنوان القضية (عربي)</Label>
                    <Input
                      value={formData.title_ar}
                      onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      required
                      data-testid="case-title-ar-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-right text-gray-300">المحكمة</Label>
                      <Input
                        value={formData.court}
                        onChange={(e) => setFormData({...formData, court: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                        required
                        data-testid="court-input"
                      />
                    </div>
                    <div>
                      <Label className="text-right text-gray-300">الأولوية</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="priority-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-white/10">
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-right text-gray-300">المدعي</Label>
                      <Input
                        value={formData.plaintiff}
                        onChange={(e) => setFormData({...formData, plaintiff: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                        required
                        data-testid="plaintiff-input"
                      />
                    </div>
                    <div>
                      <Label className="text-right text-gray-300">المدعى عليه</Label>
                      <Input
                        value={formData.defendant}
                        onChange={(e) => setFormData({...formData, defendant: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                        required
                        data-testid="defendant-input"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="submit-case-button">
                    إضافة القضية
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="بحث في القضايا..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-[#111827] border-white/10 text-white text-right"
                data-testid="search-cases-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
          ) : filteredCases.length === 0 ? (
            <Card className="bg-[#111827] border-white/5">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد قضايا</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4" data-testid="cases-list">
              {filteredCases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="bg-[#111827] border-white/5 hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  data-testid={`case-item-${caseItem.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2" style={{ fontFamily: 'Cairo' }}>
                          {caseItem.title_ar}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="number-input" style={{ fontFamily: 'Manrope' }}>
                            #{caseItem.case_number}
                          </span>
                          <span>{getCaseTypeLabel(caseItem.type)}</span>
                          <span className={getPriorityColor(caseItem.priority)}>
                            {getPriorityLabel(caseItem.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">المحكمة: </span>
                        <span className="text-white">{caseItem.court}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">المدعي: </span>
                        <span className="text-white">{caseItem.plaintiff}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">المدعى عليه: </span>
                        <span className="text-white">{caseItem.defendant}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cases;