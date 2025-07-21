export type TGeneratedContent = {
  caption: string;
  hashtags: string[];
  imageUrl?: string;
};

export type TPost = {
  id: string;
  content: string;
  date: string;
  time: string;
  platform: string[];
  status: "scheduled" | "published" | "failed";
  images: string[];
  createdAt: string;
};
