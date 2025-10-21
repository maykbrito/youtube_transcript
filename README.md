# 🎬 YouTube Transcript Extractor

Uma aplicação web moderna e elegante para extrair transcrições de vídeos do YouTube de forma rápida e fácil.

## 📋 Sobre o Projeto

O **YouTube Transcript Extractor** é uma ferramenta que permite obter automaticamente as transcrições (legendas) de qualquer vídeo do YouTube. Basta inserir a URL do vídeo e a aplicação irá buscar e exibir toda a transcrição disponível.

### ✨ Funcionalidades

- 🔗 **Extração simples**: Cole a URL do YouTube e obtenha a transcrição instantaneamente
- 🌐 **Suporte multilíngue**: Prioriza português e inglês, mas funciona com outros idiomas
- 📋 **Cópia fácil**: Botão para copiar toda a transcrição com um clique
- 📱 **Design responsivo**: Funciona perfeitamente em desktop e mobile
- ⚡ **Performance otimizada**: Carregamento rápido e interface fluida

## 🛠️ Tecnologias Utilizadas

### Frontend & Framework
- **[Astro](https://astro.build/)** - Framework web moderno para sites estáticos e dinâmicos
- **[TypeScript](https://www.typescriptlang.org/)** - Superset do JavaScript com tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário para estilização rápida

### Backend & Deploy
- **[Netlify](https://www.netlify.com/)** - Plataforma de deploy e hospedagem
- **Server-Side Rendering (SSR)** - Renderização no servidor para melhor performance

### Ferramentas de Desenvolvimento
- **[Bun](https://bun.sh/)** - Runtime JavaScript ultra-rápido
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automatizado

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior) ou Bun
- Git

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/youtube_transcript.git
   cd youtube_transcript
   ```

2. **Instale as dependências**
   ```bash
   # Com Bun (recomendado)
   bun install
   
   # Ou com npm
   npm install
   ```

3. **Execute o projeto em modo de desenvolvimento**
   ```bash
   # Com Bun
   bun run dev
   
   # Ou com npm
   npm run dev
   ```

4. **Acesse a aplicação**
   Abra seu navegador e vá para `http://localhost:4321`

### Scripts Disponíveis

- `bun run dev` - Inicia o servidor de desenvolvimento
- `bun run build` - Gera a build de produção
- `bun run preview` - Visualiza a build de produção localmente
- `bun run check-types` - Verifica os tipos TypeScript

## 📖 Como Usar

1. **Acesse a aplicação** no seu navegador
2. **Cole a URL** do vídeo do YouTube no campo de entrada
3. **Clique em "Pegar transcrição"** e aguarde o processamento
4. **Visualize a transcrição** que aparecerá na tela
5. **Use o botão "Copiar"** para copiar todo o texto para a área de transferência

## Usando como API

A aplicação também pode ser usada como uma API para buscar transcrições de vídeos do YouTube.

### Formatos de URL Suportados
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

## 🏗️ Estrutura do Projeto

```
youtube_transcript/
├── .github/workflows/     # Configurações do GitHub Actions
├── .vscode/              # Configurações do VS Code
├── public/               # Arquivos estáticos
│   ├── favicon.svg       # Ícone da aplicação
├── src/
│   ├── lib/             # Bibliotecas e utilitários
│   │   └── fetch-youtube.ts  # Lógica de extração do YouTube
│   ├── pages/           # Páginas da aplicação
│   │   ├── api/         # Endpoints da API
│   │   │   └── youtube.ts    # API para buscar transcrições
│   │   └── index.astro  # Página principal
│   └── styles/          # Estilos globais
├── astro.config.mjs     # Configuração do Astro
├── package.json         # Dependências e scripts
└── tsconfig.json        # Configuração do TypeScript
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**MYK Brito**

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!