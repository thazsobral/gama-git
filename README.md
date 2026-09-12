# Gama Git - Explorador de Repositórios & Histórico de Commits

Uma aplicação Single-Page Application (SPA) moderna, rápida e responsiva construída em **React 19**, **TypeScript** e **Tailwind CSS v4** para explorar qualquer perfil público do GitHub, navegar por repositórios e branches, inspecionar commits e diffs de arquivos, analisar a atividade de desenvolvimento e gerar animações ilustrativas em GIF através da **Máquina do Tempo**.

O projeto é uma evolução completa do conceito original do **gama-git**.

---

## 🚀 Funcionalidades Principais

### 1. 🔍 Busca e Perfil de Usuários
- Caixa de busca em tempo real com sugestões rápidas (`@torvalds`, `@facebook`, `@vercel`, etc.).
- Cartão de perfil com avatar, bio, contadores de repositórios públicos, seguidores, seguidos e link direto para o GitHub.
- Listagem dos repositórios com contadores de estrelas, forks, linguagem principal e última atualização.
- Ordenação flexível dos repositórios: mais recentes, mais estrelados ou ordem alfabética (A-Z).
- Filtro textual em tempo real por nome ou tecnologia.

### 2. 🌿 Navegação Avançada por Branches
- Seletor de branches em menu suspenso com campo de busca interna e rolagem suave.
- Destaque automático para a branch principal (`main` ou `master`).
- Atualização reativa de todo o histórico, estatísticas e grafo ao alternar de branch.

### 3. 📜 Histórico de Commits e Grafo Git
- **Visualização em Lista**:
  - Mensagem do commit, dados do autor e committer, data relativa e hash SHA curto.
  - Indicador visual exclusivo para *Merge Commits*.
  - Botão de cópia rápida do hash SHA em um clique com feedback visual.
  - Paginação suave e busca filtrada por mensagem, autor ou hash.
- **Visualização em Grafo em Árvore (Git Graph)**:
  - Grafo vetorial desenhado com SVG conectando nós cronológicos com trilhos (*lanes*) coloridos e curvas Bezier para merges e forks.
  - Controles de zoom interativos (`+`, `-`, `Reset`).
  - Interação direta: clique em qualquer nó do grafo para abrir a inspeção do commit.

### 4. 🔍 Detalhes Aprofundados do Commit & Diffs
- Modal modal responsivo com cabeçalho de metadados, autor, committer e commits pais.
- Resumo quantitativo de alterações: total de mudanças, adições (`+`) e remoções (`-`).
- Lista de arquivos afetados com marcadores de status:
  - `Adicionado` (verde)
  - `Modificado` (azul)
  - `Removido` (vermelho)
  - `Renomeado` (roxo)
- Visualizador de código com expansão de diff/patch unificado.

### 5. 📊 Análise de Atividades do Repositório (Dashboard)
- Painel analítico completo adaptado com contraste perfeito para temas claro e escuro:
  - **4 Cards de Métricas**: Total de commits analisados, autores únicos, pico diário de atividade e linguagem primária.
  - **Frequência de Commits**: Gráficos dinâmicos alternáveis por data cronológica, dia da semana (heatmap de produtividade) e horário de pico (madrugada, manhã, tarde, noite).
  - **Distribuição de Linguagens**: Gráfico em rosca (*doughnut*) interativo integrado a uma lista percentual detalhada com bytes de código e barras proporcionais coloridas.

### 6. ⏳ Máquina do Tempo (Geração de GIFs Animados)
Gera animações em GIF diretamente no navegador com renderização em Canvas e codificação multi-thread via Web Workers:
- **Evolução da Árvore (Ilustração Viva)**:
  - Ilustração botânica que germina raízes, tronco, galhos e folhagens à medida que o repositório evolui no tempo.
  - Nós de merge e marcos do projeto desabrocham como flores douradas e lavanda.
  - Linha do tempo na base com datas de início e fim e índice de maturidade da árvore, sem poluição de mensagens de texto.
- **Evolução dos Arquivos**:
  - Reconstrução da árvore de pastas e arquivos commit por commit via Git Trees API, destacando o crescimento estrutural do projeto.
- **Crescimento das Branches e Commits (Grafo em Árvore)**:
  - Grafo procedural animado demonstrando os nós e conexões cronológicas.
- **Controles Personalizáveis**:
  - Seleção de branch alvo.
  - Definição do intervalo de commits (10 a 50 frames).
  - Velocidade da animação (300ms a 1200ms por quadro).
  - Pré-visualização com barra de progresso em tempo real e download direto do arquivo `.gif`.

### 7. 🌓 Suporte Completo a Tema Claro e Escuro
- Alternador de tema no cabeçalho com três modos:
  - **Claro** (`Light`)
  - **Escuro** (`Dark`)
  - **Sistema** (`Auto`)
- Persistência das preferências no `localStorage`.
- Paleta refinada com contraste calibrado (WCAG AA), evitando elementos apagados ou ilegíveis.

### 8. 🛡️ Tratamento Amigável de Erros e Rate Limit
- Tratamento de status da API do GitHub:
  - Usuário ou repositório não encontrado (404).
  - Repositório vazio sem commits (409).
  - Limite de taxa excedido (403 Rate Limit).
- Modal para configuração de **Personal Access Token (PAT)** do GitHub armazenado com segurança no `localStorage`, elevando a cota de 60 requisições/hora para até **5.000 requisições/hora**.

---

## 🛠️ Tecnologias e Bibliotecas

| Tecnologia | Finalidade |
| :--- | :--- |
| **React 19** | Biblioteca declarativa para construção da interface de usuário |
| **TypeScript 5.8** | Tipagem estática rigorosa para segurança e previsibilidade |
| **Tailwind CSS v4** | Estilização utilitária moderna com suporte nativo a dark mode |
| **Axios** | Cliente HTTP para consumo da API REST v3 do GitHub |
| **Chart.js & React-Chartjs-2** | Renderização dos gráficos de atividade e linguagens |
| **Lucide React** | Ícones vetoriais modernos e consistentes |
| **Vite** | Bundler e servidor de desenvolvimento ultra-rápido |

---

## 📂 Estrutura do Projeto

```
/
├── public/                     # Ativos estáticos e ícones
├── src/
│   ├── api/
│   │   └── github.ts           # Cliente Axios, endpoints da API do GitHub e tipagem de erros
│   ├── context/
│   │   └── AppContext.tsx      # Context API para estado global (usuário, repositório, branch, commits)
│   ├── hooks/
│   │   └── useGitHub.ts        # Hook customizado que encapsula o contexto e filtros computados
│   ├── components/
│   │   ├── BranchSelector.tsx  # Dropdown de seleção e busca de branches
│   │   ├── CommitDetail.tsx    # Modal de detalhes e diffs de arquivos do commit
│   │   ├── CommitGraph.tsx     # Grafo visual de ramificações em SVG com controles de zoom
│   │   ├── CommitList.tsx      # Listagem paginada de commits com cópia de SHA e busca
│   │   ├── ErrorMessage.tsx    # Banner com diagnóstico de erros e ações de recuperação
│   │   ├── Header.tsx          # Cabeçalho com logotipo, breadcrumb, tema e botão de token
│   │   ├── LoadingSpinner.tsx  # Indicadores de carregamento e esqueletos visuais
│   │   ├── RepoActivityAnalytics.tsx # Dashboard de métricas, commits temporais e linguagens
│   │   ├── RepoList.tsx        # Lista de repositórios com ordenação e filtros
│   │   ├── SearchBar.tsx       # Campo de busca de usuários com sugestões rápidas
│   │   ├── ThemeToggle.tsx     # Alternador de tema (claro, escuro e sistema)
│   │   ├── TokenModal.tsx      # Modal para cadastro seguro de token PAT do GitHub
│   │   ├── UserProfileCard.tsx # Resumo do perfil do usuário pesquisado
│   │   └── TimeMachine/        # Módulo da Máquina do Tempo
│   │       ├── index.jsx       # Componente da Máquina do Tempo e renderizadores de animação
│   │       ├── index.d.ts      # Declaração de tipos TypeScript para o módulo
│   │       └── TimeMachine.module.css # Estilização do módulo TimeMachine
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript da API do GitHub e entidades internas
│   ├── App.tsx                 # Layout principal com abas e controle de visualização
│   ├── index.css               # Importação do Tailwind CSS e regras globais
│   └── main.tsx                # Ponto de entrada da aplicação React
├── index.html                  # Arquivo HTML base com metatags otimizadas
├── metadata.json               # Metadados da aplicação no Google AI Studio
├── package.json                # Gerenciamento de scripts e dependências
├── tsconfig.json               # Configurações do compilador TypeScript
└── vite.config.ts              # Configuração do Vite com plugins React e Tailwind
```

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
- **Node.js**: versão 18 ou superior
- **npm**, **yarn** ou **bun**

### 1. Instalar as dependências
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O servidor estará acessível em `http://localhost:3000`.

### 3. Gerar a compilação para produção
```bash
npm run build
```

### 4. Executar os testes de tipagem (Linter)
```bash
npm run lint
```

---

## 🔑 Autenticação e Limites da API do GitHub

Por padrão, requisições não autenticadas para a API pública do GitHub são limitadas a **60 requisições por hora** por endereço IP.

Para navegar livremente por repositórios grandes e gerar animações na Máquina do Tempo sem interrupções:
1. Acesse sua conta no GitHub em: `Settings` > `Developer Settings` > `Personal Access Tokens`.
2. Crie um token pessoal (*classic* ou *fine-grained*). Nenhuma permissão de escrita ou escopo privado é necessária para explorar repositórios públicos.
3. No Gama Git Explorer, clique no botão **"Token de Acesso"** (ícone de chave) no cabeçalho.
4. Cole o token e salve. Seu limite será automaticamente expandido para **5.000 requisições por hora**. O token permanece salvo exclusivamente no `localStorage` do seu navegador.

---

## 📄 Licença
Este projeto foi desenvolvido para fins didáticos, analíticos e de demonstração prática como evolução do **gama-git**.
