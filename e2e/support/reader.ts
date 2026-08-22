import { expect, type Locator, type Page } from '@playwright/test';

export async function createReader(
  page: Page,
  email = 'leitora.e2e@example.com',
  name = 'Leitora E2E',
): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Seu e-mail').fill(email);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByPlaceholder('Seu nome completo').fill(name);
  await page.getByRole('button', { name: 'Criar conta e entrar' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Boa leitura hoje!')).toBeVisible();
}

export async function startReading(
  page: Page,
  title: string,
  author = 'Autora E2E',
): Promise<Locator> {
  await page.getByLabel('Título do Livro').fill(title);
  await page.getByRole('textbox', { name: /^Autor/ }).fill(author);
  await page.getByLabel('Total de Páginas').fill('180');
  await page.getByLabel('Categoria').selectOption({ label: 'Ficção' });
  await page.getByRole('button', { name: 'Começar leitura' }).click();

  const bookCard = page.getByRole('button', {
    name: 'Gerenciar ' + title + ', de ' + author,
  });
  await expect(bookCard).toBeVisible();
  return bookCard;
}

export async function dismissMokaSpotlight(page: Page): Promise<void> {
  const continueButton = page.getByRole('button', { name: 'Continuar minha jornada' });

  try {
    await continueButton.waitFor({ state: 'visible', timeout: 3_000 });
    await continueButton.click();
  } catch {
    // A celebração pode já ter sido dispensada pelo próprio fluxo.
  }
}

export async function openReadingManager(
  page: Page,
  bookCard: Locator,
  title: string,
): Promise<Locator> {
  await bookCard.click();
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  return dialog;
}
