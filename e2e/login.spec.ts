import { expect, test } from '@playwright/test';

test('login screen renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
});
