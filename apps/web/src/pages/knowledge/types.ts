export interface ArticleFilters {
  search: string;
  author: string;
  tag: string;
  dateRange: string;
  sortBy: 'newest' | 'oldest' | 'title';
}

export const emptyArticleFilters: ArticleFilters = {
  search: '',
  author: '',
  tag: '',
  dateRange: '',
  sortBy: 'newest',
};

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}
