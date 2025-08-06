import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { X, Upload, Trash2 } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { InsertCase, PoliceStation } from "@shared/schema";

interface CaseFormProps {
  onClose: () => void;
}

export default function CaseForm({ onClose }: CaseFormProps) {
  const [formData, setFormData] = useState<Partial<InsertCase>>({
    title: "",
    description: "",
    caseType: "fraud",
    victim: {
      name: "",
      phone: "",
      email: "",
    },
    accused: {
      name: "",
      phone: "",
      address: "",
    },
    city: "",
    policeStationId: "",
    clientId: authService.getUser()?._id || "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: policeStations = [] } = useQuery({
    queryKey: ['/api/police-stations', formData.city],
    enabled: !!formData.city,
  });

  const createCase = useMutation({
    mutationFn: async (data: { caseData: Partial<InsertCase>; files: File[] }) => {
      const formDataObj = new FormData();
      
      // Add case data
      Object.entries(data.caseData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            formDataObj.append(key, JSON.stringify(value));
          } else {
            formDataObj.append(key, value.toString());
          }
        }
      });
      
      // Add files
      data.files.forEach(file => {
        formDataObj.append('documents', file);
      });

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
        },
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error('Failed to create case');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      onClose();
    },
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof InsertCase] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.victim?.name || 
        !formData.accused?.name || !formData.policeStationId) {
      alert('Please fill in all required fields');
      return;
    }

    createCase.mutate({
      caseData: formData,
      files: selectedFiles,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Create New Case</h3>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Basic Case Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Case Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter case title"
            required
          />
        </div>
        <div>
          <Label htmlFor="caseType">Case Type *</Label>
          <Select
            value={formData.caseType}
            onValueChange={(value) => handleInputChange('caseType', value)}
          >
            <SelectTrigger>
              <SelectValue />
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
      </div>

      <div>
        <Label htmlFor="description">Case Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the case details..."
          rows={4}
          required
        />
      </div>

      {/* Victim and Accused Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Victim Details</h4>
          <div>
            <Label htmlFor="victimName">Full Name *</Label>
            <Input
              id="victimName"
              value={formData.victim?.name}
              onChange={(e) => handleInputChange('victim.name', e.target.value)}
              placeholder="Enter victim's full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="victimPhone">Contact Number *</Label>
            <Input
              id="victimPhone"
              value={formData.victim?.phone}
              onChange={(e) => handleInputChange('victim.phone', e.target.value)}
              placeholder="Enter contact number"
              required
            />
          </div>
          <div>
            <Label htmlFor="victimEmail">Email Address</Label>
            <Input
              id="victimEmail"
              type="email"
              value={formData.victim?.email}
              onChange={(e) => handleInputChange('victim.email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Accused Details</h4>
          <div>
            <Label htmlFor="accusedName">Full Name *</Label>
            <Input
              id="accusedName"
              value={formData.accused?.name}
              onChange={(e) => handleInputChange('accused.name', e.target.value)}
              placeholder="Enter accused's full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="accusedPhone">Contact Number</Label>
            <Input
              id="accusedPhone"
              value={formData.accused?.phone}
              onChange={(e) => handleInputChange('accused.phone', e.target.value)}
              placeholder="Enter contact number"
            />
          </div>
          <div>
            <Label htmlFor="accusedAddress">Known Address</Label>
            <Textarea
              id="accusedAddress"
              value={formData.accused?.address}
              onChange={(e) => handleInputChange('accused.address', e.target.value)}
              placeholder="Enter known address"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="city">City *</Label>
          <Select
            value={formData.city}
            onValueChange={(value) => handleInputChange('city', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delhi">Delhi</SelectItem>
              <SelectItem value="mumbai">Mumbai</SelectItem>
              <SelectItem value="bangalore">Bangalore</SelectItem>
              <SelectItem value="chennai">Chennai</SelectItem>
              <SelectItem value="kolkata">Kolkata</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="policeStation">Police Station *</Label>
          <Select
            value={formData.policeStationId}
            onValueChange={(value) => handleInputChange('policeStationId', value)}
            disabled={!formData.city}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select police station" />
            </SelectTrigger>
            <SelectContent>
              {policeStations.map((station: PoliceStation) => (
                <SelectItem key={station._id} value={station._id!}>
                  {station.name} - {station.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <Label>Upload Documents</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-legal-blue transition-colors">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Support for PDF, DOC, DOCX, JPG, PNG files up to 10MB each
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              id="document-upload"
            />
            <Label
              htmlFor="document-upload"
              className="bg-legal-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
            >
              Choose Files
            </Label>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <div className="flex space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createCase.isPending}
            className="bg-legal-blue hover:bg-blue-700 text-white"
          >
            {createCase.isPending ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </div>
    </form>
  );
}
