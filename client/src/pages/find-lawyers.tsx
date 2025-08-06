import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Star, Briefcase, MessageCircle } from 'lucide-react';
import type { User } from '@shared/schema';

const caseRequestSchema = z.object({
  lawyerId: z.string().min(1, 'Please select a lawyer'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  caseType: z.enum(['fraud', 'theft', 'murder', 'civil', 'corporate']),
  victim: z.object({
    name: z.string().min(1, 'Victim name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email().optional().or(z.literal('')),
  }),
  accused: z.object({
    name: z.string().min(1, 'Accused name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  city: z.string().min(1, 'City is required'),
  policeStationId: z.string().min(1, 'Police station is required'),
});

type CaseRequestFormData = z.infer<typeof caseRequestSchema>;

export default function FindLawyers() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCaseType, setSelectedCaseType] = useState<string>('');
  const [selectedLawyer, setSelectedLawyer] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lawyers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'lawyer', city: selectedCity, caseType: selectedCaseType }],
    queryFn: async () => {
      const params = new URLSearchParams({ role: 'lawyer' });
      if (selectedCity && selectedCity !== 'all') params.append('city', selectedCity);
      if (selectedCaseType && selectedCaseType !== 'all') params.append('caseType', selectedCaseType);
      const response = await apiRequest('GET', `/api/users?${params}`);
      return response as unknown as User[];
    },
  });

  const { data: policeStations = [] } = useQuery<any[]>({
    queryKey: ['/api/police-stations'],
  });

  const form = useForm<CaseRequestFormData>({
    resolver: zodResolver(caseRequestSchema),
    defaultValues: {
      lawyerId: '',
      title: '',
      description: '',
      caseType: 'civil',
      victim: {
        name: '',
        phone: '',
        email: '',
      },
      accused: {
        name: '',
        phone: '',
        address: '',
      },
      city: '',
      policeStationId: '',
    },
  });

  const createCaseRequestMutation = useMutation({
    mutationFn: async (data: CaseRequestFormData) => {
      const response = await fetch('/api/case-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send case request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Case Request Sent',
        description: 'Your case request has been sent to the lawyer. You will be notified of their response.',
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/case-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send case request',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CaseRequestFormData) => {
    if (selectedLawyer) {
      createCaseRequestMutation.mutate({
        ...data,
        lawyerId: selectedLawyer._id || '',
      });
    }
  };

  const handleSendRequest = (lawyer: User) => {
    setSelectedLawyer(lawyer);
    form.setValue('lawyerId', lawyer._id!);
    setIsDialogOpen(true);
  };

  const cities = Array.from(new Set(Array.isArray(lawyers) ? lawyers.map((l: User) => l.city).filter(Boolean) : []));
  const caseTypes = ['fraud', 'theft', 'murder', 'civil', 'corporate'];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Lawyers</h1>
        <p className="text-gray-600">Browse experienced lawyers and send case requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {Array.from(cities).filter(Boolean).map((city: string) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCaseType} onValueChange={setSelectedCaseType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by case type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Case Types</SelectItem>
            {caseTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lawyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-gray-500">
            Loading lawyers...
          </div>
        ) : !Array.isArray(lawyers) || lawyers.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No lawyers found matching your criteria
          </div>
        ) : lawyers.map((lawyer: User) => (
          <Card key={lawyer._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={lawyer.image} alt={lawyer.name} />
                <AvatarFallback>{lawyer.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{lawyer.name}</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {lawyer.city}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{lawyer.rating || 4.5}/5</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({lawyer.stats?.totalCases || 0} cases)
                  </span>
                </div>

                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span className="text-sm text-gray-600">{lawyer.experience || 0} years experience</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {lawyer.specialization?.slice(0, 3).map((spec: string) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>

                {lawyer.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {lawyer.description}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => handleSendRequest(lawyer)}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Case Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Case Request to {selectedLawyer?.name}</DialogTitle>
            <DialogDescription>
              Provide details about your case. The lawyer will review and respond to your request.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief title for your case" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select case type" />
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

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City where case occurred" {...field} />
                      </FormControl>
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
                      <Textarea 
                        placeholder="Provide detailed description of your case..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="font-semibold">Victim Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="victim.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Victim Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="victim.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="victim.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Accused Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accused.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accused Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accused.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accused.address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="policeStationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Police Station</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select police station" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(policeStations as any[]).map((station: any) => (
                          <SelectItem key={station._id} value={station._id}>
                            {station.name} - {station.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCaseRequestMutation.isPending}
                >
                  {createCaseRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}