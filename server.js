const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    response.end(JSON.stringify(body));
}

function parseWhatIsMyIpAddressHtml(html) {
    const ipv4Match = html.match(/id=["']ipv4["'][^>]*>[\s\S]*?([0-9]{1,3}(?:\.[0-9]{1,3}){3})/i);
    const ipv6Match = html.match(/id=["']ipv6["'][^>]*>[\s\S]*?([0-9a-f:]{2,}:[0-9a-f:.]{2,})/i);

    return {
        ipv4: ipv4Match ? ipv4Match[1] : '',
        ipv6: ipv6Match ? ipv6Match[1] : '',
    };
}

async function handlePublicIp(response) {
    const pageResponse = await fetch('https://whatismyipaddress.com/', {
        headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(12000),
    });
    const html = await pageResponse.text();
    const parsed = parseWhatIsMyIpAddressHtml(html);

    if (!pageResponse.ok || (!parsed.ipv4 && !parsed.ipv6)) {
        sendJson(response, 502, {
            error: 'Unable to read IP addresses from whatismyipaddress.com.',
        });
        return;
    }

    sendJson(response, 200, {
        ...parsed,
        source: 'whatismyipaddress.com',
    });
}

function serveStatic(requestUrl, response) {
    let pathname;
    try {
        pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
        response.writeHead(400);
        response.end('Bad request');
        return;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let filePath = path.resolve(ROOT, relativePath);

    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (error, contents) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500);
            response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
            return;
        }

        response.writeHead(200, {
            'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        });
        response.end(contents);
    });
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && requestUrl.pathname === '/api/ip') {
        try {
            await handlePublicIp(response);
        } catch {
            sendJson(response, 502, {
                error: 'Unable to read IP addresses from whatismyipaddress.com.',
            });
        }
        return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Method not allowed');
        return;
    }

    serveStatic(requestUrl, response);
});

server.listen(PORT, () => {
    console.log(`GeekTool is running at http://localhost:${PORT}`);
});
