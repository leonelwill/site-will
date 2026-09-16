---
name: site-quality-audit
description: Audita o site William Leonel, em produção ou local, com navegador real e inspeção de código, cobrindo design, conversão, funções, estados, responsividade, acessibilidade, efeitos, animações e imagens. Use quando o usuário pedir QA completo, design review, auditoria do site, revisão visual/funcional ou um plano de melhorias; não use para implementar as correções sem pedido explícito.
---

# QA do site William Leonel

Produza um diagnóstico baseado em evidências, não uma lista de gostos pessoais. A auditoria cruza o que foi renderizado, o que o DOM computou, o comportamento observado e o código que explica o achado.

## Limites fixos

- O tema institucional é claro. Não proponha dark mode.
- Preserve a identidade Ethimos, os tokens existentes e a prioridade de conversão. Referências externas inspiram critérios; não autorizam copiar estética, componentes ou dependências.
- Não implemente correções durante a auditoria. Gere laudo e backlog; só altere produto em tarefa posterior e explícita.
- Em produção, não envie lead real, não conclua mensagem externa e não altere dados. Validações podem ser exercitadas sem submissão. Teste de entrega exige ambiente local/staging e canal seguro autorizado.
- Rotas com token (`/e/[token]`, `/est/[token]`) só entram no QA dinâmico quando houver token de teste autorizado. Não use nem exponha dados reais.
- Não afirme compatibilidade, acessibilidade, performance ou funcionamento sem a evidência correspondente. Marque o que não foi testado.

## Antes de auditar

1. Leia `AGENTS.md`, `memory/MEMORY.md`, `CLAUDE.md` e a Seção 4 de `memory/historico_ias.md`.
2. Leia o plano vigente em `PLANO_AVALIACAO_SITE.md`; ele define o recorte inicial, fases e portões.
3. Faça inventário das rotas e componentes reais. Não presuma que a documentação está atualizada.
4. Registre URL, commit/deploy quando identificável, data, navegador, viewport, acesso disponível e limitações.
5. Leia [protocolo de auditoria](references/audit-protocol.md). Para auditoria completa, aplique todas as trilhas; para pedido parcial, aplique apenas as trilhas declaradas.
6. Leia [biblioteca de referências](references/reference-library.md) somente quando comparar direção visual, movimento, efeitos, 3D ou componentes.
7. Leia [formato do laudo](references/report-template.md) antes de consolidar achados.

## Ordem da auditoria

1. **Baseline:** capture a página antes de interagir e faça scroll completo para montar conteúdo lazy.
2. **Jornadas:** percorra navegação, âncoras, menu mobile, CTAs, links externos, formulário e estados seguros.
3. **Matriz responsiva:** execute mobile, tablet e desktop; acrescente larguras-limite quando um defeito aparecer.
4. **Design e conteúdo:** avalie hierarquia, ritmo, craft, coerência, autoridade, confiança e foco de conversão.
5. **Movimento:** observe entrada, scroll, hover, foco, transições, estabilidade, performance e movimento reduzido.
6. **Imagens:** verifique propósito, qualidade, crop, ponto focal, carregamento, dimensões, texto alternativo e consistência de marca.
7. **DOM e código:** confirme contraste, dimensões, overflow, estilos computados, semântica, estados e a causa provável no repositório.
8. **Síntese:** deduplique, atribua severidade e confiança, separe fato de hipótese e monte prioridades.

## Evidência mínima por achado

Todo achado precisa de:

- ID estável (`FUN-`, `VIS-`, `MOT-`, `IMG-`, `A11Y-`, `PERF-`, `CONV-`);
- local exato: rota + viewport + elemento e, quando possível, `arquivo:linha`;
- evidência observada ou medida;
- consequência para a pessoa usuária ou para o objetivo de conversão/confiança;
- correção concreta, preferindo o sistema já existente;
- severidade e confiança conforme o protocolo.

Print isolado não prova comportamento. Código isolado não prova renderização. Quando a afirmação depender dos dois, colete os dois.

## Uso das referências externas

Use Spell, Inspora, Refero Styles, GSAP, Three.js e 21st.dev como catálogo de perguntas e padrões, nunca como checklist de novidades a adicionar. Uma recomendação de GSAP ou Three.js só é válida se:

1. resolver um objetivo narrativo ou interativo específico;
2. superar claramente Framer Motion/CSS já presentes;
3. declarar impacto em bundle, LCP/INP, manutenção e movimento reduzido;
4. oferecer fallback sem efeito e sem WebGL.

Caso contrário, recomende refino com a stack existente.

## Portão de conclusão

Não declare “QA completo” até que o laudo tenha:

- matriz de escopo preenchida com `testado`, `não testado` ou `bloqueado`;
- evidência para todos os achados;
- estados positivos e negativos cobertos onde seguro;
- mobile, tablet e desktop;
- teclado e `prefers-reduced-motion`;
- separação entre produção observada e código local;
- no máximo cinco prioridades executivas;
- seção “o que funciona e deve ser preservado”;
- limitações explícitas, sem transformar hipótese em falha.

Ao finalizar uma sessão relevante, registre a auditoria ou o plano em `memory/historico_ias.md` conforme o template do projeto.
