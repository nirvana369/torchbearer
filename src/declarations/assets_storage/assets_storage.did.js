export const idlFactory = ({ IDL }) => {
  const Roles = IDL.Variant({
    'admin' : IDL.Null,
    'storage' : IDL.Null,
    'user' : IDL.Null,
    'anonymous' : IDL.Null,
    'superadmin' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Tuple(IDL.Text, IDL.Int))),
    'err' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const FileChunk = IDL.Record({ 'id' : IDL.Nat, 'data' : IDL.Vec(IDL.Nat8) });
  const Result_3 = IDL.Variant({ 'ok' : FileChunk, 'err' : IDL.Text });
  const FileState = IDL.Variant({ 'empty' : IDL.Null, 'ready' : IDL.Null });
  const FileInfo = IDL.Record({
    'name' : IDL.Text,
    'size' : IDL.Nat,
    'state' : FileState,
    'lastTimeUpdate' : IDL.Int,
    'chunks' : IDL.Vec(IDL.Text),
  });
  const Result_2 = IDL.Variant({ 'ok' : FileInfo, 'err' : IDL.Text });
  const ProfileResult = IDL.Record({
    'id' : IDL.Text,
    'count' : IDL.Nat,
    'avgProcTime' : IDL.Int,
    'totalProcTime' : IDL.Int,
  });
  const FileStorage = IDL.Service({
    'addAdmins' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [IDL.Vec(IDL.Tuple(IDL.Text, Roles))],
        [],
      ),
    'changeChunkSize' : IDL.Func([IDL.Nat], [Result], []),
    'clean' : IDL.Func([IDL.Bool], [Result_4], []),
    'deleteFile' : IDL.Func([IDL.Text], [Result_1], []),
    'getCanisterId' : IDL.Func([], [IDL.Text], []),
    'getFileChunk' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'getFileInfo' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'getProfiler' : IDL.Func([], [IDL.Vec(ProfileResult)], []),
    'getRoles' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, Roles))], ['query']),
    'getStorageInfo' : IDL.Func(
        [],
        [IDL.Record({ 'mem' : IDL.Text, 'cycle' : IDL.Text })],
        [],
      ),
    'getVersion' : IDL.Func([], [IDL.Text], []),
    'isExisted' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'listFiles' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'putFile' : IDL.Func([IDL.Text, FileChunk], [Result], []),
    'registerUploadFile' : IDL.Func([IDL.Text, FileInfo], [Result], []),
    'watcherCallback' : IDL.Func([], [Result], []),
    'whoami' : IDL.Func([], [IDL.Text], ['query']),
  });
  return FileStorage;
};
export const init = ({ IDL }) => { return []; };
