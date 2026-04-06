## Site William Leonel

Landing page institucional e de captacao de leads para a assessoria de investimentos do William Leonel, vinculada a Ethimos Investimentos / BTG Pactual.

## Getting Started

1. Crie o arquivo `.env.local` com base em `.env.example`.
2. Para desenvolvimento local, use `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
3. Na Vercel, use `NEXT_PUBLIC_SITE_URL=https://williamleonel.com.br`.
4. Rode o servidor:

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

O arquivo `.env.local` e outras variantes locais ja estao ignorados no Git.

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
