import {useAssetBackendActor} from '../hooks/assetActor';

self.onmessage = async function(event) {
    const {
        actor,           // The actor instance (initialized with anonymous agent by default)
    } = useAssetBackendActor();
    const { folderId, fileId, fileName, hash, chunk } = event.data;
    
    console.log("worker..:" + folderId + "_" + fileId);
    try {
        actor.putFile(folderId, fileId, chunk).then((result) => {
            console.log(result);
            self.postMessage({ folderId : folderId, fileId : fileId, fileName : fileName, hash : hash, chunkId : result.ok });
        });
    } catch (error) {
        console.log(error);
        self.postMessage({ error: error.message });
    }
};