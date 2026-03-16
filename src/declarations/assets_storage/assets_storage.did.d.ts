import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileChunk { 'id' : bigint, 'data' : Uint8Array | number[] }
export interface FileInfo {
  'name' : string,
  'size' : bigint,
  'state' : FileState,
  'lastTimeUpdate' : bigint,
  'chunks' : Array<string>,
}
export type FileState = { 'empty' : null } |
  { 'ready' : null };
export interface FileStorage {
  'addAdmins' : ActorMethod<[Array<Principal>], Array<[string, Roles]>>,
  /**
   * / Changes chunk size configuration
   */
  'changeChunkSize' : ActorMethod<[bigint], Result>,
  'clean' : ActorMethod<[boolean], Result_4>,
  /**
   * / Deletes a file from storage
   */
  'deleteFile' : ActorMethod<[string], Result_1>,
  /**
   * / Returns canister ID
   */
  'getCanisterId' : ActorMethod<[], string>,
  'getFileChunk' : ActorMethod<[string], Result_3>,
  /**
   * / Retrieves a file from storage
   */
  'getFileInfo' : ActorMethod<[string], Result_2>,
  /**
   * / Returns profiler data
   */
  'getProfiler' : ActorMethod<[], Array<ProfileResult>>,
  /**
   * / Returns RBAC roles
   */
  'getRoles' : ActorMethod<[], Array<[string, Roles]>>,
  /**
   * / Returns storage information
   */
  'getStorageInfo' : ActorMethod<[], { 'mem' : string, 'cycle' : string }>,
  /**
   * / Returns version information
   */
  'getVersion' : ActorMethod<[], string>,
  /**
   * / Checks if file exists
   */
  'isExisted' : ActorMethod<[string], Result_1>,
  'listFiles' : ActorMethod<[], Array<string>>,
  /**
   * / Stores a file in the storage system
   */
  'putFile' : ActorMethod<[string, FileChunk], Result>,
  /**
   * / Stores a file in the storage system
   */
  'registerUploadFile' : ActorMethod<[string, FileInfo], Result>,
  'watcherCallback' : ActorMethod<[], Result>,
  /**
   * / Returns caller's principal
   */
  'whoami' : ActorMethod<[], string>,
}
export interface ProfileResult {
  'id' : string,
  'count' : bigint,
  'avgProcTime' : bigint,
  'totalProcTime' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_2 = { 'ok' : FileInfo } |
  { 'err' : string };
export type Result_3 = { 'ok' : FileChunk } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<[string, [string, bigint]]> } |
  { 'err' : string };
export type Roles = { 'admin' : null } |
  { 'storage' : null } |
  { 'user' : null } |
  { 'anonymous' : null } |
  { 'superadmin' : null };
export interface _SERVICE extends FileStorage {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
