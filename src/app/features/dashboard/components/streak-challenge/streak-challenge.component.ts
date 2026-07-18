import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { UserProgress } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-streak-challenge',
  standalone: true,
  templateUrl: './streak-challenge.component.html',
  styleUrls: ['./streak-challenge.component.scss'],
})
export class StreakChallengeComponent implements OnInit, OnDestroy, AfterViewChecked {
  progress = input.required<UserProgress>();
  shareRequested = output<void>();

  private cdr = inject(ChangeDetectorRef);

  private readonly STORAGE_KEY = '@readva:streak_data';
  private readonly DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  todayMarked = signal(false);
  streakCount = signal(0);
  animating = signal(false);
  showConfetti = signal(false);
  weekDays = signal<{ label: string; read: boolean; isToday: boolean }[]>([]);

  goalReached = computed(
    () => this.progress().dailyMinutesRead >= this.progress().dailyGoalMinutes,
  );

  percentage = computed(() => {
    const current = this.progress();
    if (!current?.dailyGoalMinutes) return 0;
    return Math.min((current.dailyMinutesRead / current.dailyGoalMinutes) * 100, 100);
  });

  private confettiTimeout: any = null;
  private animTimeout: any = null;
  private confettiRunning = false;
  private readonly CONFETTI_DURATION = 3500;

  get todayIndex(): number {
    return new Date().getDay();
  }

  get todayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadFromStorage();
    this.buildWeekDays();
  }

  ngOnDestroy() {
    clearTimeout(this.confettiTimeout);
    clearTimeout(this.animTimeout);
  }

  ngAfterViewChecked() {
    if (this.showConfetti() && !this.confettiRunning) {
      this.confettiRunning = true;
      this.runConfetti();
    }
  }

  private loadFromStorage() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { markedDays: [] };
    const markedDays: string[] = data.markedDays ?? [];

    this.todayMarked.set(markedDays.includes(this.todayKey));
    this.streakCount.set(this.calculateStreak(markedDays));
  }

  private saveToStorage(marked: boolean) {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { markedDays: [] };

    if (marked) {
      if (!data.markedDays.includes(this.todayKey)) data.markedDays.push(this.todayKey);
    } else {
      data.markedDays = data.markedDays.filter((d: string) => d !== this.todayKey);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private dateKey(d: Date): string {
    return d.toISOString().split('T')[0];
  }
  private calculateStreak(markedDays: string[]): number {
    const marked = new Set(markedDays);
    const cursor = new Date();

    if (!marked.has(this.dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (marked.has(this.dateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  private buildWeekDays() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { markedDays: [] };
    const markedDays: string[] = data.markedDays ?? [];
    const today = new Date();

    this.weekDays.set(
      this.DAY_LABELS.map((label, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (this.todayIndex - i));
        const key = d.toISOString().split('T')[0];
        return { label, read: markedDays.includes(key), isToday: i === this.todayIndex };
      }),
    );
  }

  toggleToday() {
    const nowMarked = !this.todayMarked();
    this.todayMarked.set(nowMarked);

    this.animating.set(true);
    clearTimeout(this.animTimeout);
    this.animTimeout = setTimeout(() => this.animating.set(false), 400);

    this.saveToStorage(nowMarked);

    const raw = localStorage.getItem(this.STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { markedDays: [] };
    this.streakCount.set(this.calculateStreak(data.markedDays ?? []));

    if (nowMarked) {
      this.showConfetti.set(true);
      this.confettiRunning = false;
      clearTimeout(this.confettiTimeout);
      this.confettiTimeout = setTimeout(() => {
        this.showConfetti.set(false);
        this.confettiRunning = false;
        this.cdr.markForCheck();
      }, this.CONFETTI_DURATION);
    } else {
      this.showConfetti.set(false);
      this.confettiRunning = false;
    }

    this.buildWeekDays();
  }

  markTodayRead() {
    if (!this.todayMarked()) this.toggleToday();
  }

  openShareCard() {
    this.shareRequested.emit();
  }

  private runConfetti() {
    const canvas = document.getElementById('streakConfettiCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#16a34a', '#facc15', '#d4537e', '#378add', '#1d9e75', '#d85a30'];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    const start = performance.now();
    let rafId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = performance.now() - start;

      const fadeStart = this.CONFETTI_DURATION * 0.65;
      const globalOpacity =
        elapsed > fadeStart
          ? Math.max(0, 1 - (elapsed - fadeStart) / (this.CONFETTI_DURATION - fadeStart))
          : 1;

      let anyAlive = false;
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        const opacity = p.opacity * globalOpacity;
        if (opacity > 0.01) {
          anyAlive = true;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (anyAlive && elapsed < this.CONFETTI_DURATION + 200) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafId = requestAnimationFrame(draw);
    setTimeout(() => cancelAnimationFrame(rafId), this.CONFETTI_DURATION + 300);
  }
}
