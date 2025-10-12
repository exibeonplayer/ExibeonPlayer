# 🎬 Exibeon Player Site

Sistema de gerenciamento de conteúdo para o Exibeon Player - Plataforma completa para upload, organização e distribuição de conteúdo multimídia para players digitais.

## 🚀 Funcionalidades

- 📊 **Dashboard** - Painel de controle com métricas e estatísticas
- 📹 **Gestão de Conteúdo** - Upload e gerenciamento de vídeos
- 🎵 **Playlists** - Criação e organização de playlists
- 🖥️ **Players** - Gerenciamento de dispositivos players
- 📈 **Relatórios** - Análise de dados e atividades
- 🔐 **Licenças** - Controle de licenças e usuários

## 🛠️ Tecnologias

- **React** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e banco de dados
- **Shadcn/ui** - Componentes UI
- **Lucide React** - Ícones

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/exibeon-player-site.git
cd exibeon-player-site
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# As credenciais do Supabase estão em: src/integrations/supabase/client.ts
# Para produção, considere usar variáveis de ambiente
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🌐 Deploy na Vercel

### Deploy Automático (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `exibeon-player-site`
5. Configure as variáveis de ambiente (se necessário)
6. Clique em **"Deploy"**

### Deploy via CLI

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod
```

## 🔧 Configurações Importantes

### Footer Links

Edite `src/components/Footer.tsx` para configurar:
- **Link de Download do Player**: `PLAYER_DOWNLOAD_LINK`
- **Número do WhatsApp**: `WHATSAPP_LINK` (formato: `https://wa.me/55DDDNÚMERO`)

### Supabase

As credenciais estão em `src/integrations/supabase/client.ts`

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Executa linter
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Autenticação via Supabase Auth
- ✅ Isolamento de dados por usuário
- ✅ Políticas de acesso granulares

## 📄 Licença

© 2025 Exibeon Player | Todos os direitos reservados.

## 📞 Suporte

Entre em contato através do WhatsApp disponível no rodapé do site.

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
