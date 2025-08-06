import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Scale, User, UserCheck, Shield } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { InsertUser, PoliceStation } from "@shared/schema";

const CASE_SPECIALIZATIONS = [
  'fraud', 'theft', 'murder', 'civil', 'corporate'
];

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad'
];

export default function Signup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'client' | 'lawyer' | 'police' | ''>('');
  const [formData, setFormData] = useState<Partial<InsertUser>>({
    role: undefined,
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
  });

  // Fetch police stations for police officers
  const { data: policeStations } = useQuery({
    queryKey: ['/api/police-stations', formData.city],
    enabled: selectedRole === 'police' && !!formData.city,
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      navigate("/login?registered=true");
    },
  });

  const handleRoleSelect = (role: 'client' | 'lawyer' | 'police') => {
    setSelectedRole(role);
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecializationChange = (specialization: string) => {
    const current = formData.specialization || [];
    const updated = current.includes(specialization) 
      ? current.filter(s => s !== specialization)
      : [...current, specialization];
    setFormData(prev => ({ ...prev, specialization: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role && formData.name && formData.email && formData.password && formData.phone) {
      signupMutation.mutate(formData as InsertUser);
    }
  };

  const canProceed = () => {
    if (selectedRole === 'client') {
      return formData.name && formData.email && formData.password && formData.phone && formData.city;
    } else if (selectedRole === 'lawyer') {
      return formData.name && formData.email && formData.password && formData.phone && formData.city && 
             formData.specialization?.length && formData.experience;
    } else if (selectedRole === 'police') {
      return formData.name && formData.email && formData.password && formData.phone && formData.city && 
             formData.policeStationCode;
    }
    return false;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return <User className="h-8 w-8" />;
      case 'lawyer': return <UserCheck className="h-8 w-8" />;
      case 'police': return <Shield className="h-8 w-8" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-legal-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scale className="text-legal-blue text-3xl" />
            <CardTitle className="text-2xl font-bold text-legal-blue">
              LegalCaseMS
            </CardTitle>
          </div>
          <p className="text-gray-600">Create your account</p>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Your Role</h3>
                <p className="text-sm text-gray-600">Select how you'll be using the platform</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <Card 
                  className="cursor-pointer hover:border-legal-blue hover:shadow-md transition-all"
                  onClick={() => handleRoleSelect('client')}
                >
                  <CardContent className="p-6 text-center">
                    <User className="h-12 w-12 text-legal-blue mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Client</h4>
                    <p className="text-sm text-gray-600">
                      I need legal assistance and want to file cases
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-legal-blue hover:shadow-md transition-all"
                  onClick={() => handleRoleSelect('lawyer')}
                >
                  <CardContent className="p-6 text-center">
                    <UserCheck className="h-12 w-12 text-legal-blue mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Lawyer</h4>
                    <p className="text-sm text-gray-600">
                      I provide legal services and represent clients
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-legal-blue hover:shadow-md transition-all"
                  onClick={() => handleRoleSelect('police')}
                >
                  <CardContent className="p-6 text-center">
                    <Shield className="h-12 w-12 text-legal-blue mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Police Officer</h4>
                    <p className="text-sm text-gray-600">
                      I review and approve case submissions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                {getRoleIcon(selectedRole)}
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedRole} Registration</h3>
                  <p className="text-sm text-gray-600">Fill in your information</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole === 'lawyer' && (
                  <>
                    <div className="space-y-2">
                      <Label>Specialization Areas</Label>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                        {CASE_SPECIALIZATIONS.map(spec => (
                          <label key={spec} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.specialization?.includes(spec) || false}
                              onChange={() => handleSpecializationChange(spec)}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        placeholder="Enter years of experience"
                        value={formData.experience || ''}
                        onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Professional Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell us about your practice and experience..."
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'police' && formData.city && (
                  <div className="space-y-2">
                    <Label htmlFor="policeStationCode">Police Station</Label>
                    <Select 
                      value={formData.policeStationCode} 
                      onValueChange={(value) => handleInputChange('policeStationCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your police station" />
                      </SelectTrigger>
                      <SelectContent>
                        {policeStations?.map((station: PoliceStation) => (
                          <SelectItem key={station.code} value={station.code}>
                            {station.name} ({station.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {signupMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {(signupMutation.error as any)?.message || "Registration failed"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-legal-blue hover:bg-blue-700"
                    disabled={signupMutation.isPending || !canProceed()}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-legal-blue hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}