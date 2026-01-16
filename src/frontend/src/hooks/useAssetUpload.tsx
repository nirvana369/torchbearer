// src/hooks/useAssetUpload.ts
import { useState } from 'react';
import { toast } from 'sonner';
import { AssetManager } from '@icp-sdk/canisters'; 
import { useInternetIdentity } from "./useInternetIdentity";
import { canisterId, idlFactory } from "../../../declarations/assets";

interface UseAssetUploadProps {
  onUploadSuccess?: (result: { key: string; url: string }) => void;
  onUploadError?: (error: Error) => void;
}

export function useAssetUpload({
  onUploadSuccess,
  onUploadError
}: UseAssetUploadProps = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { identity } = useInternetIdentity();

  // 1. Khởi tạo AssetManager với package mới
  const getAssetManager = async () => {
    try {

      // Tạo instance AssetManager
      const assetManager = new AssetManager({
        canisterId,
        identity,
        host: 'http://127.0.0.1:4943/' //|| process.env.IC_HOST || 'https://ic0.app'
      });

      return assetManager;
    } catch (error) {
      console.error('Failed to initialize AssetManager:', error);
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<{ key: string; url: string }> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      const assetManager = await getAssetManager();

      // 2. Tạo callback theo dõi tiến độ (nếu API hỗ trợ)
      const onProgress = (progress: number) => {
        setUploadProgress(Math.round(progress));
      };

      // 3. Upload file - SỬ DỤNG PHƯƠNG THỨC .store()
      const result = await assetManager.store(file, {
        fileName: file.name, // Cung cấp tên file
        onProgress,         // Truyền callback tiến độ
        chunkSize: 1024 * 1024, // Kích thước chunk: 1MB
        // Có thể thêm config khác như 'compress: true' nếu cần nén
      });

      setIsUploading(false);
      setUploadProgress(100);

      // 4. Xử lý kết quả trả về
      // Giả định kết quả có chứa 'key' (đường dẫn) của file
      const uploadResult = {
        key: result.key || file.name,
        url: `/assets/${result.key || file.name}`
      };

      onUploadSuccess?.(uploadResult);
      toast.success(`Upload thành công: ${uploadResult.key}`);

      return uploadResult;
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);

      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Upload thất bại: ${errorMsg}`);

      onUploadError?.(error as Error);
      throw error;
    }
  };

  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedFile(null);
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    uploadedFile,
    resetUpload,
  };
}