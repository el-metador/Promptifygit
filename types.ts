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
  promptText: string; // Hidden content
  aiModel: 'Nano Banana Pro' | 'Veo 3.1' | 'Sora 2' | 'Gemini 3 Pro';
  author: string;
  isTrending: boolean;
  ratingAvg: number;
  imageUrl: string;
  unlockCount: number;
  reviews: Review[];
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cta: string;
}

export interface FilterState {
  model: string | 'All';
  onlyTrending: boolean;
  search: string;
  sort: 'newest' | 'rating';
}
