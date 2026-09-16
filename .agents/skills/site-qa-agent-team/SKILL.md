---
name: site-qa-agent-team
description: Delega inspeções estáticas delimitadas do QA do site William Leonel a um agente OpenCode Go, mantendo navegação, evidências e veredito com o coordenador.
---

# Equipe de agentes para o QA do site

Adaptação local da skill `equipe-agentes` do Zeno. Use como apoio da
`site-quality-audit` quando um inventário de código independente puder reduzir o
trabalho do coordenador. Não use para substituir a inspeção visual ou a
reprodução no navegador.

## Contrato

- O coordenador define um subproblema fechado, revisa a resposta e conserva a
  autoria do relatório final.
- O agente trabalha em modo somente leitura: não editar, instalar, iniciar
  servidor, executar deploy, commitar nem enviar mudanças.
- Nunca enviar `.env`, segredos, leads, analytics brutos ou dados pessoais. Use
  apenas código do projeto e dados sintéticos.
- Achados do agente são candidatos. Só entram no relatório após confirmação em
  código ou navegador, com evidência reproduzível.
- O navegador real, screenshots, severidade e priorização pertencem ao
  coordenador.

## Roteamento OpenCode Go

1. Confirme a disponibilidade com `opencode models opencode-go`.
2. Para inventário e leitura mecânica, use explicitamente
   `opencode-go/mimo-v2.5` (sem treinamento e retenção zero).
3. No primeiro uso da sessão, execute uma sonda sem código em diretório
   temporário: `Responda apenas: OK`.
4. Só escale após limitação de capacidade observada; registre o motivo. Nunca
   use Muse, Luna ou Grok para este repositório privado.

## Brief mínimo

O brief deve declarar: objetivo, arquivos/áreas permitidos, perguntas exatas,
formato de saída, proibições e critérios de conclusão. Peça referências
`arquivo:linha`, impacto verificável e um teste de navegador capaz de confirmar
cada candidato. Grave o brief fora do repositório e execute:

```bash
~/.opencode/bin/opencode run --pure \
  --dir /Users/williamleonel/Documents/site-will \
  --model opencode-go/mimo-v2.5 \
  "$(cat /caminho/absoluto/do/brief.md)"
```

Monitore o processo até terminar. Se travar, interrompa-o e registre a falha;
não deixe processos órfãos. Ao concluir, descarte sugestões fora do escopo e
faça a verificação independente prevista na fase ativa do plano.
