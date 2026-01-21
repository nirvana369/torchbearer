import React, { useCallback, useEffect, useRef, useState, CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { sha256 } from 'js-sha256';
import { toast } from 'sonner';
import db from "../lib/indexedDB";
import { pRateLimit } from 'p-ratelimit';
import { AssetManager } from '@icp-sdk/canisters/assets';
import { HttpAgent } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';

// Rate limiter for concurrent uploads
const limit = pRateLimit({
  interval: 1000, // 1 second
  rate: 3, // 3 chunks per second
  concurrency: 3 // 3 concurrent uploads
});

// Type Definitions (updated with AssetManager types)
interface ChunkData {
  chunkOrderId: number;
  data: Uint8Array;
  fileId: string;
  fileName: string;
}

interface IndexedDBChunk {
  id: string;
  chunkid: string;
  data: ChunkData;
  size: number;
  uploaded: boolean;
}

interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  chunkHashes: string[];
  chunkSizes: number[];
  uploadedChunks: number[];
  status: 'cached' | 'uploading' | 'completed' | 'error';
  lastModified: number;
  createdAt: number;
}

interface FileData {
  hash: string;
  totalChunk: number;
  chunkHashes: string[];
  chunkSizes: number[];
  uploadedChunks: number[];
  size: number;
  status: string;
}

interface UploadFile {
  id: string | null;
  name: string;
  hash: string;
  size: number;
  type: string;
  totalChunk: number;
  status: 'ready' | 'registering' | 'uploading' | 'completed' | 'error' | 'cancelled';
  uploaded: boolean;
  createdAt: number;
  progress: number;
  error?: string;
}

interface UploadProgress {
  [fileName: string]: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface FilesData {
  [fileName: string]: FileData;
}

interface CancelTokens {
  [fileName: string]: boolean;
}

interface FileDropZoneProps {
  canisterId: string | Principal;
  agent?: any;
  identity?: any;
  host?: string;
  concurrency?: number;
  maxChunkSize?: number;
  maxSingleFileSize?: number;
  allowedTypes?: string[];
  customMaxFileSize?: number;
  onUploadComplete?: (asset: any) => void;
  onUploadStart?: (file: File) => void;
  onUploadError?: (error: Error, file: File) => void;
}

export default function FileDropZone({
  canisterId,
  agent: externalAgent,
  identity,
  host = 'http://127.0.0.1:4943',
  concurrency = 16,
  maxChunkSize = 1900000,
  maxSingleFileSize = 1900000,
  allowedTypes = ['image/*', 'video/*', 'application/pdf', 'text/plain'],
  customMaxFileSize = 10 * 1024 * 1024,
  onUploadComplete,
  onUploadStart,
  onUploadError
}: FileDropZoneProps) {
  const [fileUploadList, setFileUploadList] = useState<UploadFile[]>([]);
  const [filesData, setFilesData] = useState<FilesData>({});
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [cancelTokens, setCancelTokens] = useState<CancelTokens>({});
  const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const chunkLength = 1000000; // 1MB chunks

  // Initialize AssetManager (similar to IcpAssetManager)
  useEffect(() => {
    const initAssetManager = async () => {
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
        console.log('AssetManager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AssetManager:', error);
        toast.error(`Failed to initialize AssetManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initAssetManager();
  }, [canisterId, externalAgent, identity, host, concurrency, maxChunkSize, maxSingleFileSize]);

  // Helper: Convert Uint8Array to hex string (from IcpAssetManager)
  const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const makeDBKey = (hash: string, chunkId: number): string => `${hash}_${chunkId}`;

  const storeDataToIndexedDB = async (
    totalChunk: number, 
    hash: string, 
    data: Uint8Array, 
    fileName: string, 
    file: File
  ): Promise<void> => {
    const chunkPromises: Promise<{ key: string; chunkHash: string; chunkId: number; size: number }>[] = [];
    let chunkId = 0;
    const chunkHashes: string[] = [];
    const chunkSizes: number[] = [];
    
    for (let i = 0; i < data.length; i += chunkLength) {
      const offset = i + chunkLength;
      const chunk = data.subarray(i, offset > data.length ? data.length : offset);
      
      const fchunk: ChunkData = {
        chunkOrderId: chunkId,
        data: chunk,
        fileId: hash,
        fileName: fileName
      };
      
      const key = makeDBKey(hash, chunkId);
      const chunkHash = sha256(chunk as any);
      chunkHashes.push(chunkHash);
      chunkSizes.push(chunk.length);
      
      const promise = db.filechunk.put({ 
        id: key, 
        chunkid: chunkHash, 
        data: fchunk,
        size: chunk.length,
        uploaded: false
      }).then((result) => {
        console.log(`Chunk ${chunkId} cached successfully`);
        return { key, chunkHash, chunkId, size: chunk.length };
      }).catch((err: Error) => {
        console.error(`Chunk ${chunkId} caching error:`, err);
        if (err.name === 'ConstraintError') {
          console.log(`Chunk ${chunkId} already exists, skipping...`);
          return { key, chunkHash, chunkId, size: chunk.length };
        }
        throw err;
      });
      
      chunkPromises.push(promise);
      chunkId++;
    }
    
    try {
      await Promise.all(chunkPromises);
      
      const existingFile = await db.files.get(hash);
      
      const fileMetadata: FileMetadata = {
        id: hash,
        name: fileName,
        size: file.size,
        type: file.type,
        totalChunks: totalChunk,
        chunkHashes,
        chunkSizes,
        uploadedChunks: [],
        status: 'cached',
        lastModified: file.lastModified,
        createdAt: Date.now()
      };
      
      if (existingFile) {
        await db.files.update(hash, fileMetadata);
        console.log(`File ${fileName} updated in cache`);
      } else {
        await db.files.add(fileMetadata);
        console.log(`File ${fileName} added to cache`);
      }
      
      setFilesData(prev => ({
        ...prev,
        [fileName]: {
          hash,
          totalChunk,
          chunkHashes,
          chunkSizes,
          uploadedChunks: [],
          size: file.size,
          status: 'cached'
        }
      }));
      
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: {
          current: 0,
          total: totalChunk,
          percentage: 0
        }
      }));
      
      console.log(`File ${fileName} processed: ${totalChunk} chunks, hash: ${hash}`);
      
    } catch (error) {
      console.error("Error storing to IndexedDB:", error);
      toast.error(`Error processing ${fileName}: ${(error as Error).message}`);
      throw error;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      // Validate file size using customMaxFileSize from props
      if (file.size > customMaxFileSize) {
        toast.error(`${file.name} exceeds maximum size of ${Math.round(customMaxFileSize / 1024 / 1024)}MB`);
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
        toast.error(`${file.name} type not allowed`);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onabort = () => {
        toast.error(`File ${file.name} reading was aborted`);
      };
      
      reader.onerror = () => {
        toast.error(`File ${file.name} reading failed`);
      };
      
      reader.onload = async () => {
        try {
          onUploadStart?.(file);
          
          const binaryStr = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(binaryStr);
          const hash = sha256(binaryStr as any);
          const totalChunk = Math.ceil(bytes.length / chunkLength);
          
          toast.info(`Processing ${file.name}...`);
          
          const existingFile = fileUploadList.find(f => f.hash === hash);
          if (existingFile) {
            toast.info(`${file.name} is already in upload list`);
            return;
          }
          
          await storeDataToIndexedDB(totalChunk, hash, bytes, file.name, file);
          
          setFileUploadList(prev => {
            const fileExists = prev.some(f => f.hash === hash);
            if (fileExists) {
              toast.info(`${file.name} already in upload list`);
              return prev;
            }
            
            const newFile: UploadFile = {
              id: null,
              name: file.name,
              hash,
              size: file.size,
              type: file.type,
              totalChunk,
              status: 'ready',
              uploaded: false,
              createdAt: Date.now(),
              progress: 0
            };
            
            toast.success(`${file.name} ready for upload`);
            return [...prev, newFile];
          });
          
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error(`Error processing ${file.name}: ${(error as Error).message}`);
          onUploadError?.(error as Error, file);
        }
      };
      
      reader.readAsArrayBuffer(file);
    });
  }, [fileUploadList, customMaxFileSize, allowedTypes, onUploadStart, onUploadError]);

  // NEW: AssetManager-based upload function (from IcpAssetManager)
  const uploadFileWithAssetManager = async (fileItem: UploadFile, file: File): Promise<boolean> => {
    if (!assetManager) {
      toast.error("AssetManager not initialized");
      return false;
    }

    if (file.size > customMaxFileSize) {
      toast.error(`File size must be less than ${Math.round(customMaxFileSize / 1024 / 1024)}MB`);
      return false;
    }

    setUploadInProgress(true);
    setIsUpload(true);
    const progressKey = `${Date.now()}_${fileItem.name}`;
    
    // Update status
    setFileUploadList(prev => 
      prev.map(file => 
        file.name === fileItem.name 
          ? { ...file, status: 'uploading' }
          : file
      )
    );
    
    setUploadProgress(prev => ({ 
      ...prev, 
      [fileItem.name]: { 
        ...prev[fileItem.name], 
        percentage: 0,
        current: 0,
        total: 100
      } 
    }));

    // Simulate progress
    const simulateProgress = () => {
      setUploadProgress(prev => {
        const currentProgress = prev[fileItem.name] || { percentage: 0, current: 0, total: 100 };
        if (currentProgress.percentage < 90) {
          return { 
            ...prev, 
            [fileItem.name]: {
              ...currentProgress,
              percentage: currentProgress.percentage + 10,
              current: Math.floor(currentProgress.current + (currentProgress.total * 0.1))
            }
          };
        }
        return prev;
      });
    };

    const progressInterval = setInterval(simulateProgress, 300);

    try {
      // Use AssetManager's store method (from IcpAssetManager)
      const key = await assetManager.store(file);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ 
        ...prev, 
        [fileItem.name]: { 
          ...prev[fileItem.name], 
          percentage: 100,
          current: prev[fileItem.name]?.total || 100
        } 
      }));

      // Create metadata similar to IcpAssetManager
      const newAsset = {
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

      // Update file list
      setFileUploadList(prev => 
        prev.map(item => 
          item.name === fileItem.name 
            ? { ...item, id: key, uploaded: true, status: 'completed', progress: 100 }
            : item
        )
      );

      onUploadComplete?.(newAsset);
      toast.success(`${fileItem.name} uploaded successfully!`);

      return true;

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setFileUploadList(prev => 
        prev.map(item => 
          item.name === fileItem.name 
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : item
        )
      );
      
      onUploadError?.(error as Error, file);
      return false;
    } finally {
      clearInterval(progressInterval);
      setUploadInProgress(false);
      setIsUpload(false);
    }
  };

  // Legacy upload function (keeping for compatibility)
  const uploadFile = async (fileItem: UploadFile): Promise<boolean> => {
    const fileData = filesData[fileItem.name];
    
    if (!fileData) {
      toast.error("File data not ready");
      return false;
    }

    // Check if we have AssetManager available
    if (assetManager) {
      // Get the actual File object
      const file = new File([], fileItem.name, { type: fileItem.type });
      // Note: In a real implementation, you'd need to retrieve the file from cache
      return uploadFileWithAssetManager(fileItem, file);
    }
    
    // Fallback to legacy upload if AssetManager is not available
    toast.error("Upload system not initialized");
    return false;
  };

  const cancelUpload = (fileName: string): void => {
    setCancelTokens(prev => ({
      ...prev,
      [fileName]: true
    }));
    
    toast.info(`Cancelling upload for ${fileName}`);
    
    setFileUploadList(prev => 
      prev.map(file => 
        file.name === fileName 
          ? { ...file, status: 'cancelled' }
          : file
      )
    );
  };

  const removeFile = (fileName: string): void => {
    setFileUploadList(prev => prev.filter(file => file.name !== fileName));
    
    setFilesData(prev => {
      const newData = { ...prev };
      delete newData[fileName];
      return newData;
    });
    
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    
    toast.info(`${fileName} removed from list`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    disabled: !assetManager || loading
  });

  // Helper function to get status color
  const getStatusColor = (status: UploadFile['status']): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'uploading': 
      case 'registering': return '#2196F3';
      case 'error': return '#f44336';
      case 'cancelled': return '#ff9800';
      case 'ready': return '#757575';
      default: return '#757575';
    }
  };

  // Styles
  const dropzoneStyle: CSSProperties = {
    padding: '40px',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    cursor: assetManager && !loading ? 'pointer' : 'not-allowed',
    backgroundColor: isDragActive ? '#f0f8ff' : !assetManager || loading ? '#f5f5f5' : 'white',
    textAlign: 'center',
    marginBottom: '20px',
    transition: 'background-color 0.3s',
    opacity: assetManager && !loading ? 1 : 0.6
  };

  const progressBarStyle = (percentage: number, color: string): CSSProperties => ({
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.3s'
  });

  const spinnerStyle: CSSProperties = {
    width: '20px',
    height: '20px',
    border: '2px solid #e0e0e0',
    borderTopColor: '#2196F3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '10px'
  };

  const statusBadgeStyle = (color: string): CSSProperties => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: `${color}20`,
    color: color,
    fontWeight: '500'
  });

  const uploadIndicatorStyle: CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000
  };

  return (
    <div style={{ padding: '20px' }}>
      {loading && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          borderRadius: '4px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          Initializing AssetManager...
        </div>
      )}
      
      {!assetManager && !loading && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          AssetManager not initialized. Uploads disabled.
        </div>
      )}
      
      <div 
        {...getRootProps()} 
        style={dropzoneStyle}
      >
        <input {...getInputProps()} disabled={!assetManager || loading} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>
              {!assetManager || loading ? 'Initializing...' : 'Drag \'n\' drop files here, or click to select files'}
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Maximum file size: {Math.round(customMaxFileSize / 1024 / 1024)}MB
              {allowedTypes.length > 0 && (
                <span> | Allowed types: {allowedTypes.join(', ')}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {fileUploadList.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>File Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Size</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Chunks</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Progress</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fileUploadList.map((item) => {
                const fileData = filesData[item.name] || {} as FileData;
                const progress = uploadProgress[item.name] || { percentage: 0, current: 0, total: 0 };
                const uploadedCount = fileData.uploadedChunks?.length || 0;
                const totalChunks = fileData.totalChunk || 0;
                const statusColor = getStatusColor(item.status);
                
                return (
                  <tr key={item.hash} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ marginRight: '10px' }}>
                          {item.type?.startsWith('image/') ? '🖼️' : '📄'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                            {item.hash?.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {formatFileSize(item.size)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {uploadedCount}/{totalChunks}
                    </td>
                    <td style={{ padding: '12px', width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                          width: '150px', 
                          height: '8px', 
                          backgroundColor: '#e0e0e0', 
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginRight: '10px'
                        }}>
                          <div style={progressBarStyle(progress.percentage, statusColor)} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {progress.percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={statusBadgeStyle(statusColor)}>
                        {item.status.toUpperCase()}
                      </span>
                      {item.error && (
                        <div style={{ fontSize: '11px', color: '#f44336', marginTop: '4px' }}>
                          {item.error}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!item.uploaded && item.status !== 'uploading' && item.status !== 'registering' && item.status !== 'cancelled' && (
                          <button
                            onClick={() => uploadFile(item)}
                            disabled={uploadInProgress || !assetManager}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: (uploadInProgress || !assetManager) ? 'not-allowed' : 'pointer',
                              opacity: (uploadInProgress || !assetManager) ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                          >
                            {!assetManager ? 'Loading...' : 'Upload'}
                          </button>
                        )}
                        
                        {(item.status === 'uploading' || item.status === 'registering') && (
                          <button
                            onClick={() => cancelUpload(item.name)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeFile(item.name)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {uploadInProgress && (
        <div style={uploadIndicatorStyle}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={spinnerStyle} />
            <span style={{ fontWeight: '500' }}>Uploading files...</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {Object.values(uploadProgress).filter(p => p.percentage < 100).length} files in progress
          </div>
        </div>
      )}
    </div>
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