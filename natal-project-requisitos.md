# natal-project — Requisitos aplicacionais e especificação para implementação

**Versão:** 1.0
**Estado:** Especificação inicial pronta para iniciar o desenvolvimento
**Objetivo:** Aplicação web privada para gerir listas de sugestões de prendas de Natal de um grupo de 10 utilizadores.

---

## 1. Objetivo e âmbito

O `natal-project` é uma aplicação web responsiva na qual 10 utilizadores autorizados iniciam sessão, consultam listas de prendas e adicionam prendas à sua própria lista.

A aplicação deve ter identidade visual natalícia — incluindo obrigatoriamente verde e vermelho — e funcionar em telemóveis, tablets e computadores.

### Incluído na primeira versão

- Login com nome de utilizador e palavra-passe.
- Opção para manter a sessão iniciada.
- Recuperação de palavra-passe através de email, por redefinição segura.
- Consulta de listas de prendas.
- Filtro para ver todas as prendas, apenas as próprias ou as prendas de uma pessoa escolhida.
- Filtros de preço e estado, com ordenação por preço crescente ou decrescente.
- Formulário para adicionar uma prenda à lista do utilizador autenticado.
- Cada prenda tem título, descrição curta e imagem opcional.
- Edição das prendas pelo respetivo proprietário.
- Upload de imagem para armazenamento persistente.
- Criação inicial e controlada das 10 contas.
- Interface responsiva com efeitos natalícios moderados.

### Fora do âmbito inicial

- Registo público de contas.
- Eliminação de prendas depois de criadas.
- Comentários, gostos, reservas ou compra de prendas.
- Funcionalidades de administração através de uma quarta página pública.
- Aplicação móvel nativa.
- Pagamentos ou funcionalidades comerciais.

---

## 2. Stack tecnológica escolhida

Usar as seguintes tecnologias, salvo incompatibilidade técnica identificada durante a implementação:

- **Next.js**, com App Router, e **React**.
- **TypeScript** com configuração estrita.
- **Tailwind CSS** para estilos responsivos.
- **Better Auth** para autenticação, com o plugin de username.
- **Drizzle ORM** para acesso tipado à base de dados e migrações.
- **PostgreSQL no Supabase** para persistência.
- **Supabase Storage** para imagens.
- **Vercel Hobby** para alojamento da aplicação, usando o subdomínio gratuito fornecido.
- **SMTP configurável** (por exemplo, Gmail SMTP ou outro fornecedor com quota gratuita) para emails de recuperação.
- **Zod** para validação de dados no servidor.
- **Playwright** para testes end-to-end dos fluxos principais.
- **Git/GitHub** para controlo de versões.

A aplicação não deve depender de uma subscrição paga. Os serviços gratuitos têm quotas, termos e condições que podem mudar; não se promete disponibilidade vitalícia nem capacidade ilimitada.

### Princípio arquitetural

Usar uma única aplicação Next.js para frontend e lógica de servidor. Não criar microserviços nem uma API separada sem necessidade comprovada. O servidor Next.js comunica com PostgreSQL e Supabase Storage. Operações privilegiadas e segredos ficam exclusivamente no servidor.

---

## 3. Utilizadores, contas e permissões

### RF-01 — Grupo fechado

A aplicação destina-se a **exatamente 10 contas autorizadas** na primeira versão. Não deve existir registo público, formulário de criação de conta ou endpoint público que permita criar utilizadores livremente.

As contas são criadas pelo proprietário do projeto através de um procedimento seguro de bootstrap/seed, executado em ambiente de desenvolvimento ou por uma operação administrativa protegida. Não colocar palavras-passe reais no repositório nem em ficheiros versionados.

O procedimento de bootstrap deve permitir criar as contas com nome de utilizador, nome de exposição, email e uma palavra-passe inicial temporária. As palavras-passe iniciais devem ser fornecidas através de variáveis de ambiente ou de entrada segura e nunca ser registadas nos logs. Deve ser possível obrigar os utilizadores a mudar a palavra-passe inicial no primeiro acesso, se isso for suportado de forma segura pela implementação escolhida.

### RF-02 — Modelo de permissões

- Qualquer utilizador autenticado pode consultar todas as listas de prendas do grupo.
- O utilizador só pode adicionar prendas à sua própria lista.
- A propriedade de uma prenda é determinada no servidor a partir da sessão autenticada; nunca confiar num `userId` enviado pelo browser para escolher o proprietário.
- Não disponibilizar operações de edição ou eliminação na primeira versão.
- Pedidos não autenticados a páginas privadas ou operações privadas devem ser redirecionados para o login ou responder com erro apropriado.

### RF-03 — Nome de utilizador

- O nome de utilizador é obrigatório e único.
- Tratar nomes de utilizador sem distinguir maiúsculas/minúsculas (normalização consistente, por exemplo, para minúsculas).
- Validar o nome de utilizador no cliente e no servidor.
- O nome de exposição é o nome apresentado na interface; não deve ser utilizado como identificador de autenticação.

### RF-04 — Email

- Cada conta tem um email válido e único para recuperação de palavra-passe.
- O email não precisa de ser usado como credencial de login.
- Não expor publicamente o endereço de email dos utilizadores.

---

## 4. Autenticação e segurança

### RF-05 — Login

A página de login permite autenticação por nome de utilizador e palavra-passe através do Better Auth.

- Incluir botão para mostrar/ocultar a palavra-passe.
- Incluir opção «Manter sessão iniciada».
- Mostrar mensagens de erro claras, mas não revelar informação sensível desnecessária.
- Desativar sign-up/registo público.
- Após login com sucesso, redirecionar para `/prendas`.
- Se um utilizador autenticado abrir `/login`, redirecionar para `/prendas`.

### RF-06 — Sessões

- Utilizar os mecanismos de sessão e cookies seguros suportados pelo Better Auth.
- Em produção, usar HTTPS e cookies `Secure`, `HttpOnly` e uma política `SameSite` adequada.
- A opção «Manter sessão iniciada» deve usar a duração de sessão persistente configurada pela biblioteca; não guardar palavra-passe, token de sessão ou segredos no `localStorage`.
- Implementar logout e invalidar a sessão no servidor.

### RF-07 — Recuperação de palavra-passe

A recuperação é um fluxo da página `/login` (por exemplo, painel, modal ou estado do formulário), não uma quarta página principal.

- O utilizador introduz o email associado à conta.
- O servidor solicita o envio de um link de redefinição por SMTP.
- O link é temporário, de utilização única e expira.
- O utilizador define uma palavra-passe nova; a palavra-passe antiga nunca é mostrada nem recuperada.
- Depois da redefinição, invalidar sessões existentes quando suportado pela biblioteca.
- Mostrar uma mensagem genérica que não confirme se um email existe na aplicação.
- A funcionalidade deve ser testada com email real antes do deploy final.
- Em produção, não simular sucesso se o SMTP não estiver configurado; devolver uma mensagem segura e registar o erro sem expor credenciais.

### RNF-01 — Proteção de credenciais

- Nunca armazenar palavras-passe em texto simples.
- Deixar o Better Auth gerir os hashes e o modelo de dados de autenticação. Não criar um campo manual `password_encriptada` se a biblioteca já gerir esta informação.
- Não escrever passwords, tokens de recuperação, cookies ou chaves secretas nos logs.
- Usar variáveis de ambiente para todos os segredos.
- Adicionar validação de inputs, tratamento de erros e limitação razoável de tentativas nas operações sensíveis quando suportado.

---

## 5. Páginas e navegação

A aplicação tem **três páginas principais**:

### RF-08 — Página 1: Login (`/login`)

Elementos:

- Nome de utilizador.
- Palavra-passe.
- Mostrar/ocultar palavra-passe.
- Checkbox «Manter sessão iniciada».
- Botão «Entrar».
- Ligação «Esqueci-me da palavra-passe», que abre o fluxo de recuperação sem criar uma quarta página principal.
- Mensagens de validação e de erro acessíveis.

### RF-09 — Página 2: Lista de prendas (`/prendas`)

Só acessível a utilizadores autenticados.

Elementos:

- Título e identificação do utilizador autenticado através do nome de exposição.
- Botão «Adicionar prenda», que abre `/prendas/nova`.
- Filtro com, no mínimo, as opções «Todas as pessoas», «Só as minhas prendas» e seleção de uma pessoa específica.
- Lista de cartões de prendas.
- Cada cartão apresenta a imagem, descrição, data de criação e nome de exposição do proprietário.
- Cada cartão apresenta também o título; sem imagem, usa uma imagem placeholder com a marca FPN.
- Mostrar o preço opcional e o estado da prenda; «Invisível» só pode aparecer ao proprietário.
- Permitir filtrar por estado e intervalo de preço, e ordenar por preço crescente/decrescente; preços em branco ficam no fim.
- Os cartões do próprio utilizador abrem a edição ao clicar, sem expor edição de prendas de outras pessoas.
- Estado vazio quando não existem prendas para o filtro escolhido.
- Estado de carregamento e mensagem de erro em caso de falha.
- Botão/ligação para terminar sessão.

Comportamento dos filtros:

- «Todas as pessoas»: apresenta as prendas de todos os utilizadores.
- «Só as minhas prendas»: apresenta apenas as prendas pertencentes ao utilizador autenticado.
- «Pessoa específica»: apresenta apenas as prendas da pessoa selecionada.
- Prendas invisíveis nunca são devolvidas a outros utilizadores, mesmo quando se filtra pela pessoa proprietária.
- Intervalos de preço inválidos (mínimo superior ao máximo) são assinalados ao utilizador.
- Os filtros podem funcionar no cliente sobre dados já autorizados ou, de preferência, como query no servidor; evitar descarregar grandes quantidades de dados sem necessidade.
- Ordenação por data de criação descendente por omissão (mais recentes primeiro).

### RF-10 — Página 3: Adicionar prenda (`/prendas/nova`)

Só acessível a utilizadores autenticados.

Campos:

- Título da prenda (obrigatório).
- Pequena descrição da prenda (obrigatória).
- Imagem (opcional), carregada como ficheiro.
- Ligação para a página da prenda (opcional, apenas HTTP/HTTPS).
- Preço em euros (opcional, até duas casas decimais).
- Estado: «Disponível», «Já Recebi» ou «Invisível».
- A data de criação é gerada pelo servidor; o utilizador não a introduz manualmente.

Comportamento:

- Validar os campos no browser e no servidor.
- Aceitar apenas formatos de imagem permitidos, no mínimo JPEG, PNG e WebP.
- Limitar o ficheiro a 5 MB por imagem, quando enviada.
- Rejeitar ficheiros com extensão ou tipo MIME não permitido; não confiar só na extensão enviada pelo browser.
- Guardar a imagem no Supabase Storage e guardar na base de dados apenas o caminho/identificador do ficheiro, não os bytes da imagem.
- Associar a prenda ao utilizador autenticado no servidor.
- Em caso de sucesso, mostrar confirmação, limpar o formulário e mantê-lo aberto para permitir criar outra prenda.
- Em caso de erro, conservar os dados textuais do formulário quando seguro e explicar como corrigir.
- Disponibilizar botão para cancelar e voltar à lista.

### RF-11 — Editar prenda

- A edição está disponível apenas para o proprietário autenticado, tanto na leitura como na gravação.
- Permitir alterar descrição, ligação, preço, estado e, opcionalmente, substituir a imagem.
- Permitir alterar título.
- Um utilizador que tente abrir ou alterar uma prenda alheia não pode consultar nem modificar os seus dados.

---

## 6. Modelo de dados

Usar as tabelas de autenticação geridas pelo Better Auth e acrescentar a tabela de negócio `gift`/`prendas` através do Drizzle ORM.

### Utilizador / Pessoa

Representado pelo registo de utilizador do Better Auth, com pelo menos:

- `id`: identificador único.
- `username`: nome de utilizador único, fornecido pelo plugin username.
- `name`: nome de exposição.
- `email`: endereço privado para recuperação.
- `createdAt` e `updatedAt`.
- Tabelas de conta e sessão geridas pela biblioteca de autenticação, incluindo hash seguro de palavra-passe no local previsto pela biblioteca.

Não duplicar os dados de autenticação numa tabela `Pessoa` à parte, salvo justificação técnica documentada. As prendas referenciam o ID do utilizador do Better Auth.

### Prenda (`gift` ou `prendas`)

Campos mínimos:

- `id`: UUID ou identificador único.
- `userId`: chave estrangeira para o utilizador proprietário; obrigatório.
- `description`: texto obrigatório com limite de tamanho razoável (por exemplo, 500 caracteres).
- `title`: título obrigatório com limite de 120 caracteres.
- `productUrl`: ligação opcional HTTP/HTTPS.
- `priceCents`: preço em cêntimos, opcional.
- `status`: `available`, `received` ou `hidden`; por omissão, `available`.
- `imagePath`: caminho do objeto no Supabase Storage; opcional.
- `createdAt`: timestamp gerado no servidor/base de dados.

Requisitos de integridade:

- Criar chave estrangeira para o utilizador.
- Indexar `userId` e `createdAt` para suportar filtros e ordenação.
- Definir ações de integridade referencial de forma explícita.
- Guardar as datas em UTC e apresentá-las de forma legível para o utilizador.

### Armazenamento de imagens

- Usar um bucket privado no Supabase Storage.
- Não tornar a chave de serviço pública nem colocar segredos `SUPABASE_*` em variáveis `NEXT_PUBLIC_*`.
- O servidor valida a sessão e gera URLs assinados de curta duração, ou serve a imagem por uma rota autorizada.
- Não aceitar caminhos de storage arbitrários enviados pelo cliente; o caminho deve ser gerado pelo servidor.

---

## 7. Requisitos visuais e de experiência de utilização

### RNF-02 — Identidade natalícia obrigatória

A identidade visual deve incluir sempre:

- Verde escuro e vermelho como cores principais.
- Branco/marfim para superfícies e texto quando apropriado.
- Dourado como cor de destaque opcional.
- Elementos visuais natalícios discretos: flocos de neve, estrelas, luzes, ramos, presentes ou padrões sazonais.

Manter contraste suficiente e legibilidade. Não usar efeitos que tapem formulários ou conteúdo.

### RNF-03 — Responsividade

- Mobile-first.
- Suportar larguras pequenas (a partir de cerca de 320 px), tablets e ecrãs desktop comuns.
- Sem scroll horizontal na utilização normal.
- Em telemóvel, os cartões devem ficar numa coluna; em ecrãs maiores podem usar grelha.
- Formulários, botões e filtros devem ser confortáveis para toque.

### RNF-04 — Animações

- Usar CSS e/ou animações leves; evitar dependências pesadas sem benefício claro.
- Efeitos de neve ou luzes devem ser discretos e não prejudicar o desempenho.
- Respeitar `prefers-reduced-motion`; nesse caso, reduzir ou desativar animações não essenciais.
- Não sacrificar acessibilidade, legibilidade ou velocidade pela decoração.

### RNF-05 — Acessibilidade

- Usar labels associados aos campos.
- Permitir navegação por teclado e foco visível.
- Não comunicar estados apenas pela cor.
- Fornecer texto alternativo apropriado para imagens.
- Tornar mensagens de validação e feedback acessíveis a leitores de ecrã.

---

## 8. Arquitetura e organização do código

Usar Next.js App Router. Organização sugerida (ajustável, mantendo separação de responsabilidades):

```text
natal-project/
├── public/
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── prendas/page.tsx
│   │   ├── prendas/nova/page.tsx
│   │   ├── api/auth/[...all]/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   ├── gifts/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── db.ts
│   │   ├── storage.ts
│   │   ├── validation.ts
│   │   └── mailer.ts
│   └── db/
│       ├── schema.ts
│       └── migrations/
├── scripts/
│   └── seed-users.ts
├── tests/
├── .env.example
├── README.md
└── package.json
```

Instruções de implementação:

- Separar componentes da interface, acesso à base de dados, autenticação e lógica de negócio.
- Preferir Server Components para leitura e renderização sempre que apropriado; usar Client Components apenas quando existir interatividade necessária.
- Usar Server Actions ou Route Handlers de forma consistente para operações de escrita.
- Validar novamente no servidor todos os dados recebidos do cliente.
- Criar migrações reproduzíveis para a base de dados.
- Evitar abstrações complexas para apenas três páginas.
- Não expor tokens nem credenciais em código enviado ao cliente.

---

## 9. Variáveis de ambiente

Criar `.env.example` sem valores reais. O `.env.local` deve ficar fora do Git.

Variáveis a configurar conforme a versão final dos SDKs e serviços:

```dotenv
# URL pública do website em produção
BETTER_AUTH_URL=
# Segredo aleatório forte para Better Auth
BETTER_AUTH_SECRET=

# URL PostgreSQL usada pelo servidor/Drizzle
DATABASE_URL=

# Supabase — apenas no servidor; nunca expor a chave privilegiada ao browser
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

# SMTP para recuperação de palavra-passe
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Opcional, se necessário na implementação escolhida
NODE_ENV=
```

Confirmar os nomes exatos das variáveis e a configuração de ligação PostgreSQL nas versões usadas. Nunca colocar credenciais reais no `README`, nos testes, no histórico Git ou nos logs. A chave privilegiada do Supabase só pode ser usada no servidor.

---

## 10. Alojamento e restrições de custo

### RNF-06 — Custo

A infraestrutura deve ser desenhada para funcionar em planos com custo obrigatório de 0 €:

- Vercel Hobby para a aplicação Next.js.
- Supabase Free para PostgreSQL e Storage.
- Better Auth, Drizzle, Zod, Tailwind CSS e Playwright como dependências de código aberto, sem taxa por utilização destas bibliotecas.
- Fornecedor SMTP com quota gratuita para os emails transacionais.
- Subdomínio gratuito do fornecedor de alojamento; não comprar domínio.

Não ativar serviços pagos, upgrades automáticos ou funcionalidades que exijam uma subscrição. Antes do deploy, verificar os limites e os termos atuais de cada fornecedor.

### RNF-07 — Limitações reconhecidas

- Não é possível garantir que os serviços gratuitos continuem gratuitos ou disponíveis para sempre.
- O plano gratuito do Supabase pode suspender projetos com atividade insuficiente; prever procedimento documentado de reativação.
- As quotas de armazenamento, tráfego, execução e email são finitas.
- O plano Vercel Hobby destina-se a utilização pessoal/não comercial, de acordo com os termos do fornecedor.
- Não depender de um domínio próprio.

### RNF-08 — Backup e portabilidade

- Documentar como exportar a base de dados PostgreSQL.
- Documentar como exportar/guardar as imagens do Storage.
- Manter o código e as migrações em Git.
- Criar instruções de restauro e migração para outro alojamento.
- Não afirmar que existe backup automático garantido no plano gratuito; validar e testar o procedimento manual.

---

## 11. Tratamento de erros e estados da interface

Todas as páginas devem ter estados claros para:

- Carregamento.
- Lista vazia.
- Falha de rede/servidor.
- Campo inválido.
- Upload inválido ou demasiado grande.
- Sessão expirada.
- Falha de envio de email.
- Sucesso ao adicionar uma prenda.

As mensagens apresentadas ao utilizador devem ser claras, sem incluir stack traces, detalhes internos, credenciais ou informação pessoal desnecessária. Registar erros técnicos no servidor sem segredos.

---

## 12. Testes e critérios de aceitação

A primeira versão só está concluída quando os seguintes critérios forem verificados.

### Autenticação

- [ ] Utilizador autorizado consegue iniciar sessão com nome de utilizador e palavra-passe.
- [ ] Palavra-passe errada não inicia sessão.
- [ ] Uma conta inexistente não pode ser criada através da interface pública.
- [ ] «Manter sessão iniciada» mantém a sessão conforme a configuração definida.
- [ ] Logout invalida a sessão.
- [ ] Páginas privadas não são acessíveis sem autenticação.
- [ ] Recuperação envia um email real e permite definir uma palavra-passe nova através de um link temporário.
- [ ] O link de recuperação expirado ou já utilizado não pode redefinir novamente a palavra-passe.
- [ ] Erros de recuperação não revelam se uma conta existe.

### Lista de prendas

- [ ] Depois de iniciar sessão, o utilizador consegue ver a lista.
- [ ] «Todas as pessoas» apresenta prendas de vários utilizadores.
- [ ] «Só as minhas prendas» mostra apenas as prendas do utilizador autenticado.
- [ ] Selecionar uma pessoa mostra apenas as prendas dessa pessoa.
- [ ] Os cartões apresentam imagem, descrição, data de criação e nome de exposição.
- [ ] Uma lista vazia tem uma apresentação adequada.
- [ ] Prendas invisíveis só são incluídas na lista do proprietário.
- [ ] Filtros de estado e preço e ordenação de preço produzem resultados corretos.
- [ ] O cartão do proprietário permite abrir a edição; cartão alheio não permite editar.

### Adicionar prenda

- [ ] Utilizador autenticado consegue adicionar uma prenda com título e descrição, com ou sem imagem.
- [ ] A ligação opcional da prenda é validada e apresentada no cartão.
- [ ] O servidor associa a prenda ao utilizador da sessão.
- [ ] A data é gerada pelo servidor.
- [ ] Formatos não permitidos e imagens superiores a 5 MB são rejeitados.
- [ ] Imagem e registo ficam persistidos após terminar sessão e voltar a entrar.
- [ ] A nova prenda aparece na lista e no filtro «Só as minhas prendas».
- [ ] Depois de guardar, o formulário fica limpo e permite criar outra prenda.
- [ ] O preço opcional e o estado escolhido são guardados e apresentados.
- [ ] Um utilizador não consegue associar uma prenda à conta de outra pessoa manipulando o pedido.

### Editar prenda

- [ ] O proprietário consegue atualizar todos os campos e substituir opcionalmente a imagem.
- [ ] Outro utilizador não consegue carregar a página de edição nem executar a alteração através de um pedido manipulado.

### Interface e operação

- [ ] O site funciona a partir de 320 px de largura e em desktop, sem scroll horizontal indesejado.
- [ ] Verde e vermelho são visíveis na identidade visual.
- [ ] Os efeitos natalícios respeitam `prefers-reduced-motion`.
- [ ] Campos têm labels, foco visível e utilização por teclado.
- [ ] O projeto instala dependências, executa migrações e passa `lint`, verificação TypeScript, testes relevantes e `build`.
- [ ] A aplicação pode ser publicada sem introduzir qualquer serviço pago.
- [ ] Os passos de configuração, criação das 10 contas, deployment e backup estão documentados no README.

---

## 13. Fases sugeridas de implementação

1. **Fundação:** criar aplicação Next.js, TypeScript, Tailwind, configuração de lint, `.env.example` e README.
2. **Base de dados:** configurar Drizzle/PostgreSQL, schema, migrações e teste de ligação.
3. **Autenticação:** configurar Better Auth, username, sessões, desativar registo público e criar seed privado das 10 contas.
4. **Email:** configurar SMTP e validar o fluxo de redefinição.
5. **Lista:** implementar query, cartões, filtros e estados vazios/erro.
6. **Upload:** configurar bucket privado, validação de ficheiros, upload seguro e URLs assinados.
7. **Criação de prendas:** implementar formulário, validação e associação ao utilizador autenticado.
8. **Polimento:** responsividade, identidade natalícia, acessibilidade e animações leves.
9. **Testes:** executar testes automatizados dos fluxos críticos e verificar permissões.
10. **Deploy:** publicar na Vercel, configurar variáveis de ambiente e validar a aplicação em produção.
11. **Continuidade:** documentar exportação, backup, restauro e reativação do Supabase se necessário.

---

## 14. Instrução para o agente de programação

Implementa o `natal-project` de acordo com esta especificação. Antes de escrever muito código, inspeciona o estado atual do repositório e apresenta um plano curto de implementação. Depois executa as fases por ordem, validando o build e os testes após alterações relevantes.

Regras de trabalho:

- Não substituir a stack definida sem explicar a incompatibilidade concreta.
- Não criar registo público.
- Não deixar dados fictícios como se fossem dados reais em produção.
- Não expor segredos ao cliente nem adicionar credenciais ao Git.
- Não declarar a recuperação de palavra-passe concluída sem testar o envio real de email.
- Não introduzir dependências pagas ou serviços que exijam pagamento.
- Não implementar edição/eliminação de prendas nem páginas principais adicionais na primeira versão.
- Se for necessária uma decisão não especificada, escolher a alternativa mais simples e segura, documentando a decisão no README.
- Ao terminar, apresentar os comandos para desenvolvimento local, migrações, testes, criação controlada das contas e deployment.
