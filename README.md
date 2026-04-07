## Site William Leonel

Landing page institucional e de captacao de leads para a assessoria de investimentos do William Leonel, vinculada a Ethimos Investimentos / BTG Pactual.

## Arquitetura Atual

- `src/app/layout.tsx` monta a estrutura global com `Navbar`, `StickyContactBar`, `Footer`, metadata SEO e JSON-LD.
- `src/app/page.tsx` compoe a homepage em 5 secoes ativas: `Hero`, `AuthoritySection`, `AboutMe`, `Services` e `ContactCTA`.
- `src/app/api/lead/route.ts` recebe leads com validacao server-side, honeypot, rate limit em memoria, timeout nas integracoes e Turnstile opcional.
- `src/app/api/private-photo/[slug]/route.ts` serve fotos pessoais a partir da pasta local `private-photos/`, que fica fora do versionamento.
- `src/components/sections/ContactCTA.tsx` concentra o formulario principal de conversao.
- `src/components/sections/AboutMe.tsx` consome as fotos do William via rota local privada, com fallback visual se a imagem falhar.
- `next.config.ts` aplica headers de seguranca em producao.

## Getting Started

1. Crie o arquivo `.env.local` com base em `.env.example`.
2. Para desenvolvimento local, use `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
3. Na Vercel, use `NEXT_PUBLIC_SITE_URL=https://williamleonel.com.br`.
4. Se quiser usar as fotos privadas do William, coloque os arquivos abaixo em `private-photos/`:
   - `private-photos/william-about.jpg`
   - `private-photos/william-about2.jpg`
5. Rode o servidor:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `RESEND_API_KEY`
- `LEAD_NOTIFICATION_EMAIL`
- `LEAD_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `LEAD_WEBHOOK_URL` opcional
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` opcional
- `TURNSTILE_SECRET_KEY` opcional

O arquivo `.env.local` e outras variantes locais ja estao ignorados no Git.

## Fotos Privadas

- Fotos pessoais nao devem ficar em `public/`.
- O diretorio correto e `private-photos/`, que ja esta no `.gitignore`.
- As imagens sao servidas pela rota `/api/private-photo/[slug]`.
- Slugs atualmente suportados:
  - `/api/private-photo/william-about`
  - `/api/private-photo/william-about2`
- Se os arquivos nao existirem localmente, o `AboutMe` continua funcionando com fallback visual.

## Deploy

O projeto esta configurado para deploy na Vercel com dominio final em [https://williamleonel.com.br](https://williamleonel.com.br).

Ao alterar variaveis de ambiente na Vercel, faca um novo deploy para garantir que o build use os valores atualizados.

## Stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Framer Motion
- Vercel
