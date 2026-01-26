import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Star, Zap } from 'lucide-react';
import { Prompt, User, Review } from '../types';
import { Button } from './Button';
import { mockService } from '../services/mockService';

interface PromptModalProps {
  prompt: Prompt | null;
  user: User | null;
  isUnlocked: boolean;
  onClose: () => void;
  onUnlock: (promptId: string) => Promise<void>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ 
  prompt, 
  user, 
  isUnlocked, 
  onClose, 
  onUnlock 
}) => {
  const [step, setStep] = useState<'preview' | 'unlocking' | 'view'>('preview');
  const [timeLeft, setTimeLeft] = useState(10);
  const [isUnlockLoading, setIsUnlockLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptText, setPromptText] = useState<string | null>(prompt?.promptText ?? null);
  const [isPromptTextLoading, setIsPromptTextLoading] = useState(false);
  
  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  // Загружаем отзывы при открытии
  useEffect(() => {
    if (prompt) {
      setPromptText(prompt.promptText ?? null);
      mockService
        .getReviews(prompt.id)
        .then((data) => setReviews(data))
        .catch((err) => console.error('Failed to load reviews:', err));
    }
  }, [prompt, user]);

  useEffect(() => {
    if (!user) {
      setHasUserReviewed(false);
      return;
    }
    setHasUserReviewed(reviews.some((review) => review.userId === user.id));
  }, [reviews, user]);

  // Устанавливаем step при изменении isUnlocked
  useEffect(() => {
    if (isUnlocked) {
      setStep('view');
    } else {
      setStep('preview');
    }
  }, [isUnlocked]);

  // Загружаем защищенный текст при необходимости
  useEffect(() => {
    if (!prompt || !isUnlocked || promptText) return;
    setIsPromptTextLoading(true);
    mockService
      .getPromptSecret(prompt.id)
      .then((text) => setPromptText(text))
      .catch((err) => console.error('Failed to load prompt text:', err))
      .finally(() => setIsPromptTextLoading(false));
  }, [prompt, isUnlocked, promptText]);

  // Таймер для разблокировки
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (step === 'unlocking' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (step === 'unlocking' && timeLeft === 0 && prompt) {
      handleUnlock();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timeLeft]);

  // Проверка на null
  if (!prompt) {
    return null;
  }

  const handleStartUnlock = () => {
    if (!user) return;
    if (user.coins < 1) return;
    setTimeLeft(10);
    setStep('unlocking');
  };

  const handleUnlock = async () => {
    if (!prompt || !onUnlock) return;
    
    setIsUnlockLoading(true);
    try {
      await onUnlock(prompt.id);
      setStep('view');
      if (!promptText) {
        setIsPromptTextLoading(true);
        const text = await mockService.getPromptSecret(prompt.id);
        setPromptText(text);
        setIsPromptTextLoading(false);
      }
    } catch (error) {
      console.error('Unlock failed:', error);
      setStep('preview');
    } finally {
      setIsUnlockLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!promptText) return;
    
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !prompt || rating === 0) return;
    
    const sanitizedComment = comment.trim();
    if (sanitizedComment.length < 3) {
      setReviewError("Comment must be at least 3 characters.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      const savedReview = await mockService.submitReview(prompt.id, {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || '',
        rating,
        comment: sanitizedComment
      });

      setReviews(prev => [savedReview, ...prev]);
      setHasUserReviewed(true);
      setRating(0);
      setComment('');
    } catch (e: any) {
      console.error('Review error:', e);
      setReviewError(e.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Закрытие по клику на фон
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface rounded-3xl border border-white/10 shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-20 p-2 rounded-full bg-black/30 text-white/70 hover:text-white hover:bg-black/50 transition-colors backdrop-blur-md"
        >
          <X className="h-5 w-5" />
        </button>

        {/* UNLOCKING VIEW */}
        {step === 'unlocking' ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-surface">
            <div className="mb-6 relative h-20 w-20">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <path 
                  className="text-zinc-800" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                />
                <path 
                  className="text-primary transition-all duration-1000 ease-linear" 
                  strokeDasharray={`${(timeLeft / 10) * 100}, 100`} 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                {timeLeft}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-white">Decrypting Prompt...</h3>
            <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
              Please wait a moment while we retrieve the data from the secure vault.
            </p>
          </div>
        ) : (
          /* CONTENT VIEW */
          <>
            {/* Header Image */}
            <div className="relative h-64 sm:h-80 w-full">
              <img 
                src={prompt.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'} 
                alt={prompt.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white">
                    {prompt.aiModel}
                  </span>
                  {prompt.isTrending && (
                    <span className="bg-primary/20 text-primary-light border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> Viral
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{prompt.title}</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Author & Stats */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {prompt.author?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{prompt.author}</p>
                    <p className="text-xs text-zinc-500">{prompt.unlockCount} unlocks</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                  <Star className="w-4 h-4 text-primary fill-current" />
                  <span className="font-bold text-white">{prompt.ratingAvg?.toFixed(1) || '0.0'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  About this Prompt
                </h3>
                <p className="text-zinc-300 leading-relaxed text-sm">{prompt.description}</p>
              </div>

              {/* Prompt Content */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Prompt Content
                  </h3>
                  {isUnlocked && (
                    <button 
                      onClick={copyToClipboard}
                      disabled={isPromptTextLoading || !promptText}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                  )}
                </div>
                
                <div className="relative rounded-2xl bg-black/50 border border-zinc-800 overflow-hidden">
                  {isUnlocked ? (
                    <div className="p-5 font-mono text-sm text-zinc-300 leading-relaxed break-words selection:bg-primary/30">
                      {isPromptTextLoading ? 'Loading prompt...' : promptText || 'Prompt text unavailable.'}
                    </div>
                  ) : (
                    <div className="relative p-4 h-40 flex items-center justify-center bg-zinc-900/30">
                      <div className="absolute inset-0 p-5 font-mono text-sm text-zinc-700 blur-[6px] select-none">
                        Cinematic shot of a futuristic city... [LOCKED CONTENT] ... 8k resolution, unreal engine render.
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px]">
                        {user ? (
                          user.coins > 0 ? (
                            <div className="text-center">
                              <Button 
                                onClick={handleStartUnlock} 
                                size="lg" 
                                className="shadow-2xl shadow-primary/20"
                                disabled={isUnlockLoading}
                                isLoading={isUnlockLoading}
                              >
                                Unlock for 1 Coin
                              </Button>
                              <p className="mt-3 text-xs text-zinc-500">Balance: {user.coins} Coins</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <Button disabled variant="outline">Insufficient Coins</Button>
                              <p className="text-xs text-zinc-500">You need more coins to unlock</p>
                            </div>
                          )
                        ) : (
                          <Button disabled variant="secondary">Log in to Unlock</Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              {isUnlocked && (
                <div className="border-t border-zinc-800 pt-8">
                  <h3 className="text-lg font-bold text-white mb-6">
                    Reviews ({reviews.length})
                  </h3>
                  
                  {/* Review Form */}
                  {user && !hasUserReviewed ? (
                    <div className="mb-8 bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800/50">
                      <h4 className="text-sm font-medium text-white mb-3">Leave a review</h4>
                      <div className="space-y-4">
                        {/* Star Rating */}
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star} 
                              onClick={() => setRating(star)} 
                              className="focus:outline-none transition-transform hover:scale-110"
                              type="button"
                            >
                              <Star 
                                className={`w-6 h-6 transition-colors ${
                                  rating >= star 
                                    ? 'text-primary fill-current' 
                                    : 'text-zinc-700 hover:text-zinc-500'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                        
                        {/* Comment */}
                        <textarea 
                          className="w-full bg-black/40 border border-zinc-700 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors"
                          placeholder="Share your experience with this prompt..."
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        
                        {/* Error */}
                        {reviewError && (
                          <p className="text-xs text-red-400">{reviewError}</p>
                        )}
                        
                        {/* Submit */}
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={handleSubmitReview} 
                            disabled={rating === 0 || !comment.trim() || isSubmittingReview}
                            isLoading={isSubmittingReview}
                          >
                            Post Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : user && hasUserReviewed && (
                    <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                      <p className="text-sm text-primary-light">✓ Thanks for your review!</p>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {reviews.length === 0 ? (
                      <p className="text-zinc-500 text-sm italic text-center py-8">
                        No reviews yet. Be the first to review!
                      </p>
                    ) : (
                      reviews.map(review => (
                        <div 
                          key={review.id} 
                          className="flex gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50"
                        >
                          <img 
                            src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} 
                            alt={review.userName} 
                            className="w-10 h-10 rounded-full bg-zinc-800 object-cover flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-white text-sm truncate">
                                {review.userName}
                              </span>
                              <div className="flex items-center gap-0.5 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                                <Star className="w-3 h-3 text-primary fill-current" />
                                <span className="text-xs text-zinc-300 font-bold">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
