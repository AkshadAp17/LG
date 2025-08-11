import { useQuery } from "@tanstack/react-query";
import CalendarComponent from "@/components/CalendarComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import type { Case } from "@shared/schema";

export default function CalendarPage() {
  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  const upcomingHearings = cases
    .filter((case_: Case) => case_.hearingDate && new Date(case_.hearingDate) > new Date())
    .sort((a: Case, b: Case) => 
      new Date(a.hearingDate!).getTime() - new Date(b.hearingDate!).getTime()
    )
    .slice(0, 5);

  const todaysHearings = cases.filter((case_: Case) => 
    case_.hearingDate && isToday(new Date(case_.hearingDate))
  );

  const getHearingPriority = (hearingDate: Date) => {
    if (isToday(hearingDate)) return { label: "Today", color: "bg-red-100 text-red-800" };
    if (isTomorrow(hearingDate)) return { label: "Tomorrow", color: "bg-orange-100 text-orange-800" };
    if (hearingDate < addDays(new Date(), 7)) return { label: "This Week", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
  };

  if (isLoading) {
    return <div className="p-6">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-1">Legal Calendar</h2>
            <p className="text-blue-100 text-lg">Manage your hearing dates and case schedules</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Hearings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-legal-blue" />
              <span>Today's Hearings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysHearings.length === 0 ? (
              <p className="text-sm text-gray-500">No hearings today</p>
            ) : (
              <div className="space-y-2">
                {todaysHearings.map((case_: Case) => (
                  <div key={case_._id} className="p-2 bg-red-50 rounded-lg">
                    <p className="font-medium text-sm text-gray-900">{case_.title}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(case_.hearingDate!), 'h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-legal-emerald" />
              <span>Upcoming</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-legal-emerald">
                {upcomingHearings.length}
              </p>
              <p className="text-sm text-gray-600">hearings scheduled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-legal-slate" />
              <span>This Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-legal-slate">
                {cases.filter((case_: Case) => {
                  if (!case_.hearingDate) return false;
                  const hearingDate = new Date(case_.hearingDate);
                  const now = new Date();
                  return hearingDate.getMonth() === now.getMonth() && 
                         hearingDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-sm text-gray-600">total hearings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Next Hearing</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingHearings.length > 0 ? (
              <div>
                <p className="font-medium text-sm text-gray-900">
                  {upcomingHearings[0].title}
                </p>
                <p className="text-xs text-gray-600">
                  {format(new Date(upcomingHearings[0].hearingDate!), 'PPP')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming hearings</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <CalendarComponent cases={cases} />
        </div>

        {/* Upcoming Hearings List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Hearings</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingHearings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No upcoming hearings scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingHearings.map((case_: Case) => {
                    const hearingDate = new Date(case_.hearingDate!);
                    const priority = getHearingPriority(hearingDate);
                    
                    return (
                      <div
                        key={case_._id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{case_.title}</h4>
                          <Badge className={`text-xs ${priority.color}`}>
                            {priority.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{format(hearingDate, 'PPP')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{format(hearingDate, 'h:mm a')}</span>
                          </div>
                          {case_.pnr && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs">PNR: {case_.pnr}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
