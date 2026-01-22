import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, FileText, Download, Search } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadData, setUploadData] = useState({
    case_id: '',
    title: ''
  });

  useEffect(() => {
    fetchCases();
    fetchAllDocuments();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases');
    }
  };

  const fetchAllDocuments = async () => {
    try {
      const casesResponse = await api.get('/cases');
      let allDocs = [];
      for (const caseItem of casesResponse.data) {
        const docsResponse = await api.get(`/cases/${caseItem.id}/documents`);
        allDocs = [...allDocs, ...docsResponse.data];
      }
      setDocuments(allDocs);
    } catch (error) {
      toast.error('فشل تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('الرجاء اختيار ملف');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('case_id', uploadData.case_id);
    formData.append('title', uploadData.title);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('تم رفع المستند بنجاح');
      setShowDialog(false);
      fetchAllDocuments();
      setUploadData({ case_id: '', title: '' });
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل رفع المستند');
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

  const filteredDocuments = documents.filter(d =>
    d.title.includes(searchTerm) || d.file_name.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="documents-heading">
                إدارة المستندات
              </h1>
              <p className="text-gray-400">رفع وإدارة مستندات القضايا</p>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="upload-document-button">
                  <Plus className="w-5 h-5 ml-2" />
                  رفع مستند
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111827] border-white/10 max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white text-right" style={{ fontFamily: 'Cairo' }}>
                    رفع مستند جديد
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-right text-gray-300">القضية</Label>
                    <select
                      value={uploadData.case_id}
                      onChange={(e) => setUploadData({...uploadData, case_id: e.target.value})}
                      className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white text-right"
                      required
                      data-testid="case-select"
                    >
                      <option value="">اختر القضية</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id}>{c.title_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">عنوان المستند</Label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                      className="bg-black/20 border-white/10 text-white text-right"
                      required
                      data-testid="document-title-input"
                    />
                  </div>

                  <div>
                    <Label className="text-right text-gray-300">الملف</Label>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="bg-black/20 border-white/10 text-white"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      required
                      data-testid="file-input"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid="submit-document-button">
                    رفع المستند
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
                placeholder="بحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-[#111827] border-white/10 text-white text-right"
                data-testid="search-documents-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="bg-[#111827] border-white/5">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد مستندات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="documents-list">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="bg-[#111827] border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                  data-testid={`document-item-${doc.id}`}
                >
                  <CardHeader>
                    <CardTitle className="text-white text-lg" style={{ fontFamily: 'Cairo' }}>
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">اسم الملف: </span>
                        <span className="text-white">{doc.file_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">الحجم: </span>
                        <span className="text-white">{(doc.file_size / 1024).toFixed(2)} KB</span>
                      </div>
                      <Button
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                        data-testid={`download-button-${doc.id}`}
                      >
                        <Download className="w-4 h-4 ml-2" />
                        تحميل
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

export default Documents;