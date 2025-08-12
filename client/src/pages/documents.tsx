import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileIcon, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  FolderOpen,
  Shield,
  Search
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
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Fetch user cases for upload dropdown
  const { data: cases = [] } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Upload failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || 'Upload failed';
        } catch {
          errorMessage = errorText || 'Upload failed';
        }
        throw new Error(errorMessage);
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
      apiRequest('DELETE', `/api/documents/${documentId}`),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl p-6 shadow-2xl border border-purple-300/20">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500/20 p-3 rounded-lg backdrop-blur-sm">
            <Shield className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Secure Document Vault
            </h1>
            <div className="text-purple-200 text-lg flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">End-to-end encrypted storage</span>
              </div>
              <span>•</span>
              <span>Professional case documents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border border-purple-200/50 shadow-xl bg-gradient-to-b from-white to-purple-50/30 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-200/50">
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <Upload className="h-5 w-5 text-purple-600" />
            <span>Upload Document</span>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Add documents to your cases (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-purple-900">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
                data-testid="input-file-upload"
              />
              {selectedFile && (
                <p className="text-sm text-purple-700">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-select" className="text-purple-900">Select Case</Label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger className="border-purple-200 focus:border-purple-400" data-testid="select-case">
                  <SelectValue placeholder="Choose a case" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(cases) && cases.map((caseItem) => (
                    <SelectItem key={caseItem._id} value={caseItem._id}>
                      {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedCase || uploading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                data-testid="button-upload"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="border border-purple-200/50 shadow-xl bg-gradient-to-b from-white to-purple-50/30 backdrop-blur-sm h-[600px]">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-200/50">
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <FolderOpen className="h-5 w-5 text-purple-600" />
            <span>Your Documents ({Array.isArray(documents) ? documents.length : 0})</span>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Access and manage all your case documents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-140px)]">
          <ScrollArea className="h-full">
            {documentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-purple-700">Loading documents...</p>
              </div>
            ) : !Array.isArray(documents) || documents.length === 0 ? (
              <div className="text-center py-12">
                <FileIcon className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-600 mb-2">
                  No Documents Found
                </h3>
                <p className="text-purple-500">
                  Upload your first document to get started
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {documents.map((doc: Document) => (
                  <div 
                    key={doc._id} 
                    className="flex items-center justify-between p-4 border border-purple-200 rounded-lg hover:bg-purple-50 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">{getFileIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-purple-900 truncate">
                          {doc.originalName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                            {doc.caseTitle}
                          </Badge>
                          <span className="text-xs text-purple-600">
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="text-xs text-purple-600">
                            by {doc.uploadedBy}
                          </span>
                        </div>
                        <p className="text-xs text-purple-500 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc.filename)}
                        className="border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                        data-testid={`button-view-${doc._id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.filename, doc.originalName)}
                        className="border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                        data-testid={`button-download-${doc._id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc._id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        data-testid={`button-delete-${doc._id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}