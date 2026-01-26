import { supabase } from './supabaseClient';
import { Prompt, Review } from '../types';

// Тип для рекламы
interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export const mockService = {
  // ===== PROMPTS =====
  
  // Получить все промпты
  async getPrompts(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    // Получаем отзывы для каждого промпта
    const promptsWithReviews = await Promise.all(
      (data || []).map(async (p) => {
        const reviews = await this.getReviews(p.id);
        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          promptText: p.prompt_text,
          imageUrl: p.image_url || '',
          aiModel: p.ai_model || 'Midjourney',
          category: p.category || 'Art',
          author: p.author || 'Admin',
          isTrending: p.is_trending || false,
          unlockCount: p.unlock_count || 0,
          ratingAvg: parseFloat(p.rating_avg) || 0,
          reviews: reviews,
          createdAt: p.created_at
        };
      })
    );

    return promptsWithReviews;
  },

  // Получить один промпт по ID
  async getPromptById(promptId: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }

    const reviews = await this.getReviews(promptId);

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      promptText: data.prompt_text,
      imageUrl: data.image_url || '',
      aiModel: data.ai_model || 'Midjourney',
      category: data.category || 'Art',
      author: data.author || 'Admin',
      isTrending: data.is_trending || false,
      unlockCount: data.unlock_count || 0,
      ratingAvg: parseFloat(data.rating_avg) || 0,
      reviews: reviews,
      createdAt: data.created_at
    };
  },

  // Добавить промпт
  async addPrompt(prompt: Partial<Prompt>): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .insert([{
        title: prompt.title,
        description: prompt.description,
        prompt_text: prompt.promptText,
        image_url: prompt.imageUrl,
        ai_model: prompt.aiModel || 'Midjourney',
        category: prompt.category || 'Art',
        author: prompt.author || 'Admin',
        is_trending: prompt.isTrending || false,
        unlock_count: 0,
        rating_avg: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding prompt:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      promptText: data.prompt_text,
      imageUrl: data.image_url || '',
      aiModel: data.ai_model,
      category: data.category,
      author: data.author,
      isTrending: data.is_trending,
      unlockCount: 0,
      ratingAvg: 0,
      reviews: [],
      createdAt: data.created_at
    };
  },

  // Обновить промпт
  async updatePrompt(promptId: string, updates: Partial<Prompt>): Promise<boolean> {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.promptText !== undefined) updateData.prompt_text = updates.promptText;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.aiModel !== undefined) updateData.ai_model = updates.aiModel;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.author !== undefined) updateData.author = updates.author;
    if (updates.isTrending !== undefined) updateData.is_trending = updates.isTrending;

    const { error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', promptId);

    if (error) {
      console.error('Error updating prompt:', error);
      return false;
    }

    return true;
  },

  // Удалить промпт
  async deletePrompt(promptId: string): Promise<boolean> {
    // Сначала удаляем связанные отзывы
    await supabase
      .from('reviews')
      .delete()
      .eq('prompt_id', promptId);

    // Затем удаляем сам промпт
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }

    return true;
  },

  // Увеличить счётчик разблокировок
  async incrementUnlockCount(promptId: string): Promise<void> {
    const { data } = await supabase
      .from('prompts')
      .select('unlock_count')
      .eq('id', promptId)
      .single();

    if (data) {
      await supabase
        .from('prompts')
        .update({ unlock_count: (data.unlock_count || 0) + 1 })
        .eq('id', promptId);
    }
  },

  // ===== REVIEWS =====

  // Получить отзывы для промпта
  async getReviews(promptId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar || '',
      rating: r.rating,
      comment: r.comment || '',
      createdAt: r.created_at
    }));
  },

  // Добавить отзыв
  async submitReview(promptId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        prompt_id: promptId,
        user_id: review.userId,
        user_name: review.userName,
        user_avatar: review.userAvatar,
        rating: review.rating,
        comment: review.comment
      }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting review:', error);
      throw new Error(error.message);
    }

    // Обновляем средний рейтинг промпта
    await this.updatePromptRating(promptId);

    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar || '',
      rating: data.rating,
      comment: data.comment || '',
      createdAt: data.created_at
    };
  },

  // Обновить средний рейтинг промпта
  async updatePromptRating(promptId: string): Promise<void> {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('prompt_id', promptId);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await supabase
        .from('prompts')
        .update({ rating_avg: parseFloat(avg.toFixed(2)) })
        .eq('id', promptId);
    }
  },

  // ===== UNLOCKED PROMPTS =====

  // Получить разблокированные промпты пользователя
  async getUnlockedPromptIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('unlocked_prompts')
      .select('prompt_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching unlocked prompts:', error);
      return [];
    }

    return (data || []).map(item => item.prompt_id);
  },

  // Разблокировать промпт
  async unlockPrompt(userId: string, promptId: string): Promise<boolean> {
    const { error } = await supabase
      .from('unlocked_prompts')
      .insert([{
        user_id: userId,
        prompt_id: promptId
      }]);

    if (error) {
      // Если уже разблокирован - не ошибка
      if (error.code === '23505') {
        return true;
      }
      console.error('Error unlocking prompt:', error);
      return false;
    }

    // Увеличиваем счётчик разблокировок
    await this.incrementUnlockCount(promptId);

    return true;
  },

  // ===== ADS =====

  // Получить случайную рекламу
  getRandomAd(): Ad | null {
    const ads: Ad[] = [
      {
        id: '1',
        title: 'Premium Prompts Pack',
        description: 'Get 50+ exclusive AI prompts for creative professionals',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=100&fit=crop',
        link: '#premium'
      },
      {
        id: '2',
        title: 'AI Masterclass',
        description: 'Learn to create stunning AI art in 30 days',
        imageUrl: 'https://images.unsplash.com/photo-1686191128892-3b37add4ad5f?w=400&h=100&fit=crop',
        link: '#masterclass'
      }
    ];
    
    // 50% шанс показа рекламы
    if (Math.random() > 0.5) {
      return ads[Math.floor(Math.random() * ads.length)];
    }
    return null;
  }
};
