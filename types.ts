export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  coins: number;
  role: UserRole;
  unlockedPromptIds: string[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  promptText?: string; // Hidden content (loaded only when unlocked)
  aiModel: string;
  author: string;
  category?: string;
  isTrending: boolean;
  ratingAvg: number;
  imageUrl: string;
  unlockCount: number;
  reviews: Review[];
  createdAt?: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cta: string;
  link?: string;
}

export interface FilterState {
  model: string | 'All';
  onlyTrending: boolean;
  search: string;
  sort: 'newest' | 'rating';
}
