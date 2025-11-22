import { NewsArticle } from '../types';

export const NEWS_STORAGE_KEY = 'vinielaNews';

const initialNews: NewsArticle[] = [
  {
    id: '1',
    title: {
      id: 'Pembukaan Kantor Baru di Jakarta',
      en: 'New Office Opening in Jakarta',
      cn: '雅加达新办事处开业',
    },
    content: {
      id: 'VINIELA Group dengan bangga mengumumkan pembukaan kantor baru kami di pusat kota Jakarta. Ini menandai tonggak penting dalam ekspansi kami.',
      en: 'VINIELA Group is proud to announce the opening of our new office in the heart of Jakarta. This marks a significant milestone in our expansion.',
      cn: 'VINIELA集团自豪地宣布我们在雅加达市中心的新办事处开业。这标志着我们扩张的一个重要里程碑。',
    },
    date: '2024-07-15',
    imageUrls: [
      'https://picsum.photos/seed/jakarta/800/600',
      'https://picsum.photos/seed/office/800/600',
      'https://picsum.photos/seed/building/800/600',
      'https://picsum.photos/seed/city/800/600',
    ],
    category: 'company',
  },
  {
    id: '2',
    title: {
      id: 'Peluncuran Divisi Viniela Digital Agency',
      en: 'Launch of Viniela Digital Agency Division',
      cn: 'Viniela数字代理部门启动',
    },
    content: {
      id: 'Kami sangat antusias untuk meluncurkan Viniela Digital Agency, yang menawarkan solusi pemasaran digital canggih untuk bisnis modern.',
      en: 'We are excited to launch Viniela Digital Agency, offering cutting-edge digital marketing solutions for modern businesses.',
      cn: '我们很高兴推出Viniela数字代理，为现代企业提供前沿的数字营销解决方案。',
    },
    date: '2024-06-28',
    imageUrls: ['https://picsum.photos/seed/digital/600/400'],
    category: 'division',
  },
];

export const getNews = (): NewsArticle[] => {
  try {
    const newsJson = localStorage.getItem(NEWS_STORAGE_KEY);
    if (newsJson) {
      return JSON.parse(newsJson);
    } else {
      localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(initialNews));
      return initialNews;
    }
  } catch (error) {
    console.error('Failed to parse news from localStorage', error);
    return initialNews;
  }
};

export const getNewsById = (id: string): NewsArticle | undefined => {
  const articles = getNews();
  return articles.find(article => article.id === id);
};

export const saveNews = (news: NewsArticle[]) => {
  try {
    const newsJson = JSON.stringify(news);
    localStorage.setItem(NEWS_STORAGE_KEY, newsJson);
  } catch (error) {
    console.error('Failed to save news to localStorage', error);
  }
};

export const addNewsArticle = (article: Omit<NewsArticle, 'id' | 'date'>): NewsArticle => {
  const articles = getNews();
  const newArticle: NewsArticle = {
    ...article,
    id: new Date().getTime().toString(),
    date: new Date().toISOString().split('T')[0],
  };
  const updatedArticles = [newArticle, ...articles];
  saveNews(updatedArticles);
  return newArticle;
};

export const updateNewsArticle = (updatedArticle: NewsArticle): NewsArticle => {
  const articles = getNews();
  const updatedArticles = articles.map(article =>
    article.id === updatedArticle.id ? updatedArticle : article
  );
  saveNews(updatedArticles);
  return updatedArticle;
};

export const deleteNewsArticle = (articleId: string) => {
  const articles = getNews();
  const updatedArticles = articles.filter(article => article.id !== articleId);
  saveNews(updatedArticles);
};