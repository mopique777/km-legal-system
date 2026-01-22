import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Scale, LayoutDashboard, FileText, FileCheck, DollarSign, Bot, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', testId: 'dashboard-link' },
    { icon: FileText, label: 'القضايا', path: '/cases', testId: 'cases-link' },
    { icon: FileCheck, label: 'المستندات', path: '/documents', testId: 'documents-link' },
    { icon: DollarSign, label: 'الفواتير', path: '/invoices', testId: 'invoices-link' },
    { icon: Bot, label: 'المساعد القانوني', path: '/ai-assistant', testId: 'ai-assistant-link' },
    { icon: Settings, label: 'الإعدادات', path: '/settings', testId: 'settings-link' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-6">
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Logo" className="w-10 h-10 rounded" />
          ) : (
            <Scale className="w-10 h-10 text-[#D4AF37]" />
          )}
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo' }}>
              {company?.name_ar || 'LegalCore'}
            </h2>
            {company?.name_en && (
              <p className="text-xs text-gray-400" style={{ fontFamily: 'Manrope' }}>
                {company.name_en}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { navigate('/profile'); setMobileOpen(false); }} data-testid="profile-card">
          <Avatar data-testid="user-avatar">
            <AvatarImage src={user?.avatar_url || 'https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?crop=entropy&cs=srgb&fm=jpg&q=85'} />
            <AvatarFallback>{user?.full_name_ar?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white" data-testid="user-name">
              {user?.full_name_ar}
            </p>
            <p className="text-xs text-gray-400" data-testid="user-role">
              {user?.role === 'admin' ? 'مسؤول' : 'مستخدم'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              data-testid={item.testId}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5 ml-3" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block w-64 bg-[#0B0F19] border-l border-white/10 h-screen fixed right-0 top-0 z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Desktop Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed top-4 right-4 z-50 bg-[#111827] text-white hover:bg-[#1f2937] border border-white/10"
        size="icon"
        data-testid="desktop-menu-toggle"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-[#111827] text-white" data-testid="mobile-menu-button">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#0B0F19] p-0 border-white/10">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;