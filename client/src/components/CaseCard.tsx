import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Case } from "@shared/schema";
import { format } from "date-fns";

interface CaseCardProps {
  case: Case;
  onClick?: (caseData: Case) => void;
}

export default function CaseCard({ case: caseData, onClick }: CaseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-l-legal-emerald';
      case 'rejected':
        return 'border-l-red-500';
      case 'under_review':
        return 'border-l-yellow-500';
      default:
        return 'border-l-legal-blue';
    }
  };

  return (
    <Card 
      className={`border-l-4 ${getBorderColor(caseData.status)} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onClick?.(caseData)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-gray-900">{caseData.title}</p>
          <Badge className={`text-xs ${getStatusColor(caseData.status)}`}>
            {caseData.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {caseData.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {caseData.pnr ? (
              <>PNR: <span className="font-medium">{caseData.pnr}</span></>
            ) : (
              'No PNR assigned'
            )}
          </span>
          <span>
            {caseData.createdAt && format(new Date(caseData.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
        {caseData.hearingDate && (
          <div className="mt-2 text-xs text-legal-blue font-medium">
            Hearing: {format(new Date(caseData.hearingDate), 'PPP')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
