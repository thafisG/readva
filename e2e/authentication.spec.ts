import { expect, test } from '@playwright/test';
import { createReader } from './support/reader';

test('creates an account, signs out, signs in and restores the server session', async ({
  page,
}) => {
  await page.route('https://**/*', (route) => route.abort());
  const credentials = await createReader(page, 'auth.e2e@example.com', 'Autenticação E2E');

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL('/login');

  await page.getByLabel('E-mail').fill(credentials.email);
  await page.getByLabel('Senha').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/');

  await page.reload();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Boa leitura hoje!')).toBeVisible();
});
