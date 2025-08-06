import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Star, Briefcase, MessageCircle } from 'lucide-react';
import type { User } from '@shared/schema';
import SimpleCaseForm from '@/components/SimpleCaseForm';

// Simplified case request data type
type SimpleCaseRequestData = {
  title: string;
  description: string;
  victimName: string;
  accusedName: string;
  clientPhone: string;
  clientEmail?: string;
  lawyerId: string;
};

export default function FindLawyers() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCaseType, setSelectedCaseType] = useState<string>('');
  const [selectedLawyer, setSelectedLawyer] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lawyers = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'lawyer', city: selectedCity, caseType: selectedCaseType }],
    queryFn: async () => {
      const params = new URLSearchParams({ role: 'lawyer' });
      if (selectedCity && selectedCity !== 'all') params.append('city', selectedCity);
      if (selectedCaseType && selectedCaseType !== 'all') params.append('caseType', selectedCaseType);
      const response = await apiRequest('GET', `/api/users?${params}`);
      const data = await response.json();
      // Filter data based on criteria
      let filteredData = data;
      if (selectedCity && selectedCity !== 'all') {
        filteredData = filteredData.filter((lawyer: User) => lawyer.city === selectedCity);
      }
      if (selectedCaseType && selectedCaseType !== 'all') {
        filteredData = filteredData.filter((lawyer: User) => 
          lawyer.specialization?.includes(selectedCaseType)
        );
      }
      return filteredData as User[];
    },
  });

  const createCaseRequestMutation = useMutation({
    mutationFn: async (data: SimpleCaseRequestData) => {
      const response = await apiRequest('POST', '/api/case-requests', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Case request sent successfully! The lawyer will complete the detailed form.',
      });
      setIsDialogOpen(false);
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

  const handleCaseRequest = (data: SimpleCaseRequestData) => {
    createCaseRequestMutation.mutate(data);
  };

  const handleSendRequest = (lawyer: User) => {
    setSelectedLawyer(lawyer);
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
        <p className="text-gray-600">Browse experienced lawyers and send simple case requests</p>
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
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCaseType} onValueChange={setSelectedCaseType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by case type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Case Types</SelectItem>
            {caseTypes.map((type) => (
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
            <p>No lawyers found matching your criteria</p>
            <p className="text-sm mt-2">Try adjusting your filters or check back later for more lawyers.</p>
          </div>
        ) : (
          lawyers.map((lawyer) => (
            <Card key={lawyer._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {lawyer.name?.charAt(0)?.toUpperCase() || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lawyer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lawyer.city}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {lawyer.experience} years experience
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {lawyer.rating || 'No rating'} rating
                    </span>
                  </div>

                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Specializations:</p>
                      <div className="flex flex-wrap gap-1">
                        {lawyer.specialization.map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lawyer.stats && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Cases:</span> {lawyer.stats.totalCases || 0} total,{' '}
                      {lawyer.stats.wonCases || 0} won
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSendRequest(lawyer)}
                      className="flex-1"
                      data-testid={`button-send-request-${lawyer._id}`}
                    >
                      Send Case Request
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      data-testid={`button-message-${lawyer._id}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Simple Case Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedLawyer && (
            <SimpleCaseForm
              lawyerName={selectedLawyer.name}
              lawyerId={selectedLawyer._id!}
              onSubmit={handleCaseRequest}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={createCaseRequestMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}