export type Image = {
  src: string;
  alt: string;
};

export type Article = {
  id: string;
  url: string;
  title: string;
  author?: string;
  date: Date;
  image?: Image;
  summary?: string;
  content?: string;
  metadata: {
    [key: string]: string | number | boolean;
  };
};

export type Plugin = (articles: Article[]) => Promise<Article[]>;
