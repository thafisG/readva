# Readva API

Backend do Readva em Spring Boot. Este módulo começa a retirar do navegador a responsabilidade de ser a fonte definitiva dos dados da aplicação.

## Responsabilidades atuais

- cadastrar, autenticar e consultar leitores;
- proteger a API com sessão HTTP, CSRF e autorização por leitor;
- persistir, importar, editar e excluir atividades de leitura;
- persistir, importar, atualizar e excluir livros da biblioteca pessoal;
- persistir metas, ofensiva, missões diárias, XP e conquistas;
- versionar o banco com Flyway;
- expor uma API REST para o Angular em `http://localhost:4200`.

O Angular usa a API para autenticação, biblioteca, histórico de leitura e gamificação. Perfil, avatar e feed continuam em migração incremental, domínio por domínio.

## Requisitos

- Java 21 ou mais recente.

Não é necessário instalar Maven: o Maven Wrapper está incluído no repositório.

## Executar no Windows

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

## Executar no macOS ou Linux

```bash
cd backend
./mvnw spring-boot:run
```

A API fica disponível em `http://localhost:8080`. No perfil local, o console do H2 fica em `http://localhost:8080/h2-console` e usa a URL JDBC mostrada no log de inicialização.

O banco local é persistido em `backend/data` quando o comando é executado dentro desta pasta. Essa pasta não deve ser versionada.

## Testes

```powershell
.\mvnw.cmd test
```

Os testes usam um H2 em memória separado. A suíte cobre autenticação, CRUD da biblioteca e das atividades, importações idempotentes, cálculo transacional da gamificação, fuso horário, múltiplos dispositivos e isolamento dos dados entre leitores.

## Perfis

- `dev`: H2 em arquivo e console habilitado;
- `test`: H2 isolado em memória para testes do backend;
- `e2e`: H2 isolado em memória para testes completos do navegador;
- `prod`: PostgreSQL configurado pelas variáveis `DATABASE_URL`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`.

O H2 é uma dependência de desenvolvimento e testes. O perfil de produção já está preparado para PostgreSQL.

## Endpoints atuais

| Método | Endpoint                                                  | Responsabilidade          |
| ------ | --------------------------------------------------------- | ------------------------- |
| GET    | `/api/auth/csrf`                                          | emitir cookie CSRF        |
| POST   | `/api/auth/register`                                      | criar conta e sessão      |
| POST   | `/api/auth/login`                                         | autenticar                |
| GET    | `/api/auth/session`                                       | consultar sessão          |
| POST   | `/api/auth/logout`                                        | encerrar sessão           |
| GET    | `/api/readers/{readerId}`                                 | consultar leitor          |
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

Os identificadores públicos de livros e atividades são gerados no cliente e preservados no servidor. Assim, a primeira sincronização importa dados do navegador de maneira idempotente, sem criar duplicatas. Criar, editar ou excluir uma atividade também ajusta o progresso do livro e reconcilia ofensiva e missões na mesma transação; a importação histórica não soma páginas nem XP novamente. O fuso do leitor define eventos noturnos e datas de livros, enquanto `occurredOn` mantém a data original da sessão.

Exemplo de cadastro:

```json
{
  "displayName": "Thais",
  "email": "thais@example.com",
  "password": "uma-senha-com-8-ou-mais-caracteres"
}
```

Exemplo de atividade:

```json
{
  "bookReference": "open-library:OL123W",
  "bookTitle": "O Conto da Aia",
  "pagesRead": 24,
  "minutesRead": 35,
  "note": "Leitura da noite",
  "occurredOn": "2026-08-24"
}
```

## Organização

Cada domínio contém suas próprias camadas:

- `domain`: entidades e regras do domínio;
- `application`: casos de uso e transações;
- `infrastructure`: repositórios de persistência;
- `web`: contratos e controllers HTTP.

Configurações compartilhadas ficam em `config`, e respostas de erro comuns ficam em `shared`.
