import type { MokaConfig, MokaMood } from './moka.component';

type SpotlightVariant = Pick<
  MokaConfig,
  'image' | 'emoji' | 'badge' | 'title' | 'message' | 'theme'
>;

const SPOTLIGHT_VARIANTS: Record<MokaMood, readonly SpotlightVariant[]> = {
  welcome: [
    {
      image: 'assets/moka/moka-welcome.png',
      emoji: '👋',
      badge: 'Vamos ler!',
      title: 'Que bom ter você aqui!',
      message:
        'A Moka já separou um cantinho aconchegante. Hoje pode ser dia de uma história incrível.',
      theme: 'cream',
    },
    {
      image: 'assets/moka/moka-legal.png',
      emoji: '📖',
      badge: 'Novo capítulo',
      title: 'Sua próxima página está esperando',
      message: 'Não precisa ler muito. Começar com alguns minutos já mantém a jornada viva.',
      theme: 'amber',
    },
  ],
  streak: [
    {
      image: 'assets/moka/moka-streak.png',
      emoji: '🔥',
      badge: 'Sequência!',
      title: 'Olha esse fogo todo!',
      message: 'Você está transformando leitura em hábito. A Moka está muito orgulhosa!',
      theme: 'peach',
    },
    {
      image: 'assets/moka/moka-perfeito.png',
      emoji: '⚡',
      badge: 'Imparável',
      title: 'Sua constância está brilhando',
      message: 'Mais um dia, mais uma vitória. Continue protegendo essa sequência!',
      theme: 'amber',
    },
  ],
  goal: [
    {
      image: 'assets/moka/moka-motiva.png',
      emoji: '🎉',
      badge: 'Meta alcançada',
      title: 'Você conseguiu!',
      message: 'A meta de hoje está completa. Pode comemorar: cada minuto contou para chegar aqui.',
      theme: 'mint',
    },
    {
      image: 'assets/moka/moka-perfeito.png',
      emoji: '🏆',
      badge: 'Vitória!',
      title: 'A Moka sabia que você chegaria lá',
      message: 'Meta cumprida com carinho e dedicação. Amanhã tem mais uma aventura!',
      theme: 'mint',
    },
  ],
  'empty-library': [
    {
      image: 'assets/moka/moka-library.png',
      emoji: '📚',
      badge: 'Primeiro livro',
      title: 'Vamos dar vida a essa estante?',
      message:
        'Todo grande leitor começa escolhendo uma história. A Moka pode acompanhar a primeira página.',
      theme: 'cream',
    },
    {
      image: 'assets/moka/moka-oculos.png',
      emoji: '🔎',
      badge: 'Explorar',
      title: 'Uma história perfeita está por aí',
      message:
        'Escolha algo que desperte curiosidade. Não existe leitura pequena quando ela faz você voltar.',
      theme: 'amber',
    },
  ],
  'completed-book': [
    {
      image: 'assets/moka/moka-oculos.png',
      emoji: '🎓',
      badge: 'Livro concluído',
      title: 'Você chegou à última página!',
      message: 'Mais uma história agora faz parte de você. A Moka já está pronta para a próxima.',
      theme: 'mint',
    },
    {
      image: 'assets/moka/moka-legal.png',
      emoji: '🎊',
      badge: 'Conquista',
      title: 'Final de livro merece festa!',
      message:
        'Olhe o quanto você avançou desde a primeira página. Isso é uma conquista de verdade.',
      theme: 'peach',
    },
  ],
  sleepy: [
    {
      image: 'assets/moka/moka-sono.png',
      emoji: '💤',
      badge: 'Sentimos sua falta',
      title: 'A Moka guardou seu lugar',
      message:
        'Tudo bem ter feito uma pausa. Volte com apenas cinco minutos e recomece sem pressão.',
      theme: 'rose',
    },
  ],
  love: [
    {
      image: 'assets/moka/moka-love.png',
      emoji: '💛',
      badge: 'Seu perfil',
      title: 'Sua jornada está ficando com a sua cara',
      message:
        'Cada livro, meta e conquista conta um pedacinho da história do leitor que você está se tornando.',
      theme: 'peach',
    },
    {
      image: 'assets/moka/moka-welcome.png',
      emoji: '🌟',
      badge: 'Continue assim',
      title: 'A Moka adora acompanhar sua evolução',
      message:
        'Seus números contam progresso, mas o melhor está nas histórias que ficaram com você.',
      theme: 'cream',
    },
  ],
  mission: [
    {
      image: 'assets/moka/moka-mission.png',
      emoji: '🎯',
      badge: 'Missão completa',
      title: 'Acertou em cheio!',
      message:
        'Uma missão a menos e experiência a mais. A Moka já está de olho no próximo desafio.',
      theme: 'amber',
    },
  ],
  'perfect-day': [
    {
      image: 'assets/moka/moka-perfeito.png',
      emoji: '✨',
      badge: 'Dia perfeito',
      title: 'Hoje você deu um show!',
      message: 'Todas as missões completas. A Moka não consegue parar de comemorar!',
      theme: 'mint',
    },
  ],
};

export function getMokaSpotlight(
  mood: MokaMood,
  occurrence: number,
  fallback: MokaConfig,
): MokaConfig {
  const variants = SPOTLIGHT_VARIANTS[mood];
  if (!variants.length) return fallback;
  const index = Math.max(0, Math.trunc(occurrence)) % variants.length;
  return variants[index];
}
