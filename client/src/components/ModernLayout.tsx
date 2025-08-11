import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Bell, 
  ChevronDown, 
  Settings,
  Menu,
  X,
  Home
} from "lucide-react";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationModal from "./NotificationModal";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ModernLayout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = authService.getUser();
  const isMobile = useIsMobile();

  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((notif: any) => !notif.read).length : 0;

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getSidebarItems = () => {
    const baseItems = [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-600" },
      { path: "/cases", icon: FolderOpen, label: "Cases", color: "text-green-600" },
      { path: "/calendar", icon: Calendar, label: "Calendar", color: "text-purple-600" },
    ];

    if (user?.role === 'client') {
      return [
        ...baseItems,
        { path: "/find-lawyers", icon: Users, label: "Find Lawyers", color: "text-orange-600" },
        { path: "/documents", icon: FileText, label: "Documents", color: "text-indigo-600" },
        { path: "/messages", icon: MessageSquare, label: "Messages", color: "text-pink-600" },
      ];
    } else if (user?.role === 'lawyer') {
      return [
        ...baseItems,
        { path: "/case-requests", icon: Users, label: "Case Requests", color: "text-orange-600" },
        { path: "/documents", icon: FileText, label: "Documents", color: "text-indigo-600" },
        { path: "/messages", icon: MessageSquare, label: "Messages", color: "text-pink-600" },
      ];
    } else if (user?.role === 'police') {
      return baseItems;
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  const roleColors = {
    client: "bg-blue-500",
    lawyer: "bg-green-500", 
    police: "bg-purple-500"
  };

  const roleColor = roleColors[user?.role as keyof typeof roleColors] || "bg-gray-500";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 lg:hidden">
          <div className="flex justify-between items-center h-16 px-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <Scale className="text-blue-600 text-xl" />
              <span className="text-lg font-bold text-gray-900">LegalCaseMS</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className={`${roleColor} text-white text-xs`}>
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          w-72 bg-white border-r border-gray-200 shadow-lg
        `}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <Scale className="text-blue-600 text-2xl" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LegalCaseMS</h1>
                  <p className="text-xs text-gray-500 capitalize">{user?.role} Portal</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                  className="relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className={`${roleColor} text-white text-sm`}>
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={14} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* User Info Card */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className={`${roleColor} text-white text-lg font-semibold`}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                {user?.city && (
                  <p className="text-xs text-gray-400">{user.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start h-12 ${
                        isActive 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={() => isMobile && setSidebarOpen(false)}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="h-full">
            <ScrollArea className="h-screen">
              <div className="p-6">
                {children}
              </div>
            </ScrollArea>
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