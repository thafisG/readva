import { expect, type Locator, type Page } from '@playwright/test';

export interface ReaderCredentials {
  email: string;
  password: string;
}

export async function createReader(
  page: Page,
  email = 'leitora.e2e@example.com',
  name = 'Leitora E2E',
): Promise<ReaderCredentials> {
  const separator = email.lastIndexOf('@');
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const uniqueEmail = `${email.slice(0, separator)}+${suffix}${email.slice(separator)}`;
  const password = 'Leitura@123';

  await page.goto('/login');
  await page.getByRole('tab', { name: 'Criar conta' }).click();
  await page.getByLabel('Como você quer ser chamado?').fill(name);
  await page.getByLabel('E-mail').fill(uniqueEmail);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirme a senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta e entrar' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Boa leitura hoje!')).toBeVisible();
  return { email: uniqueEmail, password };
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
