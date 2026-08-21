# Readva

Aplicação Angular para registrar leituras, acompanhar progresso, manter uma biblioteca pessoal e interagir com um feed social demonstrativo. A experiência inclui recomendações locais baseadas em regras, missões, XP, streak e o assistente visual Moka.

> O login atual é somente uma demonstração local, sem senha e sem segurança de autenticação real. A sessão pode ser alterada pelo próprio navegador. Nunca armazene senhas ou segredos no `localStorage`.

## Funcionalidades

- cadastro local por nome e e-mail;
- busca de livros na Open Library;
- leituras atuais, progresso, conclusão e biblioteca;
- feed pessoal e feed social simulado;
- pessoas demonstrativas para seguir;
- missões diárias, XP, níveis, conquistas e streak;
- recomendações locais por pontuação de categorias, com explicação do critério;
- Moka e animações com suporte a movimento reduzido.

O feed e seus perfis demonstrativos não representam uma rede social conectada. As recomendações não usam inteligência artificial: são uma classificação local e determinística baseada no histórico disponível.

## Requisitos

- Node.js 24
- npm 11

As versões aceitas estão declaradas em `package.json` e `.nvmrc`.

## Execução

```bash
npm ci
npm start
```

A aplicação fica disponível em `http://localhost:4200`.

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

- `src/app/core/models`: contratos separados por domínio;
- `src/app/core/domain`: regras puras de gamificação e recomendação;
- `src/app/core/storage`: porta de persistência, chaves e implementação local versionada;
- `src/app/core/api`: configuração das integrações externas;
- `src/app/features`: componentes e serviços por funcionalidade.

Detalhes: [arquitetura](docs/architecture.md), [persistência](docs/storage-schema.md) e [acessibilidade](docs/accessibility.md).

## Limitações atuais

- não há backend, sincronização entre dispositivos ou autenticação segura;
- o armazenamento está limitado ao navegador e pode ser apagado pelo usuário;
- Open Library, Google Books e capas remotas podem ficar indisponíveis;
- o feed social é local e usa seeds determinísticos;
- ainda não existe uma suíte E2E dedicada;
- permanecem avisos de orçamento em estilos grandes e um aviso CommonJS de `html2canvas`.

## Roadmap

1. concluir a divisão incremental do dashboard e dos modais;
2. ampliar cobertura de componentes e fluxo E2E;
3. substituir adapters locais por contratos HTTP quando houver backend;
4. autenticação real, autorização e sincronização do feed;
5. otimizar estilos, imagens e o carregamento de `html2canvas`.

As ilustrações e GIFs existentes ficam em `public/` e fazem parte da identidade visual.
