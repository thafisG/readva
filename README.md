# Readva

O Readva é uma plataforma de leitura que transforma o hábito de ler em uma jornada visual e motivadora. O leitor acompanha seu progresso, mantém uma biblioteca pessoal, participa de desafios, personaliza o perfil e recebe incentivo da Moka, a mascote do projeto.

O repositório possui um frontend Angular e um backend Spring Boot. O cadastro e o login já usam a API e uma sessão HTTP; os demais domínios estão sendo migrados gradualmente e parte dos dados de leitura ainda permanece no `localStorage`.

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

| Perfil | Banco      | Finalidade                                   |
| ------ | ---------- | -------------------------------------------- |
| `dev`  | H2 arquivo | desenvolvimento local com dados persistentes |
| `test` | H2 memória | testes isolados, descartados após a execução |
| `prod` | PostgreSQL | ambiente real configurado por variáveis      |

O Flyway é a única fonte de alteração do esquema. A migração inicial cria leitores, atividades de leitura, metas diárias, dias de ofensiva e conclusões de missões. O Hibernate usa `ddl-auto: validate`, portanto valida as entidades sem modificar tabelas silenciosamente.

Configurações importantes:

- `backend/src/main/resources/application.yml`: propriedades compartilhadas;
- `backend/src/main/resources/application-dev.yml`: H2 local;
- `backend/src/test/resources/application-test.yml`: H2 dos testes;
- `backend/src/main/resources/application-prod.yml`: PostgreSQL;
- `backend/src/main/resources/db/migration`: histórico de migrações Flyway.

## API inicial

| Método | Endpoint                             | Responsabilidade          |
| ------ | ------------------------------------ | ------------------------- |
| GET    | `/api/auth/csrf`                     | preparar a proteção CSRF  |
| POST   | `/api/auth/register`                 | criar conta e sessão      |
| POST   | `/api/auth/login`                    | autenticar e criar sessão |
| GET    | `/api/auth/session`                  | consultar a sessão atual  |
| POST   | `/api/auth/logout`                   | encerrar a sessão         |
| GET    | `/api/readers/{readerId}`            | consultar um leitor       |
| POST   | `/api/readers/{readerId}/activities` | registrar uma leitura     |
| GET    | `/api/readers/{readerId}/activities` | listar leituras do leitor |

O Angular já consome os endpoints de autenticação. A troca da persistência dos demais domínios pela API será incremental para permitir a importação segura dos dados existentes no navegador.

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

A suíte E2E cobre autenticação e as jornadas completas de leitura, meta e desafio. Os testes do backend validam cadastro, hash da senha, sessão, CSRF, autorização, persistência no H2 e migrações Flyway.

## Arquitetura

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

O fluxo básico é:

```text
Angular → API REST → aplicação → repository → JPA/Hibernate → banco
```

Detalhes adicionais: [arquitetura](docs/architecture.md), [persistência local](docs/storage-schema.md), [acessibilidade](docs/accessibility.md) e [backend](backend/README.md).

## Limitações atuais

- apenas a autenticação já está integrada ao Angular;
- ainda não existe sincronização dos dados de leitura entre dispositivos;
- parte dos dados continua limitada ao navegador;
- Open Library, Google Books e capas remotas podem ficar indisponíveis;
- o feed social ainda usa dados locais determinísticos;
- permanecem avisos de orçamento em estilos grandes e um aviso CommonJS de `html2canvas`.

## Próximos passos

1. migrar perfil e avatar do `localStorage` para a API;
2. importar atividades existentes sem perder o histórico do leitor;
3. persistir biblioteca, ofensiva, metas e missões no backend;
4. conectar o feed social a dados persistentes;
5. adicionar recuperação de senha e verificação de e-mail;
6. ativar PostgreSQL no ambiente de produção.

As ilustrações e animações existentes em `public/` fazem parte da identidade visual do projeto.
