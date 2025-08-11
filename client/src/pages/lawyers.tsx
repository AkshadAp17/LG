import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import LawyerCard from "@/components/LawyerCard";
import LawyerProfileModal from "@/components/LawyerProfileModal";
import ClientCaseForm from "@/components/ClientCaseForm";
import WinLossChart from "@/components/WinLossChart";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import type { Lawyer } from "@shared/schema";

export default function Lawyers() {
  const [filters, setFilters] = useState({
    city: "",
    caseType: "",
  });
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const { toast } = useToast();
  const user = authService.getUser();

  const { data: lawyers = [], isLoading } = useQuery({
    queryKey: ['/api/lawyers', filters.city, filters.caseType],
    queryFn: ({ queryKey }) => {
      const url = new URL('/api/lawyers', window.location.origin);
      if (queryKey[1]) url.searchParams.set('city', queryKey[1] as string);
      if (queryKey[2]) url.searchParams.set('caseType', queryKey[2] as string);
      return fetch(url.toString()).then(res => res.json());
    },
  });

  const handleSearch = () => {
    // The query will automatically refetch due to the dependency on filters
  };

  const handleSelectLawyer = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setShowProfileModal(true);
  };

  const handleChooseLawyer = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setShowProfileModal(false);
    setShowCaseForm(true);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Find Lawyers</h2>
          {user?.role === 'client' && (
            <Button
              onClick={() => setShowCaseForm(true)}
              className="bg-legal-blue hover:bg-blue-700 text-white"
            >
              Request Legal Help
            </Button>
          )}
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="caseType">Case Type</Label>
                <Select
                  value={filters.caseType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, caseType: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={filters.city}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                    <SelectItem value="kolkata">Kolkata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="bg-legal-blue hover:bg-blue-700 text-white w-full"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Lawyers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lawyers List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Lawyers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading lawyers...</div>
              ) : lawyers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No lawyers found matching your criteria
                </div>
              ) : (
                <div className="space-y-4">
                  {lawyers.map((lawyer: Lawyer) => (
                    <LawyerCard
                      key={lawyer._id}
                      lawyer={lawyer}
                      onSelect={handleSelectLawyer}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lawyer Profile */}
        <div>
          <Card className="h-[140px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lawyer Profile</CardTitle>
            </CardHeader>
            <CardContent className="h-full p-4">
              {selectedLawyer ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-legal-blue rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold">
                      {selectedLawyer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{selectedLawyer.name}</h4>
                    <p className="text-legal-blue font-medium text-xs">
                      {selectedLawyer.specialization.join(', ')} Law
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedLawyer.experience} years exp.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-sm font-bold text-legal-blue">
                        {selectedLawyer.stats.totalCases}
                      </p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-sm font-bold text-legal-emerald">
                        {selectedLawyer.stats.wonCases}
                      </p>
                      <p className="text-xs text-gray-600">Won</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-sm font-bold text-red-500">
                        {selectedLawyer.stats.lostCases}
                      </p>
                      <p className="text-xs text-gray-600">Lost</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Win/Loss Statistics</h5>
                    <WinLossChart 
                      wonCases={selectedLawyer.stats.wonCases}
                      lostCases={selectedLawyer.stats.lostCases}
                    />
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Specializations</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedLawyer.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-legal-blue text-white text-sm rounded-full"
                        >
                          {spec} Law
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="flex-1 bg-legal-blue hover:bg-blue-700 text-white">
                      Contact Lawyer
                    </Button>
                    <Button variant="outline">
                      View Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a lawyer to view their profile
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lawyer Profile Modal */}
      <LawyerProfileModal
        lawyer={selectedLawyer}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSelectLawyer={user?.role === 'client' ? handleChooseLawyer : undefined}
      />

      {/* Client Case Form */}
      <ClientCaseForm
        isOpen={showCaseForm}
        onClose={() => setShowCaseForm(false)}
        selectedLawyer={selectedLawyer}
      />
    </div>
  );
}
