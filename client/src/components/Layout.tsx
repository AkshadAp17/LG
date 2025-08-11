import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Scale, LayoutDashboard, FolderOpen, Users, Calendar, FileText, MessageSquare, Bell, ChevronDown, Settings } from "lucide-react";
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
import NotificationModal from "./NotificationModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const user = authService.getUser();

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
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/cases", icon: FolderOpen, label: "Cases" },
      { path: "/calendar", icon: Calendar, label: "Calendar" },
    ];

    if (user?.role === 'client') {
      return [
        ...baseItems,
        { path: "/find-lawyers", icon: Users, label: "Find Lawyers" },
        { path: "/documents", icon: FileText, label: "Documents" },
        { path: "/messages", icon: MessageSquare, label: "Messages" },
      ];
    } else if (user?.role === 'lawyer') {
      return [
        ...baseItems,
        { path: "/case-requests", icon: Users, label: "Case Requests" },
        { path: "/documents", icon: FileText, label: "Documents" },
        { path: "/messages", icon: MessageSquare, label: "Messages" },
      ];
    } else if (user?.role === 'police') {
      // Police officers only see Dashboard, Cases, and Calendar
      return baseItems;
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Modern Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Scale className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LegalCaseMS</h1>
              <p className="text-xs text-slate-400">Professional Legal Management</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg backdrop-blur-sm">
            <Avatar className="w-10 h-10 ring-2 ring-blue-500/30">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 animate-pulse"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50">
                <Settings className="mr-3 h-4 w-4" />
                Settings & More
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen overflow-hidden">
        <div className="p-6 h-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Notifications Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
