import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/auth";
import type { Lawyer } from "@shared/schema";

export default function FindLawyers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  
  const user = authService.getUser();

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

  const handleSendCaseRequest = (lawyer: Lawyer) => {
    // TODO: Implement case request functionality
    console.log("Sending case request to:", lawyer.name);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-2">Find Expert Lawyers</h1>
        <p className="text-green-100 text-lg">
          Connect with qualified legal professionals specialized in your case type
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lawyers List */}
        <div className="lg:col-span-2">
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
                      className={`group p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedLawyer?._id === lawyer._id
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedLawyer(lawyer)}
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-green-100 text-green-600 text-xl font-semibold">
                            {lawyer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{lawyer.name}</h3>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="text-yellow-500 fill-current" size={16} />
                                <span className="ml-1 text-sm font-medium">4.8</span>
                              </div>
                              <ChevronRight 
                                className={`transition-transform ${
                                  selectedLawyer?._id === lawyer._id ? 'rotate-90' : ''
                                }`} 
                                size={16} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
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

                          <div className="flex flex-wrap gap-2 mb-4">
                            {lawyer.specialization?.slice(0, 4).map((spec) => (
                              <Badge 
                                key={spec} 
                                variant="outline" 
                                className="bg-green-50 text-green-700 border-green-200 capitalize"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>0 total cases</span>
                              <span>•</span>
                              <span>0 won</span>
                            </div>
                            
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendCaseRequest(lawyer);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <MessageCircle className="mr-2" size={16} />
                              Send Case Request
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Lawyer Profile Detail */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Award className="mr-2 text-green-600" size={20} />
                Lawyer Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLawyer ? (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarFallback className="bg-green-100 text-green-600 text-3xl font-bold">
                        {selectedLawyer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedLawyer.name}</h3>
                    <p className="text-gray-600 mb-2">{selectedLawyer.city}</p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex items-center">
                        <Star className="text-yellow-500 fill-current" size={16} />
                        <span className="ml-1 text-sm font-medium">4.8</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-600">127 reviews</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedLawyer.experience}</div>
                      <div className="text-xs text-gray-600">Years Experience</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">85%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLawyer.specialization?.map((spec) => (
                        <Badge 
                          key={spec} 
                          className="bg-green-100 text-green-800 capitalize"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                      onClick={() => handleSendCaseRequest(selectedLawyer)}
                    >
                      <MessageCircle className="mr-2" size={18} />
                      Send Case Request
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-10">
                        <Phone className="mr-2" size={16} />
                        Call
                      </Button>
                      <Button variant="outline" className="h-10">
                        <Mail className="mr-2" size={16} />
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Quick Facts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium">&lt; 2 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cases Handled:</span>
                        <span className="font-medium">200+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Languages:</span>
                        <span className="font-medium">Hindi, English</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Select a lawyer to view their profile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}