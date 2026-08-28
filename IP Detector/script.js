const IP_ENDPOINTS = {
    ipv4: 'https://api.ipify.org?format=json',
    ipv6: 'https://api6.ipify.org?format=json',
};

function isValidIpv4(value) {
    const parts = value.split('.');
    return parts.length === 4 && parts.every((part) =>
        /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
    );
}

function isValidIpv6(value) {
    return value.includes(':') && /^[0-9a-f:.]+$/i.test(value);
}

async function fetchPublicIp(endpoint, version, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            cache: 'no-store',
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}.`);
        }

        const data = await response.json();
        const value = String(data.ip || '').trim();
        const isValid = version === 4 ? isValidIpv4(value) : isValidIpv6(value);

        if (!isValid) {
            throw new Error(`The service returned an invalid IPv${version} address.`);
        }

        return value;
    } finally {
        clearTimeout(timeout);
    }
}

if (typeof document !== 'undefined') {
    const refreshBtn = document.getElementById('refreshBtn');

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

    async function detectAddresses() {
        setLoading(views.ipv4);
        setLoading(views.ipv6);
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Detecting…';

        const requests = [
            fetchPublicIp(IP_ENDPOINTS.ipv4, 4),
            fetchPublicIp(IP_ENDPOINTS.ipv6, 6),
        ];
        const [ipv4Result, ipv6Result] = await Promise.allSettled(requests);

        if (ipv4Result.status === 'fulfilled') {
            setSuccess(views.ipv4, ipv4Result.value);
        } else {
            setFailure(views.ipv4, 4, ipv4Result.reason);
        }

        if (ipv6Result.status === 'fulfilled') {
            setSuccess(views.ipv6, ipv6Result.value);
        } else {
            setFailure(views.ipv6, 6, ipv6Result.reason);
        }

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
    module.exports = { IP_ENDPOINTS, isValidIpv4, isValidIpv6, fetchPublicIp };
}
