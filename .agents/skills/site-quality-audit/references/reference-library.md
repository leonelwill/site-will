# Biblioteca de referências

As referências abaixo funcionam como lentes de comparação. Elas não definem uma estética obrigatória e não justificam dependência nova por si só.

## Catálogos de direção visual

### Spell UI — https://spell.sh/

Use para examinar microinterações, componentes React refinados e efeitos de apresentação. Pergunte:

- o efeito esclarece o controle ou apenas chama atenção?
- estados de foco, touch e movimento reduzido continuam completos?
- o padrão pode ser reproduzido com os tokens e a stack existentes?

Não copie um componente antes de verificar licença, dependências, custo de bundle e compatibilidade com a identidade Ethimos.

### Inspora — https://www.inspora.design/

Use como moodboard por categorias (web, branding, motion, ilustração e 3D). Serve para ampliar repertório e nomear direções, não para aprovar uma solução. Uma referência escolhida precisa ser traduzida em atributos: hierarquia, densidade, ritmo, material, contraste e comportamento.

### Refero Styles — https://styles.refero.design/

Use para comparar sistemas legíveis por agentes: cores, tipografia, espaçamento e componentes. Prefira referências ligadas a serviços financeiros, confiança, clareza e “quiet premium”. Não importe um `DESIGN.md` externo sobre o sistema Ethimos; extraia princípios compatíveis e registre conflitos.

### 21st.dev — https://21st.dev/

Use para pesquisar padrões de React/Tailwind, sobretudo hero, navegação, cards, fundos e interações. Trate cada exemplo como matéria-prima:

- provar que resolve um achado real;
- adaptar a tokens e componentes do projeto;
- evitar colagem que crie um “Frankenstein visual”;
- verificar autoria/licença e dependências antes de recomendar uso.

## Movimento e 3D

### GSAP — https://gsap.com/

Use a documentação e showcases para avaliar timelines, ScrollTrigger, SVG e coreografia de interação. Não recomende migração geral do Framer Motion. A recomendação precisa apontar o efeito concreto que exige GSAP, o fallback e o orçamento de performance.

### Three.js — https://threejs.org/

Use exemplos e documentação para julgar viabilidade de WebGL/3D. Para este site, 3D é opcional e deve passar por quatro perguntas:

1. melhora a compreensão ou a narrativa da assessoria?
2. preserva a sobriedade e confiança da marca?
3. funciona em mobile fraco, redução de movimento e sem WebGL?
4. o ganho supera peso, energia, manutenção e risco de LCP/INP?

Se qualquer resposta for incerta, prefira imagem, SVG, CSS ou Framer Motion.

## Skills e cânones usados na metodologia

- `avaliar-design` do Zeno: aproveitados o princípio “pergunte ao DOM”, as lentes Craft/Nielsen/Rams/WCAG, a obrigação de testar estados e a separação tela × código. Foram excluídos cinco temas, dock e regras exclusivas do Zeno.
- `criar-plano` do Zeno: aproveitados fases verificáveis, status por fase, portões proporcionais, evidência fresca e handoff autossuficiente. Foram excluídos backlog, CI, PR e delegação específicos do Zeno quando não aplicáveis.
- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines): checklist de código e interface deve ser obtido novamente quando a auditoria for executada, pois o conteúdo evolui.
- [UI/UX Audit, MIT](https://github.com/imYChaudhary22/ui-ux-audit): referência para navegador real, viewports, medições, severidade e correções numéricas. Esta skill não copia nem instala o script externo; pode-se adotar medição equivalente com as ferramentas disponíveis.
- [UX Audit Skill](https://github.com/paulunemoon/ux-audit-skill): referência para confiança da evidência, limites honestos, estados e backlog priorizado.
- WCAG 2.2, heurísticas de Nielsen, princípios de Dieter Rams, WAI-ARIA e web.dev: use páginas primárias e atuais quando uma conclusão depender de limiar ou recomendação normativa.

## Como comparar sem copiar

Para cada inspiração citada no laudo, escreva:

1. atributo observado;
2. problema do site que ele poderia resolver;
3. adaptação compatível com o sistema atual;
4. custo/risco;
5. evidência necessária antes de implementar.

Evite “deixar parecido com X”. A recomendação deve sobreviver mesmo se o site de referência mudar amanhã.
