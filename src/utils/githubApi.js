// GitHub API 工具模块
const GITHUB_API_BASE = 'https://api.github.com';
const OWNER = 'STller';
const REPO = 'life-v-log';
const FILE_PATH = 'src/data/timelineData.js';
const TOKEN_STORAGE_KEY = 'github_access_token';

// Token 管理类
export class TokenManager {
  // 保存 Token（简单加密）
  static save(token) {
    try {
      const encrypted = btoa(token);
      localStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
      return true;
    } catch {
      return false;
    }
  }

  // 获取 Token
  static get() {
    try {
      const encrypted = localStorage.getItem(TOKEN_STORAGE_KEY);
      return encrypted ? atob(encrypted) : null;
    } catch {
      return null;
    }
  }

  // 清除 Token
  static clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  // 检查是否有 Token
  static hasToken() {
    return !!this.get();
  }
}

// 获取 GitHub Token
const getToken = () => {
  // 优先从环境变量获取（开发环境）
  if (import.meta.env.REACT_APP_GITHUB_TOKEN) {
    return import.meta.env.REACT_APP_GITHUB_TOKEN;
  }
  
  // 从用户输入获取（生产环境）
  return TokenManager.get();
};

// 获取当前文件信息
export const getCurrentFileInfo = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('GitHub Token 未配置');
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`获取文件失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    sha: data.sha,
    content: decodeBase64Content(data.content),
    size: data.size,
    downloadUrl: data.download_url
  };
};

// Base64 解码
const decodeBase64Content = (content) => {
  try {
    return decodeURIComponent(escape(atob(content)));
  } catch {
    throw new Error('文件内容解码失败');
  }
};

// Base64 编码
const encodeBase64Content = (content) => {
  try {
    return btoa(unescape(encodeURIComponent(content)));
  } catch {
    throw new Error('文件内容编码失败');
  }
};

// 生成新的文件内容
export const generateFileContent = (timelineData) => {
  const dataString = JSON.stringify(timelineData, null, 2);
  const timestamp = new Date().toISOString();
  
  return `export const timelineData = ${dataString};

// 数据结构说明：
// id: 唯一标识符
// date: 日期 (YYYY-MM-DD 格式)
// title: 标题
// description: 描述内容
// images: 图片数组 (可以是多张图片)
// tags: 标签数组 (用于分类和筛选)
// type: 类型 (milestone-里程碑, special-特殊日子, travel-旅行, daily-日常)

// 最后更新时间: ${timestamp}
// 更新方式: 在线编辑器
`;
};

// 提交文件到 GitHub
export const commitToGitHub = async (timelineData, commitMessage = null) => {
  const token = getToken();
  if (!token) {
    throw new Error('GitHub Token 未配置');
  }

  // 获取当前文件的 SHA
  const currentInfo = await getCurrentFileInfo();
  const newContent = generateFileContent(timelineData);
  
  const defaultMessage = `✨ 更新时间线数据 (${new Date().toLocaleString('zh-CN')})`;
  
  const commitData = {
    message: commitMessage || defaultMessage,
    content: encodeBase64Content(newContent),
    sha: currentInfo.sha,
    branch: 'main'
  };

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(commitData)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`提交失败: ${error.message || response.statusText}`);
  }

  const result = await response.json();
  
  // 保存最新的 SHA 用于冲突检测
  localStorage.setItem('lastSyncSha', result.content.sha);
  localStorage.setItem('lastSyncTime', new Date().toISOString());
  
  return result;
};

// 检测冲突
export const detectConflict = async () => {
  try {
    const currentInfo = await getCurrentFileInfo();
    const lastSyncSha = localStorage.getItem('lastSyncSha');
    
    if (lastSyncSha && lastSyncSha !== currentInfo.sha) {
      return {
        hasConflict: true,
        currentSha: currentInfo.sha,
        lastSyncSha: lastSyncSha,
        remoteContent: currentInfo.content
      };
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.warn('冲突检测失败:', error);
    return { hasConflict: false };
  }
};

// 验证 Token 有效性
export const validateToken = async (token = null) => {
  const testToken = token || getToken();
  
  if (!testToken) {
    return false;
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        'Authorization': `token ${testToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
};

// 获取最后同步时间
export const getLastSyncTime = () => {
  const lastSyncTime = localStorage.getItem('lastSyncTime');
  if (!lastSyncTime) {
    return '从未同步';
  }
  
  try {
    const date = new Date(lastSyncTime);
    return date.toLocaleString('zh-CN');
  } catch {
    return '时间格式错误';
  }
};