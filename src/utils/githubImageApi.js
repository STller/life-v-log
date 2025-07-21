import { TokenManager } from './githubApi.js';

// GitHub 图片上传 API
const GITHUB_API_BASE = 'https://api.github.com';
const OWNER = 'STller';
const REPO = 'life-v-log';
const IMAGES_PATH = 'public/images';

export class GitHubImageAPI {
  // 获取 Token
  static getToken() {
    // 优先从环境变量获取（开发环境）
    if (import.meta.env.REACT_APP_GITHUB_TOKEN) {
      return import.meta.env.REACT_APP_GITHUB_TOKEN;
    }
    
    // 从用户输入获取（生产环境）
    return TokenManager.get();
  }

  // 上传单张图片到 GitHub
  static async uploadImage(fileName, base64Content) {
    const token = this.getToken();
    if (!token) {
      throw new Error('GitHub Token 未配置，请先设置 Token');
    }

    const filePath = `${IMAGES_PATH}/${fileName}`;
    
    try {
      // 检查文件是否已存在
      const existsResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      let sha = null;
      if (existsResponse.ok) {
        const existingFile = await existsResponse.json();
        sha = existingFile.sha;
      }

      // 上传或更新文件
      const uploadResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `📷 Upload image: ${fileName}`,
            content: base64Content,
            ...(sha && { sha }) // 如果文件存在，包含 SHA
          })
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`上传失败: ${error.message || uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      
      // 返回图片的访问 URL
      return {
        success: true,
        fileName,
        url: `/life-v-log/images/${fileName}`,
        downloadUrl: result.content.download_url,
        sha: result.content.sha
      };

    } catch (error) {
      throw new Error(`上传图片 ${fileName} 失败: ${error.message}`);
    }
  }

  // 批量上传图片
  static async uploadImages(imageFiles) {
    const results = [];
    const errors = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const { fileName, base64Content, originalFile } = imageFiles[i];
      
      try {
        const result = await this.uploadImage(fileName, base64Content);
        results.push({
          ...result,
          originalFile,
          index: i
        });
      } catch (error) {
        errors.push({
          fileName,
          originalFile,
          error: error.message,
          index: i
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalCount: imageFiles.length,
      successCount: results.length,
      failedCount: errors.length
    };
  }

  // 删除图片
  static async deleteImage(fileName) {
    const token = this.getToken();
    if (!token) {
      throw new Error('GitHub Token 未配置');
    }

    const filePath = `${IMAGES_PATH}/${fileName}`;

    try {
      // 获取文件信息（需要 SHA 来删除）
      const fileResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!fileResponse.ok) {
        throw new Error('文件不存在或无法访问');
      }

      const fileInfo = await fileResponse.json();

      // 删除文件
      const deleteResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `🗑️ Delete image: ${fileName}`,
            sha: fileInfo.sha
          })
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(`删除失败: ${error.message || deleteResponse.statusText}`);
      }

      return {
        success: true,
        fileName,
        message: '图片已删除'
      };

    } catch (error) {
      throw new Error(`删除图片 ${fileName} 失败: ${error.message}`);
    }
  }

  // 获取仓库中的所有图片
  static async listImages() {
    const token = this.getToken();
    if (!token) {
      throw new Error('GitHub Token 未配置');
    }

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${IMAGES_PATH}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // 目录不存在，返回空数组
        }
        throw new Error(`获取图片列表失败: ${response.statusText}`);
      }

      const files = await response.json();
      
      // 过滤出图片文件
      const imageFiles = files.filter(file => 
        file.type === 'file' && 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      );

      return imageFiles.map(file => ({
        name: file.name,
        url: `/life-v-log/images/${file.name}`,
        downloadUrl: file.download_url,
        size: file.size,
        sha: file.sha
      }));

    } catch (error) {
      throw new Error(`获取图片列表失败: ${error.message}`);
    }
  }

  // 验证 Token 是否有权限上传图片
  static async validateImageUploadPermission() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // 尝试获取仓库信息
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        return false;
      }

      const repo = await response.json();
      
      // 检查是否有推送权限
      return repo.permissions && (repo.permissions.push || repo.permissions.admin);

    } catch {
      return false;
    }
  }

  // 生成图片的完整访问 URL（用于预览）
  static getImageUrl(fileName) {
    return `/life-v-log/images/${fileName}`;
  }

  // 从 URL 提取文件名
  static extractFileNameFromUrl(url) {
    if (url.startsWith('/life-v-log/images/')) {
      return url.replace('/life-v-log/images/', '');
    }
    
    // 处理完整 URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return null;
    }
  }
}