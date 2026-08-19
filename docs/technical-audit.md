# Auditoria técnica do Readva

## Linha de base (18/08/2026)

- Branch de origem: `modernizacao-tecnica`; árvore de trabalho limpa; nenhum `AGENTS.md` encontrado.
- `npm run build`: aprovado fora do sandbox (o sandbox bloqueou a leitura do caminho do projeto). Avisos: cinco folhas de estilo acima de 4 kB e `html2canvas` CommonJS.
- `npm test -- --watch=false`: 1 teste aprovado e 1 reprovado. O teste legado procura `Hello, readva`, mas a raiz contém somente o `router-outlet`.
- Não existem ESLint, scripts de verificação, E2E ou pipeline versionada.
- TypeScript já habilita várias verificações estritas, mas não declara `strict: true` e o Angular não declara `strictTemplates`.

## Diagnóstico

| Área           | Evidência / risco                                                                                                                | Decisão incremental                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tipagem        | 27 usos explícitos de `any` em produção; modelos duplicados nos componentes e serviços                                           | Centralizar contratos em `core/models` e remover casts que escondam dados incompletos              |
| Persistência   | Mais de 50 acessos diretos a `localStorage`; vários `JSON.parse` sem proteção                                                    | Introduzir adapter injetável, schema versionado, fallback e chaves centralizadas                   |
| Isolamento     | streak, XP, missões, conquistas, café e progresso diário usam chaves globais; dados `guest` podem ser carregados antes da sessão | Todo dado pessoal terá namespace normalizado do usuário e recarga reativa na troca da sessão       |
| Autenticação   | mock aceita e-mail sem formato válido, lê JSON sem proteção e não possui guard                                                   | Manter demonstração local sem senha, normalizar entrada e proteger rotas sem alegar segurança real |
| Livros         | IDs aleatórios, `NaN` pode chegar ao progresso, conclusão concede recompensa novamente, status implícito                         | UUID com fallback, normalização numérica, status union e operações idempotentes                    |
| Gamificação    | estado carregado uma vez para todos os usuários; datas usam `toDateString`; timer interno não é limpo                            | Cálculos puros, chave de data local estável, eventos idempotentes e timers descartáveis            |
| Feed           | ordenação retorna sempre `0`; seeds usam `Math.random`; timestamps são textos relativos                                          | Persistir `createdAt` ISO, ordenar por data, seeds determinísticos e formatar texto apenas na UI   |
| APIs           | componente usa `fetch`; catálogo mistura `HttpClient` e `fetch`; não valida `response.ok`; cache sem expiração/limite            | Unificar gradualmente em serviço Angular na etapa 8                                                |
| Recomendações  | usa propriedades inconsistentes (`progress`, `completed`, `likes`) e pode dividir por zero                                       | Funções puras e modelo tipado na etapa 9                                                           |
| Componentes    | dashboard: 493 TS + 477 HTML + 1.195 SCSS; concentra feed, recomendações, progresso e modais                                     | Extrair por responsabilidade na etapa 10, preservando DOM e aparência                              |
| Acessibilidade | idioma do documento incorreto, controles sem nome/label, modais artesanais e feedbacks sem `aria-live`                           | Auditoria prática e correções WCAG 2.2 AA na etapa 11                                              |
| Recursos       | timers dispersos; subscriptions manuais no catálogo; animação usa RAF sem cancelamento no destroy                                | `DestroyRef`, operadores RxJS e limpeza explícita                                                  |
| Segurança      | sessão local é adulterável; SVG em `data:` e conteúdo remoto; dados externos sem validação estrutural                            | Documentar limites, não armazenar senha e validar contratos nas bordas                             |
| Código morto   | `OnDestroy` vazio na busca e propriedades/formatos legados                                                                       | Remover somente após cobertura e confirmação de ausência de uso                                    |
| Pipeline       | nenhuma CI; formatação não é verificada                                                                                          | Configurar na etapa 13 após estabilizar as fundações                                               |

## Decisões

- Não haverá backend nem API fictícia nesta modernização.
- A interface, Moka, animações, feed, biblioteca, busca, recomendações e gamificação serão preservados.
- Dados de catálogo e cache de capas podem ser globais; sessão, livros, atividades, follows e gamificação são pessoais.
- Migrações serão compatíveis com as chaves legadas e nunca removerão os dados antigos automaticamente.

## Acompanhamento

- [x] Auditoria e linha de base registradas
- [x] Modelos e tipagem
- [x] Persistência isolada por usuário
- [x] Sessão local e guards
- [x] Integridade de livros
- [x] Gamificação
- [x] Feed social

### Verificação do checkpoint

- Build de produção aprovado; permanecem os avisos de orçamento de estilos e CommonJS já presentes na linha de base.
- 8 testes aprovados em 3 arquivos; nenhum processo pendente.
- Código de produção sem `any` explícito.
- Acesso ao `localStorage` restrito ao adapter `StoragePort`.
- Lint ainda indisponível no projeto e programado para a etapa 13.

## Segundo checkpoint

- Busca externa extraída para serviço `HttpClient`, com debounce, cancelamento, timeout e estados distintos de erro/vazio/carregamento.
- Recomendações extraídas para regras puras, determinísticas e explicáveis.
- Recomendações e painel social extraídos como componentes `OnPush` focados.
- Melhorias de foco, labels, alternativas de imagem, diálogos e movimento reduzido aplicadas.
- ESLint, Prettier, scripts de qualidade e GitHub Actions configurados.
- Angular alinhado em 22.0.2 para corrigir vulnerabilidades confirmadas; `npm audit --omit=dev` retorna zero vulnerabilidades.
- `npm ci` e `npm run check` aprovados; 15 testes em 6 arquivos.
- Pendências: ampliar cobertura de BookService/componentes, criar E2E, concluir a divisão do dashboard, medir contraste e reduzir estilos/bundle indicados pelos budgets.
- A validação visual no navegador passou após a componentização. A tentativa final posterior ao patch de dependências não foi autorizada; build e testes do patch passaram.
