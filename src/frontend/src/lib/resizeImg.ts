// lib/image-compressor-fixed.ts
export interface CompressionOptions {
    /** Kích thước tối đa tính bằng bytes (mặc định: 1MB) */
    maxSizeBytes?: number;
    /** Định dạng đầu ra (mặc định: 'webp') */
    format?: 'webp' | 'jpeg' | 'png';
    /** Chất lượng bắt đầu (mặc định: 0.8) */
    initialQuality?: number;
    /** Giữ nguyên kích thước ảnh? */
    keepDimensions?: boolean;
    /** Kích thước tối đa (chiều rộng x chiều cao) */
    maxDimensions?: { width?: number; height?: number };
    /** Tự động resize ảnh quá lớn */
    autoResizeLargeImages?: boolean;
    /** Kích thước tối đa cho ảnh lớn */
    maxImageDimension?: number;
  }
  
  export interface CompressionResult {
    /** File đã nén */
    file: File;
    /** Kích thước gốc (bytes) */
    originalSize: number;
    /** Kích thước sau nén (bytes) */
    compressedSize: number;
    /** Phần trăm giảm */
    reductionPercent: number;
    /** Định dạng đầu ra */
    format: string;
    /** Chất lượng đạt được */
    qualityUsed: number;
    /** Thông tin thêm */
    info?: {
      width: number;
      height: number;
      resized?: boolean;
      originalWidth?: number;
      originalHeight?: number;
    };
  }
  
  /**
   * Nén ảnh trong trình duyệt - Phiên bản cải thiện
   */
  export async function compressImageInBrowser(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxSizeBytes = 1024 * 1024, // 1MB
      format = 'webp',
      initialQuality = 0.8,
      keepDimensions = true,
      maxDimensions,
      autoResizeLargeImages = true,
      maxImageDimension = 4096 // 4K max
    } = options;
  
    console.log(`Bắt đầu nén: ${file.name} (${formatBytes(file.size)})`);
  
    // Kiểm tra nếu file đã nhỏ hơn giới hạn
    if (file.size <= maxSizeBytes && keepDimensions && !maxDimensions) {
      console.log('File đã nhỏ hơn giới hạn, bỏ qua nén');
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        reductionPercent: 0,
        format: getFileExtension(file),
        qualityUsed: 1,
        info: { width: 0, height: 0 }
      };
    }
  
    try {
      // Phương pháp 1: Dùng FileReader (tốt hơn cho ảnh lớn)
      const imageData = await loadImageWithFileReader(file);
      
      // Tạo URL từ base64
      const imageUrl = `data:${file.type};base64,${imageData}`;
      
      // Load ảnh
      const img = await loadImageSafely(imageUrl, maxImageDimension);
      
      // Tính toán kích thước mới
      const { targetWidth, targetHeight, wasResized } = calculateTargetDimensions(
        img,
        keepDimensions,
        maxDimensions,
        autoResizeLargeImages,
        maxImageDimension
      );
      
      console.log(`Kích thước ảnh: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
      
      // Tạo canvas với kích thước phù hợp
      const canvas = document.createElement('canvas');
      const offscreenCanvas = createOffscreenCanvas(targetWidth, targetHeight);
      
      if (!offscreenCanvas) {
        throw new Error('Canvas không được hỗ trợ hoặc ảnh quá lớn');
      }
      
      // Vẽ ảnh lên canvas
      drawImageToCanvas(offscreenCanvas, img, targetWidth, targetHeight);
      
      // Nén ảnh
      const result = await compressCanvasToTargetSize(
        offscreenCanvas,
        format,
        file.size,
        maxSizeBytes,
        initialQuality
      );
      
      // Tạo File mới
      const extension = format === 'jpeg' ? 'jpg' : format;
      const compressedFile = new File(
        [result.blob],
        generateOutputFilename(file.name, extension),
        { type: result.mimeType }
      );
      
      // Dọn dẹp
      URL.revokeObjectURL(imageUrl);
      
      const compressionResult: CompressionResult = {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        reductionPercent: Number(((file.size - compressedFile.size) / file.size * 100).toFixed(1)),
        format,
        qualityUsed: result.quality,
        info: {
          width: targetWidth,
          height: targetHeight,
          originalWidth: img.width,
          originalHeight: img.height,
          resized: wasResized
        }
      };
      
      console.log(`✅ Đã nén: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (giảm ${compressionResult.reductionPercent}%)`);
      
      return compressionResult;
      
    } catch (error) {
      console.error('Lỗi nén ảnh:', error);
      
      // Fallback: Giảm chất lượng cực thấp
      if (error instanceof Error && error.message.includes('quá lớn')) {
        return await compressWithMinimalQuality(file, format, maxSizeBytes);
      }
      
      throw new Error(`Không thể nén ảnh: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
  
  /**
   * Load ảnh bằng FileReader (tốt cho ảnh lớn)
   */
  async function loadImageWithFileReader(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Lấy base64 từ data URL
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Không thể đọc file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Lỗi đọc file'));
      };
      
      reader.onabort = () => {
        reject(new Error('Đọc file bị hủy'));
      };
      
      // Đọc dưới dạng data URL
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Load ảnh an toàn với timeout và kích thước giới hạn
   */
  function loadImageSafely(url: string, maxDimension: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
      
      // Timeout sau 30 giây
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout khi tải ảnh (quá 30 giây)'));
      }, 30000);
      
      img.onload = () => {
        cleanup();
        
        // Kiểm tra kích thước ảnh
        if (img.width === 0 || img.height === 0) {
          reject(new Error('Ảnh không hợp lệ (kích thước 0)'));
          return;
        }
        
        // Kiểm tra ảnh quá lớn
        if (img.width > maxDimension || img.height > maxDimension) {
          console.warn(`Ảnh quá lớn: ${img.width}x${img.height} (max: ${maxDimension})`);
        }
        
        resolve(img);
      };
      
      img.onerror = () => {
        cleanup();
        reject(new Error('Không thể tải ảnh. Có thể file bị hỏng hoặc quá lớn.'));
      };
      
      // Bật crossOrigin cho các URL bên ngoài
      if (!url.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.src = url;
    });
  }
  
  /**
   * Tính toán kích thước đích
   */
  function calculateTargetDimensions(
    img: HTMLImageElement,
    keepDimensions: boolean,
    maxDimensions?: { width?: number; height?: number },
    autoResizeLargeImages: boolean = true,
    maxImageDimension: number = 4096
  ): {
    targetWidth: number;
    targetHeight: number;
    wasResized: boolean;
  } {
    let targetWidth = img.width;
    let targetHeight = img.height;
    let wasResized = false;
    
    // Áp dụng maxDimensions nếu có
    if (maxDimensions) {
      const { width: maxWidth, height: maxHeight } = maxDimensions;
      
      if (maxWidth && targetWidth > maxWidth) {
        const ratio = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
        wasResized = true;
      }
      
      if (maxHeight && targetHeight > maxHeight) {
        const ratio = maxHeight / targetHeight;
        targetHeight = maxHeight;
        targetWidth = Math.round(targetWidth * ratio);
        wasResized = true;
      }
    }
    
    // Tự động resize ảnh quá lớn
    if (autoResizeLargeImages && (targetWidth > maxImageDimension || targetHeight > maxImageDimension)) {
      if (targetWidth > targetHeight) {
        const ratio = maxImageDimension / targetWidth;
        targetWidth = maxImageDimension;
        targetHeight = Math.round(targetHeight * ratio);
      } else {
        const ratio = maxImageDimension / targetHeight;
        targetHeight = maxImageDimension;
        targetWidth = Math.round(targetWidth * ratio);
      }
      wasResized = true;
      console.log(`Tự động resize ảnh lớn về: ${targetWidth}x${targetHeight}`);
    }
    
    // Đảm bảo kích thước tối thiểu
    targetWidth = Math.max(1, Math.round(targetWidth));
    targetHeight = Math.max(1, Math.round(targetHeight));
    
    return { targetWidth, targetHeight, wasResized };
  }
  
  /**
   * Tạo offscreen canvas (tốt hơn cho hiệu suất)
   */
  function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null {
    try {
      // Thử dùng OffscreenCanvas nếu có (hiệu suất tốt hơn)
      if (typeof OffscreenCanvas !== 'undefined' && width * height < 16777216) { // 16MP max
        return new OffscreenCanvas(width, height);
      }
      
      // Fallback về regular canvas
      if (width * height < 16777216) { // 16MP max
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
      }
      
      console.error(`Canvas quá lớn: ${width}x${height} = ${width * height} pixels (max: 16MP)`);
      return null;
      
    } catch (error) {
      console.error('Lỗi tạo canvas:', error);
      return null;
    }
  }
  
  /**
   * Vẽ ảnh lên canvas
   */
  function drawImageToCanvas(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    img: HTMLImageElement,
    width: number,
    height: number
  ): void {
    const ctx = (canvas as any).getContext('2d');
    if (!ctx) {
      throw new Error('Không thể lấy context từ canvas');
    }
    
    // Xóa canvas trước khi vẽ
    ctx.clearRect(0, 0, width, height);
    
    // Vẽ ảnh
    ctx.drawImage(img, 0, 0, width, height);
  }
  
  /**
   * Nén canvas đến kích thước mục tiêu
   */
  async function compressCanvasToTargetSize(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    format: string,
    originalSize: number,
    maxSizeBytes: number,
    initialQuality: number
  ): Promise<{
    blob: Blob;
    mimeType: string;
    quality: number;
  }> {
    const mimeType = getMimeTypeForFormat(format);
    
    // Nếu ảnh gốc đã nhỏ và không cần nén nhiều
    if (originalSize <= maxSizeBytes * 1.5) {
      const blob = await canvasToBlob(canvas, mimeType, initialQuality);
      if (blob.size <= maxSizeBytes) {
        return { blob, mimeType, quality: initialQuality };
      }
    }
    
    // Binary search cho chất lượng tối ưu
    let minQuality = 0.1;
    let maxQuality = Math.min(0.95, initialQuality);
    let bestQuality = initialQuality;
    let bestBlob: Blob | null = null;
    
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      const quality = (minQuality + maxQuality) / 2;
      
      try {
        const blob = await canvasToBlob(canvas, mimeType, quality);
        
        if (blob.size <= maxSizeBytes) {
          // Đạt yêu cầu, thử tăng chất lượng
          bestBlob = blob;
          bestQuality = quality;
          minQuality = quality;
        } else {
          // Quá lớn, giảm chất lượng
          maxQuality = quality;
        }
        
        // Dừng nếu đạt độ chính xác
        if ((maxQuality - minQuality) < 0.05 || blob.size <= maxSizeBytes * 1.05) {
          break;
        }
        
      } catch (error) {
        console.warn(`Lỗi tạo blob với chất lượng ${quality}:`, error);
        maxQuality = quality; // Giảm chất lượng tiếp
      }
    }
    
    // Nếu không tìm được, dùng chất lượng thấp nhất
    if (!bestBlob || (bestBlob && bestBlob.size > maxSizeBytes)) {
      bestQuality = 0.1;
      bestBlob = await canvasToBlob(canvas, mimeType, bestQuality);
      
      // Nếu vẫn quá lớn, resize lại
      if (bestBlob.size > maxSizeBytes) {
        throw new Error(`Không thể nén xuống ${formatBytes(maxSizeBytes)}. Ảnh quá lớn.`);
      }
    }
    
    return { blob: bestBlob, mimeType, quality: bestQuality };
  }
  
  /**
   * Fallback: Nén với chất lượng tối thiểu
   */
  async function compressWithMinimalQuality(
    file: File,
    format: string,
    maxSizeBytes: number
  ): Promise<CompressionResult> {
    console.log('Dùng fallback: nén với chất lượng tối thiểu');
    
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const img = await loadImageSafely(imageUrl, 2048); // Giới hạn 2K
      
      // Resize nhỏ hơn
      const scale = Math.min(2048 / img.width, 2048 / img.height, 1);
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas không hỗ trợ');
      
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      const mimeType = getMimeTypeForFormat(format);
      const blob = await canvasToBlob(canvas, mimeType, 0.1);
      
      const extension = format === 'jpeg' ? 'jpg' : format;
      const compressedFile = new File(
        [blob],
        `${file.name.replace(/\.[^.]+$/, '')}_min.${extension}`,
        { type: mimeType }
      );
      
      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        reductionPercent: Number(((file.size - compressedFile.size) / file.size * 100).toFixed(1)),
        format,
        qualityUsed: 0.1,
        info: {
          width: targetWidth,
          height: targetHeight,
          originalWidth: img.width,
          originalHeight: img.height,
          resized: true
        }
      };
      
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }
  
  /**
   * Chuyển canvas thành Blob (compatible với cả OffscreenCanvas)
   */
  function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    mimeType: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if ('convertToBlob' in canvas) {
        // OffscreenCanvas
        (canvas as OffscreenCanvas).convertToBlob({ 
          type: mimeType, 
          quality: Math.max(0.1, quality) 
        }).then(resolve).catch(reject);
      } else {
        // HTMLCanvasElement
        (canvas as HTMLCanvasElement).toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Không thể tạo blob từ canvas'));
            }
          },
          mimeType,
          Math.max(0.1, quality)
        );
      }
    });
  }
  
  // Các hàm helper giữ nguyên
  function getMimeTypeForFormat(format: string): string {
    switch (format.toLowerCase()) {
      case 'webp':
        return 'image/webp';
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'image/webp';
    }
  }
  
  function getFileExtension(file: File): string {
    const match = file.name.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }
  
  function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  function generateOutputFilename(originalName: string, extension: string): string {
    const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
    const timestamp = Date.now().toString(36); // Base36 timestamp
    return `${nameWithoutExt}_${timestamp}.${extension}`;
  }
  
  /**
   * Phiên bản đơn giản cho ảnh nhỏ
   */
  export async function compressImageSimple(file: File, maxSizeMB = 1): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Tự động resize ảnh lớn
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              const ratio = maxDimension / width;
              width = maxDimension;
              height = Math.round(height * ratio);
            } else {
              const ratio = maxDimension / height;
              height = maxDimension;
              width = Math.round(width * ratio);
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas không hỗ trợ'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Tìm chất lượng phù hợp
          const findQuality = async (quality: number): Promise<Blob> => {
            return new Promise((res) => {
              canvas.toBlob(
                (blob) => res(blob!),
                'image/jpeg',
                quality
              );
            });
          };
          
          const tryCompress = async (quality = 0.7): Promise<void> => {
            const blob = await findQuality(quality);
            
            if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.1) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(compressedFile);
            } else {
              await tryCompress(quality - 0.1);
            }
          };
          
          tryCompress();
        };
        
        img.onerror = () => {
          reject(new Error('Không thể load ảnh'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Không thể đọc file'));
      };
      
      reader.readAsDataURL(file);
    });
  }