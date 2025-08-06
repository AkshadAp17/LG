import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, CheckCircle, XCircle, User, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import type { CaseRequest } from '@shared/schema';

interface CaseRequestWithDetails extends CaseRequest {
  client?: {
    name: string;
    email: string;
    phone: string;
  };
  lawyer?: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function CaseRequests() {
  const [selectedRequest, setSelectedRequest] = useState<CaseRequestWithDetails | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [lawyerResponse, setLawyerResponse] = useState('');
  const [responseAction, setResponseAction] = useState<'accepted' | 'rejected' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caseRequests = [], isLoading } = useQuery<CaseRequestWithDetails[]>({
    queryKey: ['/api/case-requests'],
  });

  const updateCaseRequestMutation = useMutation({
    mutationFn: async ({ id, status, lawyerResponse }: { id: string; status: string; lawyerResponse: string }) => {
      const response = await fetch(`/api/case-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status, lawyerResponse }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update case request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Response Sent',
        description: 'Your response has been sent to the client.',
      });
      setIsResponseDialogOpen(false);
      setSelectedRequest(null);
      setLawyerResponse('');
      setResponseAction(null);
      queryClient.invalidateQueries({ queryKey: ['/api/case-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send response',
        variant: 'destructive',
      });
    },
  });

  const handleViewDetails = (request: CaseRequestWithDetails) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const handleRespond = (request: CaseRequestWithDetails, action: 'accepted' | 'rejected') => {
    setSelectedRequest(request);
    setResponseAction(action);
    setIsResponseDialogOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest || !responseAction) return;
    
    updateCaseRequestMutation.mutate({
      id: selectedRequest._id!,
      status: responseAction,
      lawyerResponse,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const pendingRequests = caseRequests.filter(r => r.status === 'pending');
  const acceptedRequests = caseRequests.filter(r => r.status === 'accepted');
  const rejectedRequests = caseRequests.filter(r => r.status === 'rejected');

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Requests</h1>
        <p className="text-gray-600">Manage incoming case requests from clients</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map((request) => (
              <CaseRequestCard
                key={request._id}
                request={request}
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
                showActions={true}
              />
            ))}
          </div>
          {pendingRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No pending case requests.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedRequests.map((request) => (
              <CaseRequestCard
                key={request._id}
                request={request}
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
                showActions={false}
              />
            ))}
          </div>
          {acceptedRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No accepted case requests.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rejectedRequests.map((request) => (
              <CaseRequestCard
                key={request._id}
                request={request}
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
                showActions={false}
              />
            ))}
          </div>
          {rejectedRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No rejected case requests.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && getStatusIcon(selectedRequest.status)}
              {selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              Case request details
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Case Type</Label>
                  <p className="capitalize">{selectedRequest.caseType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">City</Label>
                  <p>{selectedRequest.city}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={getStatusVariant(selectedRequest.status)} className="capitalize">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Submitted</Label>
                  <p>{selectedRequest.createdAt ? format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Victim Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedRequest.victim.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedRequest.victim.phone}</span>
                    </div>
                    {selectedRequest.victim.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.victim.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Accused Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedRequest.accused.name}</span>
                    </div>
                    {selectedRequest.accused.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.accused.phone}</span>
                      </div>
                    )}
                    {selectedRequest.accused.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.accused.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest.lawyerResponse && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Lawyer Response</Label>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedRequest.lawyerResponse}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accepted' ? 'Accept' : 'Reject'} Case Request
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'accepted' 
                ? 'Accepting this request will create a new case and notify the client.'
                : 'Please provide a reason for rejecting this case request.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="response">
                {responseAction === 'accepted' ? 'Acceptance Message (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="response"
                value={lawyerResponse}
                onChange={(e) => setLawyerResponse(e.target.value)}
                placeholder={
                  responseAction === 'accepted' 
                    ? 'Welcome message for the client...'
                    : 'Please provide a reason for rejection...'
                }
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsResponseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={updateCaseRequestMutation.isPending}
                variant={responseAction === 'accepted' ? 'default' : 'destructive'}
              >
                {updateCaseRequestMutation.isPending ? 'Sending...' : 
                 responseAction === 'accepted' ? 'Accept Request' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CaseRequestCardProps {
  request: CaseRequestWithDetails;
  onViewDetails: (request: CaseRequestWithDetails) => void;
  onRespond: (request: CaseRequestWithDetails, action: 'accepted' | 'rejected') => void;
  showActions: boolean;
}

function CaseRequestCard({ request, onViewDetails, onRespond, showActions }: CaseRequestCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{request.title}</CardTitle>
          <Badge variant={getStatusVariant(request.status)} className="capitalize">
            <span className="flex items-center gap-1">
              {getStatusIcon(request.status)}
              {request.status}
            </span>
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-4 text-sm">
          <span className="capitalize">{request.caseType}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {request.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {request.createdAt ? format(new Date(request.createdAt), 'MMM dd') : 'N/A'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {request.description}
          </p>

          <div className="text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <User className="h-4 w-4" />
              <span>Victim: {request.victim.name}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(request)}
              className="flex-1"
            >
              View Details
            </Button>
            
            {showActions && (
              <>
                <Button
                  size="sm"
                  onClick={() => onRespond(request, 'accepted')}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRespond(request, 'rejected')}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}