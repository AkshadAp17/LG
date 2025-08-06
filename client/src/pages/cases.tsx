import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderOpen, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import CaseCard from "@/components/CaseCard";
import CaseForm from "@/components/CaseForm";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

export default function Cases() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const user = authService.getUser();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  const approveCase = useMutation({
    mutationFn: async (caseId: string) => {
      return apiRequest('PATCH', `/api/cases/${caseId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
    },
  });

  const rejectCase = useMutation({
    mutationFn: async ({ caseId, reason }: { caseId: string; reason?: string }) => {
      return apiRequest('PATCH', `/api/cases/${caseId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
    },
  });

  const getFilteredCases = (status: string) => {
    if (status === "all") return cases;
    return cases.filter((case_: Case) => case_.status === status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FolderOpen className="h-4 w-4 text-blue-600" />;
    }
  };

  const handleCaseClick = (case_: Case) => {
    setSelectedCase(case_);
  };

  if (isLoading) {
    return <div className="p-6">Loading cases...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Cases</h2>
        {user?.role === 'lawyer' && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-legal-blue hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Case</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseForm onClose={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center space-x-2">
                    <span>All</span>
                    <Badge variant="secondary" className="ml-1">
                      {cases.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="under_review" className="flex items-center space-x-2">
                    <span>Pending</span>
                    <Badge variant="secondary" className="ml-1">
                      {getFilteredCases("under_review").length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center space-x-2">
                    <span>Approved</span>
                    <Badge variant="secondary" className="ml-1">
                      {getFilteredCases("approved").length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="flex items-center space-x-2">
                    <span>Rejected</span>
                    <Badge variant="secondary" className="ml-1">
                      {getFilteredCases("rejected").length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {["all", "under_review", "approved", "rejected"].map((status) => (
                  <TabsContent key={status} value={status} className="mt-4">
                    <div className="space-y-4">
                      {getFilteredCases(status).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No {status === "all" ? "" : status} cases found
                        </div>
                      ) : (
                        getFilteredCases(status).map((case_: Case) => (
                          <CaseCard
                            key={case_._id}
                            case={case_}
                            onClick={handleCaseClick}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Case Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCase ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(selectedCase.status)}
                      <Badge className={`text-xs ${
                        selectedCase.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedCase.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        selectedCase.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedCase.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{selectedCase.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Type: {selectedCase.caseType}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedCase.description}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Victim Details</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Name:</strong> {selectedCase.victim.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Phone:</strong> {selectedCase.victim.phone}
                      </p>
                      {selectedCase.victim.email && (
                        <p className="text-sm text-gray-600">
                          <strong>Email:</strong> {selectedCase.victim.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Accused Details</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Name:</strong> {selectedCase.accused.name}
                      </p>
                      {selectedCase.accused.phone && (
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong> {selectedCase.accused.phone}
                        </p>
                      )}
                      {selectedCase.accused.address && (
                        <p className="text-sm text-gray-600">
                          <strong>Address:</strong> {selectedCase.accused.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedCase.pnr && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Case Information</h4>
                      <p className="text-sm text-gray-600">
                        <strong>PNR:</strong> {selectedCase.pnr}
                      </p>
                      {selectedCase.hearingDate && (
                        <p className="text-sm text-gray-600">
                          <strong>Hearing Date:</strong> {new Date(selectedCase.hearingDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {user?.role === 'police' && selectedCase.status === 'under_review' && (
                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => rejectCase.mutate({ caseId: selectedCase._id! })}
                        disabled={rejectCase.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        className="flex-1 bg-legal-emerald hover:bg-green-700 text-white"
                        onClick={() => approveCase.mutate(selectedCase._id!)}
                        disabled={approveCase.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Select a case to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
