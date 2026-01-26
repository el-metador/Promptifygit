import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Prompt, Review, Ad } from '../types';

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
};

export const mockService = {
  // ===== PROMPTS =====

  // Получить все промпты (без защищенного текста)
  async getPrompts(): Promise<Prompt[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('prompts')
      .select(
        'id,title,description,ai_model,author,category,is_trending,unlock_count,rating_avg,image_url,created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      promptText: undefined,
      imageUrl: p.image_url || '',
      aiModel: p.ai_model || 'Unknown',
      category: p.category || 'Other',
      author: p.author || 'Admin',
      isTrending: p.is_trending || false,
      unlockCount: p.unlock_count || 0,
      ratingAvg: Number.parseFloat(p.rating_avg) || 0,
      reviews: [],
      createdAt: p.created_at,
    }));
  },

  // Получить один промпт по ID (без защищенного текста)
  async getPromptById(promptId: string): Promise<Prompt | null> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('prompts')
      .select(
        'id,title,description,ai_model,author,category,is_trending,unlock_count,rating_avg,image_url,created_at'
      )
      .eq('id', promptId)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      promptText: undefined,
      imageUrl: data.image_url || '',
      aiModel: data.ai_model || 'Unknown',
      category: data.category || 'Other',
      author: data.author || 'Admin',
      isTrending: data.is_trending || false,
      unlockCount: data.unlock_count || 0,
      ratingAvg: Number.parseFloat(data.rating_avg) || 0,
      reviews: [],
      createdAt: data.created_at,
    };
  },

  // Получить защищенный текст промпта (требует unlock)
  async getPromptSecret(promptId: string): Promise<string | null> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('prompt_secrets')
      .select('prompt_text')
      .eq('prompt_id', promptId)
      .single();

    if (error) {
      console.error('Error fetching prompt secret:', error);
      return null;
    }

    return data?.prompt_text || null;
  },

  // Добавить промпт (admin)
  async addPrompt(prompt: Partial<Prompt>): Promise<Prompt | null> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('prompts')
      .insert([
        {
          title: prompt.title,
          description: prompt.description,
          ai_model: prompt.aiModel || 'Unknown',
          category: prompt.category || 'Other',
          author: prompt.author || 'Admin',
          is_trending: prompt.isTrending || false,
          image_url: prompt.imageUrl,
          unlock_count: 0,
          rating_avg: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding prompt:', error);
      throw new Error(error.message);
    }

    if (prompt.promptText) {
      const { error: secretError } = await supabase
        .from('prompt_secrets')
        .insert([{ prompt_id: data.id, prompt_text: prompt.promptText }]);

      if (secretError) {
        console.error('Error adding prompt secret:', secretError);
        throw new Error(secretError.message);
      }
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      promptText: prompt.promptText,
      imageUrl: data.image_url || '',
      aiModel: data.ai_model,
      category: data.category,
      author: data.author,
      isTrending: data.is_trending,
      unlockCount: 0,
      ratingAvg: 0,
      reviews: [],
      createdAt: data.created_at,
    };
  },

  // Обновить промпт (admin)
  async updatePrompt(promptId: string, updates: Partial<Prompt>): Promise<boolean> {
    ensureSupabase();
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.aiModel !== undefined) updateData.ai_model = updates.aiModel;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.author !== undefined) updateData.author = updates.author;
    if (updates.isTrending !== undefined) updateData.is_trending = updates.isTrending;

    const { error } = await supabase.from('prompts').update(updateData).eq('id', promptId);

    if (error) {
      console.error('Error updating prompt:', error);
      return false;
    }

    if (updates.promptText !== undefined) {
      const { error: secretError } = await supabase
        .from('prompt_secrets')
        .upsert([{ prompt_id: promptId, prompt_text: updates.promptText }]);

      if (secretError) {
        console.error('Error updating prompt secret:', secretError);
        return false;
      }
    }

    return true;
  },

  // Удалить промпт (admin) - каскадно удалит секреты/отзывы/разблокировки
  async deletePrompt(promptId: string): Promise<boolean> {
    ensureSupabase();
    const { error } = await supabase.from('prompts').delete().eq('id', promptId);

    if (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }

    return true;
  },

  // ===== REVIEWS =====

  // Получить отзывы для промпта
  async getReviews(promptId: string): Promise<Review[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return (data || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'User',
      userAvatar: r.user_avatar || '',
      rating: r.rating,
      comment: r.comment || '',
      createdAt: r.created_at,
    }));
  },

  // Добавить отзыв
  async submitReview(promptId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          prompt_id: promptId,
          user_id: review.userId,
          user_name: review.userName,
          user_avatar: review.userAvatar,
          rating: review.rating,
          comment: review.comment,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error submitting review:', error);
      throw new Error(error.message);
    }

    const { error: ratingError } = await supabase.rpc('update_prompt_rating', {
      p_prompt_id: promptId,
    });

    if (ratingError) {
      console.error('Error updating prompt rating:', ratingError);
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar || '',
      rating: data.rating,
      comment: data.comment || '',
      createdAt: data.created_at,
    };
  },

  // ===== UNLOCKS =====

  // Получить разблокированные промпты пользователя
  async getUnlockedPromptIds(userId: string): Promise<string[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('unlocks')
      .select('prompt_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching unlocked prompts:', error);
      return [];
    }

    return (data || []).map((item) => item.prompt_id);
  },

  // Разблокировать промпт (RPC, атомарно списывает монеты)
  async unlockPrompt(promptId: string): Promise<{ unlocked: boolean; coinsLeft: number }> {
    ensureSupabase();
    const { data, error } = await supabase.rpc('unlock_prompt', { p_prompt_id: promptId });

    if (error) {
      console.error('Error unlocking prompt:', error);
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return {
      unlocked: Boolean(result?.unlocked),
      coinsLeft: Number(result?.coins_left ?? 0),
    };
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
        cta: 'Explore Pack',
        link: '#premium',
      },
      {
        id: '2',
        title: 'AI Masterclass',
        description: 'Learn to create stunning AI art in 30 days',
        imageUrl: 'https://images.unsplash.com/photo-1686191128892-3b37add4ad5f?w=400&h=100&fit=crop',
        cta: 'View Course',
        link: '#masterclass',
      },
    ];

    // 50% шанс показа рекламы
    if (Math.random() > 0.5) {
      return ads[Math.floor(Math.random() * ads.length)];
    }
    return null;
  },
};
