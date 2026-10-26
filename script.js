const CATEGORIES = [
    {
        id: 'everyday',
        title: 'Everyday',
        tools: [
            {
                id: 'daily-password',
                icon: '🗓️',
                title: 'Daily Password',
                description: 'Generate the six-digit password for any date.',
                url: 'Daily Password/index.html',
            },
            {
                id: 'ip-detector',
                icon: '🌐',
                title: 'IP Detector',
                description: 'Detect your public IPv4 and IPv6 addresses.',
                url: 'IP Detector/index.html',
            },
            {
                id: 'qr-generator',
                icon: '📱',
                title: 'QR Generator',
                description: 'Generate QR codes from text or URLs.',
                url: 'QR Code Generator/index.html',
            },
            {
                id: 'character-counter',
                icon: '📝',
                title: 'Character Counter',
                description: 'Count characters, words, and lines in text.',
                url: 'Character Counter/index.html',
            },
        ],
    },
    {
        id: 'text',
        title: 'Text & encoding',
        tools: [
            {
                id: 'uppercase',
                icon: '🔠',
                title: 'Uppercase',
                description: 'Convert text to uppercase instantly.',
                url: 'Uppercase Converter/index.html',
            },
            {
                id: 'trim-empty-space',
                icon: '✂️',
                title: 'Trim Empty Space',
                description: 'Remove leading, trailing, and extra whitespace.',
                url: 'Trim Empty Space/index.html',
            },
            {
                id: 'hex-to-string',
                icon: '🔡',
                title: 'Hex to String',
                description: 'Convert hexadecimal bytes to text, or text to hex.',
                url: 'Hex to String/index.html',
            },
            {
                id: 'base64-converter',
                icon: '🔤',
                title: 'Base64 Converter',
                description: 'Encode or decode Base64 text safely.',
                url: 'Base64 Converter/index.html',
            },
        ],
    },
    {
        id: 'crypto',
        title: 'Hashes & cipher',
        tools: [
            {
                id: 'md5',
                icon: '🔑',
                title: 'MD5 Hash',
                description: 'Generate MD5 hashes from any input.',
                url: 'MD5 Calculator/index.html',
            },
            {
                id: 'sha1',
                icon: '🔒',
                title: 'SHA-1 Hash',
                description: 'Generate SHA-1 hashes from any input.',
                url: 'SHA-1 Calculator/index.html',
            },
            {
                id: 'sha256',
                icon: '🛡️',
                title: 'SHA-256 Hash',
                description: 'Generate SHA-256 hashes from any input.',
                url: 'SHA-256 Calculator/index.html',
            },
            {
                id: '3des-calculator',
                icon: '🔐',
                title: '3DES Calculator',
                description: 'Encrypt or decrypt with Triple DES ECB/CBC.',
                url: '3DES Calculator/index.html',
            },
        ],
    },
    {
        id: 'keys-logs',
        title: 'Keys & logs',
        tools: [
            {
                id: 'public-key-encryption',
                icon: '🗝️',
                title: 'Public Key Encryption',
                description: 'RSA-OAEP encrypt and decrypt in the browser.',
                url: 'Public Key Encryption/index.html',
            },
            {
                id: 'capa-log-analyzer',
                icon: '📋',
                title: 'CAPA Log Analyzer',
                description: 'Detect ECR, host, and lifecycle events in CAPA logs.',
                url: 'CAPA Log Analyzer/index.html',
            },
            {
                id: 'capa-service-log',
                icon: '🛰️',
                title: 'CAPA Service Log',
                description: 'Read CapaService logs and check for "RESP":"CKE".',
                url: 'CAPA Service Log/index.html',
            },
            {
                id: 'future',
                icon: '➕',
                title: 'Future Tool',
                description: 'Coming Soon',
                comingSoon: true,
            },
        ],
    },
];

function navigateTo(url) {
    window.location.href = url;
}

function createToolCard(tool) {
    const card = document.createElement('article');
    card.className = 'tool-card' + (tool.comingSoon ? ' tool-card--coming-soon' : '');
    card.dataset.toolId = tool.id;

    card.innerHTML = `
        <span class="tool-icon" aria-hidden="true">${tool.icon}</span>
        <h2 class="tool-title">${tool.title}</h2>
        <p class="tool-description">${tool.description}</p>
        ${tool.comingSoon
            ? '<span class="tool-badge">Coming Soon</span>'
            : '<button type="button" class="tool-button">Open Tool →</button>'
        }
    `;

    if (!tool.comingSoon) {
        const button = card.querySelector('.tool-button');
        button.addEventListener('click', () => navigateTo(tool.url));
        card.addEventListener('click', (event) => {
            if (event.target.closest('.tool-button')) return;
            navigateTo(tool.url);
        });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'link');
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigateTo(tool.url);
            }
        });
    }

    return card;
}

function matchesQuery(tool, query) {
    if (!query) return true;
    return (
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
}

function renderTools(filter = '') {
    const grid = document.getElementById('toolGrid');
    const emptyState = document.getElementById('emptyState');
    const query = filter.trim().toLowerCase();
    let visibleCount = 0;
    let cardIndex = 0;

    grid.innerHTML = '';

    CATEGORIES.forEach((category) => {
        const tools = category.tools.filter((tool) => matchesQuery(tool, query));
        if (!tools.length) return;

        visibleCount += tools.length;
        const column = document.createElement('section');
        column.className = 'tool-column';
        column.setAttribute('aria-label', category.title);

        const title = document.createElement('h2');
        title.className = 'tool-column-title';
        title.textContent = category.title;
        column.appendChild(title);

        const list = document.createElement('div');
        list.className = 'tool-column-list';
        tools.forEach((tool) => {
            const card = createToolCard(tool);
            card.style.animationDelay = `${cardIndex * 0.04}s`;
            cardIndex += 1;
            list.appendChild(card);
        });
        column.appendChild(list);
        grid.appendChild(column);
    });

    emptyState.hidden = visibleCount > 0;
}

function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('geektool-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('geektool-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('geektool-theme', 'dark');
        }
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (event) => {
        renderTools(event.target.value);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSearch();
    renderTools();
});
