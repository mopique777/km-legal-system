import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [formData, setFormData] = useState({
    case_id: '',
    type: 'fees',
    amount: '',
    vat_percentage: 5,
    description_ar: '',
    due_date: ''
  });

  useEffect(() => {
    fetchCases();
    fetchAllInvoices();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases');
    }
  };

  const fetchAllInvoices = async () => {
    try {
      const casesResponse = await api.get('/cases');
      let allInvoices = [];
      for (const caseItem of casesResponse.data) {
        const invoicesResponse = await api.get(`/cases/${caseItem.id}/invoices`);
        allInvoices = [...allInvoices, ...invoicesResponse.data];
      }
      setInvoices(allInvoices);
    } catch (error) {
      toast.error('فشل تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        ...formData,
        amount: parseFloat(formData.amount),
        vat_percentage: parseFloat(formData.vat_percentage)
      });
      toast.success('تم إنشاء الفاتورة بنجاح');
      setShowDialog(false);
      fetchAllInvoices();
      setFormData({
        case_id: '',
        type: 'fees',
        amount: '',
        vat_percentage: 5,
        description_ar: '',
        due_date: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إنشاء الفاتورة');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partial': return 'دفع جزئي';
      case 'pending': return 'معلقة';
      default: return status;
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

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="invoices-heading">
                إدارة الفواتير
              </h1>
              <p className="text-gray-400">إنشاء ومتابعة الفواتير والمدفوعات</p>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="create-invoice-button">
                  <Plus className="w-5 h-5 ml-2" />
                  فاتورة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111827] border-white/10 max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white text-right" style={{ fontFamily: 'Cairo' }}>
                    إنشاء فاتورة جديدة
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-right text-gray-300">القضية</Label>
                    <select
                      value={formData.case_id}
                      onChange={(e) => setFormData({...formData, case_id: e.target.value})}
                      className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white text-right"
                      required
                      data-testid="invoice-case-select"
                    >
                      <option value="">اختر القضية</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id}>{c.title_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-right text-gray-300">نوع الفاتورة</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="invoice-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-white/10">
                          <SelectItem value="fees">أتعاب</SelectItem>
                          <SelectItem value="expenses">مصاريف</SelectItem>
                          <SelectItem value="receipt">إيصال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-right text-gray-300">المبلغ</Label>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-black/20 border-white/10 text-white number-input"
                        required
                        data-testid="amount-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الوصف</Label>
                    <Input
                      value={formData.description_ar}
                      onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      data-testid="description-input"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="submit-invoice-button">
                    إنشاء الفاتورة
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
          ) : invoices.length === 0 ? (
            <Card className="bg-[#111827] border-white/5">
              <CardContent className="py-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد فواتير</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4" data-testid="invoices-list">
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="bg-[#111827] border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                  data-testid={`invoice-item-${invoice.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2" style={{ fontFamily: 'Cairo' }}>
                          {getTypeLabel(invoice.type)}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="number-input" style={{ fontFamily: 'Manrope' }}>
                            #{invoice.invoice_number}
                          </span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invoice.status)}
                            <span>{getStatusLabel(invoice.status)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Manrope' }}>
                          {invoice.total_amount.toFixed(2)} AED
                        </div>
                        <div className="text-sm text-gray-400">
                          شامل ضريبة {invoice.vat_amount.toFixed(2)} AED
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {invoice.description_ar && (
                      <p className="text-gray-300 text-sm">{invoice.description_ar}</p>
                    )}
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

export default Invoices;