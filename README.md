# PZ Community Rank 🧟

Site de ranking para o desafio de sobrevivência da comunidade de Project Zomboid.

---

## Como colocar no ar (passo a passo)

### Passo 1 — Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New project** e preencha:
   - Nome do projeto: `pz-rank`
   - Senha do banco: guarde bem
   - Região: South America (São Paulo)
3. Aguarde o projeto ser criado (cerca de 1 minuto)

### Passo 2 — Criar o banco de dados

1. No painel do Supabase, clique em **SQL Editor** no menu lateral
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase_setup.sql` e cole no editor
4. Clique em **Run** (ou Ctrl+Enter)
5. Deve aparecer "Success" — a tabela foi criada

### Passo 3 — Criar o bucket de imagens

1. No painel, clique em **Storage** no menu lateral
2. Clique em **New bucket**
3. Nome: `screenshots`
4. Marque a opção **Public bucket** como ativada
5. Clique em **Create bucket**

### Passo 4 — Pegar suas chaves de API

1. No painel, clique em **Settings** (ícone de engrenagem) → **API**
2. Copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon public** key (chave longa começando com `eyJ...`)

### Passo 5 — Configurar o projeto

Abra o arquivo `js/config.js` e substitua os valores:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...sua chave anon aqui...';
```

### Passo 6 — Subir para o GitHub

1. Crie uma conta em [github.com](https://github.com) se não tiver
2. Crie um **novo repositório** (pode ser público ou privado)
3. Faça upload de todos os arquivos do projeto para o repositório

Via terminal (opcional):
```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USUARIO/pz-rank.git
git push -u origin main
```

### Passo 7 — Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta (pode usar o login do GitHub)
2. Clique em **Add New → Project**
3. Selecione o repositório `pz-rank` que você criou
4. Clique em **Deploy** — sem nenhuma configuração extra necessária
5. Em 30 segundos o site estará no ar com uma URL do tipo `pz-rank.vercel.app`

---

## Estrutura do projeto

```
pz-rank/
├── index.html              # Página principal
├── css/
│   └── style.css           # Todos os estilos
├── js/
│   ├── config.js           # ⚠️ Suas chaves do Supabase (edite aqui)
│   ├── db.js               # Integração com o banco de dados
│   └── app.js              # Lógica da aplicação
└── supabase_setup.sql      # SQL para criar a tabela (rode uma vez)
```

---

## Funcionalidades

- Ranking em tempo real salvo no banco de dados
- Ordenação por dias vivo, zumbis mortos ou tempo total
- Upload de print das habilidades (armazenado no Supabase Storage)
- Link clicável para a live ou VOD
- Top 3 com medalhas de ouro, prata e bronze
- Visualizador fullscreen do screenshot
- Layout responsivo para mobile e desktop

---

## Plano gratuito — limites

| Recurso         | Limite gratuito      | Estimativa p/ 100 players |
|-----------------|----------------------|---------------------------|
| Banco de dados  | 500 MB               | ~1 MB (sobra muito)       |
| Storage (imgs)  | 1 GB                 | ~500 MB (5 MB × 100)      |
| Requisições/mês | 50.000               | ~500 (bem abaixo)         |
| Vercel          | Ilimitado            | —                         |

---

## Dúvidas

Se o site aparecer em branco, abra o console do navegador (F12 → Console) e veja a mensagem de erro. Geralmente é a URL ou chave do Supabase incorreta no `config.js`.
