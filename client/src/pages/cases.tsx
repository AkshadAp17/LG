import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  MapPin,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Edit,
  Phone,
  Mail,
  Building,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

export default function Cases() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  
  const user = authService.getUser();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await apiRequest("DELETE", `/api/cases/${caseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      setSelectedCase(null);
      setIsDeleteDialogOpen(false);
      setCaseToDelete(null);
    },
  });

  const getStatusIcon = (status: string) => {
    const icons = {
      'approved': <CheckCircle2 className="text-green-600" size={16} />,
      'under_review': <Clock className="text-yellow-600" size={16} />,
      'rejected': <XCircle className="text-red-600" size={16} />,
      'submitted': <AlertCircle className="text-blue-600" size={16} />,
      'draft': <FileText className="text-gray-600" size={16} />
    };
    return icons[status as keyof typeof icons] || icons.draft;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'draft': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const filteredCases = statusFilter === "all" 
    ? cases 
    : cases.filter(case_ => case_.status === statusFilter);

  const caseCounts = {
    all: cases.length,
    pending: cases.filter(c => c.status === 'under_review').length,
    approved: cases.filter(c => c.status === 'approved').length,
    rejected: cases.filter(c => c.status === 'rejected').length
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Cases</h1>
            <p className="text-blue-100 text-lg">
              Track and manage your legal cases efficiently
            </p>
          </div>
          {user?.role === 'client' && (
            <Button className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-6">
              <Plus className="mr-2" size={18} />
              New Case
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2">
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
                      filteredCases.map((case_) => (
                        <div
                          key={case_._id}
                          onClick={() => setSelectedCase(case_)}
                          className={`group p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            selectedCase?._id === case_._id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                {getStatusIcon(case_.status)}
                                <h3 className="text-xl font-bold text-gray-900">{case_.title}</h3>
                                <Badge className={`${getStatusColor(case_.status)}`}>
                                  {case_.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-600 mb-3 line-clamp-2">{case_.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center text-gray-500">
                                  <FileText size={14} className="mr-1" />
                                  <span className="capitalize">{case_.caseType}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <MapPin size={14} className="mr-1" />
                                  <span>{case_.city}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Calendar size={14} className="mr-1" />
                                  <span>{case_.hearingDate ? new Date(case_.hearingDate).toLocaleDateString() : 'TBD'}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Building size={14} className="mr-1" />
                                  <span>{typeof case_.policeStation === 'string' ? case_.policeStation : case_.policeStation?.name || 'Not assigned'}</span>
                                </div>
                              </div>

                              {case_.accused?.name && (
                                <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                                  <span className="text-sm text-red-700 font-medium">
                                    Accused: {case_.accused.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {user?.role === 'lawyer' && (
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Case
                                  </DropdownMenuItem>
                                )}
                                {case_.documents && case_.documents.length > 0 && (
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Documents
                                  </DropdownMenuItem>
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
        </div>

        {/* Case Details Panel */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Case Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCase ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="text-center">
                      <Badge className={`text-sm ${getStatusColor(selectedCase.status)} px-4 py-2`}>
                        {getStatusIcon(selectedCase.status)}
                        <span className="ml-2">{selectedCase.status.replace('_', ' ').toUpperCase()}</span>
                      </Badge>
                    </div>

                    {/* Case Title */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCase.title}</h2>
                      <p className="text-gray-600">{selectedCase.description}</p>
                    </div>

                    <Separator />

                    {/* Case Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <FileText className="mr-2" size={16} />
                        Case Information
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <Badge variant="outline" className="capitalize">{selectedCase.caseType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">FIR Number:</span>
                          <span className="font-medium">{selectedCase.firNo || 'Not assigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-medium">{selectedCase.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hearing Date:</span>
                          <span className="font-medium">
                            {selectedCase.hearingDate 
                              ? new Date(selectedCase.hearingDate).toLocaleDateString()
                              : 'To be decided'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Victim Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <User className="mr-2" size={16} />
                        Victim Details
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {selectedCase.victim?.name?.charAt(0) || 'V'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedCase.victim?.name || 'Not specified'}</div>
                            <div className="text-gray-500">{selectedCase.victim?.email}</div>
                          </div>
                        </div>
                        
                        {selectedCase.victim?.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone size={14} className="mr-2" />
                            <span>{selectedCase.victim.phone}</span>
                          </div>
                        )}
                        
                        {selectedCase.victim?.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail size={14} className="mr-2" />
                            <span>{selectedCase.victim.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accused Details */}
                    {selectedCase.accused?.name && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <AlertCircle className="mr-2 text-red-600" size={16} />
                            Accused Details
                          </h3>
                          
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="font-medium text-red-900">{selectedCase.accused.name}</div>
                            {selectedCase.accused.address && (
                              <div className="text-sm text-red-700 mt-1">{selectedCase.accused.address}</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Police Station */}
                    {selectedCase.policeStation && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <Building className="mr-2" size={16} />
                            Police Station
                          </h3>
                          
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="font-medium">
                              {typeof selectedCase.policeStation === 'string' 
                                ? selectedCase.policeStation 
                                : selectedCase.policeStation?.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Status: Under review
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Documents */}
                    {selectedCase.documents && selectedCase.documents.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <FileText className="mr-2" size={16} />
                            Documents ({selectedCase.documents.length})
                          </h3>
                          
                          <div className="space-y-2">
                            {selectedCase.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <FileText size={16} className="mr-2 text-gray-500" />
                                  <span className="text-sm">Document {index + 1}</span>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <Scale className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Select a case to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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