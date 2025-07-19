import React from 'react';
import TimelineItem from '../TimelineItem/TimelineItem';
import { timelineData } from '../../data/timelineData';
import './Timeline.css';

const Timeline = () => {
  const sortedData = [...timelineData].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h1 className="timeline-title">我们的爱情时光 💕</h1>
        <p className="timeline-subtitle">记录每一个美好的瞬间</p>
      </div>
      
      <div className="timeline">
        <div className="timeline-line"></div>
        {sortedData.map((item, index) => (
          <TimelineItem 
            key={item.id} 
            item={item} 
            index={index}
          />
        ))}
      </div>
      
      <div className="timeline-footer">
        <p className="timeline-footer-text">
          每一天都是新的开始，每一刻都值得珍藏 ✨
        </p>
      </div>
    </div>
  );
};

export default Timeline;