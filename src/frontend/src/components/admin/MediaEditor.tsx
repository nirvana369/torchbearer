import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMediaItems, useAddMediaItem, useUpdateMediaItem, useDeleteMediaItem } from '../../hooks/useQueries';
import { Plus, Trash2, Save, Image, Video, Edit2, Link, Copy, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem } from '../../../../declarations/backend/backend.did';
import FileDropZone from '../FileDropZone';

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
  itemsPerPage?: number;
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
  itemsPerPage = 12
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
          agent = await HttpAgent.create({
            host
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

  // Load assets from AssetManager (from IcpAssetManager)
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
              url: `https://${typeof canisterId === 'string' ? canisterId : canisterId.toString()}.icp0.io/${canisterEntry.key}`,
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
              url: `https://${typeof canisterId === 'string' ? canisterId : canisterId.toString()}.icp0.io/${key}`,
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
          <CardContent className="space-y-4">
            {/* Asset Manager Section (from IcpAssetManager) */}
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
                        
                        {/* Asset Actions (from IcpAssetManager) */}
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
                        
                        {/* Asset URL (from IcpAssetManager) */}
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
                  <p>Upload your first file through the FileDropZone!</p>
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
                  <Card key={item.id.toString()} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.mediaType === 'image' ? (
                            <Image className="h-4 w-4 text-primary" />
                          ) : (
                            <Video className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {item.mediaType}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMedia(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {item.mediaType === 'image' && item.url && (
                        <img
                          src={`/assets/${item.url}`}
                          alt={item.caption || 'Media preview'}
                          className="w-full h-32 rounded border object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}

                      <div className="space-y-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.caption || 'No title'}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          URL: {item.url}
                        </p>
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
        <DialogContent>
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
              <Label>URL *</Label>
              <Input
                value={newMedia.url}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, url: e.target.value })
                }
                placeholder="wine-bottles-premium.dim_800x600.jpg"
              />
            </div>

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
              <Label>Upload</Label>
              {canisterId && (
                <FileDropZone 
                  canisterId={canisterId}
                  onUploadComplete={(asset) => {
                    toast.success(`${asset.name} uploaded successfully!`);
                    setNewMedia(prev => ({ ...prev, url: asset.key }));
                  }}
                />
              )}
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
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMedia}
              disabled={addMediaItem.isPending}
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