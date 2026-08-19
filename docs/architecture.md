# Arquitetura

O Readva usa Angular standalone, Signals para estado local/derivado e RxJS nas fronteiras assíncronas.

## Limites

- **Core/models:** dados de domínio sem dependência visual.
- **Core/domain:** funções puras; não acessam Angular, browser ou rede.
- **Core/storage:** única fronteira com `localStorage`, exposta pela `StoragePort`.
- **Features/services:** casos de uso locais e coordenação por domínio.
- **Features/components:** apresentação e interação; não conhecem chaves de armazenamento.

O dashboard permanece um coordenador enquanto é dividido incrementalmente. Recomendações e painel social já são componentes focados e `OnPush`; regras de recomendação e gamificação já saíram da camada visual.

## Fluxos

1. `AuthService` normaliza a identidade local e publica a sessão por Signal.
2. serviços pessoais observam a sessão e recarregam seu namespace.
3. `StorageService` lê envelopes versionados e migra chaves legadas sem apagar a origem.
4. componentes emitem intenções; serviços aplicam validação e persistem.

## Backend futuro

A persistência local deve ser substituída por adapters, mantendo componentes e modelos independentes do transporte. Entidades prováveis: users, sessions, books, reading-progress, reading-activities, likes, follows, missions, achievements, XP, streak events e preferences.

Endpoints prováveis incluem sessão, CRUD de livros do usuário, progresso, feed, likes/follows e gamificação. São apenas limites documentados; nenhuma API fictícia foi criada.
