import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload } from 'lucide-react';
import type { CaseRequest } from '@shared/schema';

const completeCaseSchema = z.object({
  pnr: z.string().min(1, 'PNR is required'),
  policeStation: z.string().min(1, 'Police station is required'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentTime: z.string().min(1, 'Incident time is required'),
  incidentLocation: z.string().min(1, 'Incident location is required'),
  caseType: z.enum(['civil', 'criminal', 'family', 'property', 'corporate', 'labor', 'tax', 'immigration', 'personal_injury', 'fraud', 'theft', 'assault', 'other']),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
  evidenceDescription: z.string().optional(),
  witnessDetails: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type CompleteCaseForm = z.infer<typeof completeCaseSchema>;

interface CompleteCaseProps {
  caseRequest: any;
  onSubmit: (data: CompleteCaseForm) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function CompleteCase({ caseRequest, onSubmit, onCancel, isSubmitting = false }: CompleteCaseProps) {
  const [documents, setDocuments] = useState<File[]>([]);

  const form = useForm<CompleteCaseForm>({
    resolver: zodResolver(completeCaseSchema),
    defaultValues: {
      pnr: '',
      policeStation: '',
      incidentDate: '',
      incidentTime: '',
      incidentLocation: '',
      caseType: caseRequest.caseType || 'other',
      urgency: 'medium',
      evidenceDescription: '',
      witnessDetails: '',
      additionalNotes: caseRequest.description,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: CompleteCaseForm) => {
    onSubmit({
      ...data,
      documents: documents as any,
    } as CompleteCaseForm);
  };

  // Generate PNR number
  const generatePNR = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const pnr = `PNR${year}${random}`;
    form.setValue('pnr', pnr);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Complete Case Details
          <Badge variant="outline">Case Request from {caseRequest.client?.name}</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Fill in the complete case information to create the official case record.
        </p>
      </CardHeader>
      <CardContent>
        {/* Original Request Summary */}
        <Card className="mb-6 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Original Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Title:</strong> {caseRequest.title}</div>
            <div><strong>Description:</strong> {caseRequest.description}</div>
            <div><strong>Victim:</strong> {caseRequest.victimName}</div>
            <div><strong>Accused:</strong> {caseRequest.accusedName}</div>
            <div><strong>Client Contact:</strong> {caseRequest.clientPhone || 'N/A'} / {caseRequest.clientEmail || 'N/A'}</div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
            {/* PNR and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="pnr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PNR Number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} data-testid="input-pnr" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePNR}
                        data-testid="button-generate-pnr"
                      >
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="policeStation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Police Station</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-police-station" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Incident Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-incident-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="incidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-incident-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="incidentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Location</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-incident-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Case Type and Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="caseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-case-type">
                          <SelectValue placeholder="Select case type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="tax">Tax</SelectItem>
                        <SelectItem value="immigration">Immigration</SelectItem>
                        <SelectItem value="personal_injury">Personal Injury</SelectItem>
                        <SelectItem value="fraud">Fraud</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="assault">Assault</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Urgency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Details */}
            <FormField
              control={form.control as any}
              name="evidenceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe any evidence available for this case..."
                      data-testid="textarea-evidence"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="witnessDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Witness Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List any witnesses and their contact information..."
                      data-testid="textarea-witnesses"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional information or notes..."
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="documents" className="cursor-pointer">
                      <span className="text-legal-blue hover:underline">Upload files</span>
                      <input
                        id="documents"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        data-testid="input-documents"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>
              
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        data-testid={`button-remove-doc-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                data-testid="button-create-case"
              >
                {isSubmitting ? 'Creating Case...' : 'Create Official Case'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                data-testid="button-cancel-case"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}