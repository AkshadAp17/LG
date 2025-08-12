import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  MapPin,
  Star,
  Calendar,
  Award,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Users,
  Briefcase,
  Clock,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import SimpleCaseForm from "@/components/SimpleCaseForm";
import type { Lawyer } from "@shared/schema";

export default function FindLawyers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showCaseRequestModal, setShowCaseRequestModal] = useState(false);
  const [requestingLawyer, setRequestingLawyer] = useState<Lawyer | null>(null);
  
  const user = authService.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lawyers = [], isLoading } = useQuery<Lawyer[]>({
    queryKey: ['/api/lawyers'],
  });

  const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad"];
  const specializations = ["fraud", "theft", "murder", "civil", "corporate"];

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === "all" || lawyer.city === selectedCity;
    const matchesSpec = selectedSpecialization === "all" || 
      lawyer.specialization?.includes(selectedSpecialization);
    
    return matchesSearch && matchesCity && matchesSpec;
  });

  // Mutation for creating case request
  const createCaseRequest = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/case-requests', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Request Sent!",
        description: `Your case request has been sent to ${requestingLawyer?.name}. They will review and respond soon.`,
      });
      setShowCaseRequestModal(false);
      setRequestingLawyer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/case-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Request",
        description: error.message || "Failed to send case request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendCaseRequest = (lawyer: Lawyer) => {
    setRequestingLawyer(lawyer);
    setShowCaseRequestModal(true);
  };

  const handleCaseRequestSubmit = (data: any) => {
    createCaseRequest.mutate(data);
  };

  const handleCaseRequestCancel = () => {
    setShowCaseRequestModal(false);
    setRequestingLawyer(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 text-white rounded-xl p-6 shadow-2xl border border-emerald-300/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 rounded-lg backdrop-blur-sm">
            <Users className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Legal Expert Network
            </h1>
            <p className="text-emerald-200 text-lg flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Verified lawyers</span>
              </div>
              <span>•</span>
              <span>Connect with qualified legal professionals</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search lawyers or cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-12">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger className="h-12">
                <Briefcase className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Case type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec} className="capitalize">{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="h-12 bg-green-600 hover:bg-green-700 text-white">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lawyers List - Full Width */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="mr-2 text-green-600" size={20} />
              Available Lawyers ({filteredLawyers.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredLawyers.map((lawyer) => (
                <div 
                  key={lawyer._id} 
                  className="group p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md border-gray-200 hover:border-green-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">{lawyer.name}</h3>
                          <div className="flex items-center">
                            <Star className="text-yellow-500 fill-current" size={16} />
                            <span className="ml-1 text-sm font-medium">4.8</span>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <Button 
                          onClick={() => handleSendCaseRequest(lawyer)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <MessageCircle className="mr-2" size={16} />
                          Send Case Request
                        </Button>
                      </div>
                      
                      {/* Info Row */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {lawyer.city}
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {lawyer.experience} years exp.
                        </div>
                        <div className="flex items-center">
                          <Award size={14} className="mr-1" />
                          85% Success Rate
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="flex flex-wrap gap-2">
                        {lawyer.specialization?.slice(0, 4).map((spec) => (
                          <Badge 
                            key={spec} 
                            variant="outline" 
                            className="bg-green-50 text-green-700 border-green-200 capitalize text-xs"
                          >
                            {spec}
                          </Badge>
                        ))}
                        {lawyer.specialization && lawyer.specialization.length > 4 && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                            +{lawyer.specialization.length - 4} more
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{lawyer.stats?.totalCases || 3} total cases</span>
                        <span>•</span>
                        <span>{lawyer.stats?.wonCases || 2} won</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Case Request Modal */}
      <Dialog open={showCaseRequestModal} onOpenChange={setShowCaseRequestModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Send Case Request</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCaseRequestCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {requestingLawyer && (
            <SimpleCaseForm
              lawyerName={requestingLawyer.name}
              lawyerId={requestingLawyer._id!}
              onSubmit={handleCaseRequestSubmit}
              onCancel={handleCaseRequestCancel}
              isSubmitting={createCaseRequest.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}