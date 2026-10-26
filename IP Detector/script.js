const IPV4_SOURCES = [
    'https://ipv4.icanhazip.com',
    'https://api.ipify.org?format=json',
];

const IPV6_SOURCES = [
    'https://ipv6.icanhazip.com',
    'https://api.ip.sb/ip',
    'https://api6.ipify.org?format=json',
];

function isValidIpv4(value) {
    const parts = value.split('.');
    return parts.length === 4 && parts.every((part) =>
        /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
    );
}

function isValidIpv6(value) {
    return value.includes(':') && /^[0-9a-f:.]+$/i.test(value);
}

function extractIp(payload, version) {
    const text = typeof payload === 'string'
        ? payload.trim()
        : String(payload?.ip || payload?.query || '').trim();

    if (version === 4) {
        const match = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
        return match && isValidIpv4(match[0]) ? match[0] : '';
    }

    const match = text.match(/[0-9a-f:]{2,}:[0-9a-f:.]{2,}/i);
    return match && isValidIpv6(match[0]) ? match[0] : '';
}

function parseWhatIsMyIpAddressHtml(html) {
    const ipv4Match = html.match(/id=["']ipv4["'][^>]*>[\s\S]*?([0-9]{1,3}(?:\.[0-9]{1,3}){3})/i);
    const ipv6Match = html.match(/id=["']ipv6["'][^>]*>[\s\S]*?([0-9a-f:]{2,}:[0-9a-f:.]{2,})/i);

    return {
        ipv4: ipv4Match && isValidIpv4(ipv4Match[1]) ? ipv4Match[1] : '',
        ipv6: ipv6Match && isValidIpv6(ipv6Match[1]) ? ipv6Match[1] : '',
        source: 'whatismyipaddress.com',
    };
}

async function fetchText(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            cache: 'no-store',
            signal: controller.signal,
            headers: { Accept: 'application/json, text/plain, text/html;q=0.8' },
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}.`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        return (await response.text()).trim();
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchPublicIp(sources, version) {
    let lastError = new Error(`Unable to detect IPv${version}.`);

    for (const url of sources) {
        try {
            const payload = await fetchText(url);
            const value = extractIp(payload, version);
            if (value) return value;
            lastError = new Error(`The service returned an invalid IPv${version} address.`);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

async function fetchFromWhatIsMyIpAddress() {
    if (window.location.protocol === 'file:') {
        throw new Error('Local server is required to read whatismyipaddress.com.');
    }

    const payload = await fetchText('/api/ip', 12000);
    if (!payload || typeof payload !== 'object') {
        throw new Error('whatismyipaddress.com did not return IP data.');
    }

    return {
        ipv4: isValidIpv4(payload.ipv4 || '') ? payload.ipv4 : '',
        ipv6: isValidIpv6(payload.ipv6 || '') ? payload.ipv6 : '',
        source: payload.source || 'whatismyipaddress.com',
    };
}

if (typeof document !== 'undefined') {
    const refreshBtn = document.getElementById('refreshBtn');
    const sourceNote = document.getElementById('sourceNote');

    const views = {
        ipv4: {
            value: document.getElementById('ipv4Value'),
            status: document.getElementById('ipv4Status'),
            copy: document.getElementById('copyIpv4Btn'),
        },
        ipv6: {
            value: document.getElementById('ipv6Value'),
            status: document.getElementById('ipv6Status'),
            copy: document.getElementById('copyIpv6Btn'),
        },
    };

    function setLoading(view) {
        view.value.textContent = '—';
        view.status.textContent = 'Detecting…';
        view.status.className = 'ip-status';
        view.copy.disabled = true;
    }

    function setSuccess(view, address) {
        view.value.textContent = address;
        view.status.textContent = 'Detected';
        view.status.className = 'ip-status ip-status--success';
        view.copy.disabled = false;
    }

    function setFailure(view, version, error) {
        view.value.textContent = 'Not available';
        view.status.textContent = version === 6
            ? 'No IPv6 connection detected'
            : error.name === 'AbortError'
                ? 'Detection timed out'
                : 'Unable to detect';
        view.status.className = version === 6
            ? 'ip-status ip-status--unavailable'
            : 'ip-status ip-status--error';
        view.copy.disabled = true;
    }

    function setSourceNote(source) {
        if (!sourceNote) return;
        sourceNote.textContent = source === 'whatismyipaddress.com'
            ? 'Addresses were read from whatismyipaddress.com.'
            : 'whatismyipaddress.com was unavailable, so a public IP lookup fallback was used.';
    }

    async function detectAddresses() {
        setLoading(views.ipv4);
        setLoading(views.ipv6);
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Detecting…';

        let ipv4 = '';
        let ipv6 = '';
        let source = '';

        try {
            const pageResult = await fetchFromWhatIsMyIpAddress();
            ipv4 = pageResult.ipv4;
            ipv6 = pageResult.ipv6;
            if (ipv4 || ipv6) source = 'whatismyipaddress.com';
        } catch {
            source = '';
        }

        const lookups = [];
        if (!ipv4) lookups.push(fetchPublicIp(IPV4_SOURCES, 4).then((value) => { ipv4 = value; }));
        if (!ipv6) lookups.push(fetchPublicIp(IPV6_SOURCES, 6).then((value) => { ipv6 = value; }));

        const settled = await Promise.allSettled(lookups);
        if (!source && settled.some((result) => result.status === 'fulfilled')) {
            source = 'fallback';
        }

        if (ipv4) {
            setSuccess(views.ipv4, ipv4);
        } else {
            const ipv4Error = settled.find((result) => result.status === 'rejected');
            setFailure(views.ipv4, 4, ipv4Error ? ipv4Error.reason : new Error('Unable to detect'));
        }

        if (ipv6) {
            setSuccess(views.ipv6, ipv6);
        } else {
            setFailure(views.ipv6, 6, new Error('No IPv6 connection detected'));
        }

        setSourceNote(source);
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Addresses';
    }

    views.ipv4.copy.addEventListener('click', () =>
        copyText(views.ipv4.value.textContent, views.ipv4.copy)
    );
    views.ipv6.copy.addEventListener('click', () =>
        copyText(views.ipv6.value.textContent, views.ipv6.copy)
    );
    refreshBtn.addEventListener('click', detectAddresses);

    detectAddresses();
}

if (typeof module !== 'undefined') {
    module.exports = {
        IPV4_SOURCES,
        IPV6_SOURCES,
        isValidIpv4,
        isValidIpv6,
        extractIp,
        parseWhatIsMyIpAddressHtml,
        fetchPublicIp,
    };
}
