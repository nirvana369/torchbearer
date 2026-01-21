import useAssetBackendActor from '../hooks/assetActor';

// Initialize actor in worker
async function initializeActor(config) {

    const actor = useAssetBackendActor();

    if (isInitialized && actor) {
      return actor;
    }
    
    try {
        if (!actor) {
            throw new Error("Actor not initialized");
          }
      
      isInitialized = true;
      console.log("Worker: Actor initialized successfully");
      return actor;
      
    } catch (error) {
      console.error("Worker: Actor initialization failed:", error);
      throw error;
    }
}
// Handle file registration
async function handleFileRegistration(fileInfo, fileHash, fileName) {

    const actor = useAssetBackendActor();
    
    try {
      if (!actor) {
        throw new Error("Actor not initialized");
      }
      
      console.log(`Worker: Registering file ${fileName} with hash ${fileHash}`);
      
      // Call registerUploadFile on canister
      const result = await actor.registerUploadFile(fileHash, fileInfo);
      
      console.log(`Worker: Registration result for ${fileName}:`, result);
      
      if (result && typeof result === 'object') {
        if ('ok' in result) {
          // Registration successful
          self.postMessage({
            type: 'REGISTRATION_COMPLETE',
            fileName,
            fileId: fileHash, // Use hash as file ID
            success: true,
            message: "File registered successfully"
          });
          return true;
        } else if ('err' in result) {
          // Registration failed
          throw new Error(`Registration failed: ${result.err}`);
        }
      }
      
      throw new Error("Invalid response from canister");
      
    } catch (error) {
      console.error(`Worker: File registration error for ${fileName}:`, error);
      self.postMessage({
        type: 'REGISTRATION_COMPLETE',
        fileName,
        success: false,
        error: error.message
      });
      return false;
    }
  }
  
  // Handle chunk upload
  async function handleChunkUpload(fileHash, fileName, chunkHash, chunk, chunkId, totalChunks) {

    const actor = useAssetBackendActor();

    try {
      if (!actor) {
        throw new Error("Actor not initialized");
      }
      
      console.log(`Worker: Uploading chunk ${chunkId} for ${fileName}`);
      
      // Prepare chunk data according to canister interface
      // chunk.data should be Uint8Array or Array
      let chunkData;
      if (chunk.data instanceof Uint8Array) {
        chunkData = chunk.data;
      } else if (Array.isArray(chunk.data)) {
        chunkData = new Uint8Array(chunk.data);
      } else {
        throw new Error("Invalid chunk data format");
      }
      
      // Create FileChunk structure
      const fileChunk = {
        data: chunkData,
        id: BigInt(chunkId)
      };
      
      console.log(`Worker: Uploading ${fileName} chunk ${chunkId}, size: ${chunkData.length} bytes`);
      
      // Call putFile on canister
      // Use chunkHash as the key parameter
      const result = await actor.putFile(chunkHash, fileChunk);
      
      console.log(`Worker: Upload result for ${fileName} chunk ${chunkId}:`, result);
      
      if (result && typeof result === 'object') {
        if ('ok' in result) {
          // Upload successful
          self.postMessage({
            type: 'UPLOAD_COMPLETE',
            fileName,
            chunkId,
            success: true,
            message: `Chunk ${chunkId} uploaded successfully`
          });
          return true;
        } else if ('err' in result) {
          // Upload failed
          throw new Error(`Upload failed: ${result.err}`);
        }
      }
      
      throw new Error("Invalid response from canister");
      
    } catch (error) {
      console.error(`Worker: Chunk upload error for ${fileName} chunk ${chunkId}:`, error);
      self.postMessage({
        type: 'UPLOAD_COMPLETE',
        fileName,
        chunkId,
        success: false,
        error: error.message
      });
      return false;
    }
  }
  
  // Main message handler
  self.onmessage = async function(event) {
    const { type, ...data } = event.data;
    
    try {
      switch (type) {
        case 'INIT':
          // Initialize actor with configuration from main thread
          await initializeActor();
          self.postMessage({
            type: 'INIT_COMPLETE',
            success: true,
            message: "Worker initialized"
          });
          break;
          
        case 'REGISTER_FILE':
          // Handle file registration
          await handleFileRegistration(
            data.fileInfo,
            data.fileHash,
            data.fileName
          );
          break;
          
        case 'UPLOAD_CHUNK':
          // Handle chunk upload
          await handleChunkUpload(
            data.fileHash,
            data.fileName,
            data.chunkHash,
            data.chunk,
            data.chunkId,
            data.totalChunks
          );
          break;
          
        default:
          console.warn("Worker: Unknown message type:", type);
          self.postMessage({
            type: 'ERROR',
            error: `Unknown message type: ${type}`
          });
      }
    } catch (error) {
      console.error("Worker: Unhandled error in message handler:", error);
      self.postMessage({
        type: 'ERROR',
        error: `Unhandled error: ${error.message}`
      });
    }
  };
  
  // Error handling
  self.onerror = function(error) {
    console.error("Worker: Global error:", error);
    self.postMessage({
      type: 'ERROR',
      error: `Worker global error: ${error.message}`
    });
  };
  
  // Handle unhandled rejections
  self.onunhandledrejection = function(event) {
    console.error("Worker: Unhandled promise rejection:", event.reason);
    self.postMessage({
      type: 'ERROR',
      error: `Unhandled promise rejection: ${event.reason.message || event.reason}`
    });
  };
  