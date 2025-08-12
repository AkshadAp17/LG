import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import LegalSidebar from '@/components/LegalSidebar';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileIcon, 
  DownloadIcon, 
  EyeIcon, 
  TrashIcon, 
  UploadIcon,
  FolderIcon,
  ShieldIcon
} from 'lucide-react';

interface Document {
  _id: string;
  filename: string;
  originalName: string;
  caseId: string;
  caseTitle: string;
  uploadedBy: string;
  uploadedById: string;
  size: number;
  type: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

interface Case {
  _id: string;
  title: string;
  status: string;
}

export default function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: () => apiRequest('/api/documents')
  });

  // Fetch user cases for upload dropdown
  const { data: cases = [] } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
    queryFn: () => apiRequest('/api/cases')
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFile(null);
      setSelectedCase('');
      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => 
      apiRequest(`/api/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a PDF, DOC, DOCX, JPG, JPEG, or PNG file',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCase) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and case',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('caseId', selectedCase);

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(formData);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  const handleDownload = (filename: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = `/api/documents/download/${filename}`;
    link.download = originalName;
    link.click();
  };

  const handleView = (filename: string) => {
    window.open(`/api/documents/view/${filename}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <LegalSidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <ShieldIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Document Vault
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Secure document management for your legal cases
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50">
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Add documents to your cases (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  data-testid="input-file-upload"
                />
                {selectedFile && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-select">Select Case</Label>
                <Select value={selectedCase} onValueChange={setSelectedCase}>
                  <SelectTrigger data-testid="select-case">
                    <SelectValue placeholder="Choose a case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((case_) => (
                      <SelectItem key={case_._id} value={case_._id}>
                        {case_.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedCase || uploading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  data-testid="button-upload"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900/50 dark:to-indigo-900/50">
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              Your Documents ({documents.length})
            </CardTitle>
            <CardDescription>
              Access and manage all your case documents
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {documentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  No Documents Found
                </h3>
                <p className="text-slate-500 dark:text-slate-500">
                  Upload your first document to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc: Document) => (
                  <div 
                    key={doc._id} 
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">{getFileIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {doc.originalName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {doc.caseTitle}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            by {doc.uploadedBy}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc.filename)}
                        data-testid={`button-view-${doc._id}`}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.filename, doc.originalName)}
                        data-testid={`button-download-${doc._id}`}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc._id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        data-testid={`button-delete-${doc._id}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}