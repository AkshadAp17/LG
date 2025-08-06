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
    <Card className="hover:bg-gray-50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {lawyer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{lawyer.name}</p>
              <p className="text-sm text-gray-600">
                {lawyer.specialization.join(', ')} Law
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-legal-emerald text-white text-xs">
                  {winRate}% Win Rate
                </Badge>
                <span className="text-xs text-gray-500">
                  {lawyer.experience} years exp.
                </span>
              </div>
              {lawyer.rating > 0 && (
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(lawyer.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {lawyer.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => onSelect(lawyer)}
            className="bg-legal-blue hover:bg-blue-700 text-white"
            size="sm"
          >
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
