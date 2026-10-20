import { test, expect } from '@playwright/test';

test('loads on the bridge with the captain station active', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Agent Helm' })).toBeVisible();
  await expect(page).toHaveTitle(/Agent Helm/);
  await expect(page.getByRole('button', { name: 'Captain' })).toHaveClass(/active/);
  await expect(page.locator('#editor')).toBeVisible();
  await expect(page.locator('#editorTitle')).toHaveText('Main Viewer');
});

test('loads a URL into the selected screen and saves a bookmark that persists', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Page URL').fill('example.com');
  await page.getByRole('button', { name: 'Load page' }).click();
  await expect(page.locator('#editorStatus')).toContainText('https://example.com/');
  await page.getByLabel('Bookmark name').fill('My Example');
  await page.getByRole('button', { name: 'Save bookmark' }).click();
  await expect(page.getByRole('button', { name: 'My Example', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'My Example', exact: true })).toBeVisible();
});

test('spawns a floating screen and teleports to Ops', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Floating screen' }).click();
  await expect(page.locator('#editorTitle')).toHaveText('Floating Screen 1');
  await page.getByRole('button', { name: 'Ops', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ops', exact: true })).toHaveClass(/active/);
});
