-- Theme configuration for g5-request NUI
-- Users can define multiple themes for different request types
-- Colors accept CSS formats like '#rrggbb', '#rrggbbaa' or 'rgba(r,g,b,a)'.

Themes = {
    -- Tema padrão (default)
    ['default'] = {
        card_bg = 'rgba(6,8,10,0.78)',
        title_bg = 'rgba(0,0,0,0.55)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(34,197,94,0.14)',
        tag_fg = '#042712',
        code_bg = 'rgba(255,255,255,0.03)',
        code_fg = '#E6F0EF',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#16A34A',
        accent = '#22C55E',
        card_width = '360px',
        card_gap = '12px',
    },

    -- Tema para ambulância (vermelho)
    ['ambulancia'] = {
        card_bg = 'rgba(25,8,8,0.85)',  -- Tom avermelhado mais visível
        title_bg = 'rgba(20,5,5,0.65)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(239,68,68,0.2)',
        tag_fg = '#7f1d1d',
        code_bg = 'rgba(239,68,68,0.15)',
        code_fg = '#fecaca',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#dc2626',
        accent = '#ef4444',
        card_width = '360px',
        card_gap = '12px',
    },

    -- Tema para polícia (azul)
    ['police'] = {
        card_bg = 'rgba(8,15,30,0.85)',  -- Tom azulado mais visível
        title_bg = 'rgba(5,10,20,0.65)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(59,130,246,0.2)',
        tag_fg = '#1e3a8a',
        code_bg = 'rgba(59,130,246,0.15)',
        code_fg = '#bfdbfe',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#2563eb',
        accent = '#3b82f6',
        card_width = '360px',
        card_gap = '12px',
    },

    -- Tema para recrutamento (roxo)
    ['recrutamento'] = {
        card_bg = 'rgba(18,8,25,0.85)',  -- Tom roxo mais visível
        title_bg = 'rgba(12,5,18,0.65)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(168,85,247,0.2)',
        tag_fg = '#4c1d95',
        code_bg = 'rgba(168,85,247,0.15)',
        code_fg = '#e9d5ff',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#9333ea',
        accent = '#a855f7',
        card_width = '360px',
        card_gap = '12px',
    },

    -- Tema para bombeiro (laranja)
    ['bombeiro'] = {
        card_bg = 'rgba(25,12,6,0.85)',  -- Tom laranja mais visível
        title_bg = 'rgba(20,8,4,0.65)',
        text = '#F4F7F8',
        muted = '#AAB7B9',
        tag_bg = 'rgba(249,115,22,0.2)',
        tag_fg = '#7c2d12',
        code_bg = 'rgba(249,115,22,0.15)',
        code_fg = '#fed7aa',
        progress_bg = 'rgba(255,255,255,0.04)',
        progress_color = '#ea580c',
        accent = '#f97316',
        card_width = '360px',
        card_gap = '12px',
    },
}

return Themes
