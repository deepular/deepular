import { expect, test } from '@playwright/test';

test('route with server controller resolver', async ({ page }) => {
  await page.goto('/server-controller-resolver');

  await expect(page.getByText('Hello World')).toBeVisible();
});

test('parent -> child', async ({ page }) => {
  await page.goto('/parent/child');

  await expect(page.getByText('Parent Child')).toBeVisible();
});
