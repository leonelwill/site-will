# Plano de execução — avaliação completa do site William Leonel

> Pedido do William em 16/09/2026. Execução iniciada na mesma data; as Fases 0 e 1 estão concluídas e a retomada começa na Fase 2.

## Objetivo

Auditar `https://williamleonel.com.br/` com navegador real e inspeção do repositório, cobrindo design, conversão, funções, estados, efeitos, animações, imagens, responsividade, acessibilidade e performance percebida. O resultado será um laudo priorizado, com evidência reproduzível e recomendações compatíveis com o sistema Ethimos.

## Estado global — leia primeiro

- **Situação:** 🟦 EM EXECUÇÃO — F0 e F1 concluídas; C1 ainda depende de F2–F4
- **Próxima fase:** Fase 2 — Design, narrativa, conversão e confiança
- **Última fase concluída:** Fase 1 em 16/09/2026
- **Laudo incremental:** `RELATORIO_QA_SITE_2026-09-16.md`
- **Diretório de evidências:** `.site-qa/2026-09-16/`
- **Bloqueios conhecidos:** escopo de `/cloud` e tokens sintéticos para `/e/[token]` e `/est/[token]` não confirmados; isso não bloqueia a homepage

Ao terminar ou interromper uma fase, atualize este bloco na mesma sessão. A próxima IA deve começar aqui, ler somente a fase indicada e consultar fases anteriores apenas se o bloco apontar uma dependência.

## Adaptação da skill `criar-plano` do Zeno

### O que se aplica

- plano como documento de handoff, não como lista de desejos;
- fases que cabem em uma sessão e fecham com prova focada;
- caminhos reais, contrato, armadilha e portão em cada fase;
- evidência fresca antes de marcar conclusão;
- bloco obrigatório `Status / Evidência / FALTA` atualizado na mesma sessão;
- checkpoints proporcionais, sem repetir a auditoria inteira após cada fase;
- decisões do William ficam bloqueadas e explícitas, nunca presumidas.

### O que não se aplica

- `PENDENCIAS.md`: este repositório não possui essa fila; este plano é a fonte canônica até o laudo final;
- delegação automática via OpenCode: não se aplica; quando William pedir apoio explícito, usar a skill local `site-qa-agent-team`, limitar o agente à inspeção estática e verificar tudo de forma independente;
- `caveman`, `simplify`, revisão de diff, CI e PR por fase: não há implementação nesta auditoria;
- cinco temas, `qa:shot` e comandos do Zeno: o site William tem tema claro congelado e outra stack de QA;
- testes completos de código a cada fase: `lint`, `test` e `build` não provam experiência renderizada e só entram se uma investigação de código exigir.

## Regras de execução e economia de contexto

1. Execute **uma fase por vez**. Não antecipe a seguinte só porque restaram tokens.
2. Antes da fase, leia apenas: este plano, o `SKILL.md` da `site-quality-audit` e as referências citadas pela fase.
3. Mantenha o laudo incremental em `RELATORIO_QA_SITE_<AAAA-MM-DD>.md`; não deixe descobertas apenas na conversa.
4. Salve screenshots, clips e dumps em `.site-qa/<AAAA-MM-DD>/fase-N/`. O Git ignora esse diretório.
5. Um achado só entra no laudo com ID, local, evidência, consequência, severidade, confiança e correção verificável.
6. Se os tokens estiverem acabando, pare em um limite seguro, marque a fase `🟨 PARCIAL`, escreva o ponto exato de retomada e não resuma evidência ainda não coletada.
7. Só use `✅ CONCLUÍDA` quando o portão da fase estiver satisfeito. “Olhei” ou “parece correto” não é evidência.
8. Ao concluir a fase, atualize: Estado global, bloco da fase, laudo incremental e `memory/historico_ias.md`.
9. Não implementar correções. O produto permanece intocado durante F0–F7.

### Blocos de status permitidos

```markdown
**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.
```

```markdown
**Status:** 🟨 PARCIAL em <data> — <último resultado seguro>.
**Evidência:** <arquivos/capturas/medidas já produzidos>.
**FALTA:** <primeira ação exata da retomada + itens restantes>.
```

```markdown
**Status:** ✅ CONCLUÍDA em <data> — <resultado da fase em uma linha>.
**Evidência:** <artefatos e veredito do portão>.
**FALTA:** nada nesta fase | <limitação explicitamente transferida>.
```

## Skills e fontes aplicáveis

- `site-quality-audit` — protocolo principal criado para este repositório.
- `web-design-guidelines` — revisão atualizada do código/interface conforme as regras da Vercel.
- `webapp-testing` ou ferramenta de navegador equivalente — interação, screenshots, DOM, console e viewports.
- `vercel-react-best-practices` — apenas na leitura de causas em React/Next e em eventual fase futura de implementação.
- Zeno `avaliar-design` — reaproveitar DOM medido, Craft, Nielsen, Rams e WCAG; não carregar os cinco temas e regras exclusivas do Zeno.
- Zeno `criar-plano` — fases verificáveis, status e evidência; sem importar rituais de CI/PR/delegação que não se aplicam.
- Referências: Spell, Inspora, Refero Styles, GSAP, Three.js e 21st.dev, conforme `.agents/skills/site-quality-audit/references/reference-library.md`.

## Invariantes

1. Tema claro permanece congelado; auditoria não propõe dark mode.
2. Não copiar um site ou componente de referência. Traduzir referência em princípio compatível com marca, tokens e objetivo.
3. Não adicionar GSAP, Three.js ou biblioteca visual sem caso concreto, comparação com Framer Motion/CSS, fallback e orçamento de performance.
4. Nenhum achado sem rota, viewport, elemento, evidência, consequência e correção verificável.
5. Não enviar lead, WhatsApp ou outra ação externa real em produção.
6. Dados/tokens reais não entram em screenshots, logs, prompts ou Git.
7. Auditoria não implementa correções. O backlog resultante será submetido à decisão do William.
8. A prioridade principal é conversão confiável; estética não pode reduzir clareza, autoridade, acessibilidade ou velocidade.

## Escopo inicial

### Dentro

- Homepage `/`: Hero, AuthoritySection, AboutMe, Services, ContactCTA.
- Casca global: Navbar, Footer e StickyContactBar.
- Jornadas públicas: navegação/âncoras, menu mobile, links, CTAs, validação segura do formulário e estados observáveis.
- Design system renderizado, tipografia, tokens, responsividade e consistência.
- Efeitos/animações existentes em Framer Motion, IntersectionObserver e CSS.
- Imagens, logos e fallbacks usados nas páginas auditadas.
- Console, rede, overflow, metadata básica e performance percebida.

### Condicional

- `/cloud`: auditar se for rota pública deliberada e relevante para o site institucional.
- `/e/[token]` e `/est/[token]`: somente com token sintético/de teste e confirmação do escopo.
- Entrega real do formulário: somente em local/staging com sink seguro ou autorização específica.
- Safari/Firefox e leitor de tela: executar se houver ferramenta/ambiente; caso contrário registrar como não testado.

### Fora de propósito

- Redesign ou implementação.
- Dark mode.
- Pentest, fuzzing de API ou teste destrutivo.
- Pesquisa com usuários, analytics e CRO quantitativo sem dados fornecidos.
- Promessas de conformidade WCAG; o trabalho é auditoria heurística/técnica amostral.

## Estratégia de evidência

- Evidências temporárias: `.site-qa/<AAAA-MM-DD>/` (ignorado pelo Git).
- Laudo persistente proposto: `RELATORIO_QA_SITE_<AAAA-MM-DD>.md`.
- Captura por achado: screenshot/clip quando visual, dump do DOM/computed style quando mensurável, passos quando funcional e `arquivo:linha` quando a causa estiver no código.
- Viewports-base: 390×844, 768×1024 e 1440×900.
- Cada fase fecha com o menor portão que prova seu contrato; o checkpoint final deduplica e revisa coerência.

## Checkpoints

| Checkpoint | Quando | Prova mínima |
|---|---|---|
| C0 — Escopo confiável | após F0 | inventário + baseline nas três viewports + matriz de cobertura |
| C1 — Experiência observada | após F1–F4 | jornadas, design, movimento e mídia registrados no laudo, sem lacunas ocultas |
| C2 — Qualidade técnica | após F5–F6 | acessibilidade/responsividade e performance com ambiente e limitações declarados |
| C3 — Laudo final | após F7 | achados deduplicados, severidade/confiança revisadas e até cinco prioridades executivas |

Não repita fases anteriores em cada checkpoint. Faça smoke direcionado apenas quando um achado posterior contradisser evidência anterior.

## Fase 0 — Baseline e inventário  ✅ CONCLUÍDA

**Objetivo:** congelar o que está sendo auditado e impedir conclusões sobre deploy/rota errados.

**Ações:**

- registrar data, URL final após redirects, commit/deploy quando identificável, navegador, DPR e acesso;
- inventariar rotas reais em `src/app/`, seções de `src/app/page.tsx` e componentes globais de `src/app/layout.tsx`;
- mapear links/CTAs a partir de `src/lib/contact.ts` e estados do formulário em `src/components/sections/ContactCTA.tsx`;
- capturar baseline full-page e primeira dobra nas três viewports;
- criar matriz `testado/não testado/bloqueado`.

**Armadilha:** confundir produção com a branch local ou assumir que uma rota documentada está publicada.

**Portão:** inventário cita caminhos existentes e cada captura registra URL + viewport.

**Status:** ✅ CONCLUÍDA em 16/09/2026 — produção identificada, inventário confirmado e baseline capturado nas três viewports.
**Evidência:** `.site-qa/2026-09-16/fase-0/MANIFESTO.md`, `browser-metadata.json`, seis PNGs com SHA-256 e seção F0 de `RELATORIO_QA_SITE_2026-09-16.md`; checkpoint C0 satisfeito.
**FALTA:** nada nesta fase. `/cloud` e rotas com token permanecem condicionais, sem bloquear F1 da homepage.

## Fase 1 — Jornadas, funções e estados  ✅ CONCLUÍDA

**Objetivo:** provar que os caminhos públicos funcionam sem gerar efeito externo indevido.

**Ações:**

- testar Navbar, âncoras, menu mobile, StickyContactBar, CTAs, WhatsApp, redes e Footer;
- exercitar teclado, Escape, foco e retorno após interação;
- testar campos vazios/inválidos, rótulos, autocomplete, mensagens e bloqueios do formulário sem submissão real;
- observar estados loading/success/error via local/staging apenas se houver canal seguro;
- registrar console, requests falhas, links quebrados e sobreposições.

**Arquivos de causa prováveis:** `src/components/layout/*.tsx`, `src/components/sections/ContactCTA.tsx`, `src/lib/contact.ts`, `src/app/api/lead/route.ts`.

**Armadilha:** um link abrir não prova que o destino, contexto, foco e retorno estejam corretos.

**Portão:** tabela de casos contém pré-condição, ação, esperado, observado e evidência.

**Status:** ✅ CONCLUÍDA em 16/09/2026 — jornadas públicas testadas sem submissão externa; apoio OpenCode Go revisado e triado pelo coordenador.
**Evidência:** `.site-qa/2026-09-16/fase-1/MANIFESTO.md`, `functional-results.json`, `verified-cases.json`, capturas e seção F1 de `RELATORIO_QA_SITE_2026-09-16.md`.
**FALTA:** nada para fechar a fase. Loading/success/error de entrega permanecem explicitamente não testados até existir staging/local com canal seguro; isso não bloqueia a F2.

## Fase 2 — Design, narrativa, conversão e confiança  ⬜ A FAZER

**Objetivo:** avaliar se a experiência comunica valor, autoridade e próximo passo com acabamento consistente.

**Ações:**

- revisar primeira dobra, CTA dominante, hierarquia, tipografia, ritmo, densidade, cards, ícones, bordas e elevação;
- percorrer a narrativa Hero → autoridade → pessoa → serviços → contato;
- avaliar honestidade de claims, números e prova social, com rigor maior por se tratar de finanças;
- comparar tokens/renderização com `src/app/globals.css` e regras de `CLAUDE.md`;
- usar Spell, Inspora, Refero Styles e 21st.dev para atributos específicos, sem clonagem.

**Armadilha:** transformar repertório externo em colagem e apagar a identidade Ethimos.

**Portão:** toda referência citada segue atributo → problema → adaptação → custo/risco; preferência estética sem consequência não vira achado.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Fase 3 — Efeitos, animações e movimento  ⬜ A FAZER

**Objetivo:** verificar propósito, física, estabilidade, acessibilidade e custo do movimento atual.

**Ações:**

- observar visita fresca, scroll completo, hover, foco e interações nas três viewports;
- repetir com `prefers-reduced-motion: reduce`;
- inspecionar `AnimateOnScroll`, `Counter`, transições CSS e propriedades animadas;
- registrar frame drops perceptíveis, CLS, conteúdo preso em opacity, hover-only e competição por atenção;
- consultar GSAP/Three.js apenas como portões de oportunidade concreta.

**Arquivos de causa prováveis:** `src/components/ui/AnimateOnScroll.tsx`, `src/components/ui/Counter.tsx`, `src/app/globals.css` e consumidores.

**Armadilha:** recomendar tecnologia por espetáculo. O site atual já possui Framer Motion; substituição exige ganho demonstrável.

**Portão:** cada recomendação de movimento nomeia objetivo, trigger, duração/easing ou técnica, fallback e impacto esperado.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Fase 4 — Imagens, logos e mídia  ⬜ A FAZER

**Objetivo:** garantir que mídia reforça confiança e mantém qualidade/custo em todas as larguras.

**Ações:**

- auditar fotos de AboutMe, logos de Navbar/Footer, ícones de marca e fallbacks;
- medir dimensões renderizadas/naturais, crop, ponto focal, compressão, prioridade/lazy e estabilidade;
- revisar `alt`, função decorativa/informativa e consistência com contexto claro;
- identificar ausência de prova visual apenas quando houver função clara para a imagem sugerida.

**Arquivos de causa prováveis:** `src/components/sections/AboutMe.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/lib/theme.ts`, `public/images/`.

**Armadilha:** “adicionar imagem” não é recomendação sem função narrativa e plano responsivo.

**Portão:** inventário de mídia por viewport com função, achado, bytes/dimensões quando relevante e correção.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Fase 5 — Responsividade e acessibilidade  ⬜ A FAZER

**Objetivo:** verificar uso real por teclado, touch, zoom e movimento reduzido, além de checagens WCAG aplicáveis.

**Ações:**

- medir contraste, alvos, overflow, reflow, ordem de headings/landmarks e nomes acessíveis;
- testar foco visível, labels/erros, dependência de cor/hover e sticky elements;
- executar a versão atual da `web-design-guidelines` contra os arquivos de UI;
- usar automação acessível disponível, seguida de verificação manual dos achados.

**Armadilha:** ferramenta automática verde não significa acessibilidade completa.

**Portão:** cada requisito tem `pass/fail/não testado`, evidência e limite da ferramenta.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Fase 6 — Performance percebida e integridade técnica  ⬜ A FAZER

**Objetivo:** ligar custo técnico a impactos visíveis, sem transformar o trabalho em auditoria genérica de engenharia.

**Ações:**

- coletar erros de console/rede e sinais de hidratação;
- medir LCP/CLS/INP em execução registrada quando a ferramenta estiver disponível;
- identificar peso dominante de imagens, fontes, JavaScript e terceiros;
- conferir metadata/canonical/OG e comportamento de carregamento que afete confiança ou compartilhamento;
- revisar causa provável no Next/React usando documentação local compatível com Next 16.

**Armadilha:** comparar números de laboratório obtidos com condições diferentes ou tratar score como experiência.

**Portão:** toda métrica informa ambiente; cada recomendação técnica aponta efeito percebido.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Fase 7 — Síntese e plano de melhorias  ⬜ A FAZER

**Objetivo:** entregar um laudo que permita decidir o próximo ciclo sem reler a sessão.

**Ações:**

- deduplicar achados cruzados e separar causa de sintoma;
- classificar S0–S3 e confiança O-M/O-V/O-I/O-C/INF/HIP;
- escrever resumo executivo, matriz de cobertura, achados, referências aplicadas e limitações;
- destacar o que funciona e deve ser preservado;
- montar no máximo cinco prioridades executivas e um backlog restante;
- separar melhorias de refinamento, correções funcionais e experimentos dependentes de decisão/analytics.

**Portão integrador:** revisar cada achado contra evidência, severidade e correção; nenhum “QA completo” com célula vazia ou área não testada escondida.

**Entregável:** `RELATORIO_QA_SITE_<AAAA-MM-DD>.md`, sem implementação.

**Status:** ⬜ A FAZER
**Evidência:** —
**FALTA:** executar a fase inteira.

## Status geral

| Fase | Estado | Evidência |
|---|---|---|
| F0 — Baseline e inventário | ✅ FEITA | `.site-qa/2026-09-16/fase-0/MANIFESTO.md`, `browser-metadata.json`, 6 PNGs com SHA-256 |
| F1 — Jornadas, funções e estados | ✅ FEITA | `.site-qa/2026-09-16/fase-1/MANIFESTO.md`, `functional-results.json`, `verified-cases.json`, capturas |
| F2 — Design, narrativa, conversão e confiança | ⬜ A FAZER | Nenhum commit tocou `src/components/` ou `globals.css` após a sessão de 16/09 |
| F3 — Efeitos, animações e movimento | ⬜ A FAZER | Nenhuma evidência; `AnimateOnScroll.tsx`, `Counter.tsx` inalterados |
| F4 — Imagens, logos e mídia | ⬜ A FAZER | Nenhuma evidência; nenhum inventário de mídia produzido |
| F5 — Responsividade e acessibilidade | ⬜ A FAZER | Nenhuma evidência; `web-design-guidelines` não executada |
| F6 — Performance percebida e integridade técnica | ⬜ A FAZER | Nenhuma evidência; métricas não coletadas |
| F7 — Síntese e plano de melhorias | ⬜ A FAZER | Nenhum laudo finalizado; `RELATORIO_QA_SITE_2026-09-16.md` ainda cobre só F0–F1 |

**Retomar aqui:** Fase 2 — Design, narrativa, conversão e confiança. Iniciar com visita fresca ao site, revisar primeira dobra/CTA/hierarquia, comparar tokens com `globals.css`, e registrar achados seguindo o contrato (atributo → problema → adaptação → custo/risco). A evidência de F0–F1 está sólida; os achados F1 (FUN-01, A11Y-01, FUN-02, A11Y-02) ficam registrados no laudo para verificação cruzada quando F5 rodar.

## Checkpoint posterior, fora desta auditoria

Se o William aprovar correções, criar plano de implementação separado. Após o último commit que muda pixels, repetir apenas casos afetados + smoke completo da homepage e comparar evidências antes/depois. Não misturar essa futura implementação com o laudo original.
