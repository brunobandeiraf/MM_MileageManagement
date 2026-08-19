# Requirements Document

## Introduction

O **Mundo Milhas** é um sistema de gestão de milhas de alto padrão que permite a uma empresa administrar clientes, regras de negócio e solicitações relacionadas a programas de milhas aéreas. Esta sprint cobre a infraestrutura inicial do projeto, autenticação, páginas públicas, dashboard inicial, navegação lateral, alternância de tema, gestão de usuários pelo administrador e containerização do backend com Docker. O sistema é composto por um backend Node.js (API REST) e um frontend React, com banco de dados PostgreSQL via Supabase, implantados respectivamente no Railway e na Vercel.

---

## Glossary

- **System**: O sistema Mundo Milhas como um todo (backend + frontend).
- **API**: Serviço backend Node.js + Express + Prisma ORM hospedado no Railway.
- **Web**: Aplicação frontend React + Tailwind CSS + shadcn/ui hospedada na Vercel.
- **Database**: Instância PostgreSQL provisionada pelo Supabase.
- **Admin**: Usuário com perfil administrador, capaz de gerenciar usuários e configurações do sistema.
- **User**: Qualquer usuário com acesso autenticado ao sistema (inclui Admin e usuários comuns).
- **Visitor**: Qualquer pessoa que acessa páginas públicas sem autenticação.
- **JWT**: JSON Web Token usado para autenticação stateless.
- **Seed**: Script de população inicial do banco de dados que cria o usuário administrador padrão.
- **Environment_Variable**: Variável de configuração externa ao código-fonte, gerenciada via `.env` e plataformas de deployment.
- **Hash**: Resultado de função criptográfica unidirecional (bcrypt) aplicada a senhas.
- **Sidebar**: Menu de navegação lateral fixo, visível em todas as páginas da área logada.
- **Temporary_Password**: Senha gerada automaticamente pelo sistema no momento do cadastro de um novo usuário, transmitida exclusivamente por email.
- **Container**: Unidade de execução isolada criada a partir de uma imagem Docker, utilizada para empacotar e executar a API de forma reprodutível.

---

## Requirements

### Requirement 1: Estrutura e Configuração do Projeto

**User Story:** Como desenvolvedor, quero uma estrutura de projeto padronizada com configurações prontas, para que o time possa iniciar o desenvolvimento com consistência e sem ambiguidades de configuração.

#### Acceptance Criteria

1. THE System SHALL organizar o código em duas pastas raiz: `/api` (backend Node.js + Express + Prisma) e `/web` (frontend React + Tailwind + shadcn/ui), cada uma com seu próprio `package.json` e dependências isoladas.
2. THE API SHALL incluir um arquivo `/api/.env.example` contendo todas as variáveis de ambiente obrigatórias com valores placeholder não-vazios e descritivos (ex: `DATABASE_URL="postgresql://user:password@host:5432/db"`), sem expor valores reais.
3. THE Web SHALL incluir um arquivo `/web/.env.example` contendo todas as variáveis de ambiente obrigatórias com valores placeholder não-vazios e descritivos, sem expor valores reais.
4. THE System SHALL incluir um arquivo `.gitignore` na raiz que exclua de qualquer commit: arquivos `.env` e `.env.local`, diretórios `node_modules/`, diretórios de build (`dist/`, `build/`, `.next/`), arquivos de log (`*.log`, `logs/`) e arquivos de cache (`.eslintcache`, `coverage/`).
5. THE API SHALL incluir um arquivo `README.md` com as seções: "Pré-requisitos", "Instalação", "Configuração de Variáveis de Ambiente", "Executando localmente" e "Executando testes".
6. THE Web SHALL incluir um arquivo `README.md` com as seções: "Pré-requisitos", "Instalação", "Configuração de Variáveis de Ambiente", "Executando localmente" e "Executando testes".
7. WHEN um pull request é aberto ou atualizado para a branch `main`, THE System SHALL executar automaticamente via GitHub Actions os jobs de lint e testes unitários, e todos os checks SHALL encerrar com código de saída 0 para que o PR seja considerado aprovado.

---

### Requirement 2: Segurança de Credenciais e Chaves

**User Story:** Como responsável pela segurança, quero garantir que nenhuma credencial, chave ou secret seja exposta no código-fonte ou logs, para que o sistema seja seguro contra vazamentos de informação.

#### Acceptance Criteria

1. THE API SHALL carregar todas as chaves de API, strings de conexão e secrets exclusivamente a partir de variáveis de ambiente em tempo de execução, sem nenhum valor hardcoded no código-fonte.
2. IF uma variável de ambiente obrigatória estiver ausente na inicialização, THEN THE API SHALL encerrar o processo com uma mensagem de erro que identifique pelo nome exato a variável ausente, antes de aceitar qualquer requisição.
3. WHEN uma senha é armazenada no Database, THE API SHALL aplicar a função de hash bcrypt com fator de custo mínimo de 10 antes de persistir o campo `password_hash`.
4. THE API SHALL nunca registrar senhas, tokens de autenticação ou chaves de API em arquivos de log ou em campos de respostas HTTP.
5. WHEN o script de Seed é executado, THE Seed SHALL ler o email e a senha do usuário administrador padrão exclusivamente das variáveis de ambiente `ADMIN_EMAIL` e `ADMIN_PASSWORD`, sem utilizar valores literais no código-fonte.
6. IF a variável de ambiente `ADMIN_EMAIL` ou `ADMIN_PASSWORD` estiver ausente ou vazia quando o script de Seed é executado, THEN THE Seed SHALL encerrar o processo com uma mensagem de erro identificando a variável ausente, sem criar nenhum registro no Database.

---

### Requirement 3: Banco de Dados e Schema Inicial

**User Story:** Como desenvolvedor, quero um schema de banco de dados bem definido, para que os dados de usuários sejam armazenados de forma estruturada e segura.

#### Acceptance Criteria

1. THE Database SHALL conter uma tabela `users` com os campos: `id` (UUID, chave primária, gerado automaticamente), `name` (texto, máx. 255 caracteres, obrigatório), `email` (texto, máx. 255 caracteres, único, obrigatório), `password_hash` (texto, obrigatório), `role` (enum: `ADMIN` | `USER`, padrão `USER`), `created_at` (timestamp com timezone, padrão now()) e `updated_at` (timestamp com timezone, atualizado automaticamente).
2. WHEN a aplicação API é inicializada em qualquer ambiente, THE API SHALL ter aplicado previamente todas as migrações via `prisma migrate deploy`, de forma que o schema do Database seja idêntico ao definido nos arquivos de migração versionados no repositório.

---

### Requirement 4: Seed Seguro do Administrador

**User Story:** Como operador do sistema, quero que um usuário administrador padrão seja criado automaticamente na primeira execução, para que o sistema já tenha acesso administrativo funcional sem exposição de credenciais.

#### Acceptance Criteria

1. WHEN o script de Seed é executado, THE Seed SHALL verificar se já existe um usuário com o email definido na variável de ambiente `ADMIN_EMAIL` no Database antes de tentar criar um novo registro.
2. IF o usuário administrador já existir no Database, THEN THE Seed SHALL encerrar sem criar registros duplicados e sem retornar erro, registrando apenas uma mensagem informativa no console.
3. WHEN o script de Seed cria o usuário administrador, THE Seed SHALL ler a senha da variável de ambiente `ADMIN_PASSWORD` e aplicar hash bcrypt com fator de custo mínimo de 10 antes de armazenar o campo `password_hash`.
4. WHEN o script de Seed cria o usuário administrador, THE Seed SHALL atribuir o papel `ADMIN` ao registro criado.
5. IF a variável de ambiente `ADMIN_EMAIL` ou `ADMIN_PASSWORD` estiver ausente ou vazia, THEN THE Seed SHALL encerrar com mensagem de erro identificando a variável ausente, sem criar nenhum registro.

---

### Requirement 5: Autenticação de Usuários

**User Story:** Como usuário do sistema, quero fazer login com meu email e senha, para que eu possa acessar as funcionalidades correspondentes ao meu perfil de forma segura.

#### Acceptance Criteria

1. WHEN um Visitor envia email e senha válidos para o endpoint de login, THE API SHALL retornar HTTP 200 com um JWT assinado contendo os claims `id`, `role` e `name` do usuário, com expiração de 8 horas a partir do momento de emissão.
2. IF um Visitor envia email não cadastrado ou senha incorreta, THEN THE API SHALL retornar HTTP 401 com a mensagem `"Credenciais inválidas"`, sem indicar qual campo está errado.
3. WHILE um JWT válido estiver presente no cabeçalho `Authorization: Bearer` de uma requisição protegida, THE API SHALL conceder acesso ao endpoint solicitado sem realizar consultas adicionais ao Database para validar o token.
4. IF um JWT ausente, expirado ou com assinatura inválida for enviado em uma requisição a endpoint protegido, THEN THE API SHALL retornar HTTP 401 sem processar a requisição.
5. THE Web SHALL armazenar o JWT de forma que não seja legível via JavaScript (httpOnly cookie), nunca em `localStorage` ou `sessionStorage`.
6. IF o Visitor submeter o formulário de login sem informar email ou sem informar senha, THEN THE API SHALL retornar HTTP 400 com a indicação dos campos obrigatórios ausentes.
7. IF nenhum cabeçalho `Authorization` estiver presente em uma requisição a endpoint protegido, THEN THE API SHALL retornar HTTP 401 com a mensagem `"Token não fornecido"`.

---

### Requirement 6: Páginas Públicas

**User Story:** Como Visitor, quero acessar páginas informativas e de autenticação sem precisar de login, para que eu possa conhecer o sistema e realizar meu acesso.

#### Acceptance Criteria

1. THE Web SHALL disponibilizar a rota pública `/` que renderize a Home Page do Mundo Milhas, contendo: título do sistema, descrição do propósito de gestão de milhas e link/botão de navegação para `/login`, acessível sem autenticação.
2. THE Web SHALL disponibilizar a rota pública `/login` com formulário contendo campos de email (tipo `email`) e senha (tipo `password`) e botão de submissão, acessível sem autenticação.
3. WHEN um User autenticado (JWT válido presente) tenta acessar `/login`, THE Web SHALL redirecionar o User imediatamente para `/dashboard` sem renderizar o conteúdo da página solicitada.
4. WHEN o formulário de login é submetido com dados inválidos, THE Web SHALL exibir as mensagens de erro de validação inline, adjacentes aos campos correspondentes, sem recarregar a página.
5. THE Web SHALL garantir que as páginas públicas sejam acessíveis por leitores de tela, com todos os campos de formulário possuindo labels associados e contraste de cor mínimo de 4.5:1 para textos normais (WCAG AA).

---

### Requirement 7: Proteção de Rotas Privadas

**User Story:** Como administrador de segurança, quero que todas as rotas privadas exijam autenticação válida, para que usuários não autenticados não acessem dados protegidos.

#### Acceptance Criteria

1. WHEN um Visitor sem JWT válido tenta acessar qualquer rota privada da Web, THE Web SHALL redirecionar o Visitor para `/login?redirect=<rota-original>`, preservando a rota de destino para redirecionamento pós-login.
2. IF um User autenticado tenta acessar uma rota exclusiva de Admin sem o papel `ADMIN`, THEN THE API SHALL retornar HTTP 403 com a mensagem `"Acesso não autorizado"` sem processar a requisição.
3. THE API SHALL expor um middleware de autenticação reutilizável que, antes de processar qualquer requisição a endpoints protegidos, valide: a presença do cabeçalho `Authorization`, a assinatura do JWT e a expiração do token.
4. IF um JWT com assinatura inválida ou expirado for recebido em endpoint protegido, THEN THE API SHALL retornar HTTP 401 sem executar a lógica do handler do endpoint.

---

### Requirement 8: Menu Lateral e Navegação (Sidebar)

**User Story:** Como User autenticado, quero um menu lateral fixo com links de navegação, para que eu possa transitar entre as seções do sistema de forma clara e eficiente.

#### Acceptance Criteria

1. THE Web SHALL exibir a Sidebar em todas as páginas da área logada, fixada à esquerda da tela, contendo os links de navegação das seções disponíveis para o papel do User autenticado.
2. THE Sidebar SHALL exibir o logotipo e o nome do sistema na parte superior.
3. THE Sidebar SHALL exibir o nome e o papel do User autenticado (`Admin` para papel `ADMIN`, `Usuário` para papel `USER`) na parte inferior.
4. WHEN um User clica em um item da Sidebar, THE Web SHALL navegar para a rota correspondente sem recarregar a página inteira, utilizando navegação client-side.
5. THE Sidebar SHALL destacar visualmente o item de navegação correspondente à rota atualmente ativa, diferenciando-o dos demais itens.
6. WHEN a largura da viewport é inferior a 768px, THE Sidebar SHALL ser recolhida por padrão e THE Web SHALL exibir um botão de toggle para abrir e fechar a Sidebar sem recarregar a página.
7. WHERE o User autenticado possui papel `ADMIN`, THE Sidebar SHALL incluir o item de navegação "Gestão de Usuários" apontando para a rota `/usuarios`.

---

### Requirement 9: Tema Dark/Light

**User Story:** Como User, quero alternar entre os temas dark e light, para que eu possa usar o sistema no modo visual de minha preferência em cada sessão.

#### Acceptance Criteria

1. THE Web SHALL inicializar em modo dark em todas as sessões onde nenhuma preferência anterior estiver armazenada no `localStorage` do dispositivo.
2. THE Web SHALL exibir um toggle de tema (representado por ícone de sol para light e ícone de lua para dark) no canto superior direito do header em todas as páginas da área logada.
3. WHEN um User aciona o toggle de tema, THE Web SHALL aplicar o tema selecionado imediatamente em toda a interface sem recarregar a página.
4. WHEN um User aciona o toggle de tema, THE Web SHALL persistir a preferência selecionada na chave `theme` do `localStorage` do dispositivo, de forma que a mesma preferência seja aplicada ao carregar a aplicação em sessões subsequentes no mesmo dispositivo.
5. THE Web SHALL garantir que ambos os temas (dark e light) atendam ao contraste mínimo WCAG AA de 4.5:1 para textos de tamanho normal em todos os componentes da interface.

---

### Requirement 10: Gestão de Usuários pelo Administrador

**User Story:** Como Admin, quero gerenciar os usuários cadastrados no sistema, para que eu possa controlar quem tem acesso e manter os dados atualizados.

#### Acceptance Criteria

1. WHEN um Admin solicita a listagem de usuários, THE API SHALL retornar todos os usuários cadastrados paginados em até 100 registros por página, com os campos `id`, `name`, `email`, `role` e `created_at`; se nenhum usuário existir além do Admin, SHALL retornar array vazio sem erro; o campo `password_hash` SHALL ser omitido de todas as respostas.
2. WHEN um Admin cria um novo User informando nome e email válidos, THE API SHALL gerar uma Temporary_Password de 8 a 16 caracteres contendo letras e dígitos, aplicar hash bcrypt com fator de custo mínimo de 10, salvar o registro no Database e enviar ao email cadastrado uma mensagem de boas-vindas contendo: saudação personalizada com o nome do usuário, mensagem de boas-vindas à plataforma Mundo Milhas de gestão de milhas, e as credenciais de acesso (email e Temporary_Password em texto plano); a Temporary_Password SHALL ser omitida da resposta HTTP da API.
3. WHEN um Admin atualiza os dados de um User existente (nome e/ou email), THE API SHALL validar que o novo email (se alterado) não está em uso por outro usuário no Database e atualizar o registro, retornando HTTP 200 com os dados atualizados.
4. WHEN um Admin exclui um User, THE API SHALL remover o registro correspondente do Database e retornar HTTP 200.
5. IF um Admin tenta criar um User com um email já cadastrado, THEN THE API SHALL retornar HTTP 409 com a mensagem `"Email já cadastrado"`, sem criar nenhum registro no Database.
6. IF um Admin tenta atualizar o email de um User para um email já utilizado por outro usuário no Database, THEN THE API SHALL retornar HTTP 409 com a mensagem `"Email já cadastrado"`, sem alterar o Database.
7. IF um Admin tenta excluir o único usuário com papel `ADMIN` no Database, THEN THE API SHALL retornar HTTP 400 com a mensagem `"Não é possível excluir o único administrador do sistema"`, sem alterar o Database.
8. IF um Admin tenta excluir ou editar um User com um `id` inexistente no Database, THEN THE API SHALL retornar HTTP 404 com a mensagem `"Usuário não encontrado"`, sem alterar o Database.
9. IF um Admin tenta criar um User sem informar nome ou sem informar email, THEN THE API SHALL retornar HTTP 400 com a indicação dos campos obrigatórios ausentes, sem criar nenhum registro no Database.

---

### Requirement 11: Dashboard Inicial (Área Logada)

**User Story:** Como User autenticado, quero acessar um dashboard inicial após o login, para que eu tenha uma visão geral do sistema e acesso à navegação principal.

#### Acceptance Criteria

1. WHEN um User autenticado acessa `/dashboard`, THE Web SHALL exibir uma mensagem de boas-vindas personalizada contendo o nome do User e um painel inicial com informações básicas do sistema.
2. THE Web SHALL renderizar a Sidebar e o header com o toggle de tema em todas as páginas da área logada, incluindo `/dashboard`.
3. WHEN um User autenticado acessa `/dashboard`, THE Web SHALL exibir no header o nome do usuário e seu papel (`Admin` para papel `ADMIN`, `Usuário` para papel `USER`).
4. IF um User não autenticado tenta acessar `/dashboard`, THEN THE Web SHALL redirecionar o Visitor para `/login?redirect=/dashboard`, sem renderizar o conteúdo da página.

---

### Requirement 12: Containerização do Backend com Docker

**User Story:** Como desenvolvedor, quero que o backend esteja containerizado com Docker, para que eu possa executar a API de forma reprodutível em qualquer ambiente local ou de produção sem dependências manuais instaladas na máquina.

#### Acceptance Criteria

1. THE API SHALL incluir um arquivo `Dockerfile` na pasta `/api` que utilize uma imagem base oficial do Node.js (versão LTS em variante `alpine`), copie apenas os arquivos necessários para produção, instale exclusivamente dependências de produção (`npm ci --omit=dev`) e exponha a porta definida pela variável de ambiente `PORT`.
2. THE `Dockerfile` SHALL seguir o padrão multi-stage build, com estágio `builder` (instalação de dependências e build do TypeScript, se aplicável) e estágio `runner` (imagem final enxuta apenas com artefatos de produção), de forma que a imagem final não contenha `devDependencies` nem arquivos de código-fonte desnecessários.
3. THE API SHALL incluir um arquivo `.dockerignore` na pasta `/api` que exclua da imagem: `node_modules/`, arquivos `.env`, diretórios de build intermediários, arquivos de log (`*.log`) e arquivos de teste.
4. THE System SHALL incluir um arquivo `docker-compose.yml` na raiz do repositório que defina o serviço `api`, mapeie as variáveis de ambiente a partir de um arquivo `.env` local (nunca valores hardcoded no compose), mapeie a porta do Container para a porta do host e configure a política de restart como `unless-stopped`.
5. WHEN o comando `docker compose up` é executado na raiz do repositório com um arquivo `.env` válido em `/api`, THE Container SHALL iniciar a API e esta SHALL responder a requisições HTTP na porta mapeada em menos de 30 segundos.
6. IF uma variável de ambiente obrigatória estiver ausente no arquivo `.env` referenciado pelo `docker-compose.yml`, THEN THE Container SHALL encerrar com código de saída diferente de zero e registrar no log a variável ausente, antes de aceitar qualquer requisição (alinhado com o Requirement 2, critério 2).
7. THE `Dockerfile` SHALL definir um usuário não-root para execução do processo da API dentro do Container, de forma que o processo não seja executado como `root`.
8. THE System SHALL incluir instruções de uso do Docker no `README.md` da API, descrevendo como construir a imagem localmente (`docker build`) e como iniciar o ambiente completo via `docker compose up`.
