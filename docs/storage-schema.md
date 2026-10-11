# Persistência local

O `StorageService` grava envelopes `{ version, value }`. Dados pessoais usam:

```text
@readva:v1:<domínio>:<email-normalizado>
```

Livros, atividades, exclusões pendentes desses dois domínios, follows, desafios, streak, progresso diário, café e preferências são pessoais. Sessão e cadastro local são globais porque localizam a identidade ativa. O cache de capas também é global, pois a capa não pertence a um usuário.

Biblioteca, atividades, gamificação e perfil usam o armazenamento local como cache e fila de recuperação, mas sua fonte persistente é a API. O campo `updatedAt` concilia versões locais e remotas; exclusões que falham por indisponibilidade da rede ficam registradas para reenvio e não reaparecem na próxima sincronização.

Leituras toleram JSON inválido e retornam fallback. A migração consulta chaves antigas quando a versionada não existe, copia o valor válido e preserva a origem. Para gamificação e perfil, o backend registra `local_migration_completed`, impedindo reimportação por outro dispositivo. O perfil guarda apenas as escolhas validadas do avatar; o SVG derivado permanece uma representação do frontend.

`StoragePort` permite testes em memória e futura substituição por outro adapter. Componentes não acessam armazenamento diretamente.
