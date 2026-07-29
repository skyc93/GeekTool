function initToolTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

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

function copyText(text, button) {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        if (!button) return;
        const original = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = original;
            button.classList.remove('copied');
        }, 2000);
    });
}

function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
}

function hideError(element) {
    if (!element) element = document.getElementById('errorMessage');
    if (element) element.hidden = true;
}

document.addEventListener('DOMContentLoaded', initToolTheme);
