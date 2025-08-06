import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, Phone, Mail, Award, Briefcase } from "lucide-react";
import WinLossChart from "./WinLossChart";
import type { Lawyer } from "@shared/schema";

interface LawyerProfileModalProps {
  lawyer: Lawyer | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectLawyer?: (lawyer: Lawyer) => void;
}

export default function LawyerProfileModal({ 
  lawyer, 
  isOpen, 
  onClose, 
  onSelectLawyer 
}: LawyerProfileModalProps) {
  if (!lawyer) return null;

  const handleSelectLawyer = () => {
    onSelectLawyer?.(lawyer);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Lawyer Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl bg-legal-blue text-white">
                  {lawyer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{lawyer.name}</h3>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(lawyer.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">{lawyer.rating}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{lawyer.city}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {lawyer.specialization.map((spec, index) => (
                  <Badge key={index} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>{lawyer.experience} years experience</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{lawyer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{lawyer.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {lawyer.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">About</h4>
              <p className="text-gray-700">{lawyer.description}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-legal-blue" />
                Case Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-legal-blue">
                    {lawyer.stats.totalCases}
                  </div>
                  <div className="text-sm text-gray-600">Total Cases</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {lawyer.stats.wonCases}
                  </div>
                  <div className="text-sm text-gray-600">Won</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {lawyer.stats.lostCases}
                  </div>
                  <div className="text-sm text-gray-600">Lost</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold">
                  Success Rate: {
                    lawyer.stats.totalCases > 0 
                      ? Math.round((lawyer.stats.wonCases / lawyer.stats.totalCases) * 100)
                      : 0
                  }%
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Win/Loss Chart</h4>
              <WinLossChart 
                wonCases={lawyer.stats.wonCases}
                lostCases={lawyer.stats.lostCases}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onSelectLawyer && (
              <Button onClick={handleSelectLawyer} className="bg-legal-blue hover:bg-blue-700">
                Select This Lawyer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}