import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

export type MokaMood =
  | 'welcome'
  | 'coffee'
  | 'streak'
  | 'goal'
  | 'empty-library'
  | 'completed-book'
  | 'sleepy'
  | 'love';

export interface MokaConfig {
  image: string;
  title: string;
  message: string;
  theme: 'cream' | 'peach' | 'rose' | 'mint' | 'amber';
}

export const MOKA_CONFIG: Record<MokaMood, MokaConfig> = {
  welcome: {
    image: 'assets/moka/moka-welcome.png',
    title: 'Bem-vindo ao Readva!',
    message: 'Moka acabou de preparar um café fresquinho para a próxima leitura.',
    theme: 'cream',
  },

  coffee: {
    image: 'assets/moka/moka-coffee.png',
    title: 'Café sobre Rodas',
    message: 'Quantos cafezinhos acompanharam essa sessão de leitura?',
    theme: 'amber',
  },

  streak: {
    image: 'assets/moka/moka-streak.png',
    title: 'Sequência incrível!',
    message: 'Moka preparou um café especial para comemorar.',
    theme: 'peach',
  },

  goal: {
    image: 'assets/moka/moka-motiva.png',
    title: 'Meta alcançada!',
    message: 'Moka está comemorando com um cappuccino!',
    theme: 'mint',
  },

  'empty-library': {
    image: 'assets/moka/moka-library.png',
    title: 'Sua estante está vazia',
    message: 'Moka está esperando sua próxima leitura.',
    theme: 'cream',
  },

  'completed-book': {
    image: 'assets/moka/moka-oculos.png',
    title: 'Livro concluído!',
    message: 'Mais um livro foi para a estante.',
    theme: 'mint',
  },

  sleepy: {
    image: 'assets/moka/moka-sono.png',
    title: 'Sentimos sua falta',
    message: 'Já faz um tempinho desde a última leitura...',
    theme: 'rose',
  },

  love: {
    image: 'assets/moka/moka-love.png',
    title: 'Leituras feitas com carinho',
    message: 'Moka encontrou alguns livros que combinam com você!',
    theme: 'peach',
  },
};

@Component({
  selector: 'app-moka',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moka.component.html',
  styleUrls: ['./moka.component.scss'],
})
export class MokaComponent {
  mood = input<MokaMood>('welcome');

  config = computed(() => MOKA_CONFIG[this.mood()]);

  showBubble = signal(false);

  toggleBubble() {
    this.showBubble.update((value) => !value);
  }
}
