const CAPA_CRITERIA = [
    {
        id: 'payment-oncreate',
        title: 'PaymentApplication onCreate',
        shortTitle: 'onCreate',
        group: 'Lifecycle',
        icon: '🐣',
        pattern: /PaymentApplication.*onCreate|onCreate.*PaymentApplication/i,
    },
    {
        id: 'bootup',
        title: 'BootUp action received',
        shortTitle: 'BootUp',
        group: 'Lifecycle',
        icon: '🚀',
        pattern: /BootUp action received/i,
    },
    {
        id: 'trigger-dispatcher',
        title: 'TriggerDispatcherReceiver onReceive',
        shortTitle: 'Trigger',
        group: 'Lifecycle',
        icon: '📡',
        pattern: /TriggerDispatcherReceiver.*onReceive|onReceive.*TriggerDispatcherReceiver/i,
    },
    {
        id: 'ecr-mode',
        title: 'ECR Request Ecr Mode',
        shortTitle: 'Ecr Mode',
        group: 'ECR',
        icon: '🎯',
        pattern: /ECR Request(?:\s*=>\s*|\s+)Ecr\s*Mode/i,
    },
    {
        id: 'ecr-request',
        title: 'ECR Request =>',
        shortTitle: 'ECR Request',
        group: 'ECR',
        icon: '📤',
        pattern: /ECR Request\s*=>/i,
    },
    {
        id: 'host-request',
        title: 'Host transaction request',
        shortTitle: 'Host req',
        group: 'Host',
        icon: '📨',
        pattern: /(?:transaction\s+)?request to host|send(?:ing)?(?:\s+\w+)?\s+to host|host request|online request|iso(?:8583)? request/i,
    },
    {
        id: 'host-response',
        title: 'Host transaction response',
        shortTitle: 'Host resp',
        group: 'Host',
        icon: '📬',
        pattern: /(?:transaction\s+)?response from host|receiv(?:ed|ing)(?:\s+\w+)?\s+from host|host response|online response|iso(?:8583)? response/i,
    },
    {
        id: 'ecr-response',
        title: 'ECR Response =>',
        shortTitle: 'ECR Response',
        group: 'ECR',
        icon: '📥',
        pattern: /ECR Response\s*=>/i,
    },
];

function extractTimestamp(line) {
    const match = line.match(
        /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?|\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)/
    );
    return match ? match[1].trim() : '';
}

function isEcrModeLine(line) {
    return /ECR Request(?:\s*=>\s*|\s+)Ecr\s*Mode/i.test(line);
}

function criteriaForLine(line) {
    return CAPA_CRITERIA.filter((criterion) => {
        if (criterion.id === 'ecr-request' && isEcrModeLine(line)) {
            return false;
        }
        return criterion.pattern.test(line);
    });
}

function extractDetail(line, criterion) {
    if (criterion.id === 'ecr-mode') {
        const mode = String(line).split(/Ecr\s*Mode/i)[1] || '';
        return mode.replace(/^[\s:=>-]+/, '').trim();
    }

    if (criterion.id === 'ecr-request' || criterion.id === 'ecr-response') {
        const payload = line.split(/=>/).slice(1).join('=>').trim();
        return payload || '';
    }

    return '';
}

const TXN_START_ID = 'trigger-dispatcher';
const TXN_END_ID = 'ecr-response';
const SESSION_EVENT_IDS = new Set(['payment-oncreate', 'bootup']);

function createSessionGroup(id) {
    return {
        id: id || 'session',
        kind: 'session',
        title: 'App lifecycle',
        icon: '🌙',
        events: [],
        complete: false,
        status: 'session',
        mode: '',
        response: '',
        appSequence: [],
        ecrSequence: [],
    };
}

function sequenceStep(event, extra = {}) {
    return {
        id: event.criterionId,
        icon: event.icon,
        label: event.shortTitle || event.title,
        missing: false,
        ...extra,
    };
}

function attachSequences(group) {
    group.appSequence = group.events
        .filter((event) => event.group === 'Lifecycle')
        .map((event) => sequenceStep(event));
    group.ecrSequence = group.events
        .filter((event) => event.group === 'ECR' || event.group === 'Host')
        .map((event) => {
            if (event.criterionId === 'ecr-response' && (group.responseCode || group.responseStatus)) {
                return sequenceStep(event, { label: group.responseLabel });
            }
            return sequenceStep(event);
        });

    if (group.kind === 'txn' && !group.hasEcrResponse && (group.hasEcrRequest || group.hasEcrMode)) {
        group.ecrSequence.push({
            id: 'missing-response',
            icon: '∅',
            label: 'ECR Response',
            missing: true,
        });
    }
}

const RESPONSE_STATUS_WORDS = /^(APPROVED|DECLINED|REJECTED|APPROVE|DECLINE|REJECT|CANCELLED|CANCELED|TIMEOUT|FAILED|SUCCESS|ERROR|VOIDED|REVERSED|PENDING|UNKNOWN)$/i;
const RESPONSE_CODE_HEADERS = /^(MS|MSG|STX|ETX|ACK|NAK|LEN|ECR|RSP|REQ|ID)$/i;
const RESPONSE_CODE_JUNK = /^(ECR|CMD|REQ|AMT|PAN|TID|MID|STAN|TYPE|CODE|DATE|TIME|LOG|MS|EDC|POS|PIN|ICC|NFC|EMV|TLV|HEX|APP|DEV)$/i;
const KNOWN_ECR_RESULT = /^(UC|IO|AP|ND|TO|NE|CE|IE|AE|RE|NA|DE|VO|Y1|Y2|Y3|Z1|Z3|Z4|EERM)$/i;

function normalizeResponseCode(value, options = {}) {
    const code = String(value || '')
        .trim()
        .replace(/^["'<[/(]+|[>"'\])]+$/g, '')
        .toUpperCase()
        .replace(/[/.]/g, '');
    if (RESPONSE_STATUS_WORDS.test(code) || RESPONSE_CODE_JUNK.test(code) || RESPONSE_CODE_HEADERS.test(code)) {
        return '';
    }
    if (/^[A-Z]{3,4}$/.test(code)) {
        if (KNOWN_TXN_TYPES.test(code)) return '';
        if (options.tagged || KNOWN_ECR_RESULT.test(code)) return code;
        return '';
    }
    if (/^[A-Z0-9]{2}$/.test(code)) return code;
    return '';
}

function stripLogPrefix(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line
            .replace(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\s*/, '')
            .replace(/^\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\s*/, '')
            .replace(/\b\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?\b/g, ' ')
            .replace(/^\d+\s+\d+\s+/, '')
            .replace(/^[VDIWEAF]\s+/, '')
            .replace(/^[A-Za-z0-9_./$]+:\s+/, '')
            .trim())
        .filter(Boolean)
        .join('\n');
}

function collectResponseTokens(text) {
    return String(text || '')
        .replace(/I\s*\/\s*O/gi, 'IO')
        .split(/[\s,;|=:：]+/)
        .map((part) => normalizeResponseCode(part))
        .filter(Boolean);
}

function extractKnownEcrResult(text) {
    const match = String(text || '').match(/(?:^|[^A-Za-z0-9])(UC|IO|AP|ND|TO|NE|CE|IE|AE|RE|NA|DE|VO|Y1|Y2|Y3|Z1|Z3|Z4|EERM)(?![A-Za-z0-9])/i);
    return match ? match[1].toUpperCase() : '';
}

function extractResponseCode(text) {
    const value = String(text || '');
    if (!value) return '';

    const payload = value.includes('ECR Response')
        ? value.split(/ECR Response\s*=>/i).slice(1).join('=>').trim()
        : value;
    const search = stripLogPrefix(payload).replace(/\bEDC\b/gi, ' ');
    if (!search.trim()) return '';

    const tagged = search.match(
        /\b(?:RESP|RC|RSPC|RspCode|DE39|result(?:\s*code)?)\s*[=:：]\s*([A-Za-z]{3,4}|[A-Za-z0-9]{2}|I\s*\/\s*O)(?!-)\b/i
    ) || search.match(/\bRESP\s+([A-Za-z]{3,4}|[A-Za-z0-9]{2}|I\s*\/\s*O)\b/i)
        || search.match(/\bRC\s+([A-Za-z0-9]{2}|I\s*\/\s*O)\b/i);
    const taggedCode = tagged ? normalizeResponseCode(tagged[1], { tagged: true }) : '';
    if (taggedCode && taggedCode !== 'EDC') return taggedCode;

    const json = search.match(/["'](?:rc|resp)["']\s*:\s*["']?([A-Za-z]{3,4}|[A-Za-z0-9]{2})/i);
    const jsonCode = json ? normalizeResponseCode(json[1], { tagged: true }) : '';
    if (jsonCode && jsonCode !== 'EDC') return jsonCode;

    const known = extractKnownEcrResult(search);
    if (known && known !== 'EDC') return known;

    const glued = search.match(/(?:^|[^A-Za-z0-9])MS([A-Z]{3,4}|[A-Z0-9]{2})(?![A-Za-z0-9])/i);
    const gluedCode = glued ? normalizeResponseCode(glued[1]) : '';
    if (gluedCode && gluedCode !== 'EDC') return gluedCode;

    const tokens = collectResponseTokens(search).filter((token) => token !== 'EDC' && !RESPONSE_CODE_HEADERS.test(token));
    const letterToken = tokens.find((token) => /^[A-Z]{2,4}$/.test(token) && token !== 'EDC');
    if (letterToken) return letterToken;
    if (tokens.length && tokens[0] !== 'EDC') return tokens[0];

    return '';
}

function extractEcrStatus(text) {
    const match = String(text || '').match(
        /(?:^|[^A-Za-z])(APPROVED|DECLINED|REJECTED|APPROVE|DECLINE|REJECT|CANCELLED|CANCELED|TIMEOUT|FAILED|SUCCESS|ERROR|VOIDED|REVERSED|PENDING|UNKNOWN)(?![A-Za-z])/i
    );
    if (!match) return '';
    const status = match[1].toUpperCase();
    if (status === 'APPROVE') return 'APPROVED';
    if (status === 'DECLINE') return 'DECLINED';
    if (status === 'REJECT') return 'REJECTED';
    if (status === 'CANCELED') return 'CANCELLED';
    return status;
}

function formatResponseLabel(status, code) {
    if (status && code) return `${status} · RESP ${code}`;
    if (code) return `RESP ${code}`;
    if (status) return status;
    return 'RESP -';
}

function formatRcLabel(code) {
    return code ? `RESP ${code}` : 'RESP -';
}

const KNOWN_TXN_TYPE = '(SALE|VOID|REFUND|AUTH|SETTLE|SETTLEMENT|REVERSAL|PREAUTH|COMPLETION|TIP|CASH|BALANCE|QR|QRPAY|EWALLET|DCC|ADJUST|OFFLINE|INQUIRY|PURCHASE|WITHDRAWAL|PAY|PAYMENT)';
const KNOWN_TXN_TYPES = new RegExp(`^${KNOWN_TXN_TYPE}$`, 'i');

function eventSearchText(event) {
    return [event.detail, event.line, event.context].filter(Boolean).join('\n');
}

function normalizeCmdValue(value) {
    const cmd = String(value || '').trim().replace(/^["'<\[]+|["'>\]]+$/g, '');
    if (!cmd || /^(CMD|CODE|ID|TYPE|ECR|REQUEST|RESPONSE|MODE)$/i.test(cmd)) return '';
    return cmd.toUpperCase();
}

function extractKnownType(text) {
    const payload = String(text || '').split(/ECR Request\s*=>/i)[1] || text;
    const match = String(payload).match(new RegExp(`(?:^|[^A-Za-z])${KNOWN_TXN_TYPE}(?![A-Za-z])`, 'i'));
    return match ? match[1].toUpperCase() : '';
}

function extractCmd(text) {
    const value = String(text || '');
    const patterns = [
        /[\[(]\s*CMD\s*[\])]\s*[=:：＝|#-]?\s*"?([A-Za-z0-9_\/.-]+)"?/i,
        /cmd(?:[_\s-]*(?:code|id|type))?\s*[=:：＝]\s*"?([A-Za-z0-9_\/.-]+)"?/i,
        /['"]cmd['"]\s*:\s*['"]?([A-Za-z0-9_\/.-]+)/i,
        /<CMD>\s*([^<\s]+)\s*<\/CMD>/i,
        /CMD\s*[\[(]\s*([A-Za-z0-9_\/.-]+)\s*[\])]/i,
        /(?:^|[^A-Za-z])CMD\s*[,|#]\s*([A-Za-z0-9_\/.-]+)/i,
        /(?:^|[^A-Za-z])CMD\s+([A-Za-z0-9_\/.-]{2,})\b/i,
        /(?:txn\s*type|trans(?:action)?\s*type|msg\s*type|command)\s*[=:：＝]\s*"?([A-Za-z0-9_\/.-]+)"?/i,
    ];

    for (const pattern of patterns) {
        const match = value.match(pattern);
        const cmd = match ? normalizeCmdValue(match[1]) : '';
        if (cmd) return cmd;
    }

    const known = extractKnownType(value);
    if (known) return known;

    const afterRequest = value.split(/ECR Request\s*=>/i)[1];
    if (afterRequest) {
        const firstToken = afterRequest.trim().match(/^"?([A-Za-z][A-Za-z0-9_\/.-]{1,20})/);
        if (firstToken && !/^(ECR|REQUEST|RESPONSE|MODE)$/i.test(firstToken[1])) {
            return firstToken[1].toUpperCase();
        }
    }

    return '';
}

function resolveTxnType(txn) {
    const requestText = txn.events
        .filter((event) => event.criterionId === 'ecr-request')
        .map(eventSearchText)
        .join('\n');
    const ecrText = txn.events
        .filter((event) => event.group === 'ECR')
        .map(eventSearchText)
        .join('\n');
    const allText = txn.events.map(eventSearchText).join('\n');
    const fromMode = String(txn.mode || '').trim().split(/[\s,;|]+/)[0] || '';
    const modeLooksLikeType = fromMode && (KNOWN_TXN_TYPES.test(fromMode) || /^[A-Za-z][A-Za-z0-9_-]{1,20}$/.test(fromMode));

    txn.cmd = extractCmd(requestText) || extractCmd(ecrText) || extractCmd(allText);
    txn.txnType = txn.cmd || (modeLooksLikeType ? fromMode.toUpperCase() : '');
    txn.txnTypeLabel = txn.cmd ? `CMD ${txn.cmd}` : (txn.txnType || 'NO CMD');
}

function buildTxnTypeSummary(groups) {
    const categories = new Map();

    groups.filter((group) => group.kind === 'txn').forEach((txn) => {
        const type = txn.txnTypeLabel || txn.txnType || 'NO CMD';
        const status = txn.responseStatus || '';
        const code = txn.responseCode || '';
        const rowKey = `${status}||${code}`;
        if (!categories.has(type)) {
            categories.set(type, { type, count: 0, rows: new Map() });
        }
        const category = categories.get(type);
        const current = category.rows.get(rowKey) || { status, code, count: 0, groupIds: [] };
        current.count += 1;
        current.groupIds.push(txn.id);
        category.rows.set(rowKey, current);
        category.count += 1;
    });

    return Array.from(categories.values()).map((category) => ({
        type: category.type,
        count: category.count,
        rows: Array.from(category.rows.values()).sort((left, right) => {
            if (left.status !== right.status) return left.status.localeCompare(right.status);
            return left.code.localeCompare(right.code);
        }),
    })).sort((left, right) => left.type.localeCompare(right.type));
}

function resolveCycleResponse(txn) {
    const ecr = txn.events.find((event) => event.criterionId === 'ecr-response');
    const host = txn.events.find((event) => event.criterionId === 'host-response');
    const ecrText = ecr ? eventSearchText(ecr) : '';
    const hostText = host ? eventSearchText(host) : '';

    txn.responseCode = extractResponseCode(ecrText) || extractResponseCode(hostText);
    txn.responseStatus = extractEcrStatus(ecrText) || extractEcrStatus(hostText);
    txn.responseLabel = formatResponseLabel(txn.responseStatus, txn.responseCode);
}

function findMidCycleInterruptions(txn) {
    const start = txn.events.findIndex((event) => (
        event.criterionId === 'ecr-request' || event.criterionId === 'ecr-mode'
    ));
    if (start === -1) return [];

    const endIndex = txn.events.findIndex((event, index) => (
        index > start && event.criterionId === 'ecr-response'
    ));
    const end = endIndex === -1 ? txn.events.length : endIndex;
    const interruptions = [];

    for (let index = start + 1; index < end; index += 1) {
        const event = txn.events[index];
        if (event.criterionId === 'payment-oncreate') {
            interruptions.push({
                id: 'mid-oncreate',
                reason: 'PaymentApplication onCreate in the middle of this ECR cycle',
            });
        }
        if (event.criterionId === 'bootup') {
            interruptions.push({
                id: 'mid-bootup',
                reason: 'BootUp action in the middle of this ECR cycle',
            });
        }
    }

    return interruptions;
}

function collectAbnormalReasons(txn) {
    return (txn.interruptions || []).map((item) => item.reason);
}

function createTxnGroup(number, event) {
    return {
        id: `txn-${number}`,
        kind: 'txn',
        number,
        title: `Txn ${number}`,
        icon: '🛒',
        events: event ? [event] : [],
        complete: false,
        status: 'open',
        mode: '',
        response: '',
        responseCode: '',
        responseStatus: '',
        responseLabel: 'RESP -',
        cmd: '',
        txnType: '',
        txnTypeLabel: 'NO CMD',
        note: '',
        superseded: false,
        hasEcrRequest: false,
        hasEcrResponse: false,
        hasHostRequest: false,
        hasHostResponse: false,
        interruptions: [],
        abnormalReasons: [],
        appSequence: [],
        ecrSequence: [],
    };
}

function extractTriggerAction(line) {
    const match = String(line).match(/action\s*=\s*([^\s,;]+)/i);
    return match ? match[1] : '';
}

function txnHas(txn, criterionId) {
    return txn.events.some((event) => event.criterionId === criterionId);
}

function explainNoEcr(txn) {
    const trigger = txn.events.find((event) => event.criterionId === TXN_START_ID);
    const action = trigger ? extractTriggerAction(trigger.line) : '';
    const hasMode = txnHas(txn, 'ecr-mode');
    const hasHost = txnHas(txn, 'host-request') || txnHas(txn, 'host-response');
    const parts = ['No ECR Request => or ECR Response => after this trigger, so an ECR session never started.'];

    if (txn.superseded) {
        parts.push('A later TriggerDispatcherReceiver began before this one reached ECR, so this trigger was likely interrupted or replaced.');
    } else if (txn.events.length === 1) {
        parts.push('Only the trigger line was found. The action may have been ignored, PaymentApplication may not have been ready, or the log may have been cut off.');
    }

    if (hasMode) {
        parts.push(`ECR mode ${txn.mode || 'was selected'} but the request never went out.`);
    }

    if (hasHost) {
        parts.push('Host traffic appeared without the ECR request/response pair, which is unusual for a normal ECR txn.');
    }

    if (action) {
        parts.push(`Trigger action logged as ${action}.`);
    }

    return parts.join(' ');
}

function explainOpenTxn(txn) {
    if (txn.hasEcrRequest && !txn.hasEcrResponse) {
        return 'ECR Request => was sent, but no ECR Response => followed. The terminal may still have been waiting, timed out, crashed, or the log may have been truncated.';
    }

    if (!txn.hasEcrRequest && txn.hasEcrResponse) {
        return 'ECR Response => appeared without a matching ECR Request =>. The request line may be missing from this log, or a different format was used.';
    }

    return 'This transaction did not finish the usual TriggerDispatcherReceiver → ECR Response path.';
}

function explainNoResponse(txn) {
    const mode = txn.mode ? ` (${txn.mode})` : '';
    const hasTrigger = txnHas(txn, TXN_START_ID);
    const parts = [];

    if (txn.hasEcrRequest && txnHas(txn, 'ecr-mode')) {
        parts.push(`This cycle logged ECR Request => and ECR Request Ecr Mode${mode}, but no ECR Response =>.`);
    } else if (txn.hasEcrRequest) {
        parts.push('ECR Request => was logged without a matching ECR Response =>.');
    } else {
        parts.push(`ECR Request Ecr Mode${mode} was logged without an ECR Request => payload or an ECR Response =>.`);
    }

    parts.push('That handshake never finished — common when ECR keeps retrying, the ECR host never answers, or the response was not captured.');

    if (!hasTrigger) {
        parts.push('No TriggerDispatcherReceiver start was found for this cycle.');
    }

    return parts.join(' ');
}

function shouldStartNewEcrCycle(txn, event) {
    if (event.criterionId !== 'ecr-request' && event.criterionId !== 'ecr-mode') {
        return false;
    }

    if (!txn) {
        return true;
    }

    return txnHas(txn, event.criterionId);
}

function finalizeTxn(txn) {
    txn.hasEcrRequest = txnHas(txn, 'ecr-request');
    txn.hasEcrResponse = txnHas(txn, 'ecr-response');
    txn.hasEcrMode = txnHas(txn, 'ecr-mode');
    txn.hasHostRequest = txnHas(txn, 'host-request');
    txn.hasHostResponse = txnHas(txn, 'host-response');
    txn.interruptions = findMidCycleInterruptions(txn);
    resolveCycleResponse(txn);
    resolveTxnType(txn);

    if (!txnHas(txn, TXN_START_ID) && (txn.hasEcrRequest || txn.hasEcrMode)) {
        txn.title = `ECR cycle ${txn.number}`;
    }

    if (txn.status === 'orphan') {
        txn.icon = '🧩';
        txn.note = txn.hasEcrRequest
            ? 'ECR Response => appeared without a matching TriggerDispatcherReceiver start.'
            : 'ECR Response => appeared without a TriggerDispatcherReceiver start or an ECR Request =>.';
    } else if (txn.hasEcrRequest && txn.hasEcrResponse) {
        txn.complete = true;
        txn.status = 'complete';
        txn.icon = '🛒';
        txn.note = txn.interruptions.length
            ? txn.interruptions.map((item) => item.reason).join(' ')
            : '';
    } else if (!txn.hasEcrRequest && !txn.hasEcrMode && !txn.hasEcrResponse) {
        txn.complete = false;
        txn.status = 'no-ecr';
        txn.icon = '⚠️';
        txn.note = explainNoEcr(txn);
    } else if (!txn.hasEcrResponse && (txn.hasEcrRequest || txn.hasEcrMode)) {
        txn.complete = false;
        txn.status = 'no-response';
        txn.icon = '🚫';
        txn.note = explainNoResponse(txn);
    } else {
        txn.complete = false;
        txn.status = txn.hasEcrRequest ? 'open' : 'no-request';
        txn.icon = '⏳';
        txn.note = explainOpenTxn(txn);
    }

    if (txn.interruptions.length && txn.status !== 'complete') {
        txn.note = `${txn.interruptions.map((item) => item.reason).join(' ')} ${txn.note}`.trim();
    }

    txn.abnormalReasons = collectAbnormalReasons(txn);
    attachSequences(txn);
}

function applyEventToTxn(txn, event) {
    txn.events.push(event);
    if (event.criterionId === 'ecr-mode' && event.detail) {
        txn.mode = event.detail;
    }
    if (event.criterionId === TXN_END_ID && event.detail) {
        txn.response = event.detail;
    }
}

function groupTransactions(events) {
    const groups = [];
    let pendingLifecycle = [];
    let current = null;
    let txnIndex = 0;
    let lifecycleIndex = 0;

    function takePendingInto(txn) {
        if (!pendingLifecycle.length) return;
        txn.events = pendingLifecycle.concat(txn.events);
        pendingLifecycle = [];
    }

    function flushPendingLifecycle() {
        if (!pendingLifecycle.length) return;
        lifecycleIndex += 1;
        const group = createSessionGroup(`lifecycle-${lifecycleIndex}`);
        group.events = pendingLifecycle;
        pendingLifecycle = [];
        attachSequences(group);
        groups.push(group);
    }

    function startTxn(event) {
        txnIndex += 1;
        current = createTxnGroup(txnIndex, event);
        takePendingInto(current);
        groups.push(current);
    }

    events.forEach((event) => {
        if (SESSION_EVENT_IDS.has(event.criterionId)) {
            if (current) {
                applyEventToTxn(current, event);
            } else {
                pendingLifecycle.push(event);
            }
            return;
        }

        if (event.criterionId === TXN_START_ID) {
            if (current) {
                current.superseded = true;
            }
            startTxn(event);
            return;
        }

        if (event.criterionId === TXN_END_ID) {
            if (!current) {
                startTxn(null);
                current.status = 'orphan';
            }
            applyEventToTxn(current, event);
            if (current.status !== 'orphan') {
                current.complete = true;
                current.status = 'complete';
            }
            current = null;
            return;
        }

        if (shouldStartNewEcrCycle(current, event)) {
            startTxn(event);
            return;
        }

        if (current) {
            applyEventToTxn(current, event);
            return;
        }

        startTxn(event);
    });

    flushPendingLifecycle();
    groups.filter((group) => group.kind === 'txn').forEach(finalizeTxn);

    const result = groups;

    return {
        groups: result,
        txnCount: groups.filter((group) => group.kind === 'txn').length,
        completedCount: groups.filter((group) => group.complete).length,
        noEcrCount: groups.filter((group) => group.status === 'no-ecr').length,
        noResponseCount: groups.filter((group) => group.status === 'no-response').length,
        incompleteCount: groups.filter((group) => (
            group.kind === 'txn'
            && !group.complete
            && group.status !== 'no-ecr'
            && group.status !== 'no-response'
        )).length,
        abnormalGroups: groups.filter((group) => group.kind === 'txn' && group.abnormalReasons.length),
        txnTypeSummary: buildTxnTypeSummary(groups),
    };
}

function peekEventContext(lines, index) {
    const extras = [];
    for (let i = index + 1; i < lines.length && extras.length < 4; i += 1) {
        const next = String(lines[i] || '').trim();
        if (!next) continue;
        if (criteriaForLine(next).length) break;
        extras.push(next);
    }
    return extras.join('\n');
}

function analyzeCapaLog(logText) {
    const lines = String(logText).replace(/\r\n/g, '\n').split('\n');
    const events = [];
    const counts = Object.fromEntries(CAPA_CRITERIA.map((criterion) => [criterion.id, 0]));

    lines.forEach((line, index) => {
        if (!line.trim()) return;

        criteriaForLine(line).forEach((criterion) => {
            counts[criterion.id] += 1;
            events.push({
                lineNumber: index + 1,
                timestamp: extractTimestamp(line),
                criterionId: criterion.id,
                title: criterion.title,
                shortTitle: criterion.shortTitle || criterion.title,
                group: criterion.group,
                icon: criterion.icon,
                detail: extractDetail(line, criterion),
                line: line.trim(),
                context: criterion.group === 'ECR' ? peekEventContext(lines, index) : '',
            });
        });
    });

    return {
        lineCount: lines.length,
        events,
        counts,
        missing: CAPA_CRITERIA.filter((criterion) => counts[criterion.id] === 0).map((criterion) => criterion.title),
        ...groupTransactions(events),
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
    const logInput = document.getElementById('logInput');
    const logFile = document.getElementById('logFile');
    const errorMessage = document.getElementById('errorMessage');
    const resultPanel = document.getElementById('resultPanel');
    const summary = document.getElementById('summary');
    const criteriaFilters = document.getElementById('criteriaFilters');
    const abnormalJumps = document.getElementById('abnormalJumps');
    const txnTypeSummary = document.getElementById('txnTypeSummary');
    const timeline = document.getElementById('timeline');

    let currentAnalysis = null;
    let activeFilter = 'all';
    const expandedKeys = new Set();
    const collapsedTxnKeys = new Set();

    function eventKey(event) {
        return `${event.criterionId}:${event.lineNumber}`;
    }

    function txnRange(events) {
        if (!events.length) return '';
        const first = events[0];
        const last = events[events.length - 1];
        const start = first.timestamp || `L${first.lineNumber}`;
        const end = last.timestamp || `L${last.lineNumber}`;
        return start === end ? start : `${start} → ${end}`;
    }

    function renderLane(title, steps, extraClass) {
        if (!steps.length) return '';
        return `
            <p class="lifecycle-lane ${extraClass}">
                <span class="lifecycle-lane-title">${escapeHtml(title)}</span>
                ${steps.map((step) => `
                    <span class="lifecycle-step${step.missing ? ' is-missing' : ''}">
                        <span aria-hidden="true">${step.icon}</span>
                        ${escapeHtml(step.label)}
                    </span>
                `).join('<span class="lifecycle-arrow" aria-hidden="true">→</span>')}
            </p>
        `;
    }

    function txnStatusLabel(group) {
        if (group.kind === 'session') return 'outside txn';
        if (group.status === 'complete') return 'done';
        if (group.status === 'no-ecr') return 'no ECR';
        if (group.status === 'no-response') return 'no ECR response';
        if (group.status === 'no-request') return 'no ECR request';
        if (group.status === 'orphan') return 'no start';
        return 'open';
    }

    function renderScenario(event) {
        const key = eventKey(event);
        const expanded = expandedKeys.has(key);
        const metaBits = [
            `L${event.lineNumber}`,
            event.timestamp,
            event.detail,
        ].filter(Boolean);

        return `
            <article class="scenario scenario--${event.group.toLowerCase()}${expanded ? ' is-open' : ''}" data-key="${escapeHtml(key)}">
                <button type="button" class="scenario-toggle" aria-expanded="${expanded}">
                    <span class="scenario-icon" aria-hidden="true">${event.icon}</span>
                    <span class="scenario-copy">
                        <span class="scenario-title">${escapeHtml(event.title)}</span>
                        <span class="scenario-meta">${escapeHtml(metaBits.join(' · '))}</span>
                    </span>
                    <span class="scenario-hint">${expanded ? 'hide log' : 'show log'}</span>
                    <span class="scenario-chevron" aria-hidden="true"></span>
                </button>
                <div class="scenario-log" ${expanded ? '' : 'hidden'}>
                    <pre class="event-line-text">${escapeHtml(event.line)}</pre>
                </div>
            </article>
        `;
    }

    function renderFilters(analysis) {
        criteriaFilters.innerHTML = `
            <button type="button" class="filter-pill${activeFilter === 'all' ? ' active' : ''}" data-filter="all">
                🌈 All ${analysis.events.length}
            </button>
            ${CAPA_CRITERIA.map((criterion) => `
                <button type="button" class="filter-pill${activeFilter === criterion.id ? ' active' : ''}" data-filter="${criterion.id}">
                    ${criterion.icon} ${analysis.counts[criterion.id]}
                    <span class="filter-pill-label">${escapeHtml(criterion.title)}</span>
                </button>
            `).join('')}
        `;

        criteriaFilters.querySelectorAll('.filter-pill').forEach((pill) => {
            pill.addEventListener('click', () => {
                activeFilter = pill.dataset.filter;
                renderFilters(analysis);
                renderTimeline(analysis);
            });
        });
    }

    function renderTimeline(analysis) {
        const visibleGroups = analysis.groups
            .map((group) => ({
                ...group,
                events: activeFilter === 'all'
                    ? group.events
                    : group.events.filter((event) => event.criterionId === activeFilter),
            }))
            .filter((group) => group.events.length > 0);

        if (visibleGroups.length === 0) {
            timeline.innerHTML = '<p class="empty-timeline">No matching events for this filter.</p>';
            return;
        }

        timeline.innerHTML = visibleGroups.map((group) => {
            const collapsed = collapsedTxnKeys.has(group.id);
            const abnormal = Boolean(group.abnormalReasons && group.abnormalReasons.length);
            const metaBits = [
                group.mode,
                txnStatusLabel(group),
                `${group.events.length} step${group.events.length === 1 ? '' : 's'}`,
                txnRange(group.events),
            ].filter(Boolean);

            return `
            <section class="txn-group txn-group--${group.kind} txn-group--${group.status}${abnormal ? ' txn-group--abnormal' : ''}${collapsed ? ' is-collapsed' : ''}" id="group-${escapeHtml(group.id)}" data-txn="${escapeHtml(group.id)}">
                <button type="button" class="txn-toggle" aria-expanded="${!collapsed}">
                    <span class="txn-icon" aria-hidden="true">${group.icon}</span>
                    <span class="txn-copy">
                        <span class="txn-title">${escapeHtml(group.title)}</span>
                        <span class="txn-meta">${escapeHtml(metaBits.join(' · '))}</span>
                    </span>
                    ${group.kind === 'txn' ? renderTxnBadges(group) : ''}
                    <span class="txn-count">${group.kind === 'txn' ? `#${group.number}` : 'pre'}</span>
                    <span class="scenario-chevron" aria-hidden="true"></span>
                </button>
                <div class="lifecycle-lanes">
                    ${renderLane('App lifecycle', group.appSequence || [], 'lifecycle-lane--app')}
                    ${renderLane('ECR lifecycle', group.ecrSequence || [], 'lifecycle-lane--ecr')}
                </div>
                ${group.note ? `<p class="txn-note">${escapeHtml(group.note)}</p>` : ''}
                <div class="txn-steps" ${collapsed ? 'hidden' : ''}>
                    ${group.events.map(renderScenario).join('')}
                </div>
            </section>
            `;
        }).join('');
    }

    function renderAnalysis(analysis) {
        const detected = CAPA_CRITERIA.length - analysis.missing.length;
        const txnLabel = analysis.txnCount === 1 ? 'txn' : 'txns';
        summary.innerHTML = `
            <div class="stat-chip stat-chip--txn"><strong>${analysis.txnCount}</strong> ${txnLabel}</div>
            <div class="stat-chip stat-chip--ok"><strong>${analysis.completedCount}</strong> complete</div>
            ${analysis.noResponseCount
                ? `<div class="stat-chip stat-chip--alert"><strong>${analysis.noResponseCount}</strong> no ECR response</div>`
                : ''
            }
            ${analysis.noEcrCount
                ? `<div class="stat-chip stat-chip--alert"><strong>${analysis.noEcrCount}</strong> no ECR</div>`
                : ''
            }
            ${analysis.abnormalGroups.length
                ? `<div class="stat-chip stat-chip--alert"><strong>${analysis.abnormalGroups.length}</strong> abnormal</div>`
                : ''
            }
            ${analysis.incompleteCount
                ? `<div class="stat-chip stat-chip--missing"><strong>${analysis.incompleteCount}</strong> open</div>`
                : ''
            }
            <div class="stat-chip"><strong>${analysis.lineCount}</strong> lines</div>
            <div class="stat-chip"><strong>${analysis.events.length}</strong> events</div>
            <div class="stat-chip"><strong>${detected}/${CAPA_CRITERIA.length}</strong> criteria found</div>
            ${analysis.missing.length
                ? `<div class="stat-chip stat-chip--missing">Missing: ${escapeHtml(analysis.missing.join(', '))}</div>`
                : ''
            }
        `;
        renderFilters(analysis);
        renderTxnTypeSummary(analysis);
        renderAbnormalJumps(analysis);
        renderTimeline(analysis);
        resultPanel.hidden = false;
    }

    function renderTxnBadges(group) {
        return `
            <span class="txn-badges">
                <span class="txn-cmd">${escapeHtml(group.txnTypeLabel || 'NO CMD')}</span>
                <span class="txn-status">${escapeHtml(group.responseStatus || '—')}</span>
                <span class="txn-rc">${escapeHtml(formatRcLabel(group.responseCode))}</span>
            </span>
        `;
    }

    function renderTxnTypeSummary(analysis) {
        const categories = analysis.txnTypeSummary || [];
        if (!categories.length) {
            txnTypeSummary.hidden = true;
            txnTypeSummary.innerHTML = '';
            return;
        }

        txnTypeSummary.hidden = false;
        txnTypeSummary.innerHTML = `
            <p class="tool-label">Transaction type summary</p>
            <div class="txn-type-list">
                ${categories.map((category) => `
                    <section class="txn-type-category">
                        <p class="txn-type-category-title">
                            <span class="txn-cmd">${escapeHtml(category.type || 'NO CMD')}</span>
                            <span class="txn-type-count">×${category.count}</span>
                        </p>
                        ${category.rows.map((row) => `
                            <button type="button" class="txn-type-chip" data-jump-ids="${escapeHtml((row.groupIds || []).join(','))}">
                                <span class="txn-cmd">${escapeHtml(category.type || 'NO CMD')}</span>
                                <span class="txn-status">${escapeHtml(row.status || '—')}</span>
                                <span class="txn-rc">${escapeHtml(formatRcLabel(row.code))}</span>
                                <span class="txn-type-count">×${row.count}</span>
                            </button>
                        `).join('')}
                    </section>
                `).join('')}
            </div>
        `;
    }

    function renderAbnormalJumps(analysis) {
        const abnormal = analysis.abnormalGroups || [];
        if (!abnormal.length) {
            abnormalJumps.hidden = true;
            abnormalJumps.innerHTML = '';
            return;
        }

        abnormalJumps.hidden = false;
        abnormalJumps.innerHTML = `
            <p class="tool-label">Jump to abnormal ECR</p>
            <div class="abnormal-jump-list">
                ${abnormal.map((group) => `
                    <button type="button" class="abnormal-jump" data-jump="${escapeHtml(group.id)}">
                        <span class="abnormal-jump-title">${escapeHtml(group.title)}</span>
                        <span class="abnormal-jump-reason">${escapeHtml(group.abnormalReasons.join(' · '))}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function jumpToGroup(groupId) {
        jumpToGroups(groupId ? [groupId] : []);
    }

    function jumpToGroups(groupIds) {
        const ids = (groupIds || []).filter(Boolean);
        if (!currentAnalysis || !ids.length) return;

        activeFilter = 'all';
        ids.forEach((id) => collapsedTxnKeys.delete(id));
        renderFilters(currentAnalysis);
        renderTimeline(currentAnalysis);

        const nodes = ids
            .map((id) => timeline.querySelector(`[data-txn="${CSS.escape(id)}"]`))
            .filter(Boolean);
        if (!nodes.length) return;

        nodes[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        nodes.forEach((node) => node.classList.add('is-focused'));
        window.setTimeout(() => {
            nodes.forEach((node) => node.classList.remove('is-focused'));
        }, 1600);
    }

    function analyze() {
        hideError(errorMessage);
        resultPanel.hidden = true;
        activeFilter = 'all';
        expandedKeys.clear();
        collapsedTxnKeys.clear();

        const logText = logInput.value;
        if (!logText.trim()) {
            showError(errorMessage, 'Upload or paste a CAPA log first.');
            return;
        }

        currentAnalysis = analyzeCapaLog(logText);
        renderAnalysis(currentAnalysis);
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

    txnTypeSummary.addEventListener('click', (event) => {
        const button = event.target.closest('.txn-type-chip');
        if (!button) return;
        jumpToGroups(String(button.dataset.jumpIds || '').split(','));
    });

    abnormalJumps.addEventListener('click', (event) => {
        const button = event.target.closest('.abnormal-jump');
        if (!button) return;
        jumpToGroup(button.dataset.jump);
    });

    timeline.addEventListener('click', (event) => {
        const txnToggle = event.target.closest('.txn-toggle');
        if (txnToggle) {
            const group = txnToggle.closest('.txn-group');
            const key = group.dataset.txn;
            const collapsed = collapsedTxnKeys.has(key);
            if (collapsed) {
                collapsedTxnKeys.delete(key);
            } else {
                collapsedTxnKeys.add(key);
            }
            group.classList.toggle('is-collapsed', !collapsed);
            txnToggle.setAttribute('aria-expanded', String(collapsed));
            group.querySelector('.txn-steps').hidden = !collapsed;
            return;
        }

        const toggle = event.target.closest('.scenario-toggle');
        if (!toggle) return;

        const scenario = toggle.closest('.scenario');
        const key = scenario.dataset.key;
        const isOpen = expandedKeys.has(key);

        if (isOpen) {
            expandedKeys.delete(key);
        } else {
            expandedKeys.add(key);
        }

        scenario.classList.toggle('is-open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
        toggle.querySelector('.scenario-hint').textContent = isOpen ? 'show log' : 'hide log';
        scenario.querySelector('.scenario-log').hidden = isOpen;
    });

    document.getElementById('analyzeBtn').addEventListener('click', analyze);
    document.getElementById('clearBtn').addEventListener('click', () => {
        logInput.value = '';
        logFile.value = '';
        currentAnalysis = null;
        activeFilter = 'all';
        expandedKeys.clear();
        collapsedTxnKeys.clear();
        resultPanel.hidden = true;
        hideError(errorMessage);
        logInput.focus();
    });
}

if (typeof module !== 'undefined') {
    module.exports = {
        CAPA_CRITERIA,
        analyzeCapaLog,
        groupTransactions,
        extractTimestamp,
        extractDetail,
        criteriaForLine,
        extractResponseCode,
        extractEcrStatus,
        formatResponseLabel,
        extractCmd,
        formatRcLabel,
        buildTxnTypeSummary,
    };
}
