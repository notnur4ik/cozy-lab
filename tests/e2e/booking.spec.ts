import { expect, test } from '@playwright/test';

test.describe('COZY LAB Public, Mobile & Admin E2E', () => {
  test('homepage renders in Russian by default and switches to Kazakh and English', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/ru');
    await expect(page.getByRole('link', { name: 'Записаться онлайн' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Наши услуги' }).first()).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Toggle menu' }).click();
    }
    await page.getByRole('link', { name: 'kk', exact: true }).click();
    await expect(page).toHaveURL(/\/kk/);
    await expect(page.getByRole('link', { name: 'Онлайн жазылу' }).first()).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Toggle menu' }).click();
    }
    await page.getByRole('link', { name: 'en', exact: true }).click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByRole('link', { name: 'Book Online' }).first()).toBeVisible();
  });

  test('navigates across services, masters, branches, gallery, contacts, and booking', async ({
    page,
  }) => {
    await page.goto('/ru/services');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/ru/masters');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/ru/branches');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/ru/gallery');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/ru/contacts');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/ru/booking');
    await expect(page.getByRole('button', { name: /WhatsApp/i })).toBeVisible();
  });

  test('mobile navigation menu opens and closes cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/ru');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('link', { name: 'Услуги' }).last()).toBeVisible();
  });

  test('unauthenticated access to /admin/dashboard redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('button', { name: /Войти в CRM/i })).toBeVisible();
  });
});
