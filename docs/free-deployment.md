# Deploy gratuito da Readva

Esta configuração mantém o frontend na Vercel, executa a API Spring em um Web Service Free do Render e usa PostgreSQL Free no Supabase. Nenhum banco H2 é usado em produção: o disco do serviço Render gratuito é temporário.

## 1. Criar o PostgreSQL no Supabase

1. Use o projeto Supabase do Readva: [abrir projeto](https://supabase.com/dashboard/project/zartvhiknyzunkoylbpl). Ele fica na organização já existente, mas separado do projeto do Root. Essa separação mantém os dados e as migrações Flyway do Readva isolados.
2. No projeto, abra **Connect → Session pooler** e copie o host, a porta e o usuário exibidos. Use o pooler de sessão, não o endereço direto IPv6 nem o pooler de transação.
3. Monte a URL JDBC para o Render neste formato: `jdbc:postgresql://<host-do-pooler>:<porta>/postgres?sslmode=require`.
4. Se você não souber a senha, redefina-a em **Database → Settings** no painel do Supabase. A senha antiga não pode ser recuperada; [veja o guia oficial de redefinição](https://supabase.com/kb/troubleshooting/how-do-i-reset-my-supabase-database-password-oTs5sB). Essa redefinição vale para o projeto Readva, não para o projeto Root.
5. Configure no Render `DATABASE_URL` com essa URL, `DATABASE_USERNAME` com o usuário do session pooler e `DATABASE_PASSWORD` com a senha nova. Não use as credenciais do projeto Root nem salve a senha no repositório.

O Spring executa as migrações Flyway ao iniciar. Não rode as migrações manualmente antes da primeira inicialização.

## 2. Criar a API no Render

1. Faça push deste repositório ao GitHub, incluindo `Dockerfile`, `.dockerignore` e `render.yaml`.
2. No Render, selecione **New → Blueprint**, conecte `thafisG/readva` e escolha a branch desejada. O arquivo `render.yaml` declara apenas um serviço web no plano Free; ele não cria banco no Render nem configura pagamentos.
3. Quando solicitado, informe `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` e `READVA_WEB_ORIGIN`.
4. Para `READVA_WEB_ORIGIN`, informe a origem exata do site Vercel, por exemplo `https://readva.vercel.app`, sem barra final. Use o domínio real mostrado no painel Vercel.
5. Aguarde o deploy e copie o domínio HTTPS `*.onrender.com` gerado para a API.

## 3. Conectar a Vercel ao backend

1. No projeto `readva` da Vercel, abra **Settings → Environment Variables**.
2. Crie `READVA_API_URL` com a origem HTTPS do Render, sem `/api` e sem barra final.
3. Habilite pelo menos o ambiente **Production** e faça um novo deploy para aplicar a variável.
4. O rewrite do `vercel.json` encaminha as rotas `/api/*` para a função `api/proxy.ts` e mantém o navegador no mesmo domínio da Vercel, preservando cookies de sessão e CSRF.

## 4. Habilitar recuperação de senha por e-mail

A recuperação fica desabilitada até configurar um servidor SMTP. No Render, adicione as variáveis abaixo usando as credenciais do provedor de e-mail. Não coloque esses valores no repositório.

| Variável | Valor |
| --- | --- |
| `PASSWORD_RESET_ENABLED` | `true` |
| `MAIL_HOST` | Host SMTP do provedor |
| `MAIL_PORT` | Porta SMTP, geralmente `587` |
| `MAIL_USERNAME` | Usuário SMTP |
| `MAIL_PASSWORD` | Senha ou chave SMTP |
| `MAIL_FROM` | Endereço remetente verificado pelo provedor |

`READVA_WEB_ORIGIN` também precisa apontar para `https://readva.vercel.app`. Os links de redefinição expiram em 20 minutos e só podem ser usados uma vez. Se o SMTP não estiver configurado, o formulário informa que a recuperação está indisponível.

## Limites do plano sem custo

- O Web Service Free do Render dorme depois de 15 minutos sem tráfego; a primeira chamada após o repouso pode levar cerca de um minuto. O filesystem do container é temporário, portanto só o PostgreSQL do Supabase deve guardar dados.
- O Supabase Free inclui 500 MB por banco e pode pausar projetos após uma semana de atividade insuficiente. Ele não inclui backups automáticos.
- Esses limites significam que login persistente depende de ambos os serviços estarem ativos. Após uma pausa do Supabase, reative o projeto no painel antes de usar a API.

Se uma cota gratuita mudar, confirme os termos atuais nos painéis dos provedores antes de criar os recursos.
