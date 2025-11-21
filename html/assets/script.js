const container = document.getElementById('container');
let position = 'top-right'; // 'top-right' | 'top-left'

const requests = [];

let acceptKey = 'Y';
let denyKey = 'N';

window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (!d || !d.action) return;
    if (d.action === 'init') {
        if (d.acceptKey) acceptKey = d.acceptKey;
        if (d.denyKey) denyKey = d.denyKey;
        if (d.position) setContainerPosition(d.position);
    } else if (d.action === 'add' && d.request) {
        addRequest(d.request);
    } else if (d.action === 'remove' && d.id) {
        removeRequest(d.id);
    } else if (d.action === 'flashAccept' && d.id) {
        flashAccept(d.id);
    } else if (d.action === 'flashDeny' && d.id) {
        flashDeny(d.id);
    } else if (d.action === 'prolong' && d.id) {
        prolongRequest(d.id, d.set);
    }
});

function setContainerPosition(pos) {
    position = (pos === 'top-left') ? 'top-left' : 'top-right';
    container.classList.remove('pos-top-left', 'pos-top-right');
    container.classList.add(position === 'top-left' ? 'pos-top-left' : 'pos-top-right');
    if (position === 'top-left') {
        container.style.left = '30px';
        container.style.right = 'auto';
        container.style.top = '30px';
    } else {
        container.style.right = '30px';
        container.style.left = 'auto';
        container.style.top = '30px';
    }
}

setContainerPosition(position);

function _hasExtension(name) {
    return /\.[a-z0-9]{1,6}$/i.test(name);
}

function _audioPathFor(name) {
    if (!name || typeof name !== 'string') return [];
    const clean = name.trim();
    if (clean.length === 0) return [];
    if (_hasExtension(clean)) {
        return [`assets/sound/${clean}`];
    }
    return [`assets/sound/${clean}.ogg`, `assets/sound/${clean}.mp3`, `assets/sound/${clean}.wav`];
}

function playNotificationSound(name) {
    if (!name || typeof name !== 'string') return;
    if (name.trim().toLowerCase() === 'off') return;
    const candidates = _audioPathFor(name);
    (async () => {
        for (const src of candidates) {
            try {
                const a = new Audio(src);
                a.volume = 0.9;
                await a.play();
                return;
            } catch (e) {
            }
        }
    })();
}

function addRequest(req) {
    const timeout = req.timeout || 8000;
    const id = String(req.id);
    const tagColor = req.tagColor || null;
    const progressColor = req.progressColor || null;
    const codeColor = req.codeColor || null;
    const titleIcon = req.titleIcon || null;
    const titleIconColor = req.titleIconColor || null;
    const acceptText = req.acceptText || "Aceitar";
    const denyText = req.denyText || "Recusar";

    const card = document.createElement('div');
    card.className = 'request-card';
    card.dataset.id = id;

    if (tagColor) card.style.setProperty('--tag-bg', tagColor);
    if (progressColor) card.style.setProperty('--progress-color', progressColor);
    if (codeColor) card.style.setProperty('--code-bg', codeColor);

    function _esc(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function _parseColor(str) {
        if (!str || typeof str !== 'string') return null;
        const s = str.trim().toLowerCase();
        if (s[0] === '#') {
            if (s.length === 4) { // #rgb
                const r = parseInt(s[1] + s[1], 16);
                const g = parseInt(s[2] + s[2], 16);
                const b = parseInt(s[3] + s[3], 16);
                return [r, g, b];
            } else if (s.length === 7) { // #rrggbb
                const r = parseInt(s.substr(1, 2), 16);
                const g = parseInt(s.substr(3, 2), 16);
                const b = parseInt(s.substr(5, 2), 16);
                return [r, g, b];
            }
            return null;
        }
        const m = s.match(/rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})/);
        if (m) {
            return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
        }
        return null;
    }

    function _getContrastColor(colorStr) {
        const rgb = _parseColor(colorStr);
        if (!rgb) {
            return '#fff';
        }
        const srgb = rgb.map(c => c / 255);
        const lin = srgb.map(c => (c <= 0.03928) ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4));
        const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
        return (lum > 0.179) ? '#000' : '#fff';
    }

    if (tagColor) {
        const tagFg = _getContrastColor(tagColor);
        card.style.setProperty('--tag-fg', tagFg);
    }

    if (progressColor) {
        const progressFg = _getContrastColor(progressColor);
        card.style.setProperty('--progress-fg', progressFg);
    }

    if (codeColor) {
        const codeFg = _getContrastColor(codeColor);
        card.style.setProperty('--code-fg', codeFg);
    }

    let html = '';
    html += `
        <div class="request-progress">
            <div class="bar"></div>
        </div>
        <div class="top-row">
    `;
    if (req.tagText || req.tag) {
        html += `<div class="tag">${_esc(req.tagText) || ('#' + _esc(req.tag || ''))}</div>`;
    }

    if (req.code) {
        html += `<div class="code">${_esc(req.code)}</div>`;
    }

    if (req.title) {
        const iconHtml = titleIcon ? `<span class="title-icon" style="margin-left:8px"><i class="fa fa-${_esc(titleIcon)}" aria-hidden="true" style="${titleIconColor ? ('color:' + _esc(titleIconColor) + ';') : ''}"></i></span>` : '';
        html += `<div class="title" style="margin-left:8px; display:flex; align-items:center; justify-content:space-between; gap:8px"><span class="title-text">${_esc(req.title)}</span>${iconHtml}</div>`;
    }
    html += `</div><div class="card-body">`;

    if (req.extras) {
        let extrasObj = null;
        try {
            extrasObj = (typeof req.extras === 'string') ? JSON.parse(req.extras) : req.extras;
        } catch (e) {
            extrasObj = null;
        }

        if (Array.isArray(extrasObj)) {
            let extrasHtml = '';
            for (const item of extrasObj) {
                if (!item || typeof item !== 'object') continue;
                const icon = item.icon;
                const name = item.name;
                const value = item.value;
                if (value === null || value === undefined || value === '') continue;
                extrasHtml += `<div class="mutedline extra-item"><i class="fa fa-${_esc(icon || '')}" aria-hidden="true" style="margin-right:6px"></i><strong>${_esc(name || '')}</strong>: ${_esc(value)}</div>`;
            }
            if (extrasHtml) html += extrasHtml;
        } else if (extrasObj && typeof extrasObj === 'object') {
            let extrasHtml = '';
            for (const [k, v] of Object.entries(extrasObj)) {
                if (v === null || v === undefined || v === '') continue;
                const icon = k;
                extrasHtml += `<div class="mutedline extra-item"><i class="fa fa-${_esc(icon)}" aria-hidden="true" style="margin-right:6px"></i><strong>${_esc(k)}</strong>: ${_esc(v)}</div>`;
            }
            if (extrasHtml) html += extrasHtml;
        } else {
            html += `<div class="mutedline">${_esc(typeof req.extras === 'string' ? req.extras : JSON.stringify(req.extras))}</div>`;
        }
    }

    html += `
        <div class="card-footer">
            <div class="mutedline small"><div class="ghost">[${acceptKey}] ${acceptText}</div> • <div class="btn ghost">[${denyKey}] ${denyText}</div></div>
        </div>
    </div>
    `;
    card.innerHTML = html;

    try {
        if (req.sound) {
            playNotificationSound(req.sound);
        }
    } catch (e) {
        console.error('g5-request sound error', e);
    }

    container.appendChild(card);

    requestAnimationFrame(() => card.classList.add('show'));

    const bar = card.querySelector('.bar');

    const tagEl = card.querySelector('.tag');
    if (tagEl && tagColor) {
        tagEl.style.backgroundColor = tagColor;
        tagEl.style.color = card.style.getPropertyValue('--tag-fg') || _getContrastColor(tagColor);
    }

    if (titleIcon && titleIconColor) {
        const ti = card.querySelector('.title-icon i');
        if (ti) ti.style.color = titleIconColor;
    }

    if (bar && progressColor) {
        bar.style.backgroundColor = progressColor;
    }

    const record = {
        id,
        data: req,
        el: card,
        bar,
        startedAt: performance.now(),
        duration: timeout
    };

    requests.push(record);

    const tick = () => {
        const now = performance.now();
        const elapsed = now - record.startedAt;
        const pct = Math.max(0, Math.min(1, 1 - (elapsed / record.duration)));
        bar.style.width = (pct * 100) + '%';
        if (elapsed >= record.duration) {
            sendAnswer(id, false);
            removeRequest(id);
            return;
        }
        record.timeoutHandle = requestAnimationFrame(tick);
    };
    record.timeoutHandle = requestAnimationFrame(tick);
}

function findIndexById(id) {
    return requests.findIndex(r => String(r.id) === String(id));
}

function removeRequest(id) {
    const i = findIndexById(id);
    if (i === -1) return;
    const rec = requests[i];
    cancelAnimationFrame(rec.timeoutHandle);
    rec.el.classList.remove('show');
    rec.el.classList.add('hide');
    setTimeout(() => {
        if (rec.el && rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);
    }, 320);
    requests.splice(i, 1);
}

function sendAnswer(id, accepted) {
    fetch(`https://${GetParentResourceName()}/g5_request_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ id, accepted })
    }).catch(e => console.error(e));
}

function flashAccept(id) {
    const i = findIndexById(id);
    if (i === -1) return;
    const el = requests[i].el;
    el.style.boxShadow = '0 0 12px rgba(60,200,120,0.8)';
    setTimeout(() => el.style.boxShadow = '', 400);
}

function flashDeny(id) {
    const i = findIndexById(id);
    if (i === -1) return;
    const el = requests[i].el;
    el.style.boxShadow = '0 0 12px rgba(200,60,60,0.8)';
    setTimeout(() => el.style.boxShadow = '', 400);
}

function prolongRequest(id, setMs) {
    const i = findIndexById(id);
    if (i === -1) return;
    const rec = requests[i];
    if (rec.timeoutHandle) cancelAnimationFrame(rec.timeoutHandle);
    const now = performance.now();

    if (typeof setMs === 'number') {
        rec.duration = setMs;
        rec.startedAt = now;
    } else {
        rec.startedAt = now;
    }

    const tick = () => {
        const now2 = performance.now();
        const elapsed2 = now2 - rec.startedAt;
        const pct2 = Math.max(0, Math.min(1, 1 - (elapsed2 / rec.duration)));
        if (rec.bar) rec.bar.style.width = (pct2 * 100) + '%';
        if (elapsed2 >= rec.duration) {
            sendAnswer(id, false);
            removeRequest(id);
            return;
        }
        rec.timeoutHandle = requestAnimationFrame(tick);
    };
    rec.timeoutHandle = requestAnimationFrame(tick);
}

window.exports = window.exports || {};

fetch(`https://${GetParentResourceName()}/g5_nui_ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({})
}).catch(e => console.error(e));