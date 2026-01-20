import {registryActor, registry} from '../actor';

self.onmessage = async function(event) {
    const { folderId, fileId, fileName, hash, chunkId } = event.data;
    console.log("worker..:" + folderId + "_" + fileId);
    try {
        registry.streamDownFile(folderId, fileId, chunkId).then((result) => {
            console.log(result);
            if (result.ok) {
                self.postMessage({ folderId : folderId, fileId : fileId, fileName : fileName, hash : hash, chunk : result.ok });
            } else {
                console.log(result);
            };
        });
    } catch (error) {
        console.log(error);
        self.postMessage({ error: error.message });
    }
};