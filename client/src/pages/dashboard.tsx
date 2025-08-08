import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  FolderOpen, 
  Clock, 
  CalendarCheck, 
  FileText, 
  Bell, 
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  MessageSquare,
  ChevronRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Case, Lawyer, Notification } from "@shared/schema";

export default function Dashboard() {
  const user = authService.getUser();
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

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

  const getStatusColor = (status: string) => {
    const colors = {
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'draft': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'client': 'bg-blue-500',
      'lawyer': 'bg-green-500',
      'police': 'bg-purple-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 text-lg">
              {user?.role === 'client' && "Manage your legal cases and find the best lawyers"}
              {user?.role === 'lawyer' && "Track your cases and client communications"}
              {user?.role === 'police' && "Review and approve case submissions"}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm text-blue-100">Current Role</p>
              <p className="text-xl font-semibold capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCases || recentCases.length}</p>
                <p className="text-sm text-green-600 flex items-center mt-2">
                  <TrendingUp size={16} className="mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FolderOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeCases || recentCases.filter(c => c.status === 'approved').length}</p>
                <p className="text-sm text-blue-600 flex items-center mt-2">
                  <Clock size={16} className="mr-1" />
                  In progress
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingCases || recentCases.filter(c => c.status === 'under_review').length}</p>
                <p className="text-sm text-orange-600 flex items-center mt-2">
                  <AlertCircle size={16} className="mr-1" />
                  Awaiting action
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {user?.role === 'lawyer' ? 'Success Rate' : 'Notifications'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {user?.role === 'lawyer' ? '85%' : Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-2">
                  <BarChart3 size={16} className="mr-1" />
                  {user?.role === 'lawyer' ? 'Win rate' : 'Unread'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                {user?.role === 'lawyer' ? 
                  <BarChart3 className="text-purple-600" size={24} /> :
                  <Bell className="text-purple-600" size={24} />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Recent Cases</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {user?.role === 'client' && <TabsTrigger value="lawyers">Find Lawyers</TabsTrigger>}
            {user?.role === 'lawyer' && <TabsTrigger value="requests">Case Requests</TabsTrigger>}
            {user?.role === 'police' && <TabsTrigger value="pending">Pending Approval</TabsTrigger>}
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Clock className="mr-2 text-blue-600" size={20} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {recentCases.slice(0, 5).map((case_, index) => (
                      <div key={case_._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FolderOpen className="text-blue-600" size={16} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{case_.title}</p>
                          <p className="text-xs text-gray-500">{case_.caseType} • {case_.city}</p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(case_.status)}`}>
                          {case_.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Plus className="mr-2 text-green-600" size={20} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user?.role === 'client' && (
                    <>
                      <Button className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-2" size={18} />
                        Create New Case
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <Users className="mr-2" size={18} />
                        Find Lawyers
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <Calendar className="mr-2" size={18} />
                        Schedule Consultation
                      </Button>
                    </>
                  )}
                  
                  {user?.role === 'lawyer' && (
                    <>
                      <Button className="w-full justify-start h-12 bg-green-600 hover:bg-green-700 text-white">
                        <FolderOpen className="mr-2" size={18} />
                        Review Case Requests
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <MessageSquare className="mr-2" size={18} />
                        Client Messages
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <Calendar className="mr-2" size={18} />
                        Upcoming Hearings
                      </Button>
                    </>
                  )}
                  
                  {user?.role === 'police' && (
                    <>
                      <Button className="w-full justify-start h-12 bg-purple-600 hover:bg-purple-700 text-white">
                        <AlertCircle className="mr-2" size={18} />
                        Review Pending Cases
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <FileText className="mr-2" size={18} />
                        Case Reports
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <BarChart3 className="mr-2" size={18} />
                        Station Statistics
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">All Cases</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2" size={16} />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                        <Badge className={`${getStatusColor(case_.status)}`}>
                          {case_.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{case_.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="capitalize">{case_.caseType}</span>
                          <span>{case_.city}</span>
                          {case_.accused?.name && (
                            <span className="text-red-600 font-medium">Accused: {case_.accused.name}</span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details <ChevronRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Bell className="mr-2 text-purple-600" size={20} />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {Array.isArray(notifications) && notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notif) => (
                      <div key={notif._id} className={`p-4 rounded-lg border-l-4 ${
                        notif.read ? 'bg-gray-50 border-l-gray-300' : 'bg-blue-50 border-l-blue-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notif.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500">No notifications yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === 'client' && (
          <TabsContent value="lawyers" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Users className="mr-2 text-green-600" size={20} />
                  Available Lawyers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableLawyers.slice(0, 6).map((lawyer) => (
                      <div key={lawyer._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">
                              {lawyer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                            <p className="text-sm text-gray-600">{lawyer.city}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {lawyer.specialization?.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {lawyer.experience} years exp.
                            </span>
                            <Button size="sm" variant="outline">
                              Connect
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}