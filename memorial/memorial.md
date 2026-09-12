# 📜 Memorial de Reestruturação — Gama Git

## 📌 Contexto
Este repositório passou por uma reformulação completa de código, arquitetura e interface. O projeto original, concebido em **2021**, era uma aplicação minimalista focada na listagem visual de repositórios. Com a evolução das necessidades técnicas e de UX/UI, a estrutura legada foi descontinuada para dar lugar ao **Gama Git v2.0**.

---

## 🔄 Comparativo de Versões

| Aspecto | Versão Legada (v1.0 - 2021) | Versão Atual (v2.0) |
| :--- | :--- | :--- |
| **Interface (UI)** | Grid estático de pastas com estilo retrô/minimalista | Dashboard moderno, responsivo com suporte a temas (Escuro / Claro / Sistema) |
| **Navegação** | Visualização simples de diretórios por perfil | Explorador completo de repositórios, histórico de commits e navegação por branches |
| **Integração GitHub API** | Consultas básicas de repositórios | Inspeção de diffs de arquivos em tempo real, grafos de ramificação e gerenciamento de PAT (Rate limit até 5k req/h) |
| **Experiência (UX)** | Apenas visualização de listas | Busca interativa, ordenação, filtro dinâmico e suporte a sugestões de perfis |

---

<figure align="center">
  <img src=".\v1.png" alt="Versão 1 do projeto" width="80%" />
  <figcaption align="center"><i>Versão 1 do projeto (antiga).</i></figcaption>
</figure>

<figure align="center">
  <img src=".\v2.png" alt="Versão 2 do projeto" width="80%" />
  <figcaption align="center"><i>Versão 2 do projeto (nova).</i></figcaption>
</figure>

---

## 🚀 Decisões da Nova Arquitetura
1. **Reescrita Completa da Base de Código**: Remoção de débitos técnicos da versão legada.
2. **Performance e Rate Limit**: Implementação de suporte a Token de Acesso Pessoal (PAT) para evitar bloqueios na API pública do GitHub.
3. **Design System Moderno**: Visual alinhado com padrões modernos de UI/UX, mantendo o foco em didática e usabilidade.

---

## 📅 Registro Histórico
* **Criador**: Thaz
* **Versão Legada**: 2021 (`gamagit-search.netlify.app`)
* **Reestruturação**: 2026 (`Gama Git v2.0`)