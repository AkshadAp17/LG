import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  File,
  FileText,
  Image,
  Download,
  Trash2,
  Search,
  Filter,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  caseId: string;
  caseTitle: string;
  uploadedAt: Date;
  url: string;
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingCaseId, setUploadingCaseId] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const user = authService.getUser();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['/api/cases'],
  });

  // Mock documents data - In real implementation, this would come from the API
  const mockDocuments: DocumentFile[] = cases.flatMap((case_: Case) =>
    (case_.documents || []).map((doc, index) => ({
      id: `${case_._id}-${index}`,
      name: doc,
      type: doc.split('.').pop() || 'unknown',
      size: Math.floor(Math.random() * 1000000) + 100000, // Mock size
      caseId: case_._id!,
      caseTitle: case_.title,
      uploadedAt: case_.createdAt ? new Date(case_.createdAt) : new Date(),
      url: `/api/uploads/${doc}`,
    }))
  );

  const uploadDocuments = useMutation({
    mutationFn: async ({ caseId, files }: { caseId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('caseId', caseId);
      
      const response = await fetch('/api/cases/documents', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      setSelectedFiles([]);
      setUploadingCaseId("");
    },
  });

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0 && uploadingCaseId) {
      uploadDocuments.mutate({ caseId: uploadingCaseId, files: selectedFiles });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const filteredDocuments = mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.caseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.caseId]) {
      acc[doc.caseId] = {
        case: cases.find((c: Case) => c._id === doc.caseId),
        documents: []
      };
    }
    acc[doc.caseId].documents.push(doc);
    return acc;
  }, {} as Record<string, { case: Case; documents: DocumentFile[] }>);

  if (casesLoading) {
    return <div className="p-6">Loading documents...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Documents</h2>
        <p className="text-gray-600">Manage case documents and files</p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Case Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Case
              </label>
              <select
                value={uploadingCaseId}
                onChange={(e) => setUploadingCaseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-blue focus:border-transparent"
              >
                <option value="">Choose a case...</option>
                {cases.map((case_: Case) => (
                  <option key={case_._id} value={case_._id}>
                    {case_.title}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragOver
                  ? 'border-legal-blue bg-blue-50'
                  : 'border-gray-300 hover:border-legal-blue'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Support for PDF, DOC, DOCX, JPG, PNG files up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-legal-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Selected Files</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.name.split('.').pop() || '')}
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadingCaseId || uploadDocuments.isPending}
                    className="bg-legal-blue hover:bg-blue-700 text-white"
                  >
                    {uploadDocuments.isPending ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Documents</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocuments).map(([caseId, { case: caseData, documents }]) => (
                <div key={caseId} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {caseData?.title || 'Unknown Case'}
                    </h3>
                    <Badge variant="outline">
                      {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {getFileIcon(doc.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          Uploaded {format(doc.uploadedAt, 'MMM d, yyyy')}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </Button>
                          {user?.role === 'client' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
