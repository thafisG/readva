# Arquitetura

O Readva usa Angular standalone, Signals para estado local/derivado e RxJS nas fronteiras assíncronas.

## Limites

- **Core/models:** dados de domínio sem dependência visual.
- **Core/domain:** funções puras; não acessam Angular, browser ou rede.
- **Core/storage:** única fronteira com `localStorage`, exposta pela `StoragePort`.
- **Features/services:** casos de uso, coordenação por domínio e adapters das APIs.
- **Features/components:** apresentação e interação; não conhecem chaves de armazenamento.

O dashboard permanece um coordenador enquanto é dividido incrementalmente. Recomendações e painel social já são componentes focados e `OnPush`; regras de recomendação e gamificação já saíram da camada visual.

## Fluxos

1. `AuthService` restaura a sessão HTTP e publica o leitor autenticado por Signal.
2. serviços pessoais observam a sessão e recarregam seu namespace local.
3. `BookService` coordena a jornada; `ReadingActivityService` mantém histórico e fila offline. Atividades sincronizam antes da biblioteca, preservando corretamente ajustes offline de páginas.
4. versões locais e remotas são conciliadas por `updatedAt`; importações e exclusões são idempotentes.
5. o backend reconcilia metas, missões, XP, conquistas e ofensiva na mesma transação da atividade; o frontend atualiza o cache com o agregado retornado.
6. `StorageService` lê envelopes versionados e migra chaves legadas sem apagar a origem.
7. componentes emitem intenções; serviços aplicam validação e persistem.

## Backend atual

O Spring Boot é organizado por domínio e camadas `domain`, `application`, `infrastructure` e `web`. Autenticação, biblioteca e histórico de leitura já são persistentes. O Flyway cria leitores, credenciais, atividades, estruturas de gamificação e a biblioteca pessoal; o Hibernate apenas valida esse esquema.

O navegador mantém biblioteca, atividades e gamificação como cache resiliente, enquanto a API é a fonte persistente. A migração local da gamificação é idempotente e registrada no banco. O próximo limite de migração é perfil/avatar, seguido pelo feed social.
