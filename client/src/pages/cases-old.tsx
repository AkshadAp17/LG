import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Scale,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  MoreVertical,
  FileText,
  Calendar,
  MapPin,
  User,
  Clock,
  Building,
  Star
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
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['/api/cases'],
  });

  // Delete case mutation
  const deleteCaseMutation = useMutation({
    mutationFn: (caseId: string) => apiRequest(`/api/cases/${caseId}`, { method: 'DELETE' }),
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
    mutationFn: (caseId: string) => apiRequest(`/api/cases/${caseId}/approve`, { method: 'POST' }),
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
    mutationFn: (caseId: string) => apiRequest(`/api/cases/${caseId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({ title: 'Success', description: 'Case rejected successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject case', variant: 'destructive' });
    }
  });

  // Filter cases
  const filteredCases = cases.filter((case_: Case) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'under_review') return case_.status === 'under_review' || case_.status === 'submitted';
    return case_.status === statusFilter;
  });

  // Case counts for tabs
  const caseCounts = {
    all: cases.length,
    pending: cases.filter((c: Case) => c.status === 'under_review' || c.status === 'submitted').length,
    approved: cases.filter((c: Case) => c.status === 'approved').length,
    rejected: cases.filter((c: Case) => c.status === 'rejected').length,
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
          >
            + New Case
          </Button>
        </div>
      </div>

      {/* Cases List - Full Width */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Scale className="mr-2 text-blue-600" size={20} />
              All Cases ({filteredCases.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
                All ({caseCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending" onClick={() => setStatusFilter("under_review")}>
                Pending ({caseCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" onClick={() => setStatusFilter("approved")}>
                Approved ({caseCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" onClick={() => setStatusFilter("rejected")}>
                Rejected ({caseCounts.rejected})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredCases.length === 0 ? (
                  <div className="text-center py-12">
                    <Scale className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No cases found</p>
                  </div>
                ) : (
                  filteredCases.map((case_: Case) => (
                    <div
                      key={case_._id}
                      onClick={() => setSelectedCase(case_)}
                      className={`p-6 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 ${
                        selectedCase?._id === case_._id ? 'border-blue-500 shadow-md bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">{case_.title}</h3>
                              <Badge className={`${getStatusColor(case_.status)} px-3 py-1`}>
                                {getStatusIcon(case_.status)}
                                <span className="ml-2 text-sm font-medium">
                                  {case_.status === 'in_progress' ? 'IN PROGRESS' : 
                                   case_.status === 'submitted' ? 'SUBMITTED' : 
                                   case_.status === 'under_review' ? 'UNDER REVIEW' :
                                   case_.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </Badge>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 text-sm leading-relaxed">{case_.description}</p>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <FileText className="mr-2 text-blue-500" size={16} />
                              <span className="capitalize font-medium">{case_.caseType}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <MapPin className="mr-2 text-green-500" size={16} />
                              <span>{case_.city}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="mr-2 text-purple-500" size={16} />
                              <span>{case_.hearingDate ? new Date(case_.hearingDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Building className="mr-2 text-orange-500" size={16} />
                              <span>{typeof case_.policeStation === 'string' ? case_.policeStation : case_.policeStation?.name || 'Not assigned'}</span>
                            </div>
                          </div>

                          {/* Numbers Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <span className="text-gray-600">FIR Number: </span>
                              <span className="font-medium text-blue-700">{case_.firNumber || 'Not assigned'}</span>
                            </div>
                            <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <span className="text-gray-600">PNR Number: </span>
                              <span className="font-medium text-green-700">{case_.pnr || 'Not assigned'}</span>
                            </div>
                          </div>

                          {/* Victim and Accused Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                              <div className="flex items-center mb-2">
                                <User className="mr-2 text-green-600" size={16} />
                                <span className="font-medium text-green-800">Victim</span>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">{case_.victim.name}</p>
                                <p className="text-gray-600">{case_.victim.phone}</p>
                                {case_.victim.email && <p className="text-gray-600">{case_.victim.email}</p>}
                              </div>
                            </div>
                            <div className="bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                              <div className="flex items-center mb-2">
                                <AlertCircle className="mr-2 text-red-600" size={16} />
                                <span className="font-medium text-red-800">Accused</span>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">{case_.accused.name}</p>
                                {case_.accused.phone && <p className="text-gray-600">{case_.accused.phone}</p>}
                                {case_.accused.address && <p className="text-gray-600 text-xs">{case_.accused.address}</p>}
                              </div>
                            </div>
                          </div>

                          {/* Actions for Police Users */}
                          {user?.role === 'police' && (case_.status === 'under_review' || case_.status === 'submitted') && (
                            <div className="flex gap-3 pt-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (case_._id) approveCaseMutation.mutate(case_._id);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={approveCaseMutation.isPending}
                              >
                                <CheckCircle2 className="mr-2" size={16} />
                                {approveCaseMutation.isPending ? 'Approving...' : 'Approve Case'}
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (case_._id) rejectCaseMutation.mutate(case_._id);
                                }}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                disabled={rejectCaseMutation.isPending}
                              >
                                <XCircle className="mr-2" size={16} />
                                {rejectCaseMutation.isPending ? 'Rejecting...' : 'Reject Case'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* More Options Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {user?.role === 'police' && (case_.status === 'under_review' || case_.status === 'submitted') && (
                              <>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (case_._id) approveCaseMutation.mutate(case_._id);
                                  }}
                                  className="text-green-600 bg-green-50 hover:bg-green-100 font-medium"
                                  disabled={approveCaseMutation.isPending}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {approveCaseMutation.isPending ? 'Approving...' : 'Approve Case'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (case_._id) rejectCaseMutation.mutate(case_._id);
                                  }}
                                  className="text-red-600 bg-red-50 hover:bg-red-100 font-medium"
                                  disabled={rejectCaseMutation.isPending}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {rejectCaseMutation.isPending ? 'Rejecting...' : 'Reject Case'}
                                </DropdownMenuItem>
                              </>
                            )}
                            {user?.role === 'lawyer' && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCase(case_);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Case
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

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