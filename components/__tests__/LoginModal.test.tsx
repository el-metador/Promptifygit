import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { LoginModal } from '../LoginModal';

describe('LoginModal', () => {
  it('submits email login payload', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal onClose={onClose} onLogin={onLogin} />);

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onLogin).toHaveBeenCalledWith({
      provider: 'email',
      email: 'test@example.com',
      password: 'secret',
    });
  });

  it('triggers Google login', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal onClose={onClose} onLogin={onLogin} />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(onLogin).toHaveBeenCalledWith({ provider: 'google' });
  });
});
