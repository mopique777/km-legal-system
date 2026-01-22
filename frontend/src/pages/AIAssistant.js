import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Bot, Send, User } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-5.2');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: input,
        conversation_id: conversationId,
        provider: provider,
        model: model
      });

      if (!conversationId) {
        setConversationId(response.data.conversation_id);
      }

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل الحصول على رد');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (newProvider) => {
    setProvider(newProvider);
    if (newProvider === 'openai') {
      setModel('gpt-5.2');
    } else if (newProvider === 'gemini') {
      setModel('gemini-3-pro-preview');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19]" dir="rtl">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <div className="h-screen flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo' }} data-testid="ai-assistant-heading">
                  المساعد القانوني
                </h1>
                <p className="text-gray-400">مساعد ذكي متخصص في القانون الإماراتي</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={provider} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-40 bg-[#111827] border-white/10 text-white" data-testid="model-provider-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    <SelectItem value="openai">OpenAI GPT-5.2</SelectItem>
                    <SelectItem value="gemini">Gemini 3 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Cairo' }}>
                    مرحباً بك في المساعد القانوني
                  </h2>
                  <p className="text-gray-400 max-w-md mx-auto">
                    أنا مساعد قانوني متخصص في القانون الإماراتي. يمكنني مساعدتك في البحث عن المواد القانونية وصياغة المذكرات
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-start' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <User className="w-5 h-5 text-black" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <Card className={`flex-1 max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20'
                      : 'bg-[#111827] border-white/5'
                  }`}>
                    <CardContent className="p-4">
                      <p className="text-white whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3 justify-start" data-testid="loading-indicator">
                <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Card className="bg-[#111827] border-white/5">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك القانوني هنا..."
                className="flex-1 bg-[#111827] border-white/10 text-white text-right"
                disabled={loading}
                data-testid="message-input"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                data-testid="send-button"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;