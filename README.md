# FPN — Fábrica do Pai Natal

Aplicação privada para um grupo fechado de dez pessoas consultar listas de
prendas e acrescentar sugestões às respetivas listas. A interface e as mensagens
estão em português de Portugal.

## Requisitos

- Node.js 20.9 ou superior e npm.
- Projeto Supabase com PostgreSQL e Storage.
- Conta SMTP para mensagens de redefinição de palavra-passe.
- Para testes E2E, Chromium instalado pelo Playwright.

## Configuração local

```powershell
npm ci
Copy-Item .env.example .env.local
```

Preencher `.env.local` com:

| Variável | Utilização |
| --- | --- |
| `BETTER_AUTH_URL` | URL base da aplicação, por exemplo `http://localhost:3000` localmente |
| `BETTER_AUTH_SECRET` | Segredo aleatório forte do Better Auth |
| `DATABASE_URL` | URL PostgreSQL do Supabase; na Vercel, usar o Transaction Pooler |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privilegiada, usada apenas no servidor |
| `SUPABASE_STORAGE_BUCKET` | Nome do bucket privado; o valor predefinido é `gifts` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Configuração SMTP para recuperação de palavra-passe |

Gera um segredo Better Auth localmente com:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Não usar prefixos `NEXT_PUBLIC_` nas credenciais do Supabase. Nunca guardar
credenciais ou palavras-passe reais em ficheiros versionados, exemplos, logs ou
testes.

No Supabase, criar o bucket `gifts` como **privado**. Os uploads e os URLs
assinados são criados exclusivamente no servidor; o browser nunca recebe a
chave service role. O bucket e a chave devem existir antes de testar operações
de prendas.

Para SMTP, usar porta 465 com TLS implícito ou porta 587 com STARTTLS. A
aplicação não simula o envio: se SMTP não estiver configurado ou falhar, o
pedido de redefinição apresenta um erro seguro. O fluxo deve ser testado com
uma mensagem real antes do deployment.

## Base de dados e contas

Aplicar as migrações existentes:

```powershell
npm run db:migrate
```

Depois de alterar o schema, criar uma migração e aplicá-la:

```powershell
npm run db:generate
npm run db:migrate
```

O bootstrap não é uma rota da aplicação. Lê `SEED_USERS_JSON` do ambiente,
exige exatamente dez contas distintas e chama a API interna do Better Auth
apenas no processo de seed. O registo continua desativado na aplicação normal.
Cada conta tem `username`, nome de exposição, email e palavra-passe inicial
(mínimo de oito caracteres). Exemplo da estrutura — substituir os valores e
fornecer uma lista com dez objetos:

```json
[
  {
    "username": "utilizador_01",
    "name": "Nome de exposição",
    "email": "utilizador@example.com",
    "password": "palavra-passe-temporaria"
  }
]
```

Guardar temporariamente a lista num ficheiro local ignorado pelo Git, carregar
o conteúdo para o ambiente do processo e removê-lo após a operação. Não passar
palavras-passe como argumentos de linha de comandos nem adicionar o ficheiro ao
repositório.

Exemplo PowerShell, a partir da raiz do projeto:

```powershell
$env:SEED_USERS_JSON = Get-Content -Raw .\seed-users.json
npm run db:seed
Remove-Item Env:\SEED_USERS_JSON
```

O comando é idempotente para as mesmas identidades; não altera palavras-passe
de contas existentes. Se o processo detetar conflitos ou se a base de dados não
contiver exatamente dez contas, termina com erro para permitir a correção
controlada.

## Desenvolvimento e validação

```powershell
npm run dev
npm run lint
npm run typecheck
npm run test:e2e
npm run build
```

Instalar o browser de testes uma vez:

```powershell
npx playwright install chromium
```

Os testes E2E e a aplicação necessitam de configuração de ambiente válida e de
uma base de dados acessível. O Playwright inicia o servidor local através de
`playwright.config.ts`.

## Funcionalidades e permissões

- Não existe registo público. As dez contas são criadas através do bootstrap
  controlado.
- Apenas utilizadores autenticados consultam a lista e adicionam prendas.
- A propriedade da prenda vem sempre da sessão validada no servidor.
- A lista «Quero receber» é a lista pessoal partilhada com o grupo. A lista
  «Quero oferecer» é privada e só pode ser consultada pelo respetivo autor;
  cada prenda para oferecer pode indicar um destinatário sem lhe revelar a
  sugestão.
- Ao adicionar ou editar uma prenda, é possível escolher se é para receber ou
  oferecer. Para ofertas, é obrigatório selecionar outro utilizador. Depois de
  guardar, a aplicação regressa à lista correspondente.
- Os filtros (todas as pessoas, próprias prendas ou pessoa escolhida) consultam
  a base de dados no servidor.
- Imagens JPEG, PNG e WebP são validadas pelo tipo, extensão e assinatura do
  conteúdo e têm limite de 5 MB. O limite de corpo das Server Actions está
  definido em 6 MB para acomodar os dados multipart do formulário.
- Cada prenda pode incluir uma ligação HTTP/HTTPS opcional para a página do
  produto.
- Cada prenda tem título e descrição; a imagem é opcional e usa um placeholder
  com a marca FPN quando não foi enviada.
- O preço é opcional e guardado em cêntimos; a lista permite filtrar por
  intervalo e ordenar por preço.
- Os estados são «Disponível», «Já Recebi» e «Invisível». As prendas invisíveis
  só aparecem ao respetivo proprietário.
- O proprietário pode clicar no cartão para editar a prenda; no cartão, o estado
  é guardado automaticamente quando alterado.
- A lista separa as prendas de outras pessoas das prendas do utilizador autenticado.
- O cabeçalho inclui um tutorial passo a passo; a ajuda junto ao estado explica a
  diferença entre rascunho invisível, disponível e já recebido.
- Os cartões usam uma borda discreta correspondente à cor do estado e mostram
  os rascunhos invisíveis depois das prendas visíveis.
- Os cartões apresentam título, descrição, pessoa e data; editar o estado só é
  possível na página de edição.
- As rotas apresentam skeletons enquanto os dados ou formulários carregam.
- As mensagens de informação e erro aparecem num modal centrado que fecha
  automaticamente após 2,5 segundos. Depois de guardar, a aplicação volta à
  lista de prendas para receber ou de prendas para oferecer.
- A eliminação de prendas não está disponível.

Depois de atualizar a aplicação, aplica as novas alterações à base de dados com
`npm run db:migrate`.

## Deployment

1. Criar o projeto Supabase, o bucket privado e as dez contas. Configurar no
   bucket `gifts` um limite máximo de ficheiro de pelo menos 5 MB.
2. Aplicar `npm run db:migrate` antes de apontar a aplicação para a base de
   dados.
3. Publicar o repositório na Vercel com o plano Hobby e configurar as variáveis
   de ambiente acima nos ambientes usados.
   Para `DATABASE_URL`, usar a connection string **Transaction pooler** do
   Supabase (porta `6543`), não o pooler em modo Session. A aplicação limita a
   uma ligação por instância de produção e desativa prepared statements para
   ser compatível com o Transaction pooler.
4. Definir `BETTER_AUTH_URL` para o URL HTTPS `*.vercel.app` atribuído ao
   projeto; usar o mesmo domínio como origem confiável do Better Auth.
5. Executar `npm run lint`, `npm run typecheck`, os testes E2E e `npm run build`.
6. Testar login, logout, filtros, upload e redefinição com um email real.

Não configurar upgrades ou serviços pagos. Os limites e os termos dos planos
gratuitos podem mudar; o plano Hobby da Vercel destina-se a utilização pessoal,
de acordo com os termos do fornecedor. O projeto não depende de domínio próprio
e não garante disponibilidade ou gratuitidade permanente.

## Exportação e restauro

O plano gratuito não é assumido como tendo backups automáticos garantidos.
Guardar cópias manuais fora do repositório e testar periodicamente o restauro.

Exportar a base de dados PostgreSQL com `pg_dump`:

```powershell
pg_dump --format=custom --no-owner --no-privileges "$env:DATABASE_URL" --file=fpn-backup.dump
```

Restaurar primeiro numa base de dados vazia:

```powershell
pg_restore --no-owner --no-privileges --dbname=$env:DATABASE_URL .\fpn-backup.dump
```

Exportar também os objetos do bucket privado `gifts` através do Supabase
Dashboard ou de uma ferramenta compatível com Supabase Storage; preservar os
caminhos dos objetos, pois são referenciados pela tabela `gifts`. Guardar o
dump, as imagens, o código e as migrações em locais seguros separados do
projeto. Para migrar de alojamento, restaurar PostgreSQL, copiar os objetos,
aplicar as mesmas variáveis de ambiente e validar a aplicação antes de mudar
o URL publicado.

Um projeto Supabase Free pode suspender-se após inatividade; reativá-lo pelo
Dashboard e confirmar a base de dados, o Storage e o envio SMTP antes de
retomar a utilização.
