export type User = {
  id: string | number;
  name: string;
  email: string;
  role?: "ADMIN" | "USER" | string;
  phone?: string | null;
  profilePhoto?: string | null;
};

export type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Author = {
  id: string;
  name: string;
};

export type Book = {
  id: string;
  title: string;
  description?: string;
  isbn?: string;
  publishedYear?: number;
  coverImage?: string | null;
  rating?: number;
  reviewCount?: number;
  totalCopies?: number;
  availableCopies?: number;
  borrowCount?: number;
  authorId?: string;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: Author;
  category?: Category;
};
