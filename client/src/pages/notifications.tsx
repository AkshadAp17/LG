import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import LegalSidebar from '@/components/LegalSidebar';
import { apiRequest } from '@/lib/queryClient';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FileTextIcon,
  MessageSquareIcon,
  ScaleIcon
} from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent' | 'case' | 'message' | 'document';
  read: boolean;
  userId: string;
  caseId?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('/api/notifications')
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/notifications/mark-all-read', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Success',
        description: 'Notification deleted'
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'urgent':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'case':
        return <ScaleIcon className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquareIcon className="h-5 w-5 text-purple-500" />;
      case 'document':
        return <FileTextIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-slate-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'case':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'message':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'document':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <LegalSidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <BellIcon className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Notifications
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Stay updated with important case and system notifications
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  data-testid="button-filter-all"
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  data-testid="button-filter-unread"
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                  data-testid="button-filter-read"
                >
                  Read ({notifications.length - unreadCount})
                </Button>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/50">
            <CardTitle>
              {filter === 'all' && 'All Notifications'}
              {filter === 'unread' && 'Unread Notifications'}
              {filter === 'read' && 'Read Notifications'}
            </CardTitle>
            <CardDescription>
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                </h3>
                <p className="text-slate-500 dark:text-slate-500">
                  {filter === 'unread' 
                    ? 'All caught up! No new notifications to review.'
                    : 'You\'ll see important updates and alerts here when they arrive.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification._id}
                    className={`relative p-4 border rounded-lg transition-all hover:shadow-md ${
                      !notification.read 
                        ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {!notification.read && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                          >
                            {notification.type}
                          </Badge>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                          {notification.message}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification._id)}
                            disabled={markAsReadMutation.isPending}
                            data-testid={`button-mark-read-${notification._id}`}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(notification._id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-delete-${notification._id}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}