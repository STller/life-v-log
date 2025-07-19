export const timelineData = [
  {
    id: 1,
    date: "2024-01-01",
    title: "新年快乐 🎊",
    description: "我们一起迎接了2024年的第一天，许下美好的愿望",
    images: ["/life-v-log/images/new-year-2024.svg"],
    tags: ["节日", "纪念日"],
    type: "milestone"
  },
  {
    id: 2,
    date: "2024-02-14",
    title: "情人节的浪漫时光 💕",
    description: "一起度过了甜蜜的情人节，收到了最爱的礼物",
    images: [],
    tags: ["节日", "浪漫"],
    type: "special"
  },
  {
    id: 3,
    date: "2024-03-15",
    title: "春日樱花之旅 🌸",
    description: "去看了樱花，漫步在花海中，记录下这美好的时刻",
    images: [],
    tags: ["旅行", "春天"],
    type: "travel"
  }
];

// 数据结构说明：
// id: 唯一标识符
// date: 日期 (YYYY-MM-DD 格式)
// title: 标题
// description: 描述内容
// images: 图片数组 (可以是多张图片)
// tags: 标签数组 (用于分类和筛选)
// type: 类型 (milestone-里程碑, special-特殊日子, travel-旅行, daily-日常)