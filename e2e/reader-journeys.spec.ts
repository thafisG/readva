import { expect, test } from '@playwright/test';
import {
  createReader,
  dismissMokaSpotlight,
  openReadingManager,
  startReading,
} from './support/reader';

test.describe('Jornadas principais do leitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://**/*', (route) => route.abort());
  });

  test('cria uma leitura, cronometra e publica o progresso no feed', async ({ page }) => {
    await createReader(page);
    const title = 'A Jornada E2E';
    const bookCard = await startReading(page, title);
    await dismissMokaSpotlight(page);
    const dialog = await openReadingManager(page, bookCard, title);

    await page.clock.install();
    await dialog.getByRole('button', { name: 'Iniciar' }).click();
    await page.clock.fastForward(65_000);
    await expect(dialog.getByRole('timer')).toHaveText('01:05');

    await dialog.getByLabel('Páginas lidas agora').fill('12');
    await dialog.getByLabel('Comentário').fill('Leitura excelente');
    await dialog.getByRole('button', { name: 'Publicar atividade' }).click();

    const activity = page.locator('.premium-activity-card').filter({ hasText: title }).first();
    await expect(activity).toContainText('Leu mais 12 páginas');
    await expect(activity).toContainText('1 min de leitura');
    await expect(activity).toContainText('Leitura excelente');
  });

  test('edita e alcança a meta diária com uma sessão cronometrada', async ({ page }) => {
    await createReader(page, 'meta.e2e@example.com', 'Meta E2E');
    await page.getByRole('button', { name: 'Perfil e Estatísticas' }).click();
    await expect(page).toHaveURL('/perfil');

    await page.getByRole('button', { name: 'Editar metas' }).click();
    await page.getByLabel('Minutos por dia').fill('5');
    await page.getByLabel('Livros por mês').fill('3');
    await page.getByRole('button', { name: 'Salvar metas' }).click();

    await expect(page.getByRole('status')).toHaveText('Metas atualizadas com sucesso.');
    await expect(page.getByText('5 minutos por dia')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar para o início' }).click();

    const title = 'Cinco Minutos';
    const bookCard = await startReading(page, title);
    await dismissMokaSpotlight(page);
    const dialog = await openReadingManager(page, bookCard, title);

    await page.clock.install();
    await dialog.getByRole('button', { name: 'Iniciar' }).click();
    await page.clock.fastForward(300_500);
    await expect(dialog.getByRole('timer')).toHaveText('05:00');

    await dialog.getByLabel('Páginas lidas agora').fill('1');
    await dialog.getByRole('button', { name: 'Publicar atividade' }).click();

    await expect(page.locator('.goal-val')).toContainText('5 / 5 min');
    await expect(page.locator('.moka-spotlight')).toContainText('Meta alcançada');
  });

  test('conclui o desafio de iniciar um livro e persiste XP e conquista', async ({ page }) => {
    await createReader(page, 'desafio.e2e@example.com', 'Desafio E2E');
    await page.getByRole('button', { name: 'Desafios e Metas' }).click();
    await expect(page).toHaveURL('/desafios');

    const initialMission = page.locator('.mission-card').filter({ hasText: 'Novo começo' });
    await expect(initialMission.locator('.mission-progress-text')).toHaveText('0 / 1');
    await page.getByRole('button', { name: 'Voltar' }).click();

    await startReading(page, 'Livro do Desafio');
    await dismissMokaSpotlight(page);
    await page.getByRole('button', { name: 'Desafios e Metas' }).click();

    const completedMission = page.locator('.mission-card').filter({ hasText: 'Novo começo' });
    await expect(completedMission).toHaveClass(/completed/);
    await expect(completedMission.locator('.mission-progress-text')).toHaveText('1 / 1');
    await expect(page.getByText(/40\s*\/\s*100 XP/)).toBeVisible();

    const achievement = page.locator('.achievement-badge').filter({ hasText: 'Primeira missão' });
    await expect(achievement).toHaveClass(/unlocked/);
  });
});
