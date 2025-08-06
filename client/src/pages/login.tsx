import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scale } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData, AuthResponse } from "@shared/schema";

export default function Login() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-legal-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scale className="text-legal-blue text-3xl" />
            <CardTitle className="text-2xl font-bold text-legal-blue">
              LegalCaseMS
            </CardTitle>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {loginMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(loginMutation.error as any)?.message || "Login failed"}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-legal-blue hover:bg-blue-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-legal-blue mb-2">Demo Accounts:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Client:</strong> john.smith@email.com / password123</p>
              <p><strong>Police:</strong> officer.delhi@police.gov.in / password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
