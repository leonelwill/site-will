# Site William Leonel - Assessoria de Investimentos

## Visao Geral

Site institucional e de captacao de leads para a assessoria de investimentos do William Leonel, vinculado a Ethimos Investimentos / BTG Pactual. O foco principal atual e conversao de leads qualificados; o foco secundario e reforco de autoridade para visitantes vindos de redes sociais. Deployado na Vercel com integracoes futuras ao CRM Zeno.

---

## Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.x |
| Linguagem | TypeScript | 5.x |
| Estilo | Tailwind CSS | 4.x |
| Animacoes | Framer Motion | 12.x |
| Icones | Lucide React | 1.x |
| Runtime | React | 19.x |
| Deploy | Vercel | - |

**Path aliases:** `@/*` mapeia para `./src/*`

---

## Ambiente e Deploy

- Desenvolvimento local deve usar `.env.local`
- Vercel deve usar variaveis configuradas no painel do projeto
- `NEXT_PUBLIC_SITE_URL` local: `http://localhost:3000`
- `NEXT_PUBLIC_SITE_URL` em deploy: `https://williamleonel.com.br`
- E-mail atual de notificacao de lead: `william.leonel@ethimos.com.br`
- Variaveis esperadas:
  - `RESEND_API_KEY`
  - `LEAD_NOTIFICATION_EMAIL`
  - `LEAD_FROM_EMAIL`
  - `NEXT_PUBLIC_SITE_URL`
  - `LEAD_WEBHOOK_URL` opcional
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` opcional
  - `TURNSTILE_SECRET_KEY` opcional

---

## Arquitetura de Pastas

```text
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Montserrat local, tema claro fixo, Navbar, StickyContactBar, Footer, metadata SEO + JSON-LD)
│   ├── page.tsx                  # Homepage - compoe todas as sections em ordem
│   ├── globals.css               # Design tokens, CSS custom properties, classes utilitarias e temas visuais
│   └── api/
│       └── lead/route.ts         # API serverless de leads com validacao, rate limit, honeypot, timeout e validacao Turnstile opcional
├── components/
│   ├── layout/                   # Componentes estruturais (presentes em todas as paginas)
│   │   ├── Navbar.tsx            # Navegacao fixa em tema claro + menu mobile
│   │   ├── StickyContactBar.tsx  # CTA persistente para WhatsApp + solicitacao de contato
│   │   └── Footer.tsx            # Rodape claro com logo, redes sociais e disclaimer regulatorio
│   ├── sections/                 # Secoes da landing page (ordem definida em page.tsx)
│   │   ├── Hero.tsx              # Hero tipografico sem dependencia de foto, com WhatsApp e CTA de diagnostico
│   │   ├── SocialProof.tsx       # Barra de numeros animados em cartao claro
│   │   ├── AuthoritySection.tsx  # Bloco de autoridade e explicacao do processo de atendimento
│   │   ├── AboutMe.tsx           # Secao "Sobre" com foto do William, citaçao editorial e cards de perfil
│   │   ├── WhyEthimos.tsx        # Diferenciais e premios da Ethimos
│   │   ├── Services.tsx          # Servicos com 3 prioridades e grade secundaria compacta
│   │   ├── Calculators.tsx       # Secao legacy; atualmente fora da homepage
│   │   ├── Testimonials.tsx      # Secao legacy; atualmente fora da homepage
│   │   └── ContactCTA.tsx        # CTA final com formulario reduzido, honeypot e widget Turnstile opcional
│   └── ui/                       # Componentes reutilizaveis de UI
│       ├── AnimateOnScroll.tsx   # Wrapper Framer Motion para reveal no scroll
│       ├── Counter.tsx           # Contador animado com IntersectionObserver
│       ├── SectionHeading.tsx    # Titulo padronizado de secao (eyebrow + title + desc)
│       └── TurnstileWidget.tsx   # Integracao client-side com Cloudflare Turnstile
├── lib/
│   ├── contact.ts                # Dados centralizados de contato, telefone e links externos
│   └── utils.ts                  # Utilitarios (cn() para merge de classes)
├── next.config.ts                # Headers de seguranca e configuracao global do Next.js
├── public/images/                # Logos de marca publicas
└── private-photos/               # Fotos pessoais locais ignoradas no Git e servidas por rota interna
```

### Convencoes de organizacao

- **`sections/`** contem componentes de pagina inteira. Cada arquivo = uma secao da landing page.
- **`ui/`** contem componentes genericos e reutilizaveis. Nunca devem ter logica de negocio.
- **`layout/`** contem componentes presentes em todas as paginas (via `layout.tsx`).
- Novos componentes de pagina vao em `sections/`. Novos componentes atomicos vao em `ui/`.
- Dados compartilhados de contato, telefone, localizacao e links sociais devem viver em `src/lib/contact.ts`.

### Arquitetura atual da homepage

- `layout.tsx` monta a casca global com metadata, JSON-LD, `Navbar`, `StickyContactBar`, `Footer` e tema claro fixado no `<html>`.
- `page.tsx` compoe a landing page em uma unica rota estatica com 5 secoes ativas:
  - `Hero`
  - `AuthoritySection`
  - `AboutMe`
  - `Services`
  - `ContactCTA`
- `globals.css` concentra tokens da marca, variacoes de superficie (`theme-*`) e gradientes estruturais do site.
- `contact.ts` centraliza telefone, e-mail, WhatsApp e links externos para evitar divergencia de copy/CTA entre componentes.
- `next.config.ts` aplica hardening de producao com headers de seguranca e remove o `X-Powered-By`.

### Arquitetura de captura de leads

- O frontend envia `POST` para `/api/lead` com payload JSON.
- `ContactCTA.tsx` trabalha com:
  - campos essenciais sempre visiveis
  - detalhes opcionais dentro de `<details>`
  - campo honeypot invisivel (`website`)
  - Cloudflare Turnstile opcional quando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` estiver configurada
- `src/app/api/lead/route.ts` faz:
  - validacao de tipo, formato e tamanho dos campos
  - exigencia de `name` + pelo menos um canal (`phone` ou `email`)
  - validacao de origem em producao
  - rate limit em memoria por IP
  - timeout nas chamadas externas
  - validacao server-side do Turnstile quando `TURNSTILE_SECRET_KEY` estiver configurada
  - entrega concorrente para Resend e/ou webhook
  - resposta `503` em producao se nenhum canal de entrega estiver configurado

### Arquitetura de seguranca atual

- CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` e `Strict-Transport-Security` sao definidos em `next.config.ts` apenas para `production`.
- O site nao depende mais de script inline para forcar o tema claro; isso reduz a superficie de CSP.
- A rota de lead responde com `Cache-Control: no-store` e evita logar o payload completo do lead em erros.
- Turnstile foi escolhido por funcionar no plano gratuito, sem dependencia de Vercel Pro.

---

## Design System - Cores Ethimos

As cores sao definidas como CSS custom properties em `globals.css` e expostas ao Tailwind via `@theme inline`.

### Paleta de Marca

| Token Tailwind | Variavel CSS | Hex | Uso |
|---------------|-------------|-----|-----|
| `brand-primary` | `--brand-primary` | `#253164` | CTAs, headings, links, elementos de destaque |
| `brand-dark` | `--brand-dark` | `#0d1630` | Texto forte, superficies premium e elementos de contraste |
| `brand-deep` | `--brand-deep` | `#162246` | Gradientes escuros e profundidade visual |
| `brand-accent` | `--brand-accent` | `#9dbdeb` | Hover states, badges, destaques |
| `brand-white` | `--brand-white` | `#f8fafc` | Base clara do sistema |
| `brand-gold` | `--brand-gold` | `#C9A84C` | Elementos premium, selos, destaque especial |

### Neutros

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#f8fafc` | Fundo geral do site |
| `foreground` | `#172033` | Texto principal |
| `card` | `#ffffff` | Cartoes e superficies elevadas |
| `muted` | `#eef2f7` | Backgrounds secundarios |
| `muted-foreground` | `#5c6984` | Texto secundario, descricoes |
| `border` | `#d7deea` | Bordas e separadores |

### Classes CSS Utilitarias (globals.css)

| Classe | Funcao |
|--------|--------|
| `.hero-gradient` | Gradiente azul profundo para superfícies escuras |
| `.light-hero-gradient` | Gradiente claro institucional para topo e CTA final |
| `.pattern-overlay` | Overlay sutil de pontos (decorativo) |
| `.pattern-overlay-light` | Overlay sutil para fundos claros |
| `.gold-gradient` | Gradiente dourado para badges premium |
| `.animate-fade-in-up` | Animacao de entrada de baixo para cima |
| `.section-divider` | Linha horizontal com gradiente |

### Regra de ouro para cores

- **Padrao do site:** fundo claro, texto em `brand-dark`/`foreground`, destaques em `brand-primary`.
- **Fundo escuro:** usar somente quando realmente fizer sentido estrategico.
- **Logo branca:** reservar para fundos escuros reais.
- **Logo azul / completa:** preferir para navbar e footer claros.
- **Cards hover em fundo claro:** transicao para `bg-brand-dark` com texto `white`.

### Tipografia

- **Fonte principal:** Montserrat local via `next/font/local`
- Arquivos usados na raiz do projeto:
  - `Montserrat-Regular.ttf`
  - `Montserrat-Bold.ttf`
- A fonte deve ser aplicada globalmente via `layout.tsx` e exposta ao Tailwind como `--font-sans`.

---

## Padroes de Codigo

### Componentes

1. **"use client"** so quando necessario (useState, useEffect, Framer Motion, event handlers). Componentes sem interatividade devem ser Server Components.
2. **Props tipadas** com `interface` no topo do arquivo. Nunca usar `any`.
3. **Composicao sobre heranca.** Componentes de UI recebem `children` ou props especificas, nunca herdam de classes.
4. **Um componente por arquivo.** Excecao: SVG icons inline podem ser definidos no mesmo arquivo que os usa.

### Estilizacao

1. **Tailwind-first.** Usar classes utilitarias do Tailwind sempre que possivel.
2. **CSS custom properties** para tokens de design. Nunca hardcodar hex em componentes comuns da marca.
3. **Classes utilitarias em globals.css** so para padroes repetidos que nao podem ser expressos em Tailwind.
4. **Responsividade mobile-first.** O layout base e mobile.
5. **cn() helper** (`src/lib/utils.ts`) para merge condicional de classes.

### Animacoes

1. **Framer Motion** para animacoes de entrada/scroll via `<AnimateOnScroll>` wrapper.
2. **IntersectionObserver** para triggers baseados em visibilidade (`Counter.tsx`).
3. **CSS transitions** para hovers e micro-interacoes simples.
4. **`viewport={{ once: true }}`** em animacoes de scroll para executar apenas uma vez.

### Formularios

1. Formulario de lead em `ContactCTA.tsx` com state management via `useState`.
2. Envia POST para `/api/lead`.
3. Estados do form: `idle | loading | success | error`.
4. Validacao HTML nativa + validacao server-side no route handler.
5. O formulario atual prioriza conversao e qualificacao leve:
   - `name`
   - `phone` (principal)
   - `email` (opcional)
   - `patrimonio`
   - `goal`
   - `contactPreference`
   - `message` (opcional)
6. O backend aceita lead com `name` + pelo menos um canal de contato (`phone` ou `email`).
7. O formulario possui protecao anti-spam em camadas:
   - honeypot invisivel
   - rate limit na rota
   - Cloudflare Turnstile opcional por env

### SEO

1. Metadata definida em `layout.tsx` via export `metadata` do Next.js.
2. `lang="pt-BR"` no `<html>`.
3. Open Graph tags para compartilhamento em redes sociais.
4. Descricoes e titles otimizados para "assessor de investimentos", "Ethimos", "BTG Pactual".

---

## Padrao para Novas Secoes

Ao criar uma nova secao, seguir este template:

```tsx
"use client"; // so se necessario

import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function NomeDaSecao() {
  return (
    <section id="id-para-navegacao" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Categoria"
            title="Titulo da Secao"
            description="Descricao opcional."
          />
        </AnimateOnScroll>

        {/* Conteudo da secao */}
      </div>
    </section>
  );
}
```

**Regras:**
- Secao sempre com `<section id="...">` para ancoragem na Navbar.
- Container interno: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`.
- Espacamento vertical: `py-24` (padrao) ou `py-20` (secoes menores).
- Alternancia de fundos: `bg-white` -> `bg-muted` -> `light-hero-gradient` -> `hero-gradient` quando necessario.
- Usar `<SectionHeading>` para titulos consistentes.
- Envolver blocos em `<AnimateOnScroll delay={n}>` para animacao escalonada.
- Adicionar o componente em `page.tsx` na ordem desejada.
- Se tiver link na Navbar, adicionar em `Navbar.tsx` no array `navLinks`.

### Secoes ativas na homepage

Ordem atual em `page.tsx`:
1. `Hero`
2. `AuthoritySection`
3. `AboutMe`
4. `Services`
5. `ContactCTA`

---

## Assets e Imagens

### Logos (disponiveis em /public/images/)

- `logo_ethimos_white.png` -- Logo branca para fundos escuros
- `logo_ethimos_blue.png` -- Logo azul para fundos claros
- `ethimos_investimentos_logo.png` -- Logo completa

### Uso atual de logos

- Navbar clara usa `logo_ethimos_blue.png`
- Footer claro usa `ethimos_investimentos_logo.png`
- A logo branca deve ser reservada para blocos escuros reais

### Fotos do William

- `AboutMe.tsx` usa `next/image` apontando para `/api/private-photo/william-about` e `/api/private-photo/william-about2`
- Os arquivos fisicos devem ficar em `private-photos/`
- A imagem fica abaixo da dobra, com `loading="lazy"` e `priority={false}`
- Existe fallback visual com iniciais `WL` caso a imagem falhe ao carregar
- O `Hero` continua sem dependencia de foto para preservar clareza e velocidade no first paint

### Icones

- Usar **Lucide React** para icones de UI.
- Icones de redes sociais sao SVGs inline.
- Nunca usar icones de marca via Lucide.

---

## API Routes

### POST /api/lead

Recebe dados do formulario de contato:

```json
{
  "name": "string (obrigatorio)",
  "email": "string (opcional)",
  "phone": "string (obrigatorio se email nao for enviado)",
  "patrimonio": "string (opcional)",
  "goal": "string (opcional)",
  "contactPreference": "whatsapp | phone | email (opcional)",
  "message": "string (opcional)",
  "website": "string (honeypot, invisivel no fluxo normal)",
  "turnstileToken": "string (opcional no payload; obrigatorio quando Turnstile estiver configurado)"
}
```

Retorna `{ success: true }` ou `{ error: "msg" }`.

### Entrega real de leads

O route handler atual ja suporta entrega real configuravel por ambiente:

- `RESEND_API_KEY`
- `LEAD_NOTIFICATION_EMAIL`
- `LEAD_FROM_EMAIL` (opcional)
- `LEAD_WEBHOOK_URL`
- `TURNSTILE_SECRET_KEY` (opcional, para validar anti-spam)

Comportamento:
- tenta enviar para webhook e/ou Resend
- em `production`, se nenhum canal estiver configurado, responde erro para evitar perda silenciosa de lead
- valida origem e payload antes de tentar entregar
- recusa abuso basico com rate limit e honeypot
- se Turnstile estiver ativo, exige validacao server-side do token

### Dados de contato centralizados

Arquivo: `src/lib/contact.ts`

- E-mail: `william.leonel@ethimosinvestimentos.com.br`
- Telefone / WhatsApp: `(15) 99781-2560`
- Localizacao: `Sorocaba, SP`
- Links sociais atuais:
  - LinkedIn: `https://www.linkedin.com/in/williamleonel/`
  - Instagram: `https://www.instagram.com/william.leonelf/`
  - YouTube: `https://www.youtube.com/@btgpactual`

### Elementos de conversao ja implementados

- `StickyContactBar.tsx` com CTA persistente:
  - `Falar no WhatsApp`
  - `Solicitar contato`
- `AuthoritySection.tsx` consolidando numeros, pilares de credibilidade e processo de atendimento
- `ContactCTA.tsx` com formulario reduzido e detalhes opcionais dentro de bloco colapsado
- `Hero.tsx` redesenhado para first paint claro, sem placeholder de foto, com WhatsApp como CTA principal
- `Services.tsx` reorganizado para destacar 3 servicos principais e enviar o usuario ao contato com objetivo preselecionado

---

## Comandos

```bash
npm run dev      # Dev server em localhost:3000
npm run build    # Build de producao (SSG)
npm run start    # Servir build de producao
npm run lint     # Linting com ESLint
```

---

## Informacoes da Ethimos (para conteudo)

- **1o Lugar** no Ranking BTG Pactual 2025 (melhor escritorio dentre ~160)
- **2o Lugar** no Ranking BTG Pactual 2024 + 4 premios no BTG Summit 2024
- **R$ 4 Bilhoes+** sob custodia (meta 2025: R$ 5.5 Bi)
- **7.000+ clientes** atendidos
- **160+ colaboradores**, 60+ assessores
- **10 escritorios**: Campinas, Sao Paulo, Sorocaba, Piracicaba, Vinhedo, Rio Claro, Botucatu, Ribeirao Preto, Belo Horizonte, Jau
- **65%+ clientes** sao alta renda (Private/Wealth acima de R$ 1M)
- **15+ anos** de historia (fundada em Campinas)
- Parceira do **BTG Pactual** desde 2022/2023 (anteriormente XP Investimentos)
- Fundador: Claudio Foresti

---

## Proximos Passos (Roadmap)

1. Ativar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` em producao
2. Integrar calculadoras do Zeno (Aposentadoria, Patrimonio, Financas) com captura real de lead
3. Integrar leads com CRM Zeno
4. Criar paginas /sobre e /calculadoras
5. Adicionar depoimentos reais ou cases anonimizados
6. Adicionar blog com conteudo educativo
7. Medir conversao por origem (Instagram, LinkedIn, trafego direto)
8. Refinar observabilidade de erros e entregas da rota `/api/lead`
9. Revisar se vale adotar rate limit persistente fora de memoria no futuro
