import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMediaItems, useAddMediaItem, useUpdateMediaItem, useDeleteMediaItem } from '../../hooks/useQueries';
import { Plus, Trash2, Save, Image, Video, Edit2, Link, Copy, Info, RefreshCw, Upload, X, File, FolderOpen, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem }  from '@/backend';
import { compressImageInBrowser } from '../../lib/resizeImg';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssetManager } from '@icp-sdk/canisters/assets';
import { HttpAgent } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Types from IcpAssetManager
interface AssetEncoding {
  content_encoding: string;
  sha256: Uint8Array | null;
  length: bigint;
  modified: bigint;
}

interface AssetCanisterEntry {
  key: string;
  content_type: string;
  encodings: AssetEncoding[];
  max_age: bigint | null;
  headers: [string, string][] | null;
  allow_raw_access: boolean | null;
  is_aliased: boolean | null;
}

interface AssetMetadata {
  id: string;
  key: string;
  name: string;
  url: string;
  content_type: string;
  size: number;
  created_at: Date;
  modified: Date;
  content_encoding?: string;
  sha256?: string;
  max_age?: number | null;
  headers?: [string, string][] | null;
  allow_raw_access?: boolean | null;
  is_aliased?: boolean | null;
  path?: string;
}

interface MediaEditorProps {
  canisterId?: string | Principal;
  agent?: any;
  identity?: any;
  host?: string;
  concurrency?: number;
  maxChunkSize?: number;
  maxSingleFileSize?: number;
  onDeleteComplete?: (assetId: string) => void;
  onUploadComplete?: (asset: AssetMetadata) => void;
  itemsPerPage?: number;
  allowedTypes?: string[];
  customMaxFileSize?: number;
}

export default function MediaEditor({
  canisterId,
  agent: externalAgent,
  identity,
  host = 'http://127.0.0.1:4943',
  concurrency = 16,
  maxChunkSize = 1900000,
  maxSingleFileSize = 1900000,
  onDeleteComplete,
  onUploadComplete,
  itemsPerPage = 12,
  allowedTypes = ['image/*', 'video/*', 'application/pdf', 'text/plain'],
  customMaxFileSize = 10 * 1024 * 1024 // 10MB default
}: MediaEditorProps) {
  const { data: mediaItems, isLoading: isMediaLoading, refetch: refetchMedia } = useGetMediaItems(0);
  const addMediaItem = useAddMediaItem();
  const updateMediaItem = useUpdateMediaItem();
  const deleteMediaItem = useDeleteMediaItem();

  // Asset Manager states
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [showAssets, setShowAssets] = useState(false); // Toggle between media items and assets

  // Upload states (from IcpAssetManager)
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchAssets, setBatchAssets] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  
  // Dialog upload states
  const [dialogUploading, setDialogUploading] = useState(false);
  const [dialogUploadProgress, setDialogUploadProgress] = useState<Record<string, number>>({});
  const [dialogSelectedFile, setDialogSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogFileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  // Form states
  const [newMedia, setNewMedia] = useState({
    url: '',
    caption: '',
    description: '',
    mediaType: 'image',
  });

  const [editMedia, setEditMedia] = useState({
    url: '',
    caption: '',
    description: '',
  });

  // Initialize AssetManager
  useEffect(() => {
    const initAssetManager = async () => {
      if (!canisterId) return;

      try {
        setLoading(true);
        let agent: HttpAgent;
        
        if (externalAgent) {
          agent = externalAgent;
        } else {
          const host = process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://icp-api.io'; // mainnet
          agent = await HttpAgent.create({
            host : host
          });

          if (process.env.DFX_NETWORK !== 'ic') {
            await agent.fetchRootKey();
          }

          if (identity) {
            agent.replaceIdentity(identity);
          }
        }

        const manager = new AssetManager({
          canisterId: typeof canisterId === 'string' 
            ? Principal.fromText(canisterId) 
            : canisterId,
          agent,
          concurrency,
          maxChunkSize,
          maxSingleFileSize,
        });

        setAssetManager(manager);
        console.log('AssetManager initialized in MediaEditor');
      } catch (error) {
        console.error('Failed to initialize AssetManager:', error);
        toast.error(`Failed to initialize AssetManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initAssetManager();
  }, [canisterId, externalAgent, identity, host, concurrency, maxChunkSize, maxSingleFileSize]);

  const buildAssetUrl = (key: string): string => {
    if (process.env.DFX_NETWORK === "ic") {
      return `https://${typeof canisterId === 'string' ? canisterId : canisterId?.toString()}.icp0.io${key.startsWith('/') ? key : '/' + key}`;
    }
    return `http://${typeof canisterId === 'string' ? canisterId : canisterId?.toString()}.localhost:4943${key.startsWith('/') ? key : '/' + key}`;
  };

  // UPLOAD FUNCTIONS FROM ICPASSETMANAGER
  const handleSingleUpload = async (file: File, isDialogUpload: boolean = false) => {
    if (!assetManager) {
      toast.error("AssetManager not initialized");
      return;
    }

    if (file.size > customMaxFileSize) {
      toast.error(`File size must be less than ${Math.round(customMaxFileSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    const isTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0];
        return file.type.startsWith(mainType + '/');
      }
      return file.type === type;
    });

    if (!isTypeAllowed && allowedTypes.length > 0) {
      toast.error(`File type ${file.type} not allowed`);
      return;
    }

    if (isDialogUpload) {
      setDialogUploading(true);
    } else {
      setUploading(true);
    }
    
    const progressKey = `${Date.now()}_${file.name}`;
    
    if (isDialogUpload) {
      setDialogUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
    } else {
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
    }

    try {
      // Simulate progress
      const simulateProgress = () => {
        if (isDialogUpload) {
          setDialogUploadProgress(prev => {
            const current = prev[progressKey] || 0;
            if (current < 90) {
              return { ...prev, [progressKey]: current + 10 };
            }
            return prev;
          });
        } else {
          setUploadProgress(prev => {
            const current = prev[progressKey] || 0;
            if (current < 90) {
              return { ...prev, [progressKey]: current + 10 };
            }
            return prev;
          });
        }
      };

      const progressInterval = setInterval(simulateProgress, 300);

      const f = await compressImageInBrowser(file, { maxSizeBytes: 1024 * 1024 });
      // Store the file using AssetManager
      const key = await assetManager.store(f.file);
      
      clearInterval(progressInterval);
      
      if (isDialogUpload) {
        setDialogUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      } else {
        setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      }

      // Create metadata for the new asset
      const now = BigInt(Date.now() * 1000000);
      const newAsset: AssetMetadata = {
        id: key,
        key,
        name: file.name,
        url: buildAssetUrl(key),
        content_type: file.type,
        size: file.size,
        created_at: new Date(),
        modified: new Date(),
        path: key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : '/'
      };

      if (!isDialogUpload) {
        // Update state for main asset list
        setAssets(prev => [newAsset, ...prev]);
        setTotalAssets(prev => prev + 1);
      }
      
      onUploadComplete?.(newAsset);
      toast.success(`${file.name} uploaded successfully!`);
      
      if (isDialogUpload) {
        // Set the uploaded file URL in the dialog form
        setNewMedia(prev => ({ ...prev, url: key }));
        // Clear dialog upload progress
        setTimeout(() => {
          setDialogUploadProgress({});
          setDialogSelectedFile(null);
        }, 1000);
      } else {
        // Clear main upload progress
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [progressKey]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (isDialogUpload) {
        setDialogUploading(false);
      } else {
        setUploading(false);
      }
    }
  };

  // Handle batch upload
  const handleBatchUpload = async () => {
    if (!assetManager || batchAssets.length === 0) {
      toast.error("No files selected or AssetManager not initialized");
      return;
    }

    setUploading(true);
    const batch = assetManager.batch();
    const uploadedAssets: AssetMetadata[] = [];

    try {
      for (const file of batchAssets) {
        if (file.size > customMaxFileSize) {
          console.warn(`Skipping ${file.name}: File too large`);
          toast.warning(`Skipping ${file.name}: File too large`);
          continue;
        }

        // Validate file type
        const isTypeAllowed = allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            const mainType = type.split('/')[0];
            return file.type.startsWith(mainType + '/');
          }
          return file.type === type;
        });

        if (!isTypeAllowed && allowedTypes.length > 0) {
          toast.warning(`Skipping ${file.name}: File type not allowed`);
          continue;
        }

        const progressKey = `${Date.now()}_${file.name}`;
        setUploadProgress(prev => ({ ...prev, [progressKey]: 50 }));

        try {
          // Store in batch
          const key = await batch.store(file);
          
          const newAsset: AssetMetadata = {
            id: key,
            key,
            name: file.name,
            url: buildAssetUrl(key),
            content_type: file.type,
            size: file.size,
            created_at: new Date(),
            modified: new Date(),
            path: key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : '/'
          };

          uploadedAssets.push(newAsset);
          setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
        } catch (error) {
          console.error(`Failed to add ${file.name} to batch:`, error);
          toast.error(`Failed to add ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Commit the batch
      if (uploadedAssets.length > 0) {
        await batch.commit();

        // Update state
        setAssets(prev => [...uploadedAssets, ...prev]);
        setTotalAssets(prev => prev + uploadedAssets.length);
        
        // Notify completion
        uploadedAssets.forEach(asset => {
          onUploadComplete?.(asset);
        });

        toast.success(`${uploadedAssets.length} file(s) uploaded successfully!`);
      }

      // Clear batch
      setBatchAssets([]);
      setBatchMode(false);

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress({});
      }, 1000);

    } catch (error) {
      console.error('Batch upload failed:', error);
      toast.error(`Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, isDialog: boolean = false) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Filter by allowed types
    const filteredFiles = files.filter(file => {
      if (allowedTypes.length === 0) return true;
      
      return allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return file.type.startsWith(mainType + '/');
        }
        return file.type === type;
      });
    });

    if (filteredFiles.length === 0) {
      toast.error('No files of allowed types selected');
      return;
    }

    if (isDialog) {
      // For dialog, handle single file upload
      const file = filteredFiles[0];
      setDialogSelectedFile(file);
      // Auto-upload the file
      handleSingleUpload(file, true);
    } else {
      if (batchMode) {
        setBatchAssets(prev => [...prev, ...filteredFiles]);
        toast.info(`${filteredFiles.length} file(s) added to batch`);
      } else if (filteredFiles.length === 1) {
        handleSingleUpload(filteredFiles[0]);
      } else {
        // Multiple files without batch mode - enable batch mode
        setBatchMode(true);
        setBatchAssets(filteredFiles);
        toast.info(`${filteredFiles.length} file(s) added to batch mode`);
      }
    }

    // Reset file input
    if (isDialog && dialogFileInputRef.current) {
      dialogFileInputRef.current.value = '';
    } else if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file from batch
  const removeFileFromBatch = (index: number) => {
    setBatchAssets(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles.splice(index, 1)[0];
      toast.info(`${removedFile.name} removed from batch`);
      return newFiles;
    });
  };

  // Load assets from AssetManager
  const loadAssets = useCallback(async (page: number = 1) => {
    if (!assetManager) return;

    setLoading(true);
    try {
      const start = (page - 1) * itemsPerPage;
      const entries = await assetManager.list();
      
      const paginatedEntries = entries.slice(start, start + itemsPerPage);
      
      const assetsWithMetadata: AssetMetadata[] = await Promise.all(
        paginatedEntries.map(async (entry: any) => {
          try {
            let canisterEntry: AssetCanisterEntry;
            
            if (typeof entry === 'string') {
              const asset = await assetManager.get(entry);
              console.log('Fetched asset for entry:', asset);
              canisterEntry = {
                key: entry,
                content_type: asset.contentType,
                encodings: [
                  {
                    content_encoding: asset.contentEncoding,
                    sha256: asset.sha256 || null,
                    length: BigInt(asset.length),
                    modified: BigInt(Date.now() * 1000000)
                  }
                ],
                max_age: null,
                headers: null,
                allow_raw_access: null,
                is_aliased: null
              };
            } else {
              canisterEntry = entry;
            }
            
            const primaryEncoding = canisterEntry.encodings[0] || canisterEntry.encodings.find(e => e.content_encoding === 'identity') || canisterEntry.encodings[0];
            
            const metadata: AssetMetadata = {
              id: canisterEntry.key,
              key: canisterEntry.key,
              name: canisterEntry.key.split('/').pop() || canisterEntry.key,
              url: buildAssetUrl(canisterEntry.key),
              content_type: canisterEntry.content_type,
              size: Number(primaryEncoding?.length || 0),
              created_at: new Date(Number((primaryEncoding?.modified || BigInt(0)) / BigInt(1000000))),
              modified: new Date(Number((primaryEncoding?.modified || BigInt(0)) / BigInt(1000000))),
              content_encoding: primaryEncoding?.content_encoding,
              sha256: primaryEncoding?.sha256 ? bytesToHex(primaryEncoding.sha256) : undefined,
              max_age: canisterEntry.max_age ? Number(canisterEntry.max_age) : undefined,
              headers: canisterEntry.headers || undefined,
              allow_raw_access: canisterEntry.allow_raw_access || undefined,
              is_aliased: canisterEntry.is_aliased || undefined,
              path: canisterEntry.key.includes('/') ? canisterEntry.key.substring(0, canisterEntry.key.lastIndexOf('/')) : '/'
            };
            
            return metadata;
          } catch (error) {
            console.warn(`Failed to process asset entry:`, error);
            const key = typeof entry === 'string' ? entry : entry.key;
            return {
              id: key,
              key,
              name: key.split('/').pop() || key,
              url: buildAssetUrl(key),
              content_type: 'application/octet-stream',
              size: 0,
              created_at: new Date(),
              modified: new Date(),
              path: key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : '/'
            };
          }
        })
      );
      
      setAssets(assetsWithMetadata);
      setTotalAssets(entries.length);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets from canister');
    } finally {
      setLoading(false);
    }
  }, [assetManager, canisterId, itemsPerPage]);

  // Helper: Convert Uint8Array to hex string (from IcpAssetManager)
  const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Handle asset delete (from IcpAssetManager)
  const handleDeleteAsset = async (assetKey: string) => {
    if (!assetManager || !confirm('Are you sure you want to delete this asset?')) return;

    try {
      await assetManager.delete(assetKey);
      
      setAssets(prev => prev.filter(a => a.key !== assetKey));
      setTotalAssets(prev => prev - 1);
      
      onDeleteComplete?.(assetKey);
      toast.success('Asset deleted successfully');
      
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get asset properties (from IcpAssetManager)
  const getAssetProperties = async (key: string) => {
    if (!assetManager) return null;
    
    try {
      const asset = await assetManager.get(key);
      const properties = {
        key,
        content_type: asset.contentType,
        size: asset.length,
        sha256: asset.sha256 ? bytesToHex(asset.sha256) : undefined,
      };
      
      toast.info(`Properties for ${key}: ${JSON.stringify(properties, null, 2)}`);
      return properties;
    } catch (error) {
      console.error(`Failed to get properties for ${key}:`, error);
      toast.error(`Failed to get properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Handle media item operations (existing)
  const handleAddMedia = async () => {
    if (!newMedia.url.trim()) {
      toast.error('Please enter URL');
      return;
    }

    try {
      await addMediaItem.mutateAsync({
        url: newMedia.url,
        caption: newMedia.caption,
        description: newMedia.description,
        mediaType: newMedia.mediaType,
      });
      toast.success('Media added successfully');
      setIsAddDialogOpen(false);
      setNewMedia({
        url: '',
        caption: '',
        description: '',
        mediaType: 'image',
      });
      refetchMedia();
    } catch (error) {
      toast.error('Error occurred: ' + (error as Error).message);
    }
  };

  const handleEditMedia = async () => {
    if (!editingItem) return;

    if (!editMedia.url.trim()) {
      toast.error('Please enter URL');
      return;
    }

    try {
      await updateMediaItem.mutateAsync({
        id: editingItem.id,
        url: editMedia.url,
        caption: editMedia.caption,
        description: editMedia.description,
      });
      toast.success('Media updated successfully');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      refetchMedia();
    } catch (error) {
      toast.error('Error occurred: ' + (error as Error).message);
    }
  };

  const handleDeleteMedia = async (id: bigint) => {
    if (!confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      await deleteMediaItem.mutateAsync(id);
      toast.success('Media deleted successfully');
      refetchMedia();
    } catch (error) {
      toast.error('Error occurred: ' + (error as Error).message);
    }
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item);
    setEditMedia({
      url: item.url,
      caption: item.caption,
      description: item.description,
    });
    setIsEditDialogOpen(true);
  };

  // Load assets when assetManager changes
  useEffect(() => {
    if (assetManager && showAssets) {
      loadAssets(currentPage);
    }
  }, [assetManager, showAssets, currentPage, loadAssets]);

  const totalPages = Math.ceil(totalAssets / itemsPerPage);
  const isLoading = isMediaLoading || loading;
  const selectedCount = batchAssets.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Media Library Management</CardTitle>
              <CardDescription>
                Manage images and videos for the website
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {canisterId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAssets(!showAssets);
                    if (!showAssets && assetManager) {
                      loadAssets(currentPage);
                    }
                  }}
                >
                  {showAssets ? 'Show Media Items' : 'Show Assets'}
                </Button>
              )}
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Media
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {canisterId && showAssets ? (
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="upload-section border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Upload Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload files to the asset canister
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                >
                  {showUploadPanel ? 'Hide Upload' : 'Show Upload'}
                </Button>
              </div>

              {showUploadPanel && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}>
                        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-medium mb-1">Drag & drop files here, or click to select</p>
                        <p className="text-sm text-muted-foreground">
                          Max file size: {Math.round(customMaxFileSize / 1024 / 1024)}MB
                          {allowedTypes.length > 0 && (
                            <span> | Allowed types: {allowedTypes.join(', ')}</span>
                          )}
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => handleFileSelect(e, false)}
                        accept={allowedTypes.join(',')}
                        multiple={batchMode}
                        disabled={uploading || !assetManager || loading}
                        className="hidden"
                      />
                    </div>
                    
                    {batchMode && (
                      <div className="w-48 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Batch Mode</span>
                          <Badge variant="secondary">{selectedCount} files</Badge>
                        </div>
                        {selectedCount > 0 && (
                          <Button
                            onClick={handleBatchUpload}
                            disabled={uploading || selectedCount === 0}
                            className="w-full"
                          >
                            {uploading ? 'Uploading...' : `Upload ${selectedCount} File(s)`}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBatchMode(false);
                            setBatchAssets([]);
                          }}
                          className="w-full"
                        >
                          Cancel Batch
                        </Button>
                      </div>
                    )}
                  </div>

                  {!batchMode && selectedCount === 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => setBatchMode(true)}
                      className="w-full"
                      disabled={!assetManager || loading}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Enable Batch Mode for multiple files
                    </Button>
                  )}

                  {/* Batch files list */}
                  {batchAssets.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Selected Files ({selectedCount})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {batchAssets.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate">{file.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(file.size)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFileFromBatch(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Upload Progress</h4>
                      <div className="space-y-3">
                        {Object.entries(uploadProgress).map(([key, progress]) => {
                          const fileName = key.split('_').slice(1).join('_');
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm truncate">{fileName}</span>
                                <span className="text-sm font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!assetManager && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm text-yellow-700">AssetManager not initialized. Uploads disabled.</span>
                    </div>
                  )}
                  {loading && (
                    <div className="text-center py-2 text-muted-foreground">
                      Initializing AssetManager...
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Asset Manager Section */}
            <div className="asset-manager-section">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Assets ({totalAssets})</h3>
                  <p className="text-sm text-muted-foreground">
                    Canister: {typeof canisterId === 'string' ? canisterId : canisterId.toString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => loadAssets(currentPage)}
                    variant="outline"
                    size="sm"
                    disabled={!assetManager || loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                      >
                        ←
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading assets...
                </div>
              ) : assets.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <Card key={asset.id} className="border-2">
                      <CardContent className="p-4 space-y-3">
                        {/* Asset Preview */}
                        <div className="asset-preview">
                          {asset.content_type.startsWith('image/') ? (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-32 rounded border object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>';
                              }}
                            />
                          ) : asset.content_type.startsWith('video/') ? (
                            <div className="w-full h-32 rounded border flex items-center justify-center bg-muted">
                              <Video className="h-8 w-8 text-primary" />
                              <span className="ml-2">Video</span>
                            </div>
                          ) : asset.content_type.includes('pdf') ? (
                            <div className="w-full h-32 rounded border flex items-center justify-center bg-muted">
                              <span className="text-lg">📄 PDF</span>
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded border flex items-center justify-center bg-muted">
                              <span className="text-lg">📁 {asset.content_type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Asset Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1" title={asset.name}>
                            {asset.name}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Size: {formatFileSize(asset.size)}</div>
                            <div>Type: {asset.content_type}</div>
                            <div>Modified: {asset.modified.toLocaleDateString()}</div>
                            {asset.sha256 && (
                              <div className="truncate" title={asset.sha256}>
                                SHA256: {asset.sha256.substring(0, 8)}...
                              </div>
                            )}
                            {asset.path && asset.path !== '/' && (
                              <div className="text-primary bg-primary/10 px-2 py-1 rounded text-xs mt-1">
                                Path: {asset.path}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Asset Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(asset.url, '_blank')}
                              title="View in new tab"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(asset.url);
                                toast.success('URL copied to clipboard!');
                              }}
                              title="Copy URL"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => getAssetProperties(asset.key)}
                              title="Get Properties"
                              disabled={!assetManager}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAsset(asset.key)}
                            title="Delete"
                            disabled={!assetManager}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        {/* Asset URL */}
                        <div className="pt-2">
                          <Input
                            type="text"
                            value={asset.url}
                            readOnly
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            placeholder="Asset URL"
                            className="text-xs"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">📁</div>
                  <h3 className="text-lg font-medium mb-1">No assets yet</h3>
                  <p>Upload your first file using the upload panel above!</p>
                </div>
              )}
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-4">
            {/* Original Media Items Section */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : mediaItems && mediaItems.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaItems.map((item) => (
                  <Card key={item.id.toString()} className="border">
                    <CardContent className="p-3 space-y-3">
                      {/* Media Type Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.mediaType === 'image' ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Video className="h-4 w-4 text-purple-500" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {item.mediaType}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-6 w-6 p-0"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMedia(item.id)}
                            className="h-6 w-6 p-0"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Thumbnail */}
                      {item.mediaType === 'image' && item.url && (
                        <div className="aspect-video w-full overflow-hidden rounded border bg-muted">
                          <img
                            src={item.url}
                            alt={item.caption || 'Media preview'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              
                              const parent = img.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <div class="text-center">
                                      <div class="mb-2">
                                        <svg class="h-8 w-8 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <span class="text-xs text-muted-foreground">Image not found</span>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Title */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Title
                        </div>
                        <p className="text-sm font-medium">
                          {item.caption || 'No title'}
                        </p>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Description
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {/* URL - Clickable */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center justify-between">
                          <span>URL</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(item.url);
                              toast.success('URL copied');
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-primary hover:underline truncate"
                        >
                          {item.url}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No media items yet. Click "Add New Media" to start.
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Media Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Media</DialogTitle>
            <DialogDescription>
              Add images or videos to the library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newMedia.mediaType}
                onValueChange={(value) =>
                  setNewMedia({ ...newMedia, mediaType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>URL *</Label>
                {canisterId && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => dialogFileInputRef.current?.click()}
                    disabled={!assetManager || dialogUploading}
                    className="h-auto p-0"
                  >
                    Upload file instead
                  </Button>
                )}
              </div>
              <Input
                value={newMedia.url}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, url: e.target.value })
                }
                placeholder="wine-bottles-premium.dim_800x600.jpg"
              />
              <input
                ref={dialogFileInputRef}
                type="file"
                onChange={(e) => handleFileSelect(e, true)}
                accept={allowedTypes.join(',')}
                disabled={!assetManager || dialogUploading}
                className="hidden"
              />
            </div>

            {canisterId && dialogSelectedFile && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dialogSelectedFile.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(dialogSelectedFile.size)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogSelectedFile(null)}
                    disabled={dialogUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Dialog Upload Progress */}
                {Object.keys(dialogUploadProgress).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(dialogUploadProgress).map(([key, progress]) => {
                      const fileName = key.split('_').slice(1).join('_');
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Uploading...</span>
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!assetManager && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200 mt-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700">AssetManager not initialized</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newMedia.caption}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, caption: e.target.value })
                }
                placeholder="Enter title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newMedia.description}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, description: e.target.value })
                }
                placeholder="Enter description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setDialogSelectedFile(null);
                setDialogUploadProgress({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMedia}
              disabled={addMediaItem.isPending || dialogUploading}
            >
              {addMediaItem.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update media information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={editMedia.url}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, url: e.target.value })
                }
                placeholder="wine-bottles-premium.dim_800x600.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editMedia.caption}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, caption: e.target.value })
                }
                placeholder="Enter title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editMedia.description}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, description: e.target.value })
                }
                placeholder="Enter description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMedia}
              disabled={updateMediaItem.isPending}
            >
              {updateMediaItem.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function from IcpAssetManager
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};