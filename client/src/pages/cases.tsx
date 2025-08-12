import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Scale,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  FileText,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Case {
  _id: string;
  title: string;
  description: string;
  caseType: string;
  status: string;
  pnr?: string;
  firNumber?: string;
  city: string;
  hearingDate?: string;
  createdAt?: string;
  victim: {
    name: string;
    phone: string;
    email?: string;
  };
  accused: {
    name: string;
    phone?: string;
    address?: string;
  };
  policeStation?: string | { name: string };
  lawyerId?: string;
  documents?: string[];
}

export default function Cases() {
  const user = authService.getUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const queryClient = useQueryClient();

  // Fetch cases
  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  // Delete case mutation
  const deleteCaseMutation = useMutation({
    mutationFn: (caseId: string) => apiRequest('DELETE', `/api/cases/${caseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({ title: 'Success', description: 'Case deleted successfully' });
      setIsDeleteDialogOpen(false);
      setCaseToDelete(null);
      if (selectedCase?._id === caseToDelete?._id) {
        setSelectedCase(null);
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete case', variant: 'destructive' });
    }
  });

  // Approve case mutation
  const approveCaseMutation = useMutation({
    mutationFn: (caseId: string) => apiRequest('POST', `/api/cases/${caseId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({ title: 'Success', description: 'Case approved successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to approve case', variant: 'destructive' });
    }
  });

  // Reject case mutation
  const rejectCaseMutation = useMutation({
    mutationFn: (caseId: string) => apiRequest('POST', `/api/cases/${caseId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({ title: 'Success', description: 'Case rejected successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject case', variant: 'destructive' });
    }
  });

  // Filter cases
  const filteredCases = cases.filter((case_) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'under_review') return case_.status === 'under_review' || case_.status === 'submitted';
    return case_.status === statusFilter;
  });

  // Case counts for filters
  const caseCounts = {
    all: cases.length,
    pending: cases.filter((c) => c.status === 'under_review' || c.status === 'submitted').length,
    approved: cases.filter((c) => c.status === 'approved').length,
    rejected: cases.filter((c) => c.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'under_review':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'under_review':
      case 'submitted':
        return <AlertCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const handleDeleteCase = (case_: Case) => {
    setCaseToDelete(case_);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (caseToDelete?._id) {
      deleteCaseMutation.mutate(caseToDelete._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Scale className="mx-auto text-gray-400 mb-4 animate-pulse" size={48} />
          <p className="text-gray-500">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Scale className="mr-3 text-blue-200" size={32} />
            <div>
              <h1 className="text-3xl font-bold mb-2">Case Management Hub</h1>
              <p className="text-blue-200 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Live system • Track and manage your legal cases efficiently
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/new-case'}
            className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6 py-3 rounded-xl shadow-lg"
            data-testid="button-new-case"
          >
            + New Case
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900">All Cases ({filteredCases.length})</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({caseCounts.all})</SelectItem>
                  <SelectItem value="under_review">Pending ({caseCounts.pending})</SelectItem>
                  <SelectItem value="approved">Approved ({caseCounts.approved})</SelectItem>
                  <SelectItem value="rejected">Rejected ({caseCounts.rejected})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCase ? (
        /* Full Width Case Detail View */
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Scale className="mr-2 text-blue-600" size={20} />
                Case Details
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedCase(null)}
                className="text-gray-600"
                data-testid="button-back-to-list"
              >
                ← Back to Cases
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Enhanced Case Header */}
              <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200/50">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedCase.title}</h2>
                <p className="text-gray-600 font-medium mb-4 text-lg">{selectedCase.city}</p>
                <div className="flex items-center justify-center bg-white/70 rounded-full px-6 py-3 backdrop-blur-sm">
                  <Badge className={`${getStatusColor(selectedCase.status)} px-4 py-2 text-base`}>
                    {getStatusIcon(selectedCase.status)}
                    <span className="ml-2 font-medium">
                      {selectedCase.status === 'in_progress' ? 'IN PROGRESS' : 
                       selectedCase.status === 'submitted' ? 'SUBMITTED' : 
                       selectedCase.status === 'under_review' ? 'UNDER REVIEW' :
                       selectedCase.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Case Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200/50 shadow-sm">
                  <FileText className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-emerald-600 mb-2 capitalize">{selectedCase.caseType}</div>
                  <div className="font-medium text-gray-600">Case Type</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200/50 shadow-sm">
                  <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-blue-600 mb-2">{selectedCase.city}</div>
                  <div className="font-medium text-gray-600">Location</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl border border-purple-200/50 shadow-sm">
                  <Calendar className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {selectedCase.hearingDate ? new Date(selectedCase.hearingDate).toLocaleDateString() : 'TBD'}
                  </div>
                  <div className="font-medium text-gray-600">Hearing Date</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl border border-amber-200/50 shadow-sm">
                  <Users className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-600 mb-2">
                    {selectedCase.lawyerId ? 'Assigned' : 'Pending'}
                  </div>
                  <div className="font-medium text-gray-600">Lawyer Status</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} />
                  Case Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedCase.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {user?.role === 'police' && (selectedCase.status === 'under_review' || selectedCase.status === 'submitted') && (
                  <>
                    <Button
                      onClick={() => selectedCase._id && approveCaseMutation.mutate(selectedCase._id)}
                      disabled={approveCaseMutation.isPending}
                      className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg text-lg"
                      data-testid="button-approve-case"
                    >
                      <CheckCircle2 className="mr-3" size={20} />
                      {approveCaseMutation.isPending ? 'Approving...' : 'Approve Case'}
                    </Button>
                    <Button
                      onClick={() => selectedCase._id && rejectCaseMutation.mutate(selectedCase._id)}
                      disabled={rejectCaseMutation.isPending}
                      variant="outline"
                      className="flex-1 h-14 border-2 border-red-300 hover:bg-red-50 text-red-700 font-medium rounded-xl"
                      data-testid="button-reject-case"
                    >
                      <XCircle className="mr-3" size={20} />
                      {rejectCaseMutation.isPending ? 'Rejecting...' : 'Reject Case'}
                    </Button>
                  </>
                )}
                {user?.role === 'lawyer' && (
                  <Button 
                    onClick={() => handleDeleteCase(selectedCase)}
                    variant="outline" 
                    className="h-14 px-6 border-2 border-red-300 hover:bg-red-50 text-red-700 rounded-xl"
                    data-testid="button-delete-case"
                  >
                    <Trash2 className="mr-2" size={18} />
                    Delete Case
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Scale className="mr-2 text-blue-600" size={20} />
                    All Cases ({filteredCases.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredCases.length === 0 ? (
                      <div className="text-center py-12">
                        <Scale className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No cases found matching your filters</p>
                      </div>
                    ) : (
                      filteredCases.map((case_) => (
                        <div 
                          key={case_._id} 
                          className={`group p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer h-[200px] flex flex-col ${
                            selectedCase?._id === case_._id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                          onClick={() => setSelectedCase(case_)}
                          data-testid={`case-card-${case_._id}`}
                        >
                          <div className="flex items-start flex-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-gray-900 truncate">{case_.title}</h3>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <Badge className={`${getStatusColor(case_.status)} px-2 py-1 text-xs`}>
                                    {getStatusIcon(case_.status)}
                                    <span className="ml-1 font-medium">
                                      {case_.status === 'in_progress' ? 'IN PROGRESS' : 
                                       case_.status === 'submitted' ? 'SUBMITTED' : 
                                       case_.status === 'under_review' ? 'UNDER REVIEW' :
                                       case_.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </Badge>
                                  <ChevronRight 
                                    className={`transition-transform ${
                                      selectedCase?._id === case_._id ? 'rotate-90' : ''
                                    }`} 
                                    size={16} 
                                  />
                                </div>
                              </div>
                              
                              <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">{case_.description}</p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <FileText size={14} className="mr-1" />
                                  <span className="capitalize">{case_.caseType}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {case_.city}
                                </div>
                                <div className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  {case_.hearingDate ? new Date(case_.hearingDate).toLocaleDateString() : 'TBD'}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Users size={14} />
                                  <span>{case_.lawyerId ? 'Lawyer Assigned' : 'No Lawyer Assigned'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Case Detail Panel */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 text-blue-600" size={20} />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Scale className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-500">Select a case to view details</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the case "{caseToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteCaseMutation.isPending}
              >
                {deleteCaseMutation.isPending ? 'Deleting...' : 'Delete Case'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}