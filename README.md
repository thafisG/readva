# Readva

O Readva é uma aplicação Angular para organizar leituras e transformar o hábito de ler em uma jornada visual e motivadora. O leitor acompanha seu progresso, mantém uma biblioteca pessoal, participa de desafios, personaliza o perfil e recebe incentivo da Moka, a mascote do projeto.

> O login atual é somente uma demonstração local, sem senha e sem segurança de autenticação real. A sessão pode ser alterada pelo próprio navegador. Nunca armazene senhas ou segredos no `localStorage`.

## Principais funcionalidades

- cadastro e sessão local por nome e e-mail;
- perfil do leitor com estatísticas, metas, conquistas e avatar personalizável;
- avatar exibido no dashboard e usado como atalho para o perfil;
- busca de livros e capas em catálogos externos;
- leituras atuais, registro de páginas e minutos, conclusão e biblioteca pessoal;
- cronômetro de leitura minimizável com relógio flip;
- feed pessoal e feed social simulado;
- pessoas demonstrativas para seguir;
- missões diárias, XP, níveis, conquistas e streak;
- recomendações locais por pontuação de categorias, com explicação do critério;
- interface responsiva para desktop e dispositivos móveis;
- animações com suporte à preferência de movimento reduzido.

### Moka

A Moka permanece disponível de forma discreta durante a navegação e muda sua expressão de acordo com o contexto, como café, biblioteca vazia, retorno do leitor e progresso do perfil.

A apresentação grande é reservada para recompensas reais:

- meta diária alcançada;
- missão concluída;
- sequência conquistada;
- livro concluído;
- todas as missões do dia concluídas.

Cada recompensa gera um evento próprio, permitindo que a Moka comemore novamente quando uma nova meta ou missão for conquistada, sem interromper a navegação comum.

O feed e seus perfis demonstrativos não representam uma rede social conectada. As recomendações não usam inteligência artificial: são uma classificação local e determinística baseada no histórico disponível.

## Tecnologias

- Angular 22 com componentes standalone;
- TypeScript 6;
- Angular Signals para estado local e derivado;
- RxJS nas integrações assíncronas;
- Angular Material e CDK;
- SCSS responsivo;
- Vitest e Angular TestBed;
- ESLint e Prettier.

## Requisitos

- Node.js 24
- npm 11

As versões aceitas estão declaradas em `package.json` e `.nvmrc`.

## Como executar

```bash
npm ci
npm start
```

A aplicação fica disponível em `http://localhost:4200`.

## Rotas

| Rota          | Tela                                 |
| ------------- | ------------------------------------ |
| `/`           | Dashboard e jornada de leitura       |
| `/biblioteca` | Biblioteca pessoal                   |
| `/desafios`   | Missões, XP e conquistas             |
| `/perfil`     | Perfil, estatísticas, metas e avatar |
| `/login`      | Entrada e criação local do leitor    |

As rotas pessoais são protegidas pelo `authGuard` demonstrativo.

## Qualidade e testes

```bash
npm run test:run
npm run lint
npm run format
npm run format:check
npm run build
npm run check
```

`npm run check` executa formatação, lint, testes e build de produção. As APIs externas são simuladas nos testes; a suíte não depende da rede ou de aleatoriedade real.

## Arquitetura

O projeto usa componentes standalone, carregamento lazy das rotas e separação por domínio:

- `src/app/core/models`: contratos separados por domínio;
- `src/app/core/domain`: regras puras de gamificação e recomendação;
- `src/app/core/storage`: porta de persistência, chaves e implementação local versionada;
- `src/app/core/api`: configuração das integrações externas;
- `src/app/features`: componentes e serviços organizados por funcionalidade;
- `public/assets/moka`: variações visuais da mascote.

Detalhes: [arquitetura](docs/architecture.md), [persistência](docs/storage-schema.md) e [acessibilidade](docs/accessibility.md).

## Limitações atuais

- não há backend, sincronização entre dispositivos ou autenticação segura;
- o armazenamento está limitado ao navegador e pode ser apagado pelo usuário;
- Open Library, Google Books e capas remotas podem ficar indisponíveis;
- o feed social é local e usa seeds determinísticos;
- ainda não existe uma suíte E2E dedicada;
- permanecem avisos de orçamento em estilos grandes e um aviso CommonJS de `html2canvas`.

## Próximos passos

1. adicionar testes E2E para os fluxos completos de leitura, meta e desafio;
2. concluir a divisão incremental do dashboard em componentes menores;
3. substituir a persistência local por uma API quando houver backend;
4. implementar autenticação real, autorização e sincronização entre dispositivos;
5. conectar o feed social a dados reais;
6. otimizar estilos, imagens e o carregamento de `html2canvas`.

As ilustrações e animações existentes em `public/` fazem parte da identidade visual do projeto.
