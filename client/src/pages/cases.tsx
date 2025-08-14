import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  ChevronRight,
  Upload,
  Download,
  Eye,
  FolderOpen,
  Plus,
  X
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
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const queryClient = useQueryClient();

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ caseId, formData }: { caseId: string; formData: FormData }) => {
      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({ title: 'Document uploaded successfully' });
      setShowDocumentUpload(false);
      setSelectedFile(null);
    },
    onError: () => {
      toast({ title: 'Failed to upload document', variant: 'destructive' });
    }
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle document upload
  const handleDocumentUpload = () => {
    if (!selectedFile || !selectedCase?._id) return;
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('caseId', selectedCase._id);
    
    uploadDocumentMutation.mutate({ caseId: selectedCase._id, formData });
  };

  // Handle document download
  const handleDocumentDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/documents/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 md:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Scale className="mr-3 text-blue-200" size={24} />
            <div>
              <h1 className="text-xl md:text-3xl font-bold mb-2">Case Management Hub</h1>
              <p className="text-blue-200 flex items-center text-sm md:text-base">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Live system • Track and manage your legal cases efficiently
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/new-case'}
            className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg text-sm md:text-base w-full sm:w-auto"
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

              {/* Case Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="mr-2 text-blue-600" size={20} />
                    Case Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedCase.description}</p>
                </div>

                {/* Victim & Accused Information */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <Users className="mr-2 text-blue-600" size={18} />
                      Victim Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedCase.victim?.name}</div>
                      <div><span className="font-medium">Phone:</span> {selectedCase.victim?.phone}</div>
                      {selectedCase.victim?.email && (
                        <div><span className="font-medium">Email:</span> {selectedCase.victim.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="mr-2 text-red-600" size={18} />
                      Accused Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedCase.accused?.name}</div>
                      {selectedCase.accused?.phone && (
                        <div><span className="font-medium">Phone:</span> {selectedCase.accused.phone}</div>
                      )}
                      {selectedCase.accused?.address && (
                        <div><span className="font-medium">Address:</span> {selectedCase.accused.address}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-2xl p-6 text-center">
                  <h4 className="font-bold text-gray-900 mb-2">PNR Number</h4>
                  <p className="text-green-700 font-mono">{selectedCase.pnr || 'Not Assigned'}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-6 text-center">
                  <h4 className="font-bold text-gray-900 mb-2">FIR Number</h4>
                  <p className="text-purple-700 font-mono">{selectedCase.firNumber || 'Not Filed'}</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-6 text-center">
                  <h4 className="font-bold text-gray-900 mb-2">Police Station</h4>
                  <p className="text-orange-700">
                    {typeof selectedCase.policeStation === 'string' 
                      ? selectedCase.policeStation 
                      : selectedCase.policeStation?.name || 'Not Assigned'}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <FolderOpen className="mr-2 text-indigo-600" size={20} />
                    Case Documents
                  </h3>
                  <Button
                    onClick={() => setShowDocumentUpload(true)}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="mr-2" size={16} />
                    Upload Document
                  </Button>
                </div>
                
                {selectedCase.documents && selectedCase.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCase.documents.map((doc, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.split('/').pop() || `Document ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/documents/${doc}`, '_blank')}
                              className="text-gray-600 hover:text-indigo-600"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentDownload(doc)}
                              className="text-gray-600 hover:text-indigo-600"
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                    <Button
                      onClick={() => setShowDocumentUpload(true)}
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      <Upload className="mr-2" size={16} />
                      Upload First Document
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
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
        /* Cases List */
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
                      className="group p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md border-gray-200 hover:border-blue-300"
                      onClick={() => setSelectedCase(case_)}
                      data-testid={`case-card-${case_._id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">{case_.title}</h3>
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
                            <ChevronRight className="text-gray-400" size={20} />
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{case_.description}</p>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 text-sm">
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
                              <Users className="mr-2 text-orange-500" size={16} />
                              <span>{case_.lawyerId ? 'Lawyer Assigned' : 'No Lawyer'}</span>
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
      )}

      {/* Document Upload Modal */}
      <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="mr-2 text-indigo-600" size={20} />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Select a document file to upload for this case. Supported formats: PDF, DOC, DOCX, JPG, PNG
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-gray-600 hover:text-indigo-600"
              >
                Click to select a file or drag and drop
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOC, DOCX, JPG, PNG up to 10MB
              </p>
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="text-indigo-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X size={16} />
                </Button>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDocumentUpload(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpload}
                disabled={!selectedFile || uploadDocumentMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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