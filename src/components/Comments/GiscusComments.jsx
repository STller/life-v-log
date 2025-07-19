import React from 'react';
import Giscus from '@giscus/react';
import './GiscusComments.css';

const GiscusComments = ({ itemId, title }) => {
  return (
    <div className="giscus-comments">
      <div className="comments-header">
        <h4>💬 评论区</h4>
        <p>分享你的感受和想法</p>
      </div>
      
      <Giscus
        id="comments"
        repo="STller/life-v-log"
        repoId="R_kgDOPPIdCw"
        category="Announcements"
        categoryId="DIC_kwDOPPIdC84CtLdq"
        mapping="specific"
        term={`timeline-${itemId}-${title}`}
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme="light_pink"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
};

export default GiscusComments;