import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, User, UserCheck, Shield, Mail, Lock, Phone, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData, AuthResponse, InsertUser } from "@shared/schema";

const CASE_SPECIALIZATIONS = [
  'fraud', 'theft', 'murder', 'civil', 'corporate'
];

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad'
];

export default function Login() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  
  // Login state
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });

  // Signup state
  const [selectedRole, setSelectedRole] = useState<'client' | 'lawyer' | 'police' | ''>('');
  const [signupData, setSignupData] = useState<Partial<InsertUser>>({
    role: undefined,
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      authService.setToken(data.token);
      authService.setUser(data.user);
      navigate("/dashboard");
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      setActiveTab("login");
      // Clear signup form
      setSignupData({
        role: undefined,
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
      });
      setSelectedRole('');
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.role && signupData.name && signupData.email && signupData.password && signupData.phone) {
      signupMutation.mutate(signupData as InsertUser);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignupChange = (field: string, value: string | number) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecializationChange = (specialization: string) => {
    const current = signupData.specialization || [];
    const updated = current.includes(specialization) 
      ? current.filter(s => s !== specialization)
      : [...current, specialization];
    setSignupData(prev => ({ ...prev, specialization: updated }));
  };

  const handleRoleSelect = (role: 'client' | 'lawyer' | 'police') => {
    setSelectedRole(role);
    setSignupData(prev => ({ ...prev, role }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <Scale className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LegalCaseMS</h1>
          <p className="text-gray-600 text-lg">Professional Legal Case Management System</p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-xl p-1">
                <TabsTrigger 
                  value="login" 
                  className="h-10 rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="h-10 rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-600 mt-2">Sign in to access your legal cases</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                {loginMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {(loginMutation.error as any)?.message || 'Login failed'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-base font-medium flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-base font-medium flex items-center gap-2">
                    <Lock size={16} />
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>


            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Create Account</h2>
                <p className="text-gray-600 mt-2">Join our legal case management platform</p>
              </div>

              {!selectedRole ? (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium text-center mb-6">Select Your Role</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
                      onClick={() => handleRoleSelect('client')}
                    >
                      <CardContent className="p-6 text-center">
                        <User className="text-blue-500 mx-auto mb-4" size={48} />
                        <h4 className="font-semibold text-lg mb-2">Client</h4>
                        <p className="text-sm text-gray-600">Need legal assistance? Find and connect with lawyers for your case.</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500"
                      onClick={() => handleRoleSelect('lawyer')}
                    >
                      <CardContent className="p-6 text-center">
                        <UserCheck className="text-green-500 mx-auto mb-4" size={48} />
                        <h4 className="font-semibold text-lg mb-2">Lawyer</h4>
                        <p className="text-sm text-gray-600">Legal professional? Manage cases and connect with clients.</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-500"
                      onClick={() => handleRoleSelect('police')}
                    >
                      <CardContent className="p-6 text-center">
                        <Shield className="text-purple-500 mx-auto mb-4" size={48} />
                        <h4 className="font-semibold text-lg mb-2">Police Officer</h4>
                        <p className="text-sm text-gray-600">Law enforcement officer? Review and approve case submissions.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">
                      Registration as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRole('');
                        setSignupData(prev => ({ ...prev, role: undefined }));
                      }}
                    >
                      Change Role
                    </Button>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-6">
                    {signupMutation.error && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {(signupMutation.error as any)?.message || 'Registration failed'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {signupMutation.isSuccess && (
                      <Alert>
                        <AlertDescription>
                          Registration successful! Please switch to the login tab to sign in.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-base font-medium flex items-center gap-2">
                          <User size={16} />
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          placeholder="Enter your full name"
                          value={signupData.name}
                          onChange={(e) => handleSignupChange('name', e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-base font-medium flex items-center gap-2">
                          <Mail size={16} />
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupData.email}
                          onChange={(e) => handleSignupChange('email', e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-base font-medium flex items-center gap-2">
                          <Lock size={16} />
                          Password
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={signupData.password}
                          onChange={(e) => handleSignupChange('password', e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-base font-medium flex items-center gap-2">
                          <Phone size={16} />
                          Phone Number
                        </Label>
                        <Input
                          id="signup-phone"
                          placeholder="Enter your phone number"
                          value={signupData.phone}
                          onChange={(e) => handleSignupChange('phone', e.target.value)}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-city" className="text-base font-medium flex items-center gap-2">
                          <MapPin size={16} />
                          City
                        </Label>
                        <Select
                          value={signupData.city}
                          onValueChange={(value) => handleSignupChange('city', value)}
                        >
                          <SelectTrigger className="h-12 text-base">
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
                            <Label htmlFor="signup-experience" className="text-base font-medium flex items-center gap-2">
                              <GraduationCap size={16} />
                              Experience (Years)
                            </Label>
                            <Input
                              id="signup-experience"
                              type="number"
                              placeholder="Years of experience"
                              value={signupData.experience || ''}
                              onChange={(e) => handleSignupChange('experience', parseInt(e.target.value) || 0)}
                              className="h-12 text-base"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-base font-medium flex items-center gap-2">
                              <Briefcase size={16} />
                              Specializations
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {CASE_SPECIALIZATIONS.map(spec => (
                                <Button
                                  key={spec}
                                  type="button"
                                  variant={signupData.specialization?.includes(spec) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSpecializationChange(spec)}
                                  className="text-xs capitalize"
                                >
                                  {spec}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                      disabled={signupMutation.isPending}
                    >
                      {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </div>
              )}
            </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}