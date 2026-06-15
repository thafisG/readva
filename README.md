# 📚 Readva

Readva é uma plataforma web de acompanhamento de leitura desenvolvida em Angular. O projeto busca unir organização pessoal e experiência social, permitindo que leitores registrem seu progresso, compartilhem atividades e descubram novos livros de forma inteligente.

> ⚠️ O projeto ainda está em desenvolvimento. Este README representa o estado atual da aplicação e será atualizado conforme novas funcionalidades forem implementadas.

## ✨ Funcionalidades atuais

### 🏠 Dashboard
- Cadastro de novos livros;
- Busca automática de informações do livro;
- Registro de progresso da leitura;
- Controle de páginas lidas;
- Controle de tempo de leitura;
- Sistema de sequência de leitura (streak);
- Metas diárias de leitura;
- Edição e exclusão de atividades.

### 📰 Feed de atividades

#### Meu Feed
- Visualização das próprias atividades;
- Curtidas em publicações;
- Comentários sobre a leitura;
- Edição e exclusão das publicações.

#### Feed Global
- Visualização das atividades de outros leitores;
- Sistema de seguir e deixar de seguir usuários;
- Curtidas nas atividades compartilhadas.

### 📚 Minha Biblioteca
- Visualização dos livros adicionados;
- Indicador de progresso de leitura;
- Histórico de sessões de leitura;
- Total de tempo dedicado a cada livro;
- Comentários registrados durante a leitura;
- Marcação de livros concluídos.

### 🤖 Recomendações Inteligentes

O Readva possui um sistema próprio de recomendação inspirado em técnicas de **Content-Based Recommendation**, utilizando informações do comportamento do leitor.

O algoritmo considera:

- Categorias mais lidas;
- Livros concluídos;
- Progresso acumulado;
- Engajamento nas atividades (curtidas).

Com base nesses fatores, é criado um perfil do leitor e os livros mais compatíveis são sugeridos.

---

## 🌐 Integrações com APIs

### Google Books API

Responsável por:

- Buscar livros pelo título;
- Obter capa do livro;
- Autor;
- Número de páginas;
- Categorias.

Isso permite preencher automaticamente as informações durante o cadastro.

### Open Library API

Utilizada como fonte complementar para obtenção de:

- Capas de livros;
- Metadados;
- Informações adicionais.

A combinação dessas APIs permite oferecer uma experiência mais inteligente na busca e registro de livros.

---

## 🛠 Tecnologias utilizadas

- Angular 22
- TypeScript
- HTML5
- SCSS
- Angular Signals
- Angular Material
- RxJS
- Local Storage

---

## 💾 Persistência dos dados

Atualmente, todas as informações são armazenadas em **Local Storage**, permitindo que a aplicação funcione sem backend.

Nas próximas versões, está prevista a migração para um banco de dados, possibilitando:

- Sincronização entre dispositivos;
- Armazenamento permanente;
- Melhor escalabilidade;
- Recursos sociais mais avançados.

---

## 🚧 Próximas funcionalidades

- Sistema de desafios e metas;
- Perfil do usuário;
- Estatísticas avançadas;
- Ranking de leitores;
- Busca de usuários;
- Sistema de conquistas;
- Backend e banco de dados;
- Melhorias no sistema de recomendação;
- Responsividade para dispositivos móveis;
- Novos recursos sociais.

---

## 📌 Status do projeto

🚧 Em desenvolvimento.

Este projeto está sendo construído de forma incremental e novas funcionalidades serão adicionadas nas próximas versões.

---

## 👩‍💻 Desenvolvido por

**Thais Guedes**
