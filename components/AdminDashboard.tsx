import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Search,
  Image,
  Sparkles,
  TrendingUp,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { Prompt } from '../types';
import { Button } from './Button';
import { mockService } from '../services/mockService';

interface AdminDashboardProps {
  prompts: Prompt[];
  onRefresh: () => void;
  onLogout: () => void;
  onBack: () => void;
}

// Форма для создания/редактирования промпта
interface PromptFormData {
  title: string;
  description: string;
  promptText: string;
  imageUrl: string;
  aiModel: string;
  category: string;
  author: string;
  isTrending: boolean;
}

const emptyForm: PromptFormData = {
  title: '',
  description: '',
  promptText: '',
  imageUrl: '',
  aiModel: 'Midjourney',
  category: 'Art',
  author: 'Admin',
  isTrending: false
};

const AI_MODELS = ['Midjourney', 'DALL-E', 'Stable Diffusion', 'ChatGPT', 'Claude', 'Other'];
const CATEGORIES = ['Art', 'Photography', 'Design', 'Writing', 'Code', 'Business', 'Other'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  prompts: initialPrompts,
  onRefresh,
  onLogout,
  onBack
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Загружаем промпты при монтировании
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const data = await mockService.getPrompts();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтрация промптов
  const filteredPrompts = prompts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.aiModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Открыть модал для создания
  const handleAddNew = () => {
    setEditingPrompt(null);
    setFormData(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  // Открыть модал для редактирования
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      description: prompt.description,
      promptText: prompt.promptText,
      imageUrl: prompt.imageUrl,
      aiModel: prompt.aiModel,
      category: prompt.category || 'Art',
      author: prompt.author,
      isTrending: prompt.isTrending
    });
    setError('');
    setIsModalOpen(true);
  };

  // Сохранить промпт
  const handleSave = async () => {
    // Валидация
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.promptText.trim()) {
      setError('Prompt text is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (editingPrompt) {
        // Обновление
        const success = await mockService.updatePrompt(editingPrompt.id, formData);
        if (!success) throw new Error('Failed to update');
      } else {
        // Создание
        const newPrompt = await mockService.addPrompt(formData);
        if (!newPrompt) throw new Error('Failed to create');
      }

      // Перезагружаем список
      await loadPrompts();
      setIsModalOpen(false);
      setFormData(emptyForm);
      setEditingPrompt(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save prompt');
    } finally {
      setIsLoading(false);
    }
  };

  // Удалить промпт
  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(promptId);

    try {
      const success = await mockService.deletePrompt(promptId);
      if (success) {
        setPrompts(prev => prev.filter(p => p.id !== promptId));
      } else {
        alert('Failed to delete prompt');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete prompt');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary fill-current" />
              <span className="text-xl font-black">Admin Panel</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Prompts</p>
            <p className="text-2xl font-bold">{prompts.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Trending</p>
            <p className="text-2xl font-bold text-primary">
              {prompts.filter(p => p.isTrending).length}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total Unlocks</p>
            <p className="text-2xl font-bold">
              {prompts.reduce((sum, p) => sum + (p.unlockCount || 0), 0)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Avg Rating</p>
            <p className="text-2xl font-bold">
              {prompts.length > 0 
                ? (prompts.reduce((sum, p) => sum + (p.ratingAvg || 0), 0) / prompts.length).toFixed(1)
                : '0.0'
              }
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Prompt
          </Button>
        </div>

        {/* Prompts Table */}
        <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
          {isLoading && prompts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? 'No prompts found matching your search.' : 'No prompts yet. Add your first prompt!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                      Model
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                      Stats
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredPrompts.map(prompt => (
                    <tr key={prompt.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prompt.imageUrl || 'https://via.placeholder.com/48'}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-zinc-800"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{prompt.title}</p>
                              {prompt.isTrending && (
                                <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-zinc-500 truncate max-w-xs">
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="px-2.5 py-1 bg-zinc-800 rounded-full text-xs font-medium">
                          {prompt.aiModel}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm">
                          <span className="text-zinc-400">{prompt.unlockCount} unlocks</span>
                          <span className="text-zinc-600 mx-2">•</span>
                          <span className="text-primary">★ {prompt.ratingAvg?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(prompt)}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            disabled={isDeleting === prompt.id}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-zinc-400 hover:text-red-400 disabled:opacity-50"
                          >
                            {isDeleting === prompt.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold">
                {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Enter prompt title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                  rows={2}
                  placeholder="Brief description of the prompt"
                />
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Prompt Text *
                </label>
                <textarea
                  value={formData.promptText}
                  onChange={(e) => setFormData(prev => ({ ...prev, promptText: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                  rows={4}
                  placeholder="The actual prompt text users will copy..."
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  <Image className="inline h-4 w-4 mr-1" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Model & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    AI Model
                  </label>
                  <select
                    value={formData.aiModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, aiModel: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    {AI_MODELS.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/50 border border-zinc-700 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Author name"
                />
              </div>

              {/* Trending Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isTrending: !prev.isTrending }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.isTrending ? 'bg-primary' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.isTrending ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-zinc-400">
                  Mark as Trending
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                isLoading={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingPrompt ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
