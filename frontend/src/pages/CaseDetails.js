import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowRight, Save, Trash2, FileText, Plus, Download, DollarSign } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

// Component for Sessions
const SessionForm = ({ caseId, onSuccess }) => {
  const [formData, setFormData] = useState({
    session_date: '',
    session_time: '',
    location: '',
    notes_ar: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sessions', { ...formData, case_id: caseId });
      toast.success('تم إضافة الجلسة بنجاح');
      onSuccess();
    } catch (error) {
      toast.error('فشل إضافة الجلسة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-right text-gray-300">تاريخ الجلسة</Label>
          <Input
            type="date"
            value={formData.session_date}
            onChange={(e) => setFormData({...formData, session_date: e.target.value})}
            className="bg-black/20 border-white/10 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-right text-gray-300">وقت الجلسة</Label>
          <Input
            type="time"
            value={formData.session_time}
            onChange={(e) => setFormData({...formData, session_time: e.target.value})}
            className="bg-black/20 border-white/10 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-right text-gray-300">المكان</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          className="bg-black/20 border-white/10 text-white text-right"
          required
        />
      </div>

      <div>
        <Label className="text-right text-gray-300">ملاحظات</Label>
        <Textarea
          value={formData.notes_ar}
          onChange={(e) => setFormData({...formData, notes_ar: e.target.value})}
          className="bg-black/20 border-white/10 text-white text-right"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]">
        {loading ? 'جاري الحفظ...' : 'إضافة الجلسة'}
      </Button>
    </form>
  );
};

const CaseSessions = ({ caseId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [caseId]);

  const fetchSessions = async () => {
    try {
      const response = await api.get(`/cases/${caseId}/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;
    
    try {
      await api.delete(`/sessions/${sessionId}`);
      toast.success('تم حذف الجلسة بنجاح');
      fetchSessions();
    } catch (error) {
      toast.error('فشل حذف الجلسة');
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setShowEditDialog(true);
  };

  const handleUpdate = async (formData) => {
    try {
      await api.put(`/sessions/${editingSession.id}`, formData);
      toast.success('تم تحديث الجلسة بنجاح');
      setShowEditDialog(false);
      setEditingSession(null);
      fetchSessions();
    } catch (error) {
      toast.error('فشل تحديث الجلسة');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'completed': return 'منتهية';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) return <p className="text-gray-400 text-center py-8">جاري التحميل...</p>;
  
  if (sessions.length === 0) {
    return <p className="text-gray-400 text-center py-8">لا توجد جلسات مسجلة</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-white font-semibold">{session.location}</h4>
                  <span className={`text-sm ${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📅 {new Date(session.session_date).toLocaleDateString('ar-AE')}</span>
                  {session.session_time && (
                    <span>🕐 {session.session_time}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(session)}
                  size="sm"
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                  data-testid={`edit-session-${session.id}`}
                >
                  تعديل
                </Button>
                <Button
                  onClick={() => handleDelete(session.id)}
                  size="sm"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  data-testid={`delete-session-${session.id}`}
                >
                  حذف
                </Button>
              </div>
            </div>
            {session.notes_ar && (
              <p className="text-sm text-gray-300 mt-2">{session.notes_ar}</p>
            )}
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#111827] border-white/10" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white text-right">تعديل الجلسة</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <SessionEditForm 
              session={editingSession} 
              onUpdate={handleUpdate}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Session Edit Form Component
const SessionEditForm = ({ session, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    session_date: session.session_date,
    session_time: session.session_time || '',
    location: session.location,
    notes_ar: session.notes_ar || '',
    status: session.status
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-right text-gray-300">تاريخ الجلسة</Label>
          <Input
            type="date"
            value={formData.session_date}
            onChange={(e) => setFormData({...formData, session_date: e.target.value})}
            className="bg-black/20 border-white/10 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-right text-gray-300">وقت الجلسة</Label>
          <Input
            type="time"
            value={formData.session_time}
            onChange={(e) => setFormData({...formData, session_time: e.target.value})}
            className="bg-black/20 border-white/10 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-right text-gray-300">المكان</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          className="bg-black/20 border-white/10 text-white text-right"
          required
        />
      </div>

      <div>
        <Label className="text-right text-gray-300">الحالة</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
          <SelectTrigger className="bg-black/20 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-white/10">
            <SelectItem value="scheduled">مجدولة</SelectItem>
            <SelectItem value="completed">منتهية</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-right text-gray-300">ملاحظات</Label>
        <Textarea
          value={formData.notes_ar}
          onChange={(e) => setFormData({...formData, notes_ar: e.target.value})}
          className="bg-black/20 border-white/10 text-white text-right"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" className="border-white/10 text-white">
          إلغاء
        </Button>
      </div>
    </form>
  );
};

// Component for Documents
const CaseDocuments = ({ caseId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/cases/${caseId}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('فشل تحميل المستند');
    }
  };

  if (loading) return <p className="text-gray-400 text-center py-8">جاري التحميل...</p>;
  
  if (documents.length === 0) {
    return <p className="text-gray-400 text-center py-8">لا توجد مستندات</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <div key={doc.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">{doc.title}</h4>
              <p className="text-sm text-gray-400">{doc.file_name}</p>
              <p className="text-xs text-gray-500">{(doc.file_size / 1024).toFixed(2)} KB</p>
            </div>
            <Button
              onClick={() => handleDownload(doc.id, doc.file_name)}
              size="sm"
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37]"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Component for Invoices
const CaseInvoices = ({ caseId }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [caseId]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get(`/cases/${caseId}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'fees': 'أتعاب',
      'expenses': 'مصاريف',
      'receipt': 'إيصال',
      'credit_note': 'إشعار دائن',
      'debit_note': 'إشعار مدين'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partial': return 'دفع جزئي';
      case 'pending': return 'معلقة';
      default: return status;
    }
  };

  if (loading) return <p className="text-gray-400 text-center py-8">جاري التحميل...</p>;
  
  if (invoices.length === 0) {
    return <p className="text-gray-400 text-center py-8">لا توجد فواتير</p>;
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div 
          key={invoice.id} 
          className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
          onClick={() => navigate(`/invoices/${invoice.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-white font-semibold">{getTypeLabel(invoice.type)}</h4>
                <span className="text-xs text-gray-400 number-input">#{invoice.invoice_number}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">{getStatusLabel(invoice.status)}</span>
                {invoice.description_ar && (
                  <span className="text-gray-500 text-xs">{invoice.description_ar}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[#D4AF37] number-input">
                {invoice.total_amount.toFixed(2)} AED
              </p>
              <p className="text-xs text-gray-400">شامل الضريبة</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    case_number: '',
    title_ar: '',
    title_en: '',
    type: 'civil',
    court: '',
    priority: 'medium',
    plaintiff: '',
    defendant: '',
    description_ar: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await api.get(`/cases/${id}`);
      setCaseData(response.data);
      setFormData({
        case_number: response.data.case_number,
        title_ar: response.data.title_ar,
        title_en: response.data.title_en || '',
        type: response.data.type,
        court: response.data.court,
        priority: response.data.priority,
        plaintiff: response.data.plaintiff,
        defendant: response.data.defendant,
        description_ar: response.data.description_ar || '',
        status: response.data.status || 'active'
      });
    } catch (error) {
      toast.error('فشل تحميل القضية');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/cases/${id}`, formData);
      toast.success('تم تحديث القضية بنجاح');
      setEditing(false);
      fetchCase();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل تحديث القضية');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القضية؟')) return;
    
    try {
      await api.delete(`/cases/${id}`);
      toast.success('تم حذف القضية بنجاح');
      navigate('/cases');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل حذف القضية');
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'closed': return 'مغلقة';
      case 'pending': return 'معلقة';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <div className="p-6 md:p-12 text-center text-gray-400">
            جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/cases')}
                className="text-gray-400 hover:text-white"
                data-testid="back-button"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="case-title">
                  {caseData?.title_ar}
                </h1>
                <p className="text-gray-400 number-input" style={{ fontFamily: 'Manrope' }}>
                  #{caseData?.case_number}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!editing ? (
                <>
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                    data-testid="edit-button"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    تعديل
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="delete-button"
                  >
                    <Trash2 className="w-5 h-5 ml-2" />
                    حذف
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleUpdate}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="save-button"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    حفظ
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      fetchCase();
                    }}
                    variant="outline"
                    className="border-white/10 text-white"
                    data-testid="cancel-button"
                  >
                    إلغاء
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-[#111827] border-white/10">
              <TabsTrigger value="details" data-testid="details-tab">بيانات القضية</TabsTrigger>
              <TabsTrigger value="sessions" data-testid="sessions-tab">الجلسات</TabsTrigger>
              <TabsTrigger value="documents" data-testid="documents-tab">المستندات</TabsTrigger>
              <TabsTrigger value="invoices" data-testid="invoices-tab">الفواتير</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="bg-[#111827] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                    <FileText className="w-6 h-6 inline ml-2 text-[#D4AF37]" />
                    معلومات القضية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-right text-gray-300">رقم القضية</Label>
                          <Input
                            value={formData.case_number}
                            onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                            className="bg-black/20 border-white/10 text-white text-right"
                            required
                          />
                        </div>

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
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-right text-gray-300">المحكمة</Label>
                          <Input
                            value={formData.court}
                            onChange={(e) => setFormData({...formData, court: e.target.value})}
                            className="bg-black/20 border-white/10 text-white text-right"
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-right text-gray-300">الأولوية</Label>
                          <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111827] border-white/10">
                              <SelectItem value="high">عالية</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="low">منخفضة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-right text-gray-300">المدعي</Label>
                          <Input
                            value={formData.plaintiff}
                            onChange={(e) => setFormData({...formData, plaintiff: e.target.value})}
                            className="bg-black/20 border-white/10 text-white text-right"
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-right text-gray-300">المدعى عليه</Label>
                          <Input
                            value={formData.defendant}
                            onChange={(e) => setFormData({...formData, defendant: e.target.value})}
                            className="bg-black/20 border-white/10 text-white text-right"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-right text-gray-300">عنوان القضية (عربي)</Label>
                        <Input
                          value={formData.title_ar}
                          onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                          className="bg-black/20 border-white/10 text-white text-right"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-right text-gray-300">الوصف</Label>
                        <Textarea
                          value={formData.description_ar}
                          onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                          className="bg-black/20 border-white/10 text-white text-right min-h-[120px]"
                        />
                      </div>

                      <div>
                        <Label className="text-right text-gray-300">حالة القضية</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                          <SelectTrigger className="bg-black/20 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111827] border-white/10">
                            <SelectItem value="active">نشطة</SelectItem>
                            <SelectItem value="pending">معلقة</SelectItem>
                            <SelectItem value="closed">مغلقة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">نوع القضية</p>
                          <p className="text-white text-lg">{getCaseTypeLabel(caseData?.type)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">المحكمة</p>
                          <p className="text-white text-lg">{caseData?.court}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">الأولوية</p>
                          <p className="text-white text-lg">{getPriorityLabel(caseData?.priority)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">الحالة</p>
                          <p className="text-white text-lg">{getStatusLabel(caseData?.status)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">المدعي</p>
                          <p className="text-white text-lg">{caseData?.plaintiff}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">المدعى عليه</p>
                          <p className="text-white text-lg">{caseData?.defendant}</p>
                        </div>
                      </div>

                      {caseData?.description_ar && (
                        <div>
                          <p className="text-gray-400 text-sm mb-2">الوصف</p>
                          <p className="text-white leading-relaxed">{caseData.description_ar}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="mt-6">
              <Card className="bg-[#111827] border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                      الجلسات والمواعيد
                    </CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة جلسة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#111827] border-white/10" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-white text-right">إضافة جلسة جديدة</DialogTitle>
                        </DialogHeader>
                        <SessionForm caseId={id} onSuccess={() => window.location.reload()} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <CaseSessions caseId={id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="bg-[#111827] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                    مستندات القضية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CaseDocuments caseId={id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              <Card className="bg-[#111827] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: 'Cairo' }}>
                    فواتير القضية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CaseInvoices caseId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
