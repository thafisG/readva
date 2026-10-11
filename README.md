# Readva

O Readva é uma plataforma de leitura que transforma o hábito de ler em uma jornada visual e motivadora. O leitor acompanha seu progresso, mantém uma biblioteca pessoal, participa de desafios, personaliza o perfil e recebe incentivo da Moka, a mascote do projeto.

O repositório possui um frontend Angular e um backend Spring Boot. Cadastro, login, biblioteca, histórico de leitura, gamificação e perfil usam a API; o `localStorage` funciona como cache resiliente e mantém os domínios que continuam em migração.

## Principais funcionalidades

- cadastro e login por e-mail e senha, com sessão validada pelo backend;
- perfil com estatísticas, metas, conquistas e avatar personalizável;
- avatar no dashboard usado como atalho para o perfil;
- busca de livros e capas em catálogos externos;
- registro de páginas, minutos, conclusão e biblioteca pessoal;
- cronômetro de leitura minimizável com confirmação antes de descartar o progresso;
- feed pessoal e feed social simulado;
- missões diárias rotativas, XP, níveis e conquistas;
- ofensiva sincronizada com leituras já registradas;
- resumo mensal de metas concluídas e dias ativos;
- recomendações locais por categorias, com explicação do critério;
- interface responsiva para desktop e dispositivos móveis;
- animações com suporte à preferência de movimento reduzido.

### Moka

A Moka permanece discreta durante a navegação e aparece em destaque somente quando existe um motivo para interromper o leitor.

- após registrar uma leitura, comemora e pergunta quantos cafés acompanharam o momento;
- ao concluir uma meta ou missão, aparece sem modal para celebrar;
- respeita o contexto para não sobrepor confirmações ou outros diálogos;
- aguarda o fechamento do registro antes de exibir confetes e recompensas.

O feed social é demonstrativo. As recomendações não utilizam inteligência artificial: são uma classificação local e determinística baseada no histórico disponível.

## Tecnologias

### Frontend

- Angular 22 com componentes standalone;
- TypeScript 6 e Angular Signals;
- RxJS, Angular Material e CDK;
- SCSS responsivo;
- Vitest, Angular TestBed e Playwright;
- ESLint e Prettier.

### Backend

- Java 21 e Spring Boot 4;
- Spring Web MVC, Bean Validation e Spring Security;
- Spring Data JPA e Hibernate;
- Flyway para migrações versionadas;
- H2 em desenvolvimento e testes;
- perfil de produção preparado para PostgreSQL;
- Maven Wrapper incluído no repositório.

## Requisitos

- Node.js 24;
- npm 11;
- Java 21 ou mais recente.

As versões do frontend estão declaradas em `package.json` e `.nvmrc`. Não é necessário instalar Maven globalmente.

## Como executar

### 1. Backend

Em um terminal:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### 2. Frontend

Em outro terminal, no diretório raiz:

```powershell
npm ci
npm start
```

| Serviço    | Endereço                           |
| ---------- | ---------------------------------- |
| Angular    | `http://localhost:4200`            |
| API        | `http://localhost:8080`            |
| Console H2 | `http://localhost:8080/h2-console` |

No console H2, utilize o usuário `sa`, senha vazia e a URL JDBC exibida no log de inicialização. Executando o comando dentro de `backend`, o banco local fica em `backend/data` e não é versionado.

Mais detalhes: [guia do backend](backend/README.md).

## Banco e ambientes

| Perfil | Banco      | Finalidade                                    |
| ------ | ---------- | --------------------------------------------- |
| `dev`  | H2 arquivo | desenvolvimento local com dados persistentes  |
| `test` | H2 memória | testes isolados, descartados após a execução  |
| `e2e`  | H2 memória | jornadas completas executadas pelo Playwright |
| `prod` | PostgreSQL | ambiente real configurado por variáveis       |

O Flyway é a única fonte de alteração do esquema. A migração inicial cria leitores, atividades de leitura, metas diárias, dias de ofensiva e conclusões de missões; a segunda adiciona as credenciais dos leitores; a terceira cria a biblioteca pessoal; e a quarta prepara o histórico de leitura para sincronização idempotente; a quinta persiste metas, ofensiva, missões, XP, conquistas e o controle da migração local; e a sexta cria o perfil persistente, com bio, configuração segura do avatar e migração local idempotente. O Hibernate usa `ddl-auto: validate`, portanto valida as entidades sem modificar tabelas silenciosamente.

Configurações importantes:

- `backend/src/main/resources/application.yml`: propriedades compartilhadas;
- `backend/src/main/resources/application-dev.yml`: H2 local;
- `backend/src/main/resources/application-e2e.yml`: H2 isolado dos testes E2E;
- `backend/src/test/resources/application-test.yml`: H2 dos testes;
- `backend/src/main/resources/application-prod.yml`: PostgreSQL;
- `backend/src/main/resources/db/migration`: histórico de migrações Flyway.

## Autenticação e sessão

- o primeiro acesso é feito pela opção **Criar conta**, com nome, e-mail e senha de 8 a 72 caracteres;
- a senha é enviada à API e armazenada somente como hash; ela nunca é salva no `localStorage`;
- o servidor mantém a autenticação em um cookie de sessão `HttpOnly`, com duração de 12 horas;
- o Angular obtém e envia o token CSRF automaticamente nas operações protegidas;
- o `authGuard` consulta a sessão no backend antes de liberar as rotas pessoais;
- o logout encerra a sessão no servidor e limpa o estado local da interface.

Quem já utilizava a versão local deve criar uma conta usando o mesmo e-mail. Os dados ainda armazenados no navegador continuam associados a esse endereço.

Durante o desenvolvimento, o Angular encaminha `/api` para `http://127.0.0.1:8080` por meio de `proxy.conf.json`. Por isso, backend e frontend precisam estar ativos.

## API atual

| Método | Endpoint                                                  | Responsabilidade          |
| ------ | --------------------------------------------------------- | ------------------------- |
| GET    | `/api/auth/csrf`                                          | preparar a proteção CSRF  |
| POST   | `/api/auth/register`                                      | criar conta e sessão      |
| POST   | `/api/auth/login`                                         | autenticar e criar sessão |
| GET    | `/api/auth/session`                                       | consultar a sessão atual  |
| POST   | `/api/auth/logout`                                        | encerrar a sessão         |
| GET    | `/api/readers/{readerId}`                                 | consultar um leitor       |
| POST   | `/api/readers/{readerId}/activities`                      | registrar uma leitura     |
| GET    | `/api/readers/{readerId}/activities`                      | listar leituras do leitor |
| PUT    | `/api/readers/{readerId}/activities/{id}`                 | criar ou editar leitura   |
| POST   | `/api/readers/{readerId}/activities/import`               | importar histórico local  |
| DELETE | `/api/readers/{readerId}/activities/{id}`                 | excluir uma leitura       |
| GET    | `/api/readers/{readerId}/books`                           | listar a biblioteca       |
| PUT    | `/api/readers/{readerId}/books/{id}`                      | criar ou atualizar livro  |
| POST   | `/api/readers/{readerId}/books/import`                    | importar cache local      |
| DELETE | `/api/readers/{readerId}/books/{id}`                      | excluir um livro          |
| GET    | `/api/readers/{readerId}/gamification`                    | consultar gamificação     |
| PUT    | `/api/readers/{readerId}/gamification/goals`              | atualizar metas           |
| POST   | `/api/readers/{readerId}/gamification/import`             | importar estado local     |
| PUT    | `/api/readers/{readerId}/gamification/streak-days/{date}` | marcar dia                |
| DELETE | `/api/readers/{readerId}/gamification/streak-days/{date}` | desmarcar dia             |
| POST   | `/api/readers/{readerId}/gamification/missions/seen`      | confirmar missões vistas  |
| GET    | `/api/readers/{readerId}/profile`                         | consultar perfil          |
| PUT    | `/api/readers/{readerId}/profile`                         | atualizar nome/bio/avatar |
| POST   | `/api/readers/{readerId}/profile/import`                  | importar perfil local     |

O Angular consome autenticação, biblioteca, histórico de leitura, gamificação e perfil pela API. Ao entrar, os serviços exibem seus caches imediatamente e conciliam o servidor. A primeira sincronização importa os estados legados de gamificação e perfil uma única vez, com marcadores persistidos no banco. O avatar é salvo como escolhas validadas e o SVG é gerado com segurança no navegador. Cada leitura recalcula metas, missões e ofensiva na mesma transação; `occurredOn` preserva o dia correto mesmo entre dispositivos em fusos diferentes.

## Rotas do frontend

| Rota          | Tela                                 |
| ------------- | ------------------------------------ |
| `/`           | Dashboard e jornada de leitura       |
| `/biblioteca` | Biblioteca pessoal                   |
| `/desafios`   | Missões, XP e conquistas             |
| `/perfil`     | Perfil, estatísticas, metas e avatar |
| `/login`      | Login e criação da conta             |

As rotas pessoais são protegidas pelo `authGuard`, que valida a sessão no servidor.

## Qualidade e testes

Frontend:

```powershell
npm run lint
npm run test:run
npm run e2e
npm run build
```

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

A suíte E2E inicia o backend com um H2 temporário, inicia o Angular e cobre autenticação e as jornadas completas de leitura, meta e desafio. Os testes do backend validam cadastro, hash da senha, sessão, CSRF, autorização, persistência no H2 e migrações Flyway.

## Arquitetura

O Readva adota uma **arquitetura em camadas organizada por domínio, com inspiração hexagonal**. Essa definição é mais precisa do que chamar o projeto apenas de MVC: o Spring Web MVC fornece os controllers da API REST, mas a aplicação não possui views no backend, pois a interface é responsabilidade do Angular.

A separação por `domain`, `application`, `infrastructure` e `web` mantém regras de negócio, casos de uso, persistência e HTTP em responsabilidades distintas. O fluxo principal segue esta direção:

```text
Angular → controller REST → caso de uso → domínio → repository → banco
```

A arquitetura hexagonal não é aplicada de forma estrita: algumas entidades ainda usam anotações JPA e os casos de uso dependem diretamente dos repositories do Spring. Essa escolha é intencional nesta fase do produto. Ela preserva limites de domínio e testabilidade sem introduzir portas e adaptadores extras antes de existir complexidade que justifique esse custo. Conforme integrações ou persistências alternativas surgirem, esses limites permitem extrair interfaces de porta de forma incremental, sem reestruturar todo o sistema.

### Frontend

- `src/app/core/models`: contratos separados por domínio;
- `src/app/core/domain`: regras puras de gamificação e recomendação;
- `src/app/core/storage`: porta de persistência e implementação local versionada;
- `src/app/core/api`: configuração das integrações externas;
- `src/app/features`: componentes e serviços por funcionalidade;
- `public/assets/moka`: variações visuais da mascote.

### Backend

Cada domínio do backend separa suas responsabilidades:

- `domain`: entidades e regras centrais;
- `application`: casos de uso e transações;
- `infrastructure`: repositories e persistência;
- `web`: controllers e contratos HTTP;
- `shared`: erros e respostas comuns sem regras de negócio específicas.

Os fluxos atuais são:

```text
Autenticação: Angular → API REST → Spring Security → JPA/Hibernate → banco
Biblioteca: Angular → cache local + API REST → domínio library → JPA/Hibernate → banco
Atividades: Angular → cache local + API REST → domínio reading → JPA/Hibernate → banco
Gamificação: leitura/livro → transação de domínio → JDBC + banco → cache local sincronizado
Perfil: sessão autenticada → API de perfil → JPA/Hibernate → banco → Signal da sessão
```

Detalhes adicionais: [arquitetura](docs/architecture.md), [persistência local](docs/storage-schema.md), [acessibilidade](docs/accessibility.md) e [backend](backend/README.md).

## Limitações atuais

- autenticação, biblioteca, atividades, gamificação, perfil e avatar já estão integrados;
- feed social, cafés e algumas preferências visuais continuam locais;
- ainda existe cache local por compatibilidade offline e migração incremental;
- ainda não existem recuperação de senha nem verificação de e-mail;
- Open Library, Google Books e capas remotas podem ficar indisponíveis;
- o feed social ainda usa dados locais determinísticos.

## Solução de problemas

- inicie o backend antes do frontend para que o login consiga validar a sessão;
- se o login informar que o servidor está indisponível, confirme `http://localhost:8080` e reinicie o `ng serve` após mudanças no proxy;
- o console H2 utiliza usuário `sa`, senha vazia e a URL JDBC exibida pelo backend;
- Kubernetes e arquivo `kubeconfig` não são necessários para executar o Readva localmente.

## Próximos passos

1. conectar o feed social a dados persistentes;
2. adicionar recuperação de senha e verificação de e-mail;
3. testar concorrência real com PostgreSQL;
4. ativar PostgreSQL no ambiente de produção.

As ilustrações e animações existentes em `public/` fazem parte da identidade visual do projeto.
