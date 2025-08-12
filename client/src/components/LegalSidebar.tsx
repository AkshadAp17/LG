import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import {
  Scale,
  Home,
  FileText,
  Users,
  UserCheck,
  Calendar,
  MessageSquare,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Shield,
  Gavel,
  BookOpen,
  Clock,
  Search
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function LegalSidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        icon: Home,
        label: 'Dashboard',
        href: '/dashboard',
        badge: null,
        description: 'Overview & Analytics'
      },
      {
        icon: FileText,
        label: 'Cases',
        href: '/cases',
        badge: null,
        description: 'Manage Legal Cases'
      },
      {
        icon: Calendar,
        label: 'Calendar',
        href: '/calendar',
        badge: null,
        description: 'Hearings & Events'
      },
      {
        icon: MessageSquare,
        label: 'Messages',
        href: '/messages',
        badge: null,
        description: 'Communications'
      },
      {
        icon: FolderOpen,
        label: 'Documents',
        href: '/documents',
        badge: null,
        description: 'Case Documents'
      }
    ];

    // Role-specific items
    if (user?.role === 'client') {
      baseItems.splice(2, 0, {
        icon: Search,
        label: 'Find Lawyers',
        href: '/find-lawyers',
        badge: null,
        description: 'Legal Experts'
      });
    }

    if (user?.role === 'lawyer') {
      baseItems.splice(2, 0, {
        icon: Briefcase,
        label: 'Case Requests',
        href: '/case-requests',
        badge: null,
        description: 'Client Requests'
      });
    }

    if (user?.role === 'police') {
      baseItems.splice(2, 0, {
        icon: Shield,
        label: 'Approvals',
        href: '/case-requests',
        badge: null,
        description: 'Case Approvals'
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={cn(
      "fixed left-0 top-0 z-30 flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">LegalCase</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-700">
        <div className={cn(
          "flex items-center space-x-3",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs border px-2 py-0.5",
                    user?.role === 'police' ? 'border-red-400 text-red-300' :
                    user?.role === 'lawyer' ? 'border-green-400 text-green-300' :
                    'border-blue-400 text-blue-300'
                  )}
                >
                  {user?.role === 'police' ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      Police
                    </>
                  ) : user?.role === 'lawyer' ? (
                    <>
                      <Gavel className="w-3 h-3 mr-1" />
                      Lawyer
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 mr-1" />
                      Client
                    </>
                  )}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto p-3 hover:bg-slate-700/50 transition-all duration-200",
                    isActive && "bg-blue-600/20 border-r-2 border-blue-400 text-blue-300",
                    collapsed ? "px-3" : "px-4"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    collapsed ? "justify-center w-full" : "w-full"
                  )}>
                    <Icon className={cn(
                      "flex-shrink-0",
                      isActive ? "text-blue-400" : "text-slate-400",
                      collapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
                    )} />
                    
                    {!collapsed && (
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "font-medium",
                            isActive ? "text-blue-300" : "text-slate-300"
                          )}>
                            {item.label}
                          </span>
                          {/* Hide badge when on notifications page */}
                          {item.badge && location !== '/notifications' && (
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-600 text-blue-100 text-xs px-2 py-0.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <Link href="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start hover:bg-slate-700/50",
              collapsed ? "px-3" : "px-4"
            )}
          >
            <Settings className={cn(
              "text-slate-400",
              collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
            )} />
            {!collapsed && <span className="text-slate-300">Settings</span>}
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start hover:bg-red-600/20 hover:text-red-300",
            collapsed ? "px-3" : "px-4"
          )}
        >
          <LogOut className={cn(
            "text-slate-400",
            collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
          )} />
          {!collapsed && <span className="text-slate-300">Logout</span>}
        </Button>
      </div>
    </div>
  );
}