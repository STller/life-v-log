import React from 'react';
import './TimelineItem.css';

const TimelineItem = ({ item, index }) => {
  const isEven = index % 2 === 0;
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      milestone: '🏆',
      special: '💕',
      travel: '✈️',
      daily: '📝'
    };
    return icons[type] || '📝';
  };

  return (
    <div className={`timeline-item ${isEven ? 'left' : 'right'}`}>
      <div className="timeline-content">
        <div className="timeline-marker">
          <span className="timeline-icon">{getTypeIcon(item.type)}</span>
        </div>
        
        <div className="timeline-card">
          <div className="timeline-date">
            {formatDate(item.date)}
          </div>
          
          <h3 className="timeline-title">{item.title}</h3>
          
          <p className="timeline-description">{item.description}</p>
          
          {item.images && item.images.length > 0 && (
            <div className="timeline-images">
              {item.images.map((image, idx) => (
                <img 
                  key={idx}
                  src={image} 
                  alt={`${item.title} - ${idx + 1}`}
                  className="timeline-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <div className="timeline-tags">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="timeline-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;