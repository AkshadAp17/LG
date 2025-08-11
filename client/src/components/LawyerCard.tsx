import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { Lawyer } from "@shared/schema";

interface LawyerCardProps {
  lawyer: Lawyer;
  onSelect: (lawyer: Lawyer) => void;
}

export default function LawyerCard({ lawyer, onSelect }: LawyerCardProps) {
  const winRate = lawyer.stats.totalCases > 0 
    ? Math.round((lawyer.stats.wonCases / lawyer.stats.totalCases) * 100)
    : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl overflow-hidden h-[140px]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                {lawyer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-900 transition-colors">{lawyer.name}</h3>
                {lawyer.rating > 4.0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs font-semibold border-0">
                    Top Rated
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium mb-2">
                {lawyer.specialization.join(', ')} Law • {lawyer.city}
              </p>
              <div className="flex items-center space-x-3">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1">
                  {winRate}% Success
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {lawyer.experience} years exp.
                </span>
              </div>
              {lawyer.rating > 0 && (
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(lawyer.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 ml-2">
                    {lawyer.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    (127 reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => onSelect(lawyer)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-sm font-semibold rounded-xl"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
