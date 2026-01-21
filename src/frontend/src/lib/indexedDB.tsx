// lib/indexedDB.ts
import Dexie, { Table } from 'dexie';

// Define interfaces for the database tables
export interface ChunkData {
  chunkOrderId: number;
  data: Uint8Array;
  fileId: string;
  fileName: string;
}

export interface IndexedDBChunk {
  id: string;
  chunkid: string;
  data: ChunkData;
  size: number;
  uploaded: boolean;
  uploadedAt?: number;
}

export interface FileMetadata {
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
  uploadedAt?: number;
  error?: string;
}

export class FileUploadManager extends Dexie {
  filechunk!: Table<IndexedDBChunk, string>; // id is the primary key
  files!: Table<FileMetadata, string>; // id (hash) is the primary key

  constructor() {
    super('FileTreeDB');
    
    // Version 1 - initial schema
    // Version 2 - added files table and enhanced filechunk table
    this.version(2).stores({
      filechunk: 'id, chunkid, [fileId+chunkOrderId]', // Added compound index for faster queries
      files: 'id, name, status, createdAt' // Added indexes for common queries
    }).upgrade(tx => {
      // Migration from version 1 to 2
      return tx.table('filechunk').toCollection().modify(chunk => {
        // Add size and uploaded fields to existing chunks
        if (!chunk.size) {
          chunk.size = chunk.data.data?.length || 0;
        }
        if (chunk.uploaded === undefined) {
          chunk.uploaded = false;
        }
      });
    });
    
    // Version 3 - added uploadedAt field and error field
    this.version(3).stores({
      filechunk: 'id, chunkid, [fileId+chunkOrderId], uploaded',
      files: 'id, name, status, createdAt, uploadedAt'
    }).upgrade(tx => {
      // Add uploadedAt and error fields
      return Promise.all([
        tx.table('filechunk').toCollection().modify(chunk => {
          if (!chunk.uploadedAt && chunk.uploaded) {
            chunk.uploadedAt = Date.now();
          }
        }),
        tx.table('files').toCollection().modify(file => {
          if (!file.uploadedAt && file.status === 'completed') {
            file.uploadedAt = Date.now();
          }
        })
      ]);
    });
  }
  
  // Helper method to get all chunks for a file
  async getFileChunks(fileHash: string): Promise<IndexedDBChunk[]> {
    return this.filechunk
      .where('data.fileId')
      .equals(fileHash)
      .sortBy('data.chunkOrderId');
  }
  
  // Helper method to mark chunk as uploaded
  async markChunkAsUploaded(chunkId: string): Promise<void> {
    await this.filechunk.update(chunkId, {
      uploaded: true,
      uploadedAt: Date.now()
    });
  }
  
  // Helper method to update file status
  async updateFileStatus(fileHash: string, status: FileMetadata['status'], error?: string): Promise<void> {
    const updateData: Partial<FileMetadata> = { status };
    
    if (error) {
      updateData.error = error;
    }
    
    if (status === 'completed') {
      updateData.uploadedAt = Date.now();
    }
    
    await this.files.update(fileHash, updateData);
  }
  
  // Helper method to add uploaded chunk to file metadata
  async addUploadedChunk(fileHash: string, chunkId: number): Promise<void> {
    const file = await this.files.get(fileHash);
    if (file) {
      if (!file.uploadedChunks.includes(chunkId)) {
        const uploadedChunks = [...file.uploadedChunks, chunkId];
        const isComplete = uploadedChunks.length === file.totalChunks;
        
        await this.files.update(fileHash, {
          uploadedChunks,
          status: isComplete ? 'completed' : 'uploading'
        });
        
        if (isComplete) {
          await this.markAllChunksAsUploaded(fileHash);
        }
      }
    }
  }
  
  // Helper to mark all chunks of a file as uploaded
  async markAllChunksAsUploaded(fileHash: string): Promise<void> {
    const chunks = await this.getFileChunks(fileHash);
    const updatePromises = chunks.map(chunk => 
      this.filechunk.update(chunk.id, {
        uploaded: true,
        uploadedAt: Date.now()
      })
    );
    await Promise.all(updatePromises);
  }
  
  // Helper to clear all data for a file
  async removeFile(fileHash: string): Promise<void> {
    // Delete all chunks for this file
    const chunks = await this.getFileChunks(fileHash);
    const chunkIds = chunks.map(chunk => chunk.id);
    await this.filechunk.bulkDelete(chunkIds);
    
    // Delete file metadata
    await this.files.delete(fileHash);
  }
  
  // Helper to get upload statistics
  async getUploadStats(): Promise<{
    totalFiles: number;
    uploadedFiles: number;
    totalChunks: number;
    uploadedChunks: number;
    totalSize: number;
    uploadedSize: number;
  }> {
    const files = await this.files.toArray();
    const chunks = await this.filechunk.toArray();
    
    const totalFiles = files.length;
    const uploadedFiles = files.filter(f => f.status === 'completed').length;
    const totalChunks = chunks.length;
    const uploadedChunks = chunks.filter(c => c.uploaded).length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const uploadedSize = chunks
      .filter(c => c.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    
    return {
      totalFiles,
      uploadedFiles,
      totalChunks,
      uploadedChunks,
      totalSize,
      uploadedSize
    };
  }
  
  // Helper to clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    await Promise.all([
      this.filechunk.clear(),
      this.files.clear()
    ]);
  }
  
  // Helper to get all files with their chunks
  async getAllFilesWithChunks(): Promise<Array<FileMetadata & { chunks: IndexedDBChunk[] }>> {
    const files = await this.files.toArray();
    
    const filesWithChunks = await Promise.all(
      files.map(async (file) => {
        const chunks = await this.getFileChunks(file.id);
        return {
          ...file,
          chunks
        };
      })
    );
    
    return filesWithChunks;
  }
}

// Create and export a singleton instance
const db = new FileUploadManager();

// Export the instance and types
export default db;
// export { FileUploadManager };