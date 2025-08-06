import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  bgColor?: string;
  iconColor?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  bgColor = "bg-legal-blue bg-opacity-10",
  iconColor = "text-legal-blue"
}: StatsCardProps) {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 ${bgColor} rounded-lg`}>
            <Icon className={`${iconColor} text-xl`} />
          </div>
        </div>
        {(description || trend) && (
          <div className="mt-4 flex items-center text-sm">
            {trend && <span className="text-green-600 font-medium">{trend}</span>}
            {description && (
              <span className={`text-gray-600 ${trend ? "ml-1" : ""}`}>{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
