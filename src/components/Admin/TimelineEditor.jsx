import React, { useState, useEffect } from 'react';
import './TimelineEditor.css';

const TimelineEditor = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    type: 'daily',
    tags: [],
    images: []
  });
  const [tagInput, setTagInput] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (item) {
      setFormData({
        date: item.date,
        title: item.title,
        description: item.description,
        type: item.type,
        tags: [...(item.tags || [])],
        images: [...(item.images || [])]
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        type: 'daily',
        tags: [],
        images: []
      });
    }
  }, [item]);

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 添加图片
  const handleAddImage = () => {
    const url = prompt('请输入图片URL（以 /life-v-log/images/ 开头）:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  // 删除图片
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 提交表单
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.title.trim()) {
      alert('请填写标题');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('请填写描述');
      return;
    }

    onSave(formData);
  };

  // 获取类型选项
  const typeOptions = [
    { value: 'milestone', label: '🏆 里程碑', desc: '重要的人生节点' },
    { value: 'special', label: '💕 特殊时刻', desc: '浪漫和纪念时刻' },
    { value: 'travel', label: '✈️ 旅行', desc: '旅游和出行经历' },
    { value: 'daily', label: '📝 日常', desc: '日常生活记录' }
  ];

  return (
    <div className="editor-overlay">
      <div className="editor-modal">
        <div className="editor-header">
          <h2>{item ? '编辑记录' : '添加新记录'}</h2>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <div className="form-group">
            <label htmlFor="date">日期 *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">标题 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="输入标题，支持 emoji 📝"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">描述 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="详细描述这个时刻..."
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">类型</label>
            <div className="type-options">
              {typeOptions.map(option => (
                <label key={option.value} className="type-option">
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={handleInputChange}
                  />
                  <span className="type-label">
                    <span className="type-title">{option.label}</span>
                    <span className="type-desc">{option.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="输入标签后按回车添加"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button type="button" onClick={handleAddTag}>添加</button>
            </div>
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>图片</label>
            <button type="button" onClick={handleAddImage} className="add-image-button">
              📷 添加图片
            </button>
            <div className="images-list">
              {formData.images.map((image, index) => (
                <div key={index} className="image-item">
                  <img src={image} alt={`预览 ${index + 1}`} className="image-preview" />
                  <span className="image-url">{image}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            <div className="image-help">
              <small>图片应放在 public/images/ 目录下，URL 格式: /life-v-log/images/filename.jpg</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              取消
            </button>
            <button type="submit" className="save-button">
              {item ? '更新' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimelineEditor;