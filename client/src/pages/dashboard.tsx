import { useQuery } from "@tanstack/react-query";
import { Plus, FolderOpen, Clock, CalendarCheck, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import CaseCard from "@/components/CaseCard";
import LawyerCard from "@/components/LawyerCard";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Case, Lawyer, Notification } from "@shared/schema";

export default function Dashboard() {
  const user = authService.getUser();

  const { data: stats = {}, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentCases = [], isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  const { data: availableLawyers = [], isLoading: lawyersLoading } = useQuery<Lawyer[]>({
    queryKey: ['/api/lawyers'],
    enabled: user?.role === 'client',
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications');
      return await response.json();
    },
  });

  const handleSelectLawyer = (lawyer: Lawyer) => {
    // Navigate to find lawyers page with this lawyer pre-selected
    window.location.href = `/find-lawyers?selected=${lawyer._id}`;
  };

  if (statsLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Welcome back, <span className="font-medium">{user?.name}</span>
            </p>
          </div>
          {user?.role === 'client' && (
            <Button className="bg-legal-blue hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.role === 'client' ? (
            <>
              <StatsCard
                title="Active Cases"
                value={stats.activeCases || 0}
                icon={FolderOpen}
                trend="+2"
                description="from last month"
              />
              <StatsCard
                title="Pending Approvals"
                value={stats.pendingApprovals || 0}
                icon={Clock}
                description="2 urgent"
                bgColor="bg-yellow-500 bg-opacity-10"
                iconColor="text-yellow-600"
              />
              <StatsCard
                title="Upcoming Hearings"
                value={stats.upcomingHearings || 0}
                icon={CalendarCheck}
                description="Next: Tomorrow 10:00 AM"
                bgColor="bg-legal-emerald bg-opacity-10"
                iconColor="text-legal-emerald"
              />
              <StatsCard
                title="Documents"
                value={stats.totalCases || 0}
                icon={FileText}
                description="3 uploaded today"
                bgColor="bg-purple-500 bg-opacity-10"
                iconColor="text-purple-600"
              />
            </>
          ) : user?.role === 'police' ? (
            <>
              <StatsCard
                title="Pending Review"
                value={stats.pendingReview || 0}
                icon={Clock}
                bgColor="bg-yellow-500 bg-opacity-10"
                iconColor="text-yellow-600"
              />
              <StatsCard
                title="Approved Today"
                value={stats.approvedToday || 0}
                icon={CalendarCheck}
                bgColor="bg-legal-emerald bg-opacity-10"
                iconColor="text-legal-emerald"
              />
              <StatsCard
                title="Rejected Cases"
                value={stats.rejectedCases || 0}
                icon={FileText}
                bgColor="bg-red-500 bg-opacity-10"
                iconColor="text-red-600"
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notifications for Lawyers */}
        {user?.role === 'lawyer' && notifications.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification: Notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lawyer Selection Card - Only for clients */}
        {user?.role === 'client' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Find Lawyers
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lawyersLoading ? (
                  <div>Loading lawyers...</div>
                ) : availableLawyers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No lawyers available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableLawyers.slice(0, 3).map((lawyer: Lawyer) => (
                      <LawyerCard
                        key={lawyer._id}
                        lawyer={lawyer}
                        onSelect={handleSelectLawyer}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Cases Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">
                Recent Cases
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {casesLoading ? (
                <div>Loading cases...</div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No cases found
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCases.slice(0, 3).map((case_: Case) => (
                    <CaseCard key={case_._id} case={case_} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
