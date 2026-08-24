# Readva API

Backend do Readva em Spring Boot. Este módulo começa a retirar do navegador a responsabilidade de ser a fonte definitiva dos dados da aplicação.

## Responsabilidades atuais

- cadastrar, autenticar e consultar leitores;
- proteger a API com sessão HTTP, CSRF e autorização por leitor;
- registrar e listar atividades de leitura;
- criar o esquema inicial de metas, ofensiva e missões;
- versionar o banco com Flyway;
- expor uma API REST para o Angular em `http://localhost:4200`.

O Angular já usa a API para autenticação. Os demais dados continuam em migração incremental, domínio por domínio.

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

Os testes usam um H2 em memória separado. O teste de integração cria um leitor, registra uma leitura e consulta o dado persistido.

## Perfis

- `dev`: H2 em arquivo e console habilitado;
- `test`: H2 isolado em memória para testes do backend;
- `e2e`: H2 isolado em memória para testes completos do navegador;
- `prod`: PostgreSQL configurado pelas variáveis `DATABASE_URL`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`.

O H2 é uma dependência de desenvolvimento e testes. O perfil de produção já está preparado para PostgreSQL.

## Endpoints iniciais

| Método | Endpoint                             | Responsabilidade          |
| ------ | ------------------------------------ | ------------------------- |
| GET    | `/api/auth/csrf`                     | emitir cookie CSRF        |
| POST   | `/api/auth/register`                 | criar conta e sessão      |
| POST   | `/api/auth/login`                    | autenticar                |
| GET    | `/api/auth/session`                  | consultar sessão          |
| POST   | `/api/auth/logout`                   | encerrar sessão           |
| GET    | `/api/readers/{readerId}`            | consultar leitor          |
| POST   | `/api/readers/{readerId}/activities` | registrar uma leitura     |
| GET    | `/api/readers/{readerId}/activities` | listar leituras do leitor |

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
