import React from 'react';

// 本地数据管理工具
export class LocalDataManager {
  static STORAGE_KEY = 'timelineEditData';
  static BACKUP_KEY = 'timelineBackup';
  static AUTO_SAVE_INTERVAL = 30000; // 30秒自动保存

  // 保存数据到本地存储
  static save(data) {
    try {
      const dataWithTimestamp = {
        data,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
      this.createBackup(data);
      return true;
    } catch {
      console.error('保存到本地存储失败:');
      return false;
    }
  }

  // 从本地存储加载数据
  static load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data || null;
    } catch (error) {
      console.error('从本地存储加载失败:', error);
      return null;
    }
  }

  // 获取最后保存时间
  static getLastSaveTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.lastSaved ? new Date(parsed.lastSaved) : null;
    } catch {
      return null;
    }
  }

  // 创建备份
  static createBackup(data) {
    try {
      const backups = this.getBackups();
      const newBackup = {
        id: Date.now(),
        data,
        timestamp: new Date().toISOString()
      };

      // 保留最近5个备份
      const updatedBackups = [newBackup, ...backups].slice(0, 5);
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(updatedBackups));
    } catch {
      console.error('创建备份失败:');
    }
  }

  // 获取所有备份
  static getBackups() {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // 恢复备份
  static restoreBackup(backupId) {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.id === backupId);
      if (backup) {
        this.save(backup.data);
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error('恢复备份失败:', error);
      return null;
    }
  }

  // 清除所有本地数据
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
  }

  // 检查是否有未同步的更改
  static hasUnsyncedChanges() {
    const lastSave = this.getLastSaveTime();
    const lastSync = localStorage.getItem('lastSyncTime');
    
    if (!lastSave || !lastSync) return false;
    
    return new Date(lastSave) > new Date(lastSync);
  }

  // 导出数据为JSON文件
  static exportData() {
    const data = this.load();
    if (!data) {
      alert('没有数据可导出');
      return;
    }

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 导入数据从JSON文件
  static async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // 验证数据格式
          if (!Array.isArray(data)) {
            throw new Error('数据格式不正确：应该是数组格式');
          }
          
          // 验证每个项目的必需字段
          for (const item of data) {
            if (!item.id || !item.date || !item.title) {
              throw new Error('数据格式不正确：缺少必需字段');
            }
          }
          
          this.save(data);
          resolve(data);
        } catch (error) {
          reject(new Error(`导入失败: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}

// 自动保存Hook
export const useAutoSave = (data, enabled = true) => {
  const [lastSaved, setLastSaved] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || !data) return;

    const autoSave = () => {
      setIsSaving(true);
      const success = LocalDataManager.save(data);
      if (success) {
        setLastSaved(new Date());
      }
      setIsSaving(false);
    };

    const intervalId = setInterval(autoSave, LocalDataManager.AUTO_SAVE_INTERVAL);
    
    // 页面卸载时保存
    const handleBeforeUnload = () => {
      LocalDataManager.save(data);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, enabled]);

  return { lastSaved, isSaving };
};