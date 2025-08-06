import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CloudinaryUpload from "./CloudinaryUpload";
import type { Lawyer } from "@shared/schema";

interface ClientCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLawyer?: Lawyer | null;
}

export default function ClientCaseForm({ isOpen, onClose, selectedLawyer }: ClientCaseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseType: '',
    city: '',
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
    documents: [] as string[],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch police stations based on selected city
  const { data: policeStations = [] } = useQuery({
    queryKey: ['/api/police-stations', formData.city],
    enabled: !!formData.city,
  });

  const createCase = useMutation({
    mutationFn: async (data: any) => {
      // Get the first police station for the selected city
      const policeStation = policeStations.length > 0 ? policeStations[0] : null;
      
      // Add required fields that might be missing
      const caseData = {
        ...data,
        status: 'submitted',
        policeStationId: policeStation?._id || '68939cf0eb6ef63a16eb8420', // Use police station from city or fallback
        victim: {
          name: data.victim.name || 'Unknown',
          phone: data.victim.phone || 'N/A',
          email: data.victim.email || '',
        },
        accused: {
          name: data.accused.name || 'Unknown',
          phone: data.accused.phone || '',
          address: data.accused.address || '',
        },
      };
      
      const formDataObj = new FormData();
      Object.keys(caseData).forEach(key => {
        if (key === 'victim' || key === 'accused') {
          formDataObj.append(key, JSON.stringify(caseData[key]));
        } else {
          formDataObj.append(key, caseData[key]);
        }
      });
      
      const response = await apiRequest('POST', '/api/cases', formDataObj);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Created Successfully",
        description: "Your legal case request has been submitted and is under review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create case",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      caseType: '',
      city: '',
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
      documents: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.caseType || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      lawyerId: selectedLawyer?._id || undefined,
    };

    createCase.mutate(submitData);
  };

  const handleDocumentUpload = (documentUrls: string[]) => {
    setFormData(prev => ({ ...prev, documents: documentUrls }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Legal Assistance</DialogTitle>
          {selectedLawyer && (
            <p className="text-sm text-gray-600">
              Requesting assistance from: <span className="font-medium">{selectedLawyer.name}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Case Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Case Information</h3>
            
            <div>
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of your legal issue"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed information about your legal case..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseType">Case Type *</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                    <SelectItem value="Kolkata">Kolkata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Victim Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Victim Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="victimName">Victim Name</Label>
                <Input
                  id="victimName"
                  value={formData.victim.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    victim: { ...prev.victim, name: e.target.value }
                  }))}
                  placeholder="Full name of victim"
                />
              </div>

              <div>
                <Label htmlFor="victimPhone">Victim Phone</Label>
                <Input
                  id="victimPhone"
                  value={formData.victim.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    victim: { ...prev.victim, phone: e.target.value }
                  }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="victimEmail">Victim Email</Label>
              <Input
                id="victimEmail"
                type="email"
                value={formData.victim.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  victim: { ...prev.victim, email: e.target.value }
                }))}
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Accused Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Accused Information (if known)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accusedName">Accused Name</Label>
                <Input
                  id="accusedName"
                  value={formData.accused.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    accused: { ...prev.accused, name: e.target.value }
                  }))}
                  placeholder="Full name of accused"
                />
              </div>

              <div>
                <Label htmlFor="accusedPhone">Accused Phone</Label>
                <Input
                  id="accusedPhone"
                  value={formData.accused.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    accused: { ...prev.accused, phone: e.target.value }
                  }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accusedAddress">Accused Address</Label>
              <Textarea
                id="accusedAddress"
                value={formData.accused.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  accused: { ...prev.accused, address: e.target.value }
                }))}
                placeholder="Address information"
                rows={2}
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supporting Documents</h3>
            <CloudinaryUpload
              onUpload={handleDocumentUpload}
              maxFiles={5}
              label="Upload Evidence & Documents"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createCase.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCase.isPending}
              className="bg-legal-blue hover:bg-blue-700"
            >
              {createCase.isPending ? "Submitting..." : "Submit Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}