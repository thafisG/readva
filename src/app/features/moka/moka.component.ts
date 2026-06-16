import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';

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
  emoji: string;
  badge: string;
  title: string;
  message: string;
  theme: 'cream' | 'peach' | 'rose' | 'mint' | 'amber';
}

export const MOKA_CONFIG: Record<MokaMood, MokaConfig> = {
  welcome: {
    image: 'assets/moka/moka-welcome.png',
    emoji: '👋',
    badge: 'Oi!',
    title: 'Bem-vindo ao Readva!',
    message: 'Moka acabou de preparar um café fresquinho para a próxima leitura.',
    theme: 'cream',
  },
  coffee: {
    image: 'assets/moka/moka-coffee.png',
    emoji: '☕',
    badge: '☕',
    title: 'Quantos cafés hoje?',
    message: '',
    theme: 'amber',
  },
  streak: {
    image: 'assets/moka/moka-streak.png',
    emoji: '🔥',
    badge: '🔥 Streak!',
    title: 'Sequência incrível!',
    message: 'Moka preparou um café especial para comemorar sua dedicação!',
    theme: 'peach',
  },
  goal: {
    image: 'assets/moka/moka-motiva.png',
    emoji: '🎉',
    badge: '+50 XP',
    title: 'Meta alcançada!',
    message: 'Moka está comemorando com um cappuccino!',
    theme: 'mint',
  },
  'empty-library': {
    image: 'assets/moka/moka-library.png',
    emoji: '📚',
    badge: 'Vamos!',
    title: 'Sua estante está vazia',
    message: 'Moka está esperando sua próxima leitura. Que tal começar um livro?',
    theme: 'cream',
  },
  'completed-book': {
    image: 'assets/moka/moka-oculos.png',
    emoji: '😎',
    badge: 'Top!',
    title: 'Livro concluído!',
    message: 'Mais um livro foi para a estante. Moka aprova!',
    theme: 'mint',
  },
  sleepy: {
    image: 'assets/moka/moka-sono.png',
    emoji: '💤',
    badge: 'Volte!',
    title: 'Sentimos sua falta',
    message: 'Já faz um tempinho desde a última leitura. O café esfriou...',
    theme: 'rose',
  },
  love: {
    image: 'assets/moka/moka-love.png',
    emoji: '💛',
    badge: '♡',
    title: 'Leituras feitas com carinho',
    message: 'Moka encontrou alguns livros que combinam com você!',
    theme: 'peach',
  },
};

const COFFEE_REACTIONS: Record<number, { title: string; emoji: string }> = {
  0: { title: 'Quantos cafés hoje?', emoji: '☕' },
  1: { title: 'Um cafezinho, combinado!', emoji: '☕' },
  2: { title: 'Dois! Boa energia!', emoji: '☕☕' },
  3: { title: 'Três? Você tá voando!', emoji: '🚀' },
  4: { title: 'Quatro... tá bom, tá bom.', emoji: '😅' },
  5: { title: 'Cinco! Moka tá preocupado.', emoji: '😰' },
};

function getCoffeeReaction(count: number) {
  return COFFEE_REACTIONS[Math.min(count, 5)] ?? COFFEE_REACTIONS[5];
}

@Component({
  selector: 'app-moka',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moka.component.html',
  styleUrls: ['./moka.component.scss'],
})
export class MokaComponent {
  mood = input<MokaMood>('welcome');

  coffeeChanged = output<number>();
  coffeeConfirmed = output<number>();

  config = computed(() => MOKA_CONFIG[this.mood()]);
  isCoffeeMood = computed(() => this.mood() === 'coffee');

  showBubble = signal(false);
  isWiggling = signal(false);
  coffeeCount = signal(0);

  coffeeReaction = computed(() => getCoffeeReaction(this.coffeeCount()));

  private wiggleTimer: any = null;
  private autoCloseTimer: any = null;

  private previousMood: MokaMood | null = null;

  constructor() {
    effect(() => {
      const mood = this.mood();
      untracked(() => {
        const moodChanged = mood !== this.previousMood;
        this.previousMood = mood;

        if (!moodChanged) return;

        this.triggerWiggle();
        if (mood !== 'coffee') this.coffeeCount.set(0);

        if (mood !== 'coffee') {
          this.showBubble.set(true);
          if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
          this.autoCloseTimer = setTimeout(() => this.showBubble.set(false), 2000);
        }
      });
    });
  }

  toggleBubble(): void {
    if (this.isCoffeeMood()) {
      if (!this.showBubble()) {
        this.showBubble.set(true);
        this.triggerWiggle();
      }
      return;
    }

    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
    const next = !this.showBubble();
    this.showBubble.set(next);
    if (next) this.triggerWiggle();
  }

  triggerWiggle(): void {
    if (this.wiggleTimer) clearTimeout(this.wiggleTimer);
    this.isWiggling.set(false);
    setTimeout(() => {
      this.isWiggling.set(true);
      this.wiggleTimer = setTimeout(() => this.isWiggling.set(false), 600);
    }, 10);
  }

  incrementCoffee(): void {
    this.coffeeCount.update((n) => n + 1);
    this.coffeeChanged.emit(this.coffeeCount());
    this.triggerWiggle();
  }

  decrementCoffee(): void {
    this.coffeeCount.update((n) => Math.max(0, n - 1));
    this.coffeeChanged.emit(this.coffeeCount());
  }

  confirmCoffee(): void {
    this.coffeeConfirmed.emit(this.coffeeCount());
    this.coffeeCount.set(0);
    this.showBubble.set(false);
  }
}
