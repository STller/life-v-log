import React, { useState, useRef, useCallback } from 'react';
import { ImageUtils } from '../../utils/imageUtils';
import { GitHubImageAPI } from '../../utils/githubImageApi';
import './ImageUploader.css';

const ImageUploader = ({ images = [], onImagesChange, maxImages = 5 }) => {
  const [uploadState, setUploadState] = useState('idle'); // idle, processing, uploading, success, error
  const [dragActive, setDragActive] = useState(false);
  const [processedImages, setProcessedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFiles = useCallback(async (files) => {
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    const totalImages = images.length + fileArray.length;

    if (totalImages > maxImages) {
      setError(`最多只能上传 ${maxImages} 张图片，当前已有 ${images.length} 张`);
      return;
    }

    setError('');
    setUploadState('processing');

    try {
      // 处理图片（压缩、重命名等）
      const results = await ImageUtils.processImages(fileArray);
      
      // 分离成功和失败的结果
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        const errorMessages = failed.map(f => `${f.originalFile.name}: ${f.error}`);
        setError(`部分图片处理失败:\n${errorMessages.join('\n')}`);
      }

      if (successful.length > 0) {
        setProcessedImages(successful);
        setUploadState('uploading');
        await uploadProcessedImages(successful);
      } else {
        setUploadState('error');
      }

    } catch (error) {
      setError(`图片处理失败: ${error.message}`);
      setUploadState('error');
    }
  }, [images.length, maxImages, uploadProcessedImages]);

  // 上传处理过的图片
  const uploadProcessedImages = useCallback(async (processedImages) => {
    try {
      const uploadData = [];
      
      // 准备上传数据
      for (const imageResult of processedImages) {
        const base64Content = await ImageUtils.fileToBase64(imageResult.processedFile);
        uploadData.push({
          fileName: imageResult.fileName,
          base64Content,
          originalFile: imageResult.originalFile
        });
      }

      // 设置初始进度
      const initialProgress = {};
      uploadData.forEach((_, index) => {
        initialProgress[index] = 0;
      });
      setUploadProgress(initialProgress);

      // 批量上传
      const uploadResults = await GitHubImageAPI.uploadImages(uploadData);

      if (uploadResults.successful.length > 0) {
        // 生成新的图片 URL 数组
        const newImageUrls = uploadResults.successful.map(result => result.url);
        const updatedImages = [...images, ...newImageUrls];
        
        onImagesChange(updatedImages);
        setUploadState('success');
        
        // 清理预览 URL
        processedImages.forEach(result => {
          if (result.previewUrl) {
            ImageUtils.revokePreviewUrl(result.previewUrl);
          }
        });
        
        // 重置状态
        setTimeout(() => {
          setUploadState('idle');
          setProcessedImages([]);
          setUploadProgress({});
        }, 2000);
      }

      if (uploadResults.failed.length > 0) {
        const errorMessages = uploadResults.failed.map(f => f.error);
        setError(`部分图片上传失败:\n${errorMessages.join('\n')}`);
        setUploadState('error');
      }

    } catch (error) {
      setError(`上传失败: ${error.message}`);
      setUploadState('error');
    }
  }, [images, onImagesChange]);

  // 处理拖拽事件
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // 处理文件选择器
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // 删除图片
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // 清空错误信息
  const clearError = () => {
    setError('');
    setUploadState('idle');
  };

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <h4>📷 图片管理</h4>
        <span className="image-count">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* 现有图片预览 */}
      {images.length > 0 && (
        <div className="existing-images">
          {images.map((url, index) => (
            <div key={index} className="image-preview-item">
              <img src={url} alt={`图片 ${index + 1}`} className="image-preview" />
              <button 
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="remove-image-btn"
                title="删除图片"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      {images.length < maxImages && (
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploadState !== 'idle' ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => uploadState === 'idle' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploadState !== 'idle'}
          />

          <div className="upload-content">
            {uploadState === 'idle' && (
              <>
                <div className="upload-icon">📁</div>
                <p>点击选择图片或拖拽到此处</p>
                <small>支持 JPG、PNG、WebP、GIF 格式，单张图片不超过 2.5MB</small>
              </>
            )}

            {uploadState === 'processing' && (
              <>
                <div className="upload-icon">🔄</div>
                <p>正在处理图片...</p>
              </>
            )}

            {uploadState === 'uploading' && (
              <>
                <div className="upload-icon">⬆️</div>
                <p>正在上传到 GitHub...</p>
                {processedImages.length > 0 && (
                  <div className="upload-progress">
                    {processedImages.map((img, index) => (
                      <div key={index} className="progress-item">
                        <span>{img.fileName}</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${uploadProgress[index] || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {uploadState === 'success' && (
              <>
                <div className="upload-icon">✅</div>
                <p>上传成功！</p>
              </>
            )}

            {uploadState === 'error' && (
              <>
                <div className="upload-icon">❌</div>
                <p>上传失败</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span>{error}</span>
            <button onClick={clearError} className="clear-error-btn">✕</button>
          </div>
        </div>
      )}

      {/* 上传提示 */}
      <div className="upload-tips">
        <h5>💡 使用提示：</h5>
        <ul>
          <li>图片会自动压缩并上传到 GitHub 仓库</li>
          <li>支持拖拽多张图片批量上传</li>
          <li>建议上传高质量图片，系统会自动优化</li>
          <li>上传的图片立即可用，无需等待部署</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUploader;