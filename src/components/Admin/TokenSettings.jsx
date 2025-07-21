import React, { useState } from 'react';
import { TokenManager, validateToken } from '../../utils/githubApi';
import './TokenSettings.css';

const TokenSettings = ({ onClose, onTokenSaved }) => {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [currentToken, setCurrentToken] = useState(TokenManager.get());

  const handleSave = async () => {
    if (!token.trim()) {
      setError('请输入 GitHub Token');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // 验证 Token 有效性
      const isValid = await validateToken(token);
      
      if (isValid) {
        // 保存 Token
        const saved = TokenManager.save(token);
        if (saved) {
          setCurrentToken(token);
          setToken('');
          onTokenSaved && onTokenSaved();
          alert('Token 保存成功！');
        } else {
          setError('Token 保存失败，请重试');
        }
      } else {
        setError('Token 无效或没有仓库权限，请检查 Token 设置');
      }
    } catch (error) {
      setError(`验证失败: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('确定要清除保存的 Token 吗？')) {
      TokenManager.clear();
      setCurrentToken(null);
      alert('Token 已清除');
    }
  };

  const formatToken = (token) => {
    if (!token) return '';
    return token.substring(0, 8) + '...' + token.substring(token.length - 8);
  };

  return (
    <div className="token-settings-overlay">
      <div className="token-settings-modal">
        <div className="token-settings-header">
          <h2>🔑 GitHub Token 设置</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="token-settings-content">
          <div className="current-token-info">
            <h3>当前状态</h3>
            {currentToken ? (
              <div className="token-status active">
                <span>✅ 已配置 Token: {formatToken(currentToken)}</span>
                <button onClick={handleClear} className="clear-button">清除</button>
              </div>
            ) : (
              <div className="token-status inactive">
                <span>❌ 未配置 Token</span>
              </div>
            )}
          </div>

          <div className="token-input-section">
            <h3>设置新的 Token</h3>
            <div className="token-help">
              <p>为了同步数据到 GitHub，需要提供 Personal Access Token：</p>
              <ol>
                <li>访问 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Token 设置页面</a></li>
                <li>点击 "Generate new token" → "Generate new token (classic)"</li>
                <li>设置 Token 名称：<code>life-v-log-editor</code></li>
                <li>选择权限：<strong>repo</strong>（完整仓库访问权限）</li>
                <li>点击 "Generate token" 并复制生成的 Token</li>
                <li>将 Token 粘贴到下方输入框中</li>
              </ol>
            </div>

            <div className="token-input-group">
              <input
                type="password"
                placeholder="粘贴你的 GitHub Personal Access Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="token-input"
              />
              <button
                onClick={handleSave}
                disabled={isValidating || !token.trim()}
                className="save-token-button"
              >
                {isValidating ? '验证中...' : '保存 Token'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="token-security-info">
            <h3>🔒 安全说明</h3>
            <ul>
              <li>Token 仅保存在你的浏览器本地存储中</li>
              <li>不会上传到服务器或与他人分享</li>
              <li>建议定期更换 Token（3个月一次）</li>
              <li>如果怀疑 Token 泄露，请立即在 GitHub 中删除并重新生成</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSettings;