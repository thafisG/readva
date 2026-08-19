# Contribuindo

Use Node 24 e npm 11. Antes de enviar alterações:

```bash
npm ci
npm run check
```

Mantenha componentes com uma responsabilidade clara, regras em funções/serviços do domínio e persistência atrás da `StoragePort`. Não use `any`, não armazene senhas e não introduza rede ou aleatoriedade real em testes.

Preserve a identidade visual e inclua testes de comportamento. Não versione `node_modules`, `dist`, caches, segredos ou configurações locais do editor.
