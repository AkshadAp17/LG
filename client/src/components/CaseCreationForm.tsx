import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, User, MapPin, Phone, Mail, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const caseCreationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  caseType: z.enum(['fraud', 'theft', 'murder', 'civil', 'corporate']),
  victimName: z.string().min(1, 'Victim name is required'),
  victimPhone: z.string().min(10, 'Valid victim phone is required'),
  victimEmail: z.string().email().optional().or(z.literal('')),
  accusedName: z.string().min(1, 'Accused name is required'),
  accusedPhone: z.string().optional(),
  accusedAddress: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  policeStationId: z.string().min(1, 'Police station is required'),
  pnr: z.string().min(1, 'PNR is required'),
  hearingDate: z.string().optional(),
});

type CaseCreationForm = z.infer<typeof caseCreationSchema>;

interface CaseCreationFormProps {
  caseRequestId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CaseCreationForm({ caseRequestId, onSuccess, onCancel }: CaseCreationFormProps) {
  const [autoMode, setAutoMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get case request details with client information
  const { data: caseRequestDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/case-requests/${caseRequestId}/details`],
    enabled: !!caseRequestId,
  });

  const form = useForm<CaseCreationForm>({
    resolver: zodResolver(caseCreationSchema),
    defaultValues: {
      title: '',
      description: '',
      caseType: 'civil',
      victimName: '',
      victimPhone: '',
      victimEmail: '',
      accusedName: '',
      accusedPhone: '',
      accusedAddress: '',
      city: '',
      policeStationId: '',
      pnr: '',
      hearingDate: '',
    },
  });

  // Auto-populate form when case request details are loaded
  useEffect(() => {
    if (caseRequestDetails && typeof caseRequestDetails === 'object') {
      const client = (caseRequestDetails as any).clientDetails;
      const request = caseRequestDetails as any;
      form.reset({
        title: request.title || '',
        description: request.description || '',
        caseType: request.caseType || 'civil',
        victimName: request.victimName || request.victim?.name || client?.name || '',
        victimPhone: request.victim?.phone || request.clientPhone || client?.phone || '',
        victimEmail: request.victim?.email || request.clientEmail || client?.email || '',
        accusedName: request.accusedName || request.accused?.name || '',
        accusedPhone: request.accused?.phone || '',
        accusedAddress: request.accused?.address || '',
        city: client?.city || '',
        policeStationId: request.availablePoliceStations?.[0]?._id || '',
        pnr: generatePNR(),
        hearingDate: '',
      });
    }
  }, [caseRequestDetails, form]);

  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseCreationForm) => {
      const response = await apiRequest('POST', `/api/case-requests/${caseRequestId}/create-case`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Case Created Successfully',
        description: `Case "${data.case.title}" has been created with PNR: ${data.case.pnr}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/case-requests'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create case',
        variant: 'destructive',
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async ({ autoCreate = true }: { autoCreate?: boolean }) => {
      const response = await apiRequest('PATCH', `/api/case-requests/${caseRequestId}`, {
        status: 'accepted',
        lawyerResponse: 'Case request accepted. Creating official case.',
        autoCreateCase: autoCreate,
        caseDetails: autoCreate ? form.getValues() : null,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.createdCase) {
        toast({
          title: 'Case Created Automatically',
          description: `Case has been created and submitted for review.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
        queryClient.invalidateQueries({ queryKey: ['/api/case-requests'] });
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'destructive',
      });
    },
  });

  function generatePNR(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `PNR${year}${random}`;
  }

  const handleAutoAccept = () => {
    acceptRequestMutation.mutate({ autoCreate: true });
  };

  const handleManualSubmit = (data: CaseCreationForm) => {
    createCaseMutation.mutate(data);
  };

  if (isLoadingDetails) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading case request details...</div>
        </CardContent>
      </Card>
    );
  }

  if (!caseRequestDetails) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Case request not found.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const client = (caseRequestDetails as any)?.clientDetails;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create Case from Request
          <Badge variant="outline">Request from {client?.name}</Badge>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-mode"
            checked={autoMode}
            onCheckedChange={setAutoMode}
          />
          <Label htmlFor="auto-mode">
            {autoMode ? 'Automatic Mode' : 'Manual Mode'}
          </Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Information Display */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span><strong>Name:</strong> {client?.name || 'Not available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span><strong>Phone:</strong> {client?.phone || (caseRequestDetails as any)?.clientPhone || 'Not available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span><strong>Email:</strong> {client?.email || (caseRequestDetails as any)?.clientEmail || 'Not available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span><strong>City:</strong> {client?.city || 'Not available'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Original Request Summary */}
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Original Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Title:</strong> {(caseRequestDetails as any)?.title || 'Loading...'}</div>
            <div><strong>Description:</strong> {(caseRequestDetails as any)?.description || 'Loading...'}</div>
            <div><strong>Victim:</strong> {(caseRequestDetails as any)?.victimName || (caseRequestDetails as any)?.victim?.name || client?.name || 'Not specified'}</div>
            <div><strong>Accused:</strong> <span className="text-red-600 font-semibold">{(caseRequestDetails as any)?.accusedName || (caseRequestDetails as any)?.accused?.name || 'Not specified'}</span></div>
          </CardContent>
        </Card>

        {autoMode ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                In automatic mode, the case will be created with client details filled automatically. 
                You can review and accept the case request to proceed.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button 
                onClick={handleAutoAccept}
                disabled={acceptRequestMutation.isPending}
                className="flex-1"
              >
                {acceptRequestMutation.isPending ? 'Creating Case...' : 'Accept & Create Case Automatically'}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-6">
              <Separator />
              
              {/* Case Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fraud">Fraud</SelectItem>
                          <SelectItem value="theft">Theft</SelectItem>
                          <SelectItem value="murder">Murder</SelectItem>
                          <SelectItem value="civil">Civil</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Victim Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Victim Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="victimName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Victim Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="victimPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Victim Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="victimEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Victim Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Accused Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Accused Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="accusedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accused Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accusedPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accused Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accusedAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accused Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location and Legal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policeStationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Police Station</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select police station" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(caseRequestDetails as any)?.availablePoliceStations?.map((station: any) => (
                            <SelectItem key={station._id} value={station._id}>
                              {station.name} - {station.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pnr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PNR Number</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.setValue('pnr', generatePNR())}
                        >
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hearingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hearing Date (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={createCaseMutation.isPending}
                  className="flex-1"
                >
                  {createCaseMutation.isPending ? 'Creating Case...' : 'Create Case'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}