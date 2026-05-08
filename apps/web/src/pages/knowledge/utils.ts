export function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

export function getArticleTime(article: any) {
  return new Date(article.createdAt || article.updatedAt || article.date || 0).getTime();
}

// tính thời gian đọc bài viết: tốc độ 200 từ/phút
export function getReadingTime(content: string = '') {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} phút đọc`;
}
