import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowRight, Save, Trash2, DollarSign, Plus, FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'fees',
    amount: '',
    vat_percentage: 5,
    description_ar: '',
    due_date: '',
    status: 'pending'
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchInvoice();
    fetchPayments();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      // Get all cases first
      const casesResponse = await api.get('/cases');
      if (!casesResponse.data || casesResponse.data.length === 0) {
        toast.error('لا توجد قضايا');
        navigate('/invoices');
        return;
      }

      let foundInvoice = null;
      let foundCaseId = null;
      
      // Search through all cases for the invoice
      for (const caseItem of casesResponse.data) {
        try {
          const invoicesResponse = await api.get(`/cases/${caseItem.id}/invoices`);
          if (invoicesResponse.data && Array.isArray(invoicesResponse.data)) {
            const inv = invoicesResponse.data.find(invoice => invoice.id === id);
            if (inv) {
              foundInvoice = inv;
              foundCaseId = caseItem.id;
              break;
            }
          }
        } catch (err) {
          console.error(`Error fetching invoices for case ${caseItem.id}:`, err);
        }
      }

      if (!foundInvoice) {
        toast.error('الفاتورة غير موجودة');
        navigate('/invoices');
        return;
      }

      foundInvoice.case_id = foundCaseId;
      setInvoice(foundInvoice);
      
      setFormData({
        type: foundInvoice.type || 'fees',
        amount: foundInvoice.amount || 0,
        vat_percentage: foundInvoice.amount > 0 ? ((foundInvoice.vat_amount || 0) / foundInvoice.amount) * 100 : 5,
        description_ar: foundInvoice.description_ar || '',
        due_date: foundInvoice.due_date || '',
        status: foundInvoice.status || 'pending'
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('فشل تحميل الفاتورة');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const casesResponse = await api.get('/cases');
      if (!casesResponse.data || casesResponse.data.length === 0) {
        return;
      }

      let allPayments = [];
      
      for (const caseItem of casesResponse.data) {
        try {
          const paymentsResponse = await api.get(`/cases/${caseItem.id}/payments`);
          if (paymentsResponse.data && Array.isArray(paymentsResponse.data)) {
            const invoicePayments = paymentsResponse.data.filter(p => p.invoice_id === id);
            allPayments = [...allPayments, ...invoicePayments];
          }
        } catch (err) {
          console.error(`Error fetching payments for case ${caseItem.id}:`, err);
        }
      }
      
      setPayments(allPayments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!invoice || !invoice.case_id) {
      toast.error('معلومات الفاتورة غير كاملة');
      return;
    }

    try {
      const updatePayload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        vat_percentage: parseFloat(formData.vat_percentage),
        description_ar: formData.description_ar,
        due_date: formData.due_date,
        status: formData.status
      };
      
      // Validate data
      if (isNaN(updatePayload.amount) || updatePayload.amount <= 0) {
        toast.error('المبلغ غير صحيح');
        return;
      }
      
      await api.put(`/invoices/${id}`, updatePayload);
      toast.success('تم تحديث الفاتورة بنجاح');
      setEditing(false);
      fetchInvoice();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث الفاتورة');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('تم حذف الفاتورة بنجاح');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل حذف الفاتورة');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/invoices/${id}`, newStatus);
      toast.success('تم تحديث حالة الفاتورة');
      fetchInvoice();
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        invoice_id: id,
        case_id: invoice.case_id,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        notes: paymentData.notes
      });
      
      toast.success('تم إضافة الدفعة بنجاح');
      setShowPaymentDialog(false);
      setPaymentData({ amount: '', method: 'cash', notes: '' });
      fetchInvoice();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إضافة الدفعة');
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
      case 'cancelled': return 'ملغاة';
      default: return status;
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

  const getMethodLabel = (method) => {
    const methods = {
      'cash': 'نقداً',
      'bank_transfer': 'تحويل بنكي',
      'check': 'شيك',
      'credit_card': 'بطاقة ائتمان'
    };
    return methods[method] || method;
  };

  const totalPaid = payments && Array.isArray(payments) ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
  const remaining = invoice && invoice.total_amount ? invoice.total_amount - totalPaid : 0;

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
                onClick={() => navigate('/invoices')}
                className="text-gray-400 hover:text-white"
                data-testid="back-button"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }}>
                  {getTypeLabel(invoice?.type)}
                </h1>
                <p className="text-gray-400 number-input" style={{ fontFamily: 'Manrope' }}>
                  #{invoice?.invoice_number}
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
                      fetchInvoice();
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-[#111827] border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">المبلغ الإجمالي</p>
                    <p className="text-3xl font-bold text-white number-input" style={{ fontFamily: 'Manrope' }}>
                      {invoice?.total_amount.toFixed(2)} AED
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-[#D4AF37]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">المدفوع</p>
                    <p className="text-3xl font-bold text-green-500 number-input" style={{ fontFamily: 'Manrope' }}>
                      {totalPaid.toFixed(2)} AED
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">المتبقي</p>
                    <p className={`text-3xl font-bold number-input ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`} style={{ fontFamily: 'Manrope' }}>
                      {remaining.toFixed(2)} AED
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <XCircle className="w-10 h-10 text-red-500" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Cairo' }}>
                  <FileText className="w-6 h-6 text-[#D4AF37]" />
                  تفاصيل الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <Label className="text-right text-gray-300">نوع الفاتورة</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
                      <Label className="text-right text-gray-300">المبلغ قبل الضريبة</Label>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-black/20 border-white/10 text-white number-input"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-right text-gray-300">نسبة الضريبة (%)</Label>
                      <Input
                        type="number"
                        value={formData.vat_percentage}
                        onChange={(e) => setFormData({...formData, vat_percentage: e.target.value})}
                        className="bg-black/20 border-white/10 text-white number-input"
                      />
                    </div>

                    <div>
                      <Label className="text-right text-gray-300">الوصف</Label>
                      <Input
                        value={formData.description_ar}
                        onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                        className="bg-black/20 border-white/10 text-white text-right"
                      />
                    </div>

                    <div>
                      <Label className="text-right text-gray-300">تاريخ الاستحقاق</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="bg-black/20 border-white/10 text-white"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-gray-400">الحالة</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice?.status)}
                        <span className="text-white font-semibold">{getStatusLabel(invoice?.status)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-gray-400">المبلغ</span>
                      <span className="text-white font-semibold number-input">{invoice?.amount.toFixed(2)} AED</span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-gray-400">الضريبة</span>
                      <span className="text-white font-semibold number-input">{invoice?.vat_amount.toFixed(2)} AED</span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-gray-400">الإجمالي</span>
                      <span className="text-[#D4AF37] font-bold text-xl number-input">{invoice?.total_amount.toFixed(2)} AED</span>
                    </div>

                    {invoice?.description_ar && (
                      <div className="pt-3">
                        <p className="text-gray-400 text-sm mb-2">الوصف</p>
                        <p className="text-white">{invoice.description_ar}</p>
                      </div>
                    )}

                    {invoice?.due_date && (
                      <div className="pt-3">
                        <p className="text-gray-400 text-sm mb-2">تاريخ الاستحقاق</p>
                        <p className="text-white">{new Date(invoice.due_date).toLocaleDateString('ar-AE')}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Cairo' }}>
                    <DollarSign className="w-6 h-6 text-[#D4AF37]" />
                    سجل الدفعات
                  </CardTitle>
                  
                  {remaining > 0 && (
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" data-testid="add-payment-button">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة دفعة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#111827] border-white/10" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-white text-right" style={{ fontFamily: 'Cairo' }}>
                            إضافة دفعة جديدة
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
                          <div>
                            <Label className="text-right text-gray-300">المبلغ</Label>
                            <Input
                              type="number"
                              value={paymentData.amount}
                              onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                              className="bg-black/20 border-white/10 text-white number-input"
                              placeholder={`المتبقي: ${remaining.toFixed(2)} AED`}
                              max={remaining}
                              required
                              data-testid="payment-amount-input"
                            />
                          </div>

                          <div>
                            <Label className="text-right text-gray-300">طريقة الدفع</Label>
                            <Select value={paymentData.method} onValueChange={(v) => setPaymentData({...paymentData, method: v})}>
                              <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="payment-method-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#111827] border-white/10">
                                <SelectItem value="cash">نقداً</SelectItem>
                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                <SelectItem value="check">شيك</SelectItem>
                                <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-right text-gray-300">ملاحظات</Label>
                            <Input
                              value={paymentData.notes}
                              onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                              className="bg-black/20 border-white/10 text-white text-right"
                              data-testid="payment-notes-input"
                            />
                          </div>

                          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" data-testid="submit-payment-button">
                            إضافة الدفعة
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">لا توجد دفعات</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div key={payment.id} className="p-4 bg-white/5 rounded-lg border border-white/10" data-testid={`payment-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#D4AF37] font-bold number-input" style={{ fontFamily: 'Manrope' }}>
                            {payment.amount.toFixed(2)} AED
                          </span>
                          <span className="text-gray-400 text-sm">
                            {new Date(payment.payment_date).toLocaleDateString('ar-AE')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{getMethodLabel(payment.method)}</span>
                          {payment.notes && (
                            <span className="text-gray-500">{payment.notes}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
