import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Menu,
  X,
  Search
} from "lucide-react";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationModal from "./NotificationModal";
import LegalSidebar from "./LegalSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ModernLayout({ children }: LayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const user = authService.getUser();
  const isMobile = useIsMobile();

  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((notif: any) => !notif.read).length : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72"
              >
                <LegalSidebar 
                  collapsed={false}
                  onToggle={() => setMobileSidebarOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
          <div className="fixed inset-y-0 left-0 z-30">
            <LegalSidebar 
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-300/20 shadow-2xl h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <Menu size={20} />
              </Button>
            )}
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 w-64 border border-purple-300/20">
              <Search className="text-purple-300 mr-2" size={18} />
              <input
                type="text"
                placeholder="Search cases, lawyers..."
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-purple-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="relative text-white hover:bg-white/10"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 text-white"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-purple-200 capitalize">{user?.role}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-purple-300/20">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}