import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import { useAssetsActor } from '../hooks/useAsset';
import { sha256 } from 'js-sha256';
import { toast } from 'sonner';
import db from "../indexedDB";

export default function MyDropzone({ fileTree, fileUploaded }) {

    const workerRef = useRef(null);
    const [folder, setFolder] = useState(fileTree);
    const [fileUploadList, setFileUploadList] = useState([]);
    const [filesData, setFilesData] = useState({}); // save in indexeddb -> large binary
    const [isUpload, setIsUpload] = useState(false);


    const chunkLength = 1000000;

    if (window.Worker) {
        // console.log("worker window")
        // console.log(fileTree);
    }

    const makeDBKey = (hash, chunkId) => {
        return (hash + "_" + chunkId);
    };

    const clearFileUploaded = (name, hash) => {
        let uploadList = fileUploadList.filter(function(item) {
            return item.name !== name;
        });
        let dataList = filesData;
        console.log("DELETE DATAS")
        console.log(dataList[hash]);
        delete dataList[hash];
        console.log(dataList[hash]);
        setFileUploadList(uploadList);
        setFilesData(dataList);
    }


    useEffect(() => {
        workerRef.current = new Worker(new URL('./../workers/workerUpload.js', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = function(event) {
            console.log('Response from worker:', event.data);
            let fchunk = event.data;
            filesData[fchunk.fileName].chunkIds.push(fchunk.chunkId);
            if (filesData[fchunk.fileName].chunkIds.length == filesData[fchunk.fileName].totalChunk) {
                // clearFileUploaded(fchunk.fileName, fchunk.fileHash);
                toast.success(fchunk.fileName + ":" + fchunk.fileId + " upload completed");
                fileUploaded(fchunk.folderId, fchunk.fileId); // callback to parent node
            }
        };
        return () => {
            workerRef.current.terminate(); // Clean up the worker on component unmount
        };
    }, []);

    const storeDataToIndexedDB = async (totalChunk, hash, data) => {
        let i = 0;
        let chunkId = 0;
        while (i < data.length) {
            let offset = i + chunkLength;
            let chunk;
            if (offset >= data.length) {
                chunk = data.subarray(i);
            } else {
                chunk = data.subarray(i, offset);
            }
            let fchunk = {
                chunkOrderId : chunkId,
                data : chunk,
            }
            const key = makeDBKey(hash, chunkId);

            db.filechunk.add({ id: key, chunkid : chunkId, data: fchunk }).then((result) => {
                console.log("Chunk caching SUCCESS..");
            }).catch((err) => {
                console.log("Chunk caching Error.." + err);
            });

            chunkId++;
            i += chunkLength;
        };
        if (chunkId != totalChunk) {
            console.log("Total chunk is not the same..");
        }
    }


    const onDrop = useCallback((acceptedFiles) => {
        let fList = fileUploadList;
        let fData = filesData;

        acceptedFiles.forEach((file) => {

            let hash = "";

            let f = {
                id : 0,
                name : file.name,
                fType : {file : file.type},
                // canisterId : "",
                hash : hash,
                data : [],
                size : file.size,
                totalChunk : Math.ceil(file.size / chunkLength),
                state : {empty : null},
                children : [],
            };
            console.log(f);
            fList.push(f);

            
            /// get file content
            const reader = new FileReader()

            reader.onabort = () => console.log('file reading was aborted')
            reader.onerror = () => console.log('file reading has failed')
            reader.onload = () => {
                // Do whatever you want with the file contents
                    
                const binaryStr = reader.result;
                const bytes = new Uint8Array(binaryStr);
                const h = sha256(binaryStr);
                const totalChunk = Math.ceil(bytes.length / chunkLength);

                storeDataToIndexedDB(totalChunk, h, bytes);

                fData[file.name] = {
                    hash : h,
                    totalChunk : totalChunk,
                    chunkIds : []
                };
                
                setFilesData(fData);
            }
            reader.readAsArrayBuffer(file)
        });

        setFileUploadList(fList);
        console.log("done");
    }, [])

    function checkFileDupplicate(fileHash) {
        folder.children.map((f) => {
            if (f.hash == fileHash) return false;
        });
        return true;
    };


    const upload = async (item) => {
        if (!filesData[item.name]) {
            return;
        }
        
        setIsUpload(true);
        actor.registerUploadFile(item).then((result) => {
            console.log(result);
            if (result.ok) {
                let f = result.ok;

                setFolder(f);
                
                uploadFileChunks(f);
            } else {
                console.log(result);
            };
            setIsUpload(false);
        });
    }

    function uploadFileChunks(f) {
        toast.success("start upload chunk.. " + file.name + " | " + filesData[file.name].totalChunk);
        let totalChunk = file.totalChunk;
        let chunkId = 0;

        let startTime = new Date().getTime();

        while (chunkId < totalChunk) {

            let key = makeDBKey(file.hash, chunkId);
            db.filechunk.get(key).then((chunk) => {
                console.log(chunk);
                chunk.data.fileId = file.id;
                // chunk.data = Array.from(chunk.data);
                console.log("cahe key: " + key + " is existed");
                console.log(chunk);

                workerRef.current.postMessage({folderId : folder.id, 
                    fileId : file.id,
                    fileName : file.name,
                    hash : file.hash, 
                    chunk : chunk.data
                });
            
                }).catch((err) => {
                console.log("cahe key: " + key + " is not existed");
                console.log(err);
            });
            
            chunkId++;
        }
    }

    const {getRootProps, getInputProps} = useDropzone({onDrop})

    return (
        
        <table border={1} width={"100%"}>
        <thead>
            <tr>
              <th colSpan="8">
                {isUpload == false ? 
                    <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>Drag 'n' drop some files here, or click to select files</p>
                    </div> : 
                    ""
                }
              </th>
            </tr>
            <tr>
              <th>File ID</th>
              <th>File name</th>
              <th>File type</th>
              <th>File size</th>
              <th>File hash</th>
              <th>File state</th>
              <th>Upload</th>
            </tr>
        </thead>
        <tbody>
            {fileUploadList && fileUploadList.map((item) => {
                  return (<tr key={item.name}>
                    <td>{item.id + ""}</td>
                    <td>{item.name}</td>
                    <td>{item.fType.file}</td>
                    <td>{item.size + ""}</td>
                    <td>{item.hash}</td>
                    <td>{item.isBox ? "true" : "false"}</td>
                    <td>{item.state.hasOwnProperty("empty") ? "empty" : "ready"}</td>
                    <td>
                        {isUpload == false ? 
                            <button onClick={() => upload(item)}>Upload</button> : ""
                        }
                    </td>
                  </tr>)
              })}
        </tbody>
        <tfoot></tfoot>
      </table>
    )
}