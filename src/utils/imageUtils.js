// 图片处理工具类
export class ImageUtils {
  // 支持的图片格式
  static SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  static MAX_FILE_SIZE = 500 * 1024; // 500KB
  static MAX_WIDTH = 1200; // 最大宽度
  static MAX_HEIGHT = 800; // 最大高度
  static QUALITY = 0.85; // 压缩质量

  // 验证文件是否为支持的图片格式
  static validateFile(file) {
    const errors = [];
    
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      errors.push(`不支持的文件格式: ${file.type}`);
    }
    
    if (file.size > this.MAX_FILE_SIZE * 5) { // 原始文件最大2.5MB
      errors.push(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，请选择小于2.5MB的图片`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 生成唯一文件名
  static generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop().toLowerCase();
    
    // 确保扩展名正确
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const finalExtension = validExtensions.includes(extension) ? extension : 'jpg';
    
    return `timeline-${timestamp}-${random}.${finalExtension}`;
  }

  // 压缩图片
  static async compressImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = this.calculateNewDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 如果压缩后仍然太大，降低质量重试
              if (blob.size > this.MAX_FILE_SIZE && this.QUALITY > 0.3) {
                canvas.toBlob(
                  (retryBlob) => {
                    resolve(retryBlob || blob);
                  },
                  'image/jpeg',
                  0.6
                );
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/jpeg',
          this.QUALITY
        );
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      // 读取文件
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      reader.readAsDataURL(file);
    });
  }

  // 计算新的图片尺寸（保持宽高比）
  static calculateNewDimensions(originalWidth, originalHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // 如果图片尺寸超过限制，按比例缩放
    if (width > this.MAX_WIDTH) {
      height = (height * this.MAX_WIDTH) / width;
      width = this.MAX_WIDTH;
    }

    if (height > this.MAX_HEIGHT) {
      width = (width * this.MAX_HEIGHT) / height;
      height = this.MAX_HEIGHT;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  // 创建图片预览 URL
  static createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  // 清理预览 URL
  static revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }

  // 批量处理图片
  static async processImages(files) {
    const results = [];
    
    for (const file of files) {
      try {
        // 验证文件
        const validation = this.validateFile(file);
        if (!validation.isValid) {
          results.push({
            originalFile: file,
            error: validation.errors.join(', '),
            success: false
          });
          continue;
        }

        // 压缩图片
        const compressedBlob = await this.compressImage(file);
        
        // 生成新文件名
        const fileName = this.generateFileName(file.name);
        
        // 创建新的 File 对象
        const processedFile = new File([compressedBlob], fileName, {
          type: 'image/jpeg'
        });

        results.push({
          originalFile: file,
          processedFile,
          fileName,
          previewUrl: this.createPreviewUrl(processedFile),
          success: true,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          compressionRatio: ((1 - compressedBlob.size / file.size) * 100).toFixed(1)
        });

      } catch (error) {
        results.push({
          originalFile: file,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  // 将 File 转换为 Base64（用于上传到 GitHub）
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // 移除 data:image/jpeg;base64, 前缀
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 格式化文件大小
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}