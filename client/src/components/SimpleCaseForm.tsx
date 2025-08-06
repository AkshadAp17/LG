import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

const simpleCaseRequestSchema = z.object({
  title: z.string().min(1, 'Case title is required'),
  description: z.string().min(10, 'Please provide a brief description'),
  victimName: z.string().min(1, 'Victim name is required'),
  accusedName: z.string().min(1, 'Accused name is required'),
  clientPhone: z.string().min(10, 'Valid phone number required'),
  clientEmail: z.string().email('Valid email required').optional().or(z.literal('')),
});

type SimpleCaseRequestData = z.infer<typeof simpleCaseRequestSchema>;

interface SimpleCaseFormProps {
  lawyerName: string;
  onSubmit: (data: SimpleCaseRequestData & { lawyerId: string }) => void;
  onCancel: () => void;
  lawyerId: string;
  isSubmitting?: boolean;
}

export default function SimpleCaseForm({ 
  lawyerName, 
  onSubmit, 
  onCancel, 
  lawyerId,
  isSubmitting = false 
}: SimpleCaseFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<SimpleCaseRequestData>({
    resolver: zodResolver(simpleCaseRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      victimName: '',
      accusedName: '',
      clientPhone: '',
      clientEmail: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: SimpleCaseRequestData) => {
    onSubmit({
      ...data,
      lawyerId,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Case Request to {lawyerName}</CardTitle>
        <p className="text-sm text-gray-600">
          Provide basic case information. The lawyer will help complete the detailed form later.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Case Title */}
          <div>
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Brief title for your case"
              data-testid="input-case-title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Brief Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Provide a brief description of your case..."
              className="min-h-[100px]"
              data-testid="textarea-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Victim Name */}
          <div>
            <Label htmlFor="victimName">Victim Name</Label>
            <Input
              id="victimName"
              {...form.register('victimName')}
              placeholder="Name of the victim"
              data-testid="input-victim-name"
            />
            {form.formState.errors.victimName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.victimName.message}
              </p>
            )}
          </div>

          {/* Accused Name */}
          <div>
            <Label htmlFor="accusedName">Accused Name</Label>
            <Input
              id="accusedName"
              {...form.register('accusedName')}
              placeholder="Name of the accused"
              data-testid="input-accused-name"
            />
            {form.formState.errors.accusedName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.accusedName.message}
              </p>
            )}
          </div>

          {/* Client Contact Information */}
          <div>
            <Label htmlFor="clientPhone">Your Phone Number</Label>
            <Input
              id="clientPhone"
              {...form.register('clientPhone')}
              placeholder="Your contact number"
              data-testid="input-client-phone"
            />
            {form.formState.errors.clientPhone && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.clientPhone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="clientEmail">Your Email (Optional)</Label>
            <Input
              id="clientEmail"
              type="email"
              {...form.register('clientEmail')}
              placeholder="your.email@example.com"
              data-testid="input-client-email"
            />
            {form.formState.errors.clientEmail && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.clientEmail.message}
              </p>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <Label htmlFor="documents">Upload Documents (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="documents"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="input-documents"
              />
              <label
                htmlFor="documents"
                className="cursor-pointer flex flex-col items-center justify-center text-gray-600 hover:text-gray-800"
              >
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm">Click to upload documents</span>
                <span className="text-xs text-gray-500">PDF, DOC, JPG, PNG files supported</span>
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`button-remove-file-${index}`}
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
              data-testid="button-send-request"
            >
              {isSubmitting ? 'Sending...' : 'Send Case Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}