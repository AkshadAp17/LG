import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Gavel, Calendar, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import type { Notification } from "@shared/schema";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen && authService.isAuthenticated(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // First mark all unread notifications as read
      const unreadNotifications = notifications.filter((n: Notification) => !n.read);
      await Promise.all(
        unreadNotifications.map((n: Notification) =>
          apiRequest('PATCH', `/api/notifications/${n._id}/read`, {})
        )
      );
      // Then delete all read notifications
      return apiRequest('DELETE', `/api/notifications/read/all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case_approved':
      case 'case_rejected':
        return <Gavel className="text-legal-blue" />;
      case 'hearing_scheduled':
        return <Calendar className="text-legal-emerald" />;
      case 'new_message':
        return <MessageSquare className="text-yellow-600" />;
      default:
        return <Gavel className="text-legal-blue" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'case_approved':
        return 'bg-green-50 border-green-200';
      case 'case_rejected':
        return 'bg-red-50 border-red-200';
      case 'hearing_scheduled':
        return 'bg-blue-50 border-blue-200';
      case 'new_message':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Notifications
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification: Notification) => (
              <div
                key={notification._id}
                className={`p-4 border rounded-lg ${getNotificationBg(notification.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <Badge variant="destructive" className="h-2 w-2 p-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {notification.createdAt && 
                          format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')
                        }
                      </p>
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id!)}
                          className="text-xs"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full text-center text-sm text-legal-blue hover:text-blue-700 font-medium"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? 'Processing...' : 'Mark all as read'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
