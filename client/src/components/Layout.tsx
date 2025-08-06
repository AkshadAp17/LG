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

  const unreadCount = notifications.filter((notif: any) => !notif.read).length;

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
    <div className="min-h-screen bg-legal-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Scale className="text-legal-blue text-2xl" />
              <h1 className="text-xl font-bold text-legal-blue">LegalCaseMS</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="h-4 w-4" />
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
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive ? "bg-legal-blue text-white" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            
            {/* User Type Toggle */}
            <div className="mt-8 px-4">
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Switch View
                </p>
                <select 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                  value={user?.role || 'client'}
                  disabled
                >
                  <option value="client">Client View</option>
                  <option value="lawyer">Lawyer View</option>
                  <option value="police">Police Station</option>
                </select>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Notifications Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
