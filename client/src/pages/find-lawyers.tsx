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

      {selectedLawyer ? (
        /* Full Width Lawyer Profile View */
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Award className="mr-2 text-green-600" size={20} />
                Lawyer Profile
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedLawyer(null)}
                className="text-gray-600"
              >
                ← Back to List
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Enhanced Profile Header */}
              <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200/50">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedLawyer.name}</h2>
                <p className="text-gray-600 font-medium mb-4 text-lg">{selectedLawyer.city}</p>
                <div className="flex items-center justify-center bg-white/70 rounded-full px-6 py-3 backdrop-blur-sm">
                  <div className="flex items-center">
                    <Star className="text-yellow-500 fill-current" size={20} />
                    <span className="ml-2 text-xl font-bold text-gray-900">4.8</span>
                  </div>
                  <span className="text-gray-400 mx-3">•</span>
                  <span className="text-gray-600 font-medium">127 reviews</span>
                </div>
              </div>

              {/* Enhanced Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200/50 shadow-sm">
                  <Briefcase className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{selectedLawyer.stats?.totalCases || 3}</div>
                  <div className="font-medium text-gray-600">Total Cases</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200/50 shadow-sm">
                  <Award className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-blue-600 mb-2">{selectedLawyer.stats?.wonCases || 2}</div>
                  <div className="font-medium text-gray-600">Cases Won</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl border border-purple-200/50 shadow-sm">
                  <Clock className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-purple-600 mb-2">{selectedLawyer.experience || 5}</div>
                  <div className="font-medium text-gray-600">Years Experience</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl border border-amber-200/50 shadow-sm">
                  <Star className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-amber-600 mb-2">4.8</div>
                  <div className="font-medium text-gray-600">Rating</div>
                </div>
              </div>

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Specializations */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Award className="mr-2 text-blue-600" size={20} />
                    Legal Specializations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedLawyer.specialization || ['Criminal Law', 'Corporate Law', 'Civil Rights']).map((spec, index) => (
                      <div key={index} className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="font-medium text-gray-700 capitalize">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Phone className="mr-2 text-green-600" size={20} />
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200">
                      <Phone className="text-green-600 mr-3" size={18} />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{selectedLawyer.phone || '+91 98765 43210'}</div>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200">
                      <Mail className="text-blue-600 mr-3" size={18} />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{selectedLawyer.email || 'lawyer@example.com'}</div>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200">
                      <MapPin className="text-purple-600 mr-3" size={18} />
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="font-medium">{selectedLawyer.city}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="mr-2 text-indigo-600" size={20} />
                  Professional Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                      {Math.round(((selectedLawyer.stats?.wonCases || 2) / (selectedLawyer.stats?.totalCases || 3)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">&lt; 2hr</div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">Hindi, English</div>
                    <div className="text-sm text-gray-600">Languages</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleSendCaseRequest(selectedLawyer)}
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg text-lg"
                >
                  <MessageCircle className="mr-3" size={20} />
                  Send Case Request
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 px-8 border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-medium rounded-xl"
                >
                  <Phone className="mr-2" size={18} />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
                >
                  <Star className="mr-2" size={18} />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Lawyers List */
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
                    className="group p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md border-gray-200 hover:border-green-300"
                    onClick={() => setSelectedLawyer(lawyer)}
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
                          <ChevronRight className="text-gray-400" size={20} />
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
      )}

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