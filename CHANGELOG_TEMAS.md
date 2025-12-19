# Changelog - Sistema de Temas Multi-Tipo

## Mudanças Implementadas

### 🎨 Novo Sistema de Temas com React Context

#### Frontend (React)

1. **Criado ThemeContext** (`web/src/contexts/ThemeContext.tsx`)
   - Context Provider para gerenciar temas globalmente
   - Suporte para múltiplos temas por tipo
   - Temas padrão incluídos (default, ambulancia, police, bombeiro, recrutamento)
   - Função `setThemeType()` para trocar temas dinamicamente
   - Função `applyTheme()` para aplicar temas customizados
   - Hook `useTheme()` para acessar o contexto

2. **Atualizado App.tsx**
   - Aplicação agora está envolvida com `ThemeProvider`
   - Todos os componentes têm acesso ao contexto de temas

3. **Atualizado RequestContainer.tsx**
   - Removida lógica de aplicação de temas (movida para ThemeContext)
   - Agora usa `useTheme()` para trocar temas
   - Detecta `themeType` nos requests e aplica automaticamente

4. **Atualizado RequestCard.tsx**
   - Adicionado campo `themeType` ao tipo `RequestData`
   - Suporte para especificar tipo de tema por request

5. **Simplificado themeUtils.ts**
   - Removidas funções de sanitização (agora no ThemeContext)
   - Arquivo mantido para compatibilidade mas pode ser removido

6. **Atualizado DevPanel.tsx**
   - Adicionado seletor de tipo de tema
   - Botão para aplicar temas predefinidos
   - Editor de tema customizado (JSON)
   - Testa todos os 5 temas incluídos

#### Backend (Lua)

1. **Refatorado shared/theme.lua**
   - Mudou de tema único (`Theme`) para múltiplos temas (`Themes`)
   - Temas organizados por tipo: `['default']`, `['ambulancia']`, `['police']`, `['bombeiro']`, `['recrutamento']`
   - Cada tema tem suas próprias cores e propriedades
   - Estrutura:
     ```lua
     Themes = {
         ['default'] = { ... },
         ['ambulancia'] = { ... },
         ['police'] = { ... },
         ['bombeiro'] = { ... },
         ['recrutamento'] = { ... }
     }
     ```

2. **Atualizado client/main.lua**
   - Envia `themes` (plural) ao invés de `theme` (singular)
   - NUI recebe todos os temas disponíveis na inicialização
   - Mudanças nas linhas 49 e 96: `theme = Theme` → `themes = Themes`

3. **Adicionado novo comando de teste em server/main.lua**
   - Comando `/testthemes <target>` para testar todos os temas
   - Envia 5 requests sequenciais, um para cada tema predefinido
   - Delay de 1.5s entre cada request
   - Útil para validar visualmente todos os temas

#### Documentação

1. **Atualizado README.md**
   - Seção de temas completamente reescrita
   - Explica como usar múltiplos temas
   - Exemplos de uso com `themeType`
   - Lista de temas padrão incluídos
   - Arquitetura do sistema de temas

2. **Criado examples/temas-exemplo.lua**
   - 7 exemplos práticos de uso dos temas
   - Funções de exemplo para cada tipo de serviço
   - Comando `/testar-temas` para testar todos os temas
   - Comentários explicativos detalhados

3. **Criado CHANGELOG_TEMAS.md** (este arquivo)
   - Documentação completa das mudanças

## Temas Padrão Incluídos

### 1. Default (Verde)
- Cor principal: Verde (#22C55E)
- Uso: Requests genéricos, avisos gerais
- Tag background: `rgba(34,197,94,0.14)`

### 2. Ambulância (Vermelho)
- Cor principal: Vermelho (#ef4444)
- Uso: Chamados médicos, emergências de saúde
- Tag background: `rgba(239,68,68,0.14)`

### 3. Police (Azul)
- Cor principal: Azul (#3b82f6)
- Uso: Ocorrências policiais, backup
- Tag background: `rgba(59,130,246,0.14)`

### 4. Bombeiro (Laranja)
- Cor principal: Laranja (#f97316)
- Uso: Incêndios, resgates, emergências
- Tag background: `rgba(249,115,22,0.14)`

### 5. Recrutamento (Roxo)
- Cor principal: Roxo (#a855f7)
- Uso: Convites, processos seletivos
- Tag background: `rgba(168,85,247,0.14)`

## Como Usar

### Testar todos os temas (comando do servidor):

```
/testthemes <targetServerId>
```

Este comando envia 5 requests sequenciais para o jogador alvo, cada um com um tema diferente:
1. Ambulância (vermelho) - Chamado Médico
2. Police (azul) - Ocorrência Policial
3. Bombeiro (laranja) - Emergência
4. Recrutamento (roxo) - Convite
5. Default (verde) - Solicitação Geral

Exemplo: `/testthemes 2` - envia todos os temas para o player ID 2

### Enviar request com tema específico:

```lua
-- Server-side
local request = {
    title = 'Chamado Médico',
    tag = 'AMBULÂNCIA',
    code = 'A-123',
    themeType = 'ambulancia', -- Define o tema
    extras = {
        { icon = 'heart', name = 'Urgência', value = 'Alta' }
    },
    timeout = 15000
}
TriggerEvent('g5-request:server:send', targetId, request)
```

### Adicionar novo tema personalizado:

```lua
-- No shared/theme.lua
Themes = {
    -- ... temas existentes ...
    
    ['mecanico'] = {
        card_bg = 'rgba(10,8,6,0.78)',
        title_bg = 'rgba(0,0,0,0.55)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(245,158,11,0.14)',
        tag_fg = '#78350f',
        code_bg = 'rgba(255,255,255,0.03)',
        code_fg = '#E6F0EF',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#f59e0b',
        accent = '#f59e0b',
        card_width = '360px',
        card_gap = '12px',
    }
}
```

## Compatibilidade

- ✅ Totalmente compatível com requests existentes
- ✅ Se `themeType` não for especificado, usa o tema `default`
- ✅ Cores individuais (`tagColor`, `progressColor`) ainda funcionam e sobrescrevem o tema
- ✅ Sem breaking changes - código antigo continua funcionando

## Arquivos Modificados

### Frontend
- `web/src/contexts/ThemeContext.tsx` (NOVO)
- `web/src/components/App.tsx`
- `web/src/components/RequestContainer.tsx`
- `web/src/components/RequestCard.tsx`
- `web/src/components/DevPanel.tsx`
- `web/src/utils/themeUtils.ts` (simplificado)

### Backend
- `shared/theme.lua` (refatorado)
- `client/main.lua`

### Documentação
- `README.md`
- `examples/temas-exemplo.lua` (NOVO)
- `CHANGELOG_TEMAS.md` (NOVO)

## Próximos Passos Sugeridos

1. ✅ Testar no ambiente de desenvolvimento
2. ✅ Adicionar mais temas conforme necessário
3. ✅ Integrar com scripts de ambulância, polícia, etc.
4. ⚠️ Considerar remover `themeUtils.ts` completamente (atualmente só tem export vazio)
5. ⚠️ Adicionar validação de tipo de tema no servidor (opcional)

## Migração de Código Existente

### Antes (código antigo):
```lua
-- shared/theme.lua
Theme = {
    card_bg = 'rgba(6,8,10,0.78)',
    -- ...
}

-- client/main.lua
theme = Theme
```

### Agora (novo código):
```lua
-- shared/theme.lua
Themes = {
    ['default'] = {
        card_bg = 'rgba(6,8,10,0.78)',
        -- ...
    },
    ['ambulancia'] = { ... }
}

-- client/main.lua
themes = Themes

-- Usar em requests:
requestData.themeType = 'ambulancia'
```

## Notas Técnicas

- O ThemeContext gerencia os temas disponíveis via CSS Custom Properties
- **Cada card aplica seu tema individualmente** via CSS variables locais (scoped ao elemento)
- Múltiplos cards com temas diferentes podem coexistir na tela simultaneamente
- Troca de tema é instantânea sem recarregar a página
- DevPanel permite testar todos os temas em tempo real

### Correção de Bug: Backgrounds Únicos por Card

**Problema anterior:** Quando múltiplos requests com temas diferentes eram enviados, todos os cards acabavam com o mesmo background (do último tema aplicado).

**Solução implementada:** 
- Removida a aplicação global de tema quando um request chega
- Cada `RequestCard` agora busca seu tema específico do `ThemeContext` baseado em `req.themeType`
- O tema é aplicado como CSS variables locais no elemento do card (via `el.style.setProperty`)
- Cores personalizadas (`tagColor`, `progressColor`, etc.) continuam sobrescrevendo o tema conforme esperado

**Resultado:** Agora é possível ter múltiplos cards visíveis simultaneamente, cada um com seu próprio tema e background único.

---

**Data:** 2025-12-04
**Versão:** 1.1.0
**Autor:** G5 Dev Team

