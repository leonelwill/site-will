# Site William Leonel - Assessoria de Investimentos

## Visao Geral

Site institucional e de captacao de leads para a assessoria de investimentos do William Leonel, vinculado a Ethimos Investimentos / BTG Pactual. Deployado na Vercel com integracoes futuras ao CRM Zeno.

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

## Arquitetura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, Navbar, Footer, metadata SEO)
│   ├── page.tsx                  # Homepage - compoe todas as sections em ordem
│   ├── globals.css               # Design tokens, CSS custom properties, classes utilitarias
│   └── api/
│       └── lead/route.ts         # API serverless para captura de leads (POST)
├── components/
│   ├── layout/                   # Componentes estruturais (presentes em todas as paginas)
│   │   ├── Navbar.tsx            # Navegacao fixa com scroll-aware + menu mobile
│   │   └── Footer.tsx            # Links, redes sociais, disclaimer regulatorio
│   ├── sections/                 # Secoes da landing page (ordem definida em page.tsx)
│   │   ├── Hero.tsx              # Banner principal com foto placeholder + CTAs
│   │   ├── SocialProof.tsx       # Barra de numeros animados (contadores)
│   │   ├── AboutMe.tsx           # Bio do William + foto placeholder
│   │   ├── WhyEthimos.tsx        # Diferenciais e premios da Ethimos
│   │   ├── Services.tsx          # Grid de servicos oferecidos
│   │   ├── Calculators.tsx       # Preview de ferramentas (lead magnet)
│   │   ├── Testimonials.tsx      # Depoimentos de clientes
│   │   └── ContactCTA.tsx        # Formulario de lead capture
│   └── ui/                       # Componentes reutilizaveis de UI
│       ├── AnimateOnScroll.tsx    # Wrapper Framer Motion para reveal no scroll
│       ├── Counter.tsx           # Contador animado com IntersectionObserver
│       └── SectionHeading.tsx    # Titulo padronizado de secao (eyebrow + title + desc)
├── lib/
│   └── utils.ts                  # Utilitarios (cn() para merge de classes)
```

### Convencoes de organizacao

- **`sections/`** contem componentes de pagina inteira. Cada arquivo = uma secao da landing page.
- **`ui/`** contem componentes genericos e reutilizaveis. Nunca devem ter logica de negocio.
- **`layout/`** contem componentes presentes em todas as paginas (via `layout.tsx`).
- Novos componentes de pagina vao em `sections/`. Novos componentes atomicos vao em `ui/`.

---

## Design System - Cores Ethimos

As cores sao definidas como CSS custom properties em `globals.css` e expostas ao Tailwind via `@theme inline`.

### Paleta de Marca

| Token Tailwind | Variavel CSS | Hex | Uso |
|---------------|-------------|-----|-----|
| `brand-primary` | `--brand-primary` | `#253164` | CTAs, headings, links, elementos de destaque |
| `brand-dark` | `--brand-dark` | `#0f152b` | Hero backgrounds, footer, navbar scrolled |
| `brand-deep` | `--brand-deep` | `#131a30` | Gradientes, superficies escuras |
| `brand-accent` | `--brand-accent` | `#9dbdeb` | Hover states, badges, destaques em fundo escuro |
| `brand-white` | `--brand-white` | `#efefef` | Texto em fundo escuro |
| `brand-gold` | `--brand-gold` | `#C9A84C` | Elementos premium, selos, destaque especial |

### Neutros

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#f4f6f8` | Fundo geral do site |
| `foreground` | `#1a1c20` | Texto principal |
| `card` | `#ffffff` | Cartoes e superficies elevadas |
| `muted` | `#f0f2f5` | Backgrounds secundarios |
| `muted-foreground` | `#64748b` | Texto secundario, descricoes |
| `border` | `#d1d5db` | Bordas e separadores |

### Classes CSS Utilitarias (globals.css)

| Classe | Funcao |
|--------|--------|
| `.hero-gradient` | Gradiente azul profundo para heros e CTAs |
| `.pattern-overlay` | Overlay sutil de pontos (decorativo) |
| `.gold-gradient` | Gradiente dourado para badges premium |
| `.animate-fade-in-up` | Animacao de entrada de baixo para cima |
| `.section-divider` | Linha horizontal com gradiente |

### Regra de ouro para cores
- **Fundo escuro (hero, CTA, footer):** texto em `white`, destaques em `brand-accent`, badges em `brand-gold`
- **Fundo claro (sections intermediarias):** texto em `brand-dark` ou `foreground`, destaques em `brand-primary`
- **Cards hover em fundo claro:** transicao para `bg-brand-dark` com texto `white`

---

## Padroes de Codigo

### Componentes

1. **"use client"** so quando necessario (useState, useEffect, Framer Motion, event handlers). Componentes sem interatividade devem ser Server Components.
2. **Props tipadas** com `interface` no topo do arquivo. Nunca usar `any`.
3. **Composicao sobre heranca.** Componentes de UI recebem `children` ou props especificas, nunca herdam de classes.
4. **Um componente por arquivo.** Excecao: SVG icons inline podem ser definidos no mesmo arquivo que os usa (ex: Footer.tsx).

### Estilizacao

1. **Tailwind-first.** Usar classes utilitarias do Tailwind sempre que possivel.
2. **CSS custom properties** para tokens de design (cores, espacamento). Nunca hardcodar hex em componentes.
3. **Classes utilitarias em globals.css** so para padroes repetidos que nao podem ser expressos em Tailwind (gradientes complexos, keyframes).
4. **Responsividade mobile-first.** Usar breakpoints `sm:`, `md:`, `lg:` do Tailwind. O layout base e mobile.
5. **cn() helper** (`src/lib/utils.ts`) para merge condicional de classes.

### Animacoes

1. **Framer Motion** para animacoes de entrada/scroll via `<AnimateOnScroll>` wrapper.
2. **IntersectionObserver** para triggers baseados em visibilidade (Counter.tsx).
3. **CSS transitions** para hovers e micro-interacoes simples (`transition-all`, `transition-colors`).
4. **`viewport={{ once: true }}`** em animacoes de scroll para executar apenas uma vez.

### Formularios

1. Formulario de lead em `ContactCTA.tsx` com state management via `useState`.
2. Envia POST para `/api/lead` (serverless function).
3. Estados do form: `idle | loading | success | error` com feedback visual para cada.
4. Validacao HTML nativa (`required`, `type="email"`) + validacao server-side no route handler.

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
    <section id="id-para-navegacao" className="py-24 bg-white">
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
- Alternancia de fundos: `bg-white` -> `bg-muted` -> `hero-gradient` (escuro).
- Usar `<SectionHeading>` para titulos consistentes.
- Envolver blocos em `<AnimateOnScroll delay={n}>` para animacao escalonada.
- Adicionar o componente em `page.tsx` na ordem desejada.
- Se tiver link na Navbar, adicionar em `Navbar.tsx` no array `navLinks`.

---

## Assets e Imagens

### Logos (disponiveis em /public/images/)
- `logo_ethimos_white.png` -- Logo branca para fundos escuros (Navbar, Footer)
- `logo_ethimos_blue.png` -- Logo azul para fundos claros
- `ethimos_investimentos_logo.png` -- Logo completa

### Fotos do William (placeholders ativos)
Os componentes Hero.tsx e AboutMe.tsx tem placeholders visuais com instrucoes. Para ativar:
1. Adicionar `william-hero.jpg` (vertical 3:4) e `william-about.jpg` (quadrada) em `public/images/`
2. Descomentar o `<Image>` no componente
3. Remover o div placeholder

### Icones
- Usar **Lucide React** para icones de UI.
- Icones de redes sociais (LinkedIn, Instagram, YouTube) sao SVGs inline pois Lucide nao inclui icones de marca.
- Nunca usar icones de marca via Lucide (nao existem).

---

## API Routes

### POST /api/lead
Recebe dados do formulario de contato:
```json
{
  "name": "string (obrigatorio)",
  "email": "string (obrigatorio)",
  "phone": "string (opcional)",
  "patrimonio": "string (opcional)",
  "message": "string (opcional)"
}
```
Retorna `{ success: true }` ou `{ error: "msg" }`.

**TODO:** Integrar com servico de email (Resend) e/ou CRM Zeno.

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

1. Adicionar fotos reais do William nos placeholders
2. Configurar servico de email para leads (Resend)
3. Integrar calculadoras do Zeno (Aposentadoria, Patrimonio, Financas)
4. Criar paginas /sobre e /calculadoras
5. Adicionar blog com conteudo educativo
6. Widget de WhatsApp
7. Integrar leads com CRM Zeno
8. Depoimentos reais de clientes
9. Dominio personalizado na Vercel
