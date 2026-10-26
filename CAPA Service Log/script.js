const CKE_PATTERN = /["']RESP["']\s*:\s*["']CKE["']/i;
const RESP_PATTERN = /["']RESP["']\s*:\s*["']([^"']+)["']/gi;

function extractTimestamp(line) {
    const match = String(line).match(
        /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?|\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)/
    );
    return match ? match[1].trim() : '';
}

function extractRespValues(line) {
    const values = [];
    const pattern = new RegExp(RESP_PATTERN.source, 'gi');
    let match = pattern.exec(line);
    while (match) {
        values.push(match[1].toUpperCase());
        match = pattern.exec(line);
    }
    return values;
}

function analyzeCapaServiceLog(logText) {
    const lines = String(logText).replace(/\r\n/g, '\n').split('\n');
    const matches = [];
    const respCounts = new Map();

    lines.forEach((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return;

        extractRespValues(line).forEach((value) => {
            respCounts.set(value, (respCounts.get(value) || 0) + 1);
        });

        if (!CKE_PATTERN.test(line)) return;

        matches.push({
            lineNumber: index + 1,
            timestamp: extractTimestamp(line),
            resp: 'CKE',
            line,
        });
    });

    return {
        lineCount: lines.length,
        found: matches.length > 0,
        matchCount: matches.length,
        matches,
        respCounts: Array.from(respCounts.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
    };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
    const logFile = document.getElementById('logFile');
    const logInput = document.getElementById('logInput');
    const errorMessage = document.getElementById('errorMessage');
    const resultPanel = document.getElementById('resultPanel');
    const verdict = document.getElementById('verdict');
    const summary = document.getElementById('summary');
    const matches = document.getElementById('matches');
    const expandedKeys = new Set();

    function render(analysis) {
        verdict.className = `verdict ${analysis.found ? 'verdict--found' : 'verdict--missing'}`;
        verdict.textContent = analysis.found
            ? `"RESP":"CKE" found · ${analysis.matchCount} line${analysis.matchCount === 1 ? '' : 's'}`
            : '"RESP":"CKE" not found';

        const otherResps = analysis.respCounts.filter((item) => item.value !== 'CKE');
        summary.innerHTML = `
            <div class="stat-chip"><strong>${analysis.lineCount}</strong> lines</div>
            <div class="stat-chip ${analysis.found ? 'stat-chip--ok' : 'stat-chip--alert'}">
                <strong>${analysis.matchCount}</strong> CKE
            </div>
            ${otherResps.map((item) => `
                <div class="stat-chip"><strong>${item.count}</strong> RESP ${escapeHtml(item.value)}</div>
            `).join('')}
        `;

        if (!analysis.matches.length) {
            matches.innerHTML = '<p class="empty-matches">No CapaService lines contain "RESP":"CKE".</p>';
            resultPanel.hidden = false;
            return;
        }

        matches.innerHTML = analysis.matches.map((item) => {
            const key = String(item.lineNumber);
            const open = expandedKeys.has(key);
            const meta = [`L${item.lineNumber}`, item.timestamp].filter(Boolean).join(' · ');
            return `
                <article class="match-card" data-key="${escapeHtml(key)}">
                    <button type="button" class="match-toggle" aria-expanded="${open}">
                        <span>
                            <span class="match-title">RESP CKE</span>
                            <span class="match-meta">${escapeHtml(meta)}</span>
                        </span>
                        <span class="match-badge">${open ? 'hide log' : 'show log'}</span>
                    </button>
                    <div class="match-log" ${open ? '' : 'hidden'}>
                        <pre>${escapeHtml(item.line)}</pre>
                    </div>
                </article>
            `;
        }).join('');

        resultPanel.hidden = false;
    }

    function analyze() {
        hideError(errorMessage);
        resultPanel.hidden = true;
        expandedKeys.clear();

        const logText = logInput.value;
        if (!logText.trim()) {
            showError(errorMessage, 'Upload or paste a CapaService log first.');
            return;
        }

        render(analyzeCapaServiceLog(logText));
    }

    logFile.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        hideError(errorMessage);
        try {
            logInput.value = await file.text();
        } catch {
            showError(errorMessage, 'Unable to read that log file.');
        }
    });

    matches.addEventListener('click', (event) => {
        const toggle = event.target.closest('.match-toggle');
        if (!toggle) return;

        const card = toggle.closest('.match-card');
        const key = card.dataset.key;
        const isOpen = expandedKeys.has(key);
        if (isOpen) {
            expandedKeys.delete(key);
        } else {
            expandedKeys.add(key);
        }

        toggle.setAttribute('aria-expanded', String(!isOpen));
        toggle.querySelector('.match-badge').textContent = isOpen ? 'show log' : 'hide log';
        card.querySelector('.match-log').hidden = isOpen;
    });

    document.getElementById('analyzeBtn').addEventListener('click', analyze);
    document.getElementById('clearBtn').addEventListener('click', () => {
        logInput.value = '';
        logFile.value = '';
        expandedKeys.clear();
        resultPanel.hidden = true;
        hideError(errorMessage);
        logInput.focus();
    });
});
}

if (typeof module !== 'undefined') {
    module.exports = {
        analyzeCapaServiceLog,
        extractRespValues,
    };
}
