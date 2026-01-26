import { render, screen } from '@testing-library/react';

import { PromptCard } from '../PromptCard';
import { Prompt } from '../../types';

const basePrompt: Prompt = {
  id: 'prompt-1',
  title: 'Cinematic City',
  description: 'A futuristic skyline prompt.',
  aiModel: 'Sora 2',
  author: 'Admin',
  isTrending: false,
  ratingAvg: 4.8,
  imageUrl: '',
  unlockCount: 0,
  reviews: [],
};

describe('PromptCard', () => {
  it('shows locked price when not unlocked', () => {
    render(<PromptCard prompt={basePrompt} isUnlocked={false} onClick={() => {}} />);
    expect(screen.getByText('1 COIN')).toBeInTheDocument();
    expect(screen.getByText('Cinematic City')).toBeInTheDocument();
  });

  it('shows owned label when unlocked', () => {
    render(<PromptCard prompt={basePrompt} isUnlocked={true} onClick={() => {}} />);
    expect(screen.getByText('OWNED')).toBeInTheDocument();
  });
});
