// components/AssetManager.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetManager } from '@icp-sdk/canisters/assets';
import { HttpAgent } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';

// Types based on the canister interface
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

interface AssetManagerProps {
  canisterId: string | Principal;
  agent?: any;
  identity?: any;
  host?: string;
  concurrency?: number;
  maxChunkSize?: number;
  maxSingleFileSize?: number;
  onUploadComplete?: (asset: AssetMetadata) => void;
  onDeleteComplete?: (assetId: string) => void;
  allowedTypes?: string[];
  customMaxFileSize?: number;
}

export const IcpAssetManager: React.FC<AssetManagerProps> = ({
  canisterId,
  agent: externalAgent,
  identity,
  host,
  concurrency = 16,
  maxChunkSize = 1900000,
  maxSingleFileSize = 450000,
  onUploadComplete,
  onDeleteComplete,
  allowedTypes = ['image/*', 'video/*', 'application/pdf', 'text/plain'],
  customMaxFileSize = 10 * 1024 * 1024
}) => {
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchAssets, setBatchAssets] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 12;

  // Initialize AssetManager
  useEffect(() => {
    const initAssetManager = async () => {
      try {
        let agent: HttpAgent;

        const host = process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://icp-api.io'; // mainnet
        
        if (externalAgent) {
          agent = externalAgent;
        } else {
          agent = await HttpAgent.create({
            host: host
          });

          if (process.env.DFX_NETWORK !== 'ic') {
            await agent.fetchRootKey();
          }

          if (identity) {
            console.log(identity);
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
      } catch (error) {
        console.error('Failed to initialize AssetManager:', error);
      }
    };
    
    initAssetManager();
  }, [canisterId, externalAgent, identity, host, concurrency, maxChunkSize, maxSingleFileSize]);

  // Load assets with proper type handling
  const loadAssets = useCallback(async (page: number = 1) => {
    if (!assetManager) return;

    setLoading(true);
    try {
      // The list() method calls the canister's list() query with pagination
      // According to the interface: list : (record { start: opt nat; length: opt nat }) -> (vec AssetCanisterEntry)
      const start = (page - 1) * itemsPerPage;
      const entries = await assetManager.list();
      
      // The library might not support pagination directly, so we implement it client-side
      const paginatedEntries = entries.slice(start, start + itemsPerPage);
      
      // Convert to AssetMetadata
      const assetsWithMetadata: AssetMetadata[] = await Promise.all(
        paginatedEntries.map(async (entry: any) => {
          try {
            // If the library returns raw canister data, it should match AssetCanisterEntry
            // Otherwise, we need to fetch additional details
            let canisterEntry: AssetCanisterEntry;
            
            if (typeof entry === 'string') {
              // If only key is returned, we need to get full details
              const asset = await assetManager.get(entry);
              canisterEntry = {
                key: entry,
                content_type: asset.contentType,
                encodings: [
                  {
                    content_encoding: asset.contentEncoding,
                    sha256: asset.sha256 || null,
                    length: BigInt(asset.length),
                    modified: BigInt(Date.now() * 1000000) // Approximate
                  }
                ],
                max_age: null,
                headers: null,
                allow_raw_access: null,
                is_aliased: null
              };
            } else {
              // Assume it's already a full entry
              canisterEntry = entry;
            }
            
            // Get the primary encoding (usually 'identity' or 'gzip')
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
            // Return minimal metadata
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
    } finally {
      setLoading(false);
    }
  }, [assetManager, canisterId]);

  // Helper: Convert Uint8Array to hex string
  const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Handle single file upload
  const handleSingleUpload = async (file: File) => {
    if (!assetManager) return;

    if (file.size > customMaxFileSize) {
      alert(`File size must be less than ${Math.round(customMaxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    const progressKey = `${Date.now()}_${file.name}`;
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

    try {
      // Simulate progress
      const simulateProgress = () => {
        setUploadProgress(prev => {
          const current = prev[progressKey] || 0;
          if (current < 90) {
            return { ...prev, [progressKey]: current + 10 };
          }
          return prev;
        });
      };

      const progressInterval = setInterval(simulateProgress, 300);

      // Store the file - this calls store() method which internally uses batch operations
      const key = await assetManager.store(file);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));

      // Create metadata for the new asset
      const now = BigInt(Date.now() * 1000000);
      const newAsset: AssetMetadata = {
        id: key,
        key,
        name: file.name,
        url: `https://${typeof canisterId === 'string' ? canisterId : canisterId.toString()}.icp0.io/${key}`,
        content_type: file.type,
        size: file.size,
        created_at: new Date(),
        modified: new Date(),
        path: key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : '/'
      };

      // Update state
      setAssets(prev => [newAsset, ...prev]);
      setTotalAssets(prev => prev + 1);
      
      onUploadComplete?.(newAsset);
      
      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [progressKey]: _, ...rest } = prev;
          return rest;
        });
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle batch upload
  const handleBatchUpload = async () => {
    if (!assetManager || batchAssets.length === 0) return;

    setUploading(true);
    const batch = assetManager.batch();
    const uploadedAssets: AssetMetadata[] = [];

    try {
      for (const file of batchAssets) {
        if (file.size > customMaxFileSize) {
          console.warn(`Skipping ${file.name}: File too large`);
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
            url: `https://${typeof canisterId === 'string' ? canisterId : canisterId.toString()}.icp0.io/${key}`,
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
        }
      }

      // Commit the batch - this calls commit_batch() on the canister
      if (uploadedAssets.length > 0) {
        await batch.commit();

        // Update state
        setAssets(prev => [...uploadedAssets, ...prev]);
        setTotalAssets(prev => prev + uploadedAssets.length);
        
        // Notify completion
        uploadedAssets.forEach(asset => onUploadComplete?.(asset));
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
      alert(`Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete asset
  const handleDelete = async (assetKey: string) => {
    if (!assetManager || !confirm('Are you sure you want to delete this asset?')) return;

    try {
      // This calls delete_asset() on the canister
      await assetManager.delete(assetKey);
      
      // Update state
      setAssets(prev => prev.filter(a => a.key !== assetKey));
      setTotalAssets(prev => prev - 1);
      
      onDeleteComplete?.(assetKey);
      
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get asset properties
  const getAssetProperties = async (key: string) => {
    if (!assetManager) return null;
    
    try {
      // Note: The library might not expose get_asset_properties directly
      // We might need to use a different approach
      const asset = await assetManager.get(key);
      return {
        key,
        content_type: asset.contentType,
        size: asset.length,
        sha256: asset.sha256 ? bytesToHex(asset.sha256) : undefined,
        // Additional properties might not be available through the library
      };
    } catch (error) {
      console.error(`Failed to get properties for ${key}:`, error);
      return null;
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      alert('No files of allowed types selected');
      return;
    }

    if (batchMode) {
      setBatchAssets(prev => [...prev, ...filteredFiles]);
    } else if (filteredFiles.length === 1) {
      handleSingleUpload(filteredFiles[0]);
    } else {
      // Multiple files without batch mode - enable batch mode
      setBatchMode(true);
      setBatchAssets(filteredFiles);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load assets on assetManager init and page change
  useEffect(() => {
    if (assetManager) {
      loadAssets(currentPage);
    }
  }, [assetManager, currentPage, loadAssets]);

  const totalPages = Math.ceil(totalAssets / itemsPerPage);
  const selectedCount = batchAssets.length;

  return (
    <div className="icp-asset-manager">
      {/* Header Section */}
      <div className="header-section">
        <h1>Asset Manager</h1>
        <div className="config-info">
          <span>Total Assets: {totalAssets}</span>
          <span>Canister: {typeof canisterId === 'string' ? canisterId : canisterId.toString()}</span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h2>{batchMode ? 'Batch Upload' : 'Upload Asset'}</h2>
        
        <div className="upload-controls">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={allowedTypes.join(',')}
            multiple={batchMode}
            disabled={uploading || !assetManager || loading}
          />
          
          {batchMode && (
            <div className="batch-info">
              <span>Selected: {selectedCount} file(s)</span>
              {selectedCount > 0 && (
                <button
                  onClick={handleBatchUpload}
                  disabled={uploading || selectedCount === 0}
                  className="upload-button"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedCount} File(s)`}
                </button>
              )}
              <button
                onClick={() => {
                  setBatchMode(false);
                  setBatchAssets([]);
                }}
                className="cancel-batch"
              >
                Cancel Batch
              </button>
            </div>
          )}
          
          {!batchMode && (
            <button
              onClick={() => setBatchMode(true)}
              className="enable-batch"
              disabled={!assetManager || loading}
            >
              Enable Batch Mode
            </button>
          )}
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="upload-status">
            <h4>Upload Progress</h4>
            {Object.entries(uploadProgress).map(([key, progress]) => {
              const fileName = key.split('_').slice(1).join('_');
              return (
                <div key={key} className="progress-item">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span>{fileName}: {progress}%</span>
                </div>
              );
            })}
          </div>
        )}

        {!assetManager && <div className="loading">Initializing AssetManager...</div>}
        {loading && <div className="loading">Loading assets...</div>}
      </div>

      {/* Gallery Section */}
      <div className="gallery-section">
        <div className="gallery-header">
          <h2>Assets ({totalAssets})</h2>
          <div className="gallery-controls">
            <button
              onClick={() => loadAssets(currentPage)}
              className="refresh-button"
              disabled={!assetManager || loading}
            >
              Refresh
            </button>
            <select 
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              value={currentPage}
              disabled={totalPages <= 1}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>Page {page}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="asset-grid">
          {assets.map(asset => (
            <div key={asset.id} className="asset-card">
              <div className="asset-preview">
                {asset.content_type.startsWith('image/') ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>';
                    }}
                  />
                ) : asset.content_type.startsWith('video/') ? (
                  <div className="video-preview">
                    <div className="video-icon">🎬</div>
                    <span>Video</span>
                  </div>
                ) : asset.content_type.includes('pdf') ? (
                  <div className="file-preview pdf">
                    📄 PDF
                  </div>
                ) : (
                  <div className="file-preview">
                    📁 {asset.content_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </div>
                )}
              </div>
              
              <div className="asset-info">
                <div className="asset-name" title={asset.name}>
                  {asset.name}
                </div>
                <div className="asset-meta">
                  <div>Size: {formatFileSize(asset.size)}</div>
                  <div>Type: {asset.content_type}</div>
                  <div>Modified: {asset.modified.toLocaleDateString()}</div>
                  {asset.sha256 && (
                    <div className="sha256" title={asset.sha256}>
                      SHA256: {asset.sha256.substring(0, 8)}...
                    </div>
                  )}
                  {asset.content_encoding && asset.content_encoding !== 'identity' && (
                    <div>Encoding: {asset.content_encoding}</div>
                  )}
                  {asset.max_age && (
                    <div>Max Age: {asset.max_age}s</div>
                  )}
                  {asset.path && asset.path !== '/' && (
                    <div className="asset-path">
                      Path: {asset.path}
                    </div>
                  )}
                </div>
                
                <div className="asset-actions">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button view"
                    title="View in new tab"
                  >
                    🔗
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(asset.url);
                      alert('URL copied to clipboard!');
                    }}
                    className="action-button copy"
                    title="Copy URL"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => getAssetProperties(asset.key)}
                    className="action-button info"
                    title="Get Properties"
                    disabled={!assetManager}
                  >
                    ℹ️
                  </button>
                  <button
                    onClick={() => handleDelete(asset.key)}
                    className="action-button delete"
                    title="Delete"
                    disabled={!assetManager}
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="asset-url">
                  <input
                    type="text"
                    value={asset.url}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="Asset URL"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next →
            </button>
          </div>
        )}

        {assets.length === 0 && totalAssets === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No assets yet</h3>
            <p>Upload your first file to get started!</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-first-button"
              disabled={!assetManager}
            >
              Upload First File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add styles (same as before, but with additional styles for new elements)
const styles = `
.icp-asset-manager {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Segoe UI Emoji', sans-serif;
  background: linear-gradient(135deg, #667eea0d 0%, #764ba20d 100%);
  min-height: 100vh;
}

/* ... (previous styles remain the same) ... */

.sha256 {
  font-family: monospace;
  font-size: 0.8rem;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.gallery-controls select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
}

.action-button.view {
  background: #9C27B0;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button.info {
  background: #009688;
  color: white;
}

.asset-meta > div {
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: #666;
}

.asset-path {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px !important;
  font-size: 0.8rem !important;
  color: #1976D2 !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}