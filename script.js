const TOOLS = [
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
        id: 'uppercase',
        icon: '🔠',
        title: 'Uppercase',
        description: 'Convert text to uppercase instantly.',
        url: 'Uppercase Converter/index.html',
    },
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
        id: 'character-counter',
        icon: '📝',
        title: 'Character Counter',
        description: 'Count characters, words, and lines in text.',
        url: 'Character Counter/index.html',
    },
    {
        id: 'hex-to-string',
        icon: '🔡',
        title: 'Hex to String',
        description: 'Decode hexadecimal bytes as UTF-8 or Big5.',
        url: 'Hex to String/index.html',
    },
    {
        id: 'future',
        icon: '➕',
        title: 'Future Tool',
        description: 'Coming Soon',
        comingSoon: true,
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

function renderTools(filter = '') {
    const grid = document.getElementById('toolGrid');
    const emptyState = document.getElementById('emptyState');
    const query = filter.trim().toLowerCase();

    const filtered = TOOLS.filter((tool) => {
        if (!query) return true;
        return (
            tool.title.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
        );
    });

    grid.innerHTML = '';
    filtered.forEach((tool, index) => {
        const card = createToolCard(tool);
        card.style.animationDelay = `${index * 0.06}s`;
        grid.appendChild(card);
    });

    emptyState.hidden = filtered.length > 0;
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
