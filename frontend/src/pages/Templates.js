import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { FileText, Plus, Copy, Download } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const Templates = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  const [formData, setFormData] = useState({
    type: 'civil',
    title_ar: '',
    content_ar: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error('فشل تحميل القوالب');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/templates', formData);
      toast.success('تم إضافة القالب بنجاح');
      setShowDialog(false);
      fetchTemplates();
      setFormData({ type: 'civil', title_ar: '', content_ar: '' });
    } catch (error) {
      toast.error('فشل إضافة القالب');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('تم نسخ القالب');
  };

  const getTypeLabel = (type) => {
    const types = {
      'civil': 'مدني',
      'criminal': 'جنائي',
      'commercial': 'تجاري',
      'family': 'أحوال شخصية',
      'labor': 'عمالي',
      'general': 'عام'
    };
    return types[type] || type;
  };

  const defaultTemplates = [
    {
      id: 'default-1',
      type: 'civil',
      title_ar: 'مذكرة دفاع مدني - نموذج أساسي',
      content_ar: `بسم الله الرحمن الرحيم

مذكرة دفاع

المقدمة من: [اسم المدعى عليه]
بصفته: [الصفة]
ضد: [اسم المدعي]
في الدعوى رقم: [رقم الدعوى]

السيد القاضي المحترم،

الوقائع:
[اذكر وقائع القضية بالتفصيل]

الدفوع:
1. الدفع بعدم الاختصاص
[التفاصيل]

2. الدفع الموضوعي
[التفاصيل]

السند القانوني:
- المادة [رقم المادة] من القانون الاتحادي رقم [رقم القانون]
[نص المادة]

الطلبات:
نلتمس من عدالتكم:
1. قبول الدفع شكلاً
2. في الموضوع: رفض الدعوى
3. إلزام المدعي بالمصروفات وأتعاب المحاماة

وكيل المدعى عليه
[الاسم والتوقيع]`
    },
    {
      id: 'default-2',
      type: 'commercial',
      title_ar: 'صحيفة دعوى تجارية',
      content_ar: `بسم الله الرحمن الرحيم

صحيفة دعوى تجارية

المدعي: [الاسم]
الصفة: [التاجر/الشركة]
المدعى عليه: [الاسم]

وقائع الدعوى:
[تفصيل الوقائع التجارية]

أسانيد الدعوى:
1. عقد البيع التجاري المؤرخ في [التاريخ]
2. الفواتير التجارية
3. المراسلات البنكية

السند القانوني:
- قانون المعاملات التجارية الاتحادي رقم 18 لسنة 1993
- المواد ذات الصلة من قانون المعاملات المدنية

الطلبات:
1. إلزام المدعى عليه بأداء مبلغ [المبلغ] درهم
2. الفائدة القانونية
3. المصروفات وأتعاب المحاماة

المدعي
[الاسم والتوقيع]`
    },
    {
      id: 'default-3',
      type: 'labor',
      title_ar: 'شكوى عمالية',
      content_ar: `بسم الله الرحمن الرحيم

شكوى عمالية

المشتكي: [اسم العامل]
رقم الإقامة: [رقم الإقامة]
ضد: [اسم صاحب العمل/الشركة]

موضوع الشكوى:
[تفصيل موضوع الشكوى]

التفاصيل:
- تاريخ التعيين: [التاريخ]
- المسمى الوظيفي: [المسمى]
- الراتب الأساسي: [المبلغ]
- مدة الخدمة: [المدة]

المطالب:
1. مستحقات نهاية الخدمة
2. الرواتب المتأخرة
3. بدل الإجازات
4. تذكرة العودة
5. أي مستحقات أخرى

السند القانوني:
- قانون العمل الاتحادي رقم 8 لسنة 1980 وتعديلاته
- قرارات وزارة الموارد البشرية

المشتكي
[الاسم والتوقيع]`
    },
    {
      id: 'default-4',
      type: 'family',
      title_ar: 'دعوى أحوال شخصية',
      content_ar: `بسم الله الرحمن الرحيم

دعوى أحوال شخصية

المدعي: [الاسم]
الصفة: [الزوج/الزوجة/الولي]
المدعى عليه: [الاسم]

موضوع الدعوى:
[تحديد الموضوع: طلاق، نفقة، حضانة، إلخ]

الوقائع:
[سرد الوقائع]

المستندات:
1. عقد الزواج
2. وثيقة الطلاق (إن وجدت)
3. شهادات الميلاد
4. [مستندات أخرى]

السند الشرعي والقانوني:
- قانون الأحوال الشخصية الاتحادي رقم 28 لسنة 2005
- الآيات والأحاديث ذات الصلة

الطلبات:
[تفصيل الطلبات]

المدعي
[الاسم والتوقيع]`
    }
  ];

  const allTemplates = [...defaultTemplates, ...templates];
  const filteredTemplates = selectedType === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.type === selectedType);

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="templates-heading">
                قوالب المذكرات القانونية
              </h1>
              <p className="text-gray-400">مكتبة قوالب جاهزة لجميع أنواع القضايا</p>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="add-template-button">
                  <Plus className="w-5 h-5 ml-2" />
                  قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111827] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white text-right" style={{ fontFamily: 'Cairo' }}>
                    إضافة قالب جديد
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-right text-gray-300">نوع القضية</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger className="bg-black/20 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-white/10">
                        <SelectItem value="civil">مدني</SelectItem>
                        <SelectItem value="criminal">جنائي</SelectItem>
                        <SelectItem value="commercial">تجاري</SelectItem>
                        <SelectItem value="family">أحوال شخصية</SelectItem>
                        <SelectItem value="labor">عمالي</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">عنوان القالب</Label>
                    <Input
                      value={formData.title_ar}
                      onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">محتوى القالب</Label>
                    <Textarea
                      value={formData.content_ar}
                      onChange={(e) => setFormData({...formData, content_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right min-h-[300px] font-mono"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]">
                    إضافة القالب
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-64 bg-[#111827] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-white/10">
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="civil">مدني</SelectItem>
                <SelectItem value="criminal">جنائي</SelectItem>
                <SelectItem value="commercial">تجاري</SelectItem>
                <SelectItem value="family">أحوال شخصية</SelectItem>
                <SelectItem value="labor">عمالي</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="templates-list">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-[#111827] border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                  data-testid={`template-${template.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-[#D4AF37]" />
                          <span className="text-sm text-gray-400">{getTypeLabel(template.type)}</span>
                        </div>
                        <CardTitle className="text-white text-lg" style={{ fontFamily: 'Cairo' }}>
                          {template.title_ar}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black/20 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {template.content_ar.substring(0, 300)}...
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopy(template.content_ar)}
                        className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 ml-2" />
                        نسخ القالب
                      </Button>
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

export default Templates;
