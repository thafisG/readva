import {
  Component,
  input,
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

  private cdr = inject(ChangeDetectorRef);

  private readonly STORAGE_KEY = '@readva:streak_data';
  private readonly DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  todayMarked = signal(false);
  streakCount = signal(0);
  animating = signal(false);
  showConfetti = signal(false);
  weekDays = signal<{ label: string; read: boolean; isToday: boolean }[]>([]);

  // computed garante reatividade automática quando o input muda
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
    const data = raw ? JSON.parse(raw) : { streak: this.progress().currentStreak, markedDays: [] };
    this.streakCount.set(data.streak ?? this.progress().currentStreak);
    this.todayMarked.set(data.markedDays?.includes(this.todayKey) ?? false);
  }

  private saveToStorage(marked: boolean) {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { streak: this.streakCount(), markedDays: [] };

    if (marked) {
      if (!data.markedDays.includes(this.todayKey)) data.markedDays.push(this.todayKey);
    } else {
      data.markedDays = data.markedDays.filter((d: string) => d !== this.todayKey);
    }

    data.streak = this.streakCount();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
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

    if (nowMarked) {
      this.streakCount.update((v) => v + 1);
      this.showConfetti.set(true);
      this.confettiRunning = false;
      clearTimeout(this.confettiTimeout);
      this.confettiTimeout = setTimeout(() => {
        this.showConfetti.set(false);
        this.confettiRunning = false;
        this.cdr.markForCheck();
      }, 3500);
    } else {
      this.streakCount.update((v) => Math.max(0, v - 1));
      this.showConfetti.set(false);
      this.confettiRunning = false;
    }

    this.saveToStorage(nowMarked);
    this.buildWeekDays();
  }

  markTodayRead() {
    if (!this.todayMarked()) this.toggleToday();
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

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > canvas.height * 0.55) p.opacity -= 0.025;
        if (p.opacity > 0) {
          anyAlive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });
      if (anyAlive) rafId = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    rafId = requestAnimationFrame(draw);
    setTimeout(() => cancelAnimationFrame(rafId), 3500);
  }
}
