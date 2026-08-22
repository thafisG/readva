import { CommonModule } from '@angular/common';
import { getMokaSpotlight } from './moka-spotlight-content';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

export type MokaMood =
  | 'welcome'
  | 'coffee'
  | 'streak'
  | 'goal'
  | 'empty-library'
  | 'completed-book'
  | 'sleepy'
  | 'love'
  | 'mission'
  | 'perfect-day';

export interface MokaCelebration {
  id: number;
  mood: MokaMood;
}

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
    emoji: '',
    badge: 'Oi!',
    title: 'Oii!',
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
  mission: {
    image: 'assets/moka/moka-mission.png',
    emoji: '🎯',
    badge: 'Missão!',
    title: 'Missão completa!',
    message: 'Você concluiu mais uma missão hoje. Moka tá orgulhoso!',
    theme: 'amber',
  },
  'perfect-day': {
    image: 'assets/moka/moka-perfeito.png',
    emoji: '✨',
    badge: 'Perfeito!',
    title: 'Dia perfeito!',
    message: 'Todas as missões do dia concluídas! Moka não consegue parar de dançar.',
    theme: 'mint',
  },
};

const COFFEE_REACTIONS: Record<number, { title: string; emoji: string }> = {
  0: { title: 'Quantos cafés hoje?', emoji: '☕' },
  1: { title: 'Um cafezinho, combinado!', emoji: '☕' },
  2: { title: 'Dois! Boa energia!', emoji: '☕☕' },
  3: { title: 'Três? Você tá voando!', emoji: '🚀' },
  4: { title: 'Quatro... tá bom, tá bom.', emoji: '😅' },
  5: { title: 'Moka tá preocupado.', emoji: '😰' },
};

function getCoffeeReaction(count: number) {
  return COFFEE_REACTIONS[Math.min(count, 5)] ?? COFFEE_REACTIONS[5];
}

const CELEBRATION_MOODS = new Set<MokaMood>([
  'streak',
  'goal',
  'completed-book',
  'mission',
  'perfect-day',
]);

function isCelebrationMood(mood: MokaMood): boolean {
  return CELEBRATION_MOODS.has(mood);
}

@Component({
  selector: 'app-moka',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moka.component.html',
  styleUrls: ['./moka.component.scss'],
})
export class MokaComponent {
  readonly mood = input<MokaMood | null>(null);
  readonly celebration = input<MokaCelebration | null>(null);
  readonly coffeeChanged = output<number>();
  readonly coffeeConfirmed = output<number>();

  readonly config = computed(() => MOKA_CONFIG[this.mood() ?? 'welcome']);
  readonly isCoffeeMood = computed(() => this.mood() === 'coffee');
  readonly coffeeReaction = computed(() => getCoffeeReaction(this.coffeeCount()));

  readonly visible = signal(true);
  readonly showBubble = signal(false);
  readonly isWiggling = signal(false);
  readonly isCelebrating = signal(false);
  readonly spotlightVisible = signal(false);
  readonly spotlightConfig = signal<MokaConfig>(MOKA_CONFIG.goal);
  readonly coffeeCount = signal(0);

  private readonly spotlightOccurrences = new Map<MokaMood, number>();
  private previousMood: MokaMood | null = null;
  private previousCelebrationId: number | null = null;
  private wiggleTimer: ReturnType<typeof setTimeout> | null = null;
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  private celebrationTimer: ReturnType<typeof setTimeout> | null = null;
  private spotlightTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly BUBBLE_DURATION = 4200;
  private readonly SPOTLIGHT_DURATION = 6200;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.clearAllTimers());

    effect(() => {
      const mood = this.mood();
      untracked(() => {
        if (mood === this.previousMood) return;
        this.previousMood = mood;
        this.showBubble.set(false);
        this.coffeeCount.set(0);
      });
    });

    effect(() => {
      const celebration = this.celebration();
      untracked(() => {
        if (!celebration || !isCelebrationMood(celebration.mood)) return;
        if (celebration.id === this.previousCelebrationId) return;
        this.previousCelebrationId = celebration.id;
        this.showBubble.set(false);
        this.showSpotlight(celebration.mood);
      });
    });
  }

  showSpotlight(mood: MokaMood): void {
    if (!isCelebrationMood(mood)) return;
    const occurrence = this.spotlightOccurrences.get(mood) ?? 0;
    this.spotlightOccurrences.set(mood, occurrence + 1);
    this.spotlightConfig.set(getMokaSpotlight(mood, occurrence, MOKA_CONFIG[mood]));
    this.spotlightVisible.set(true);
    this.triggerCelebration();
    if (this.spotlightTimer) clearTimeout(this.spotlightTimer);
    this.spotlightTimer = setTimeout(() => this.dismissSpotlight(), this.SPOTLIGHT_DURATION);
  }

  dismissSpotlight(): void {
    if (this.spotlightTimer) clearTimeout(this.spotlightTimer);
    this.spotlightVisible.set(false);
  }

  toggleBubble(): void {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    const next = !this.showBubble();
    this.showBubble.set(next);
    if (next) {
      this.triggerWiggle();
      this.bubbleTimer = setTimeout(() => this.showBubble.set(false), this.BUBBLE_DURATION);
    }
  }

  dismiss(): void {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.showBubble.set(false);
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
    this.coffeeCount.update((count) => count + 1);
    this.coffeeChanged.emit(this.coffeeCount());
    this.triggerWiggle();
  }

  decrementCoffee(): void {
    this.coffeeCount.update((count) => Math.max(0, count - 1));
    this.coffeeChanged.emit(this.coffeeCount());
  }

  confirmCoffee(): void {
    this.coffeeConfirmed.emit(this.coffeeCount());
    this.coffeeCount.set(0);
    this.showBubble.set(false);
  }

  private triggerCelebration(): void {
    if (this.celebrationTimer) clearTimeout(this.celebrationTimer);
    this.isCelebrating.set(false);
    setTimeout(() => {
      this.isCelebrating.set(true);
      this.celebrationTimer = setTimeout(() => this.isCelebrating.set(false), 1000);
    }, 10);
  }

  private clearAllTimers(): void {
    if (this.wiggleTimer) clearTimeout(this.wiggleTimer);
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    if (this.celebrationTimer) clearTimeout(this.celebrationTimer);
    if (this.spotlightTimer) clearTimeout(this.spotlightTimer);
  }
}
