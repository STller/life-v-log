import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timelineData as defaultData } from '../../data/timelineData';
import { commitToGitHub, detectConflict, validateToken, getLastSyncTime } from '../../utils/githubApi';
import { LocalDataManager, useAutoSave } from '../../utils/localDataManager';
import TimelineEditor from './TimelineEditor';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [timelineData, setTimelineData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [notification, setNotification] = useState(null);

  // 启用自动保存
  const { lastSaved, isSaving } = useAutoSave(timelineData, isAuthenticated);

  // 检查认证状态
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  // 加载数据
  const loadData = () => {
    const localData = LocalDataManager.load();
    if (localData) {
      setTimelineData(localData);
    } else {
      setTimelineData([...defaultData]);
    }
  };

  // 显示通知
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 保存到本地存储（现在由 LocalDataManager 处理）
  const saveToLocal = (data) => {
    const success = LocalDataManager.save(data);
    if (!success) {
      showNotification('本地保存失败', 'error');
    }
  };

  // 身份验证
  const handleAuth = () => {
    const adminPassword = import.meta.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      loadData();
    } else {
      showNotification('密码错误', 'error');
    }
  };

  // 退出登录
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

  // 添加新记录
  const handleAdd = () => {
    setEditingItem(null);
    setIsEditorOpen(true);
  };

  // 编辑记录
  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  // 删除记录
  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      const newData = timelineData.filter(item => item.id !== id);
      setTimelineData(newData);
      saveToLocal(newData);
      showNotification('记录已删除');
    }
  };

  // 保存编辑
  const handleSave = (itemData) => {
    let newData;
    
    if (editingItem) {
      // 编辑现有记录
      newData = timelineData.map(item => 
        item.id === editingItem.id ? { ...itemData, id: editingItem.id } : item
      );
    } else {
      // 添加新记录
      const newId = Math.max(...timelineData.map(item => item.id), 0) + 1;
      newData = [...timelineData, { ...itemData, id: newId }];
    }
    
    // 按日期排序
    newData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setTimelineData(newData);
    saveToLocal(newData);
    setIsEditorOpen(false);
    showNotification(editingItem ? '记录已更新' : '记录已添加');
  };

  // 同步到 GitHub
  const handleSync = async () => {
    if (syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      // 检查 Token 有效性
      const isValid = await validateToken();
      if (!isValid) {
        throw new Error('GitHub Token 无效或已过期');
      }

      // 检测冲突
      const conflict = await detectConflict();
      if (conflict.hasConflict) {
        const proceed = window.confirm(
          '检测到远程文件已被修改，继续同步将覆盖远程更改。是否继续？'
        );
        if (!proceed) {
          setSyncStatus('idle');
          return;
        }
      }

      // 提交到 GitHub
      await commitToGitHub(timelineData);
      
      setSyncStatus('success');
      showNotification('🎉 同步成功！网站将在2-3分钟内更新', 'success');
      
      setTimeout(() => setSyncStatus('idle'), 3000);
      
    } catch (error) {
      setSyncStatus('error');
      showNotification(`❌ 同步失败: ${error.message}`, 'error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // 导出数据
  const handleExport = () => {
    LocalDataManager.exportData();
    showNotification('数据已导出');
  };

  // 导入数据
  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const data = await LocalDataManager.importData(file);
        setTimelineData(data);
        showNotification('数据导入成功', 'success');
      } catch (error) {
        showNotification(error.message, 'error');
      }
    };
    
    input.click();
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 获取类型图标
  const getTypeIcon = (type) => {
    const icons = {
      milestone: '🏆',
      special: '💕',
      travel: '✈️',
      daily: '📝'
    };
    return icons[type] || '📝';
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-form">
          <h2>🔐 管理员登录</h2>
          <input
            type="password"
            placeholder="请输入管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
          />
          <button onClick={handleAuth}>登录</button>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header className="admin-header">
        <h1>📝 时间线管理</h1>
        <div className="header-actions">
          <button 
            className="sync-button"
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'idle' && '📤 同步到 GitHub'}
            {syncStatus === 'syncing' && '🔄 同步中...'}
            {syncStatus === 'success' && '✅ 同步成功'}
            {syncStatus === 'error' && '❌ 同步失败'}
          </button>
          <button onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-toolbar">
          <button className="add-button" onClick={handleAdd}>
            ➕ 添加新记录
          </button>
          <div className="toolbar-group">
            <button className="export-button" onClick={handleExport}>
              📥 导出数据
            </button>
            <button className="import-button" onClick={handleImport}>
              📤 导入数据
            </button>
          </div>
          <div className="sync-info">
            <div>
              <small>上次同步: {getLastSyncTime()}</small>
            </div>
            <div>
              <small>
                {isSaving ? '💾 自动保存中...' : lastSaved ? `💾 已保存 ${lastSaved.toLocaleTimeString()}` : ''}
              </small>
            </div>
          </div>
          <button 
            className="preview-button"
            onClick={() => navigate('/')}
          >
            👁️ 预览网站
          </button>
        </div>

        <div className="timeline-list">
          {timelineData.map((item) => (
            <div key={item.id} className="timeline-item-card">
              <div className="item-header">
                <span className="item-icon">{getTypeIcon(item.type)}</span>
                <span className="item-date">{formatDate(item.date)}</span>
                <div className="item-actions">
                  <button onClick={() => handleEdit(item)}>✏️ 编辑</button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="delete-button"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
              <h3 className="item-title">{item.title}</h3>
              <p className="item-description">{item.description}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="item-tags">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEditorOpen && (
        <TimelineEditor
          item={editingItem}
          onSave={handleSave}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminPanel;