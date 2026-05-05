const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== DATA STORAGE ====================
const DATA_FILE = 'game_data.json';
const HISTORY_FILE = 'prediction_history.json';

let gameData = {
    lastUpdate: null,
    currentPhien: null,
    history: [],
    stats: {
        totalPhien: 0,
        taiCount: 0,
        xiuCount: 0
    }
};

let predictionHistory = {
    predictions: [],
    stats: {
        total: 0,
        correct: 0,
        accuracy: 0
    }
};

// Load data từ file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            gameData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            console.log('✅ Game data loaded');
        }
        if (fs.existsSync(HISTORY_FILE)) {
            predictionHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            console.log('✅ Prediction history loaded');
        }
    } catch (e) {
        console.log('⚠️ Error loading data');
    }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(gameData, null, 2));
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(predictionHistory, null, 2));
    } catch (e) {
        console.log('⚠️ Error saving data');
    }
}

// Auto save mỗi 30s
setInterval(saveData, 30000);

// ==================== FREE PROXY SYSTEM ====================
const FREE_PROXY_SOURCES = [
    'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
    'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
];

let proxyList = [];
let workingProxies = [];
let currentProxy = null;
let lastProxyUpdate = 0;

async function fetchFreeProxies() {
    console.log('🔍 Fetching free proxies...');
    const newProxies = [];
    
    for (const source of FREE_PROXY_SOURCES) {
        try {
            const response = await fetch(source);
            const text = await response.text();
            const proxies = text.split('\n')
                .map(p => p.trim())
                .filter(p => p && p.includes(':') && !p.startsWith('#'));
            newProxies.push(...proxies);
        } catch (error) {
            // Silently continue
        }
    }
    
    proxyList = [...new Set(newProxies)];
    console.log(`✅ Found ${proxyList.length} proxies`);
    return proxyList;
}

function testProxy(proxyUrl) {
    return new Promise((resolve) => {
        const [host, port] = proxyUrl.split(':');
        const startTime = Date.now();
        
        const req = http.request({
            host: host,
            port: parseInt(port),
            path: 'http://www.google.com',
            method: 'GET',
            timeout: 5000,
        }, (res) => {
            resolve({
                working: res.statusCode === 200,
                latency: Date.now() - startTime,
                url: proxyUrl
            });
        });
        
        req.on('error', () => resolve({ working: false }));
        req.on('timeout', () => { req.destroy(); resolve({ working: false }); });
        req.end();
    });
}

async function getWorkingProxies(count = 5) {
    if (proxyList.length === 0 || Date.now() - lastProxyUpdate > 1800000) {
        await fetchFreeProxies();
        lastProxyUpdate = Date.now();
    }
    
    const testPromises = proxyList.slice(0, 20).map(p => testProxy(p));
    const results = await Promise.all(testPromises);
    
    workingProxies = results
        .filter(r => r.working)
        .sort((a, b) => a.latency - b.latency)
        .slice(0, count);
    
    if (workingProxies.length > 0) {
        currentProxy = `http://${workingProxies[0].url}`;
        console.log(`🔀 Using proxy: ${currentProxy} (${workingProxies[0].latency}ms)`);
    } else {
        currentProxy = null;
        console.log('⚠️ No working proxies, using direct');
    }
    
    return workingProxies;
}

// ==================== WEBSOCKET CLIENT ====================
const WS_URL = 'wss://link-server-game.com';
const MAX_RETRIES = 50;
const INITIAL_RETRY_DELAY = 3000;
const MAX_RETRY_DELAY = 20000;

let ws = null;
let isConnecting = false;
let retryCount = 0;
let retryDelay = INITIAL_RETRY_DELAY;
let wsConnected = false;

function getRandomHeaders() {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    ];

    return {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'Upgrade',
        'Origin': 'https://link-server-game.com',
        'Pragma': 'no-cache',
        'Sec-WebSocket-Key': Buffer.from(Date.now().toString(36) + Math.random().toString(36)).toString('base64'),
        'Sec-WebSocket-Version': '13',
        'Upgrade': 'websocket',
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    };
}

async function connectWebSocket() {
    if (isConnecting) return;
    
    if (retryCount >= MAX_RETRIES) {
        console.log(`🛑 Max retries (${MAX_RETRIES}), waiting 60s...`);
        setTimeout(() => {
            retryCount = 0;
            retryDelay = INITIAL_RETRY_DELAY;
            connectWebSocket();
        }, 60000);
        return;
    }

    isConnecting = true;
    retryCount++;
    
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🔄 WebSocket attempt ${retryCount}`);
    
    // Rotate proxy mỗi 5 lần
    if (retryCount % 5 === 0) {
        await getWorkingProxies(3);
    }
    
    try {
        const headers = getRandomHeaders();
        const wsOptions = {
            headers: headers,
            handshakeTimeout: 10000,
            rejectUnauthorized: false,
            followRedirects: true,
        };
        
        // Add proxy agent nếu có
        if (currentProxy) {
            const [proxyHost, proxyPort] = currentProxy.replace('http://', '').split(':');
            const agent = new http.Agent({
                host: proxyHost,
                port: parseInt(proxyPort),
            });
            wsOptions.agent = agent;
        }

        ws = new WebSocket(WS_URL, wsOptions);

        const connectionTimeout = setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.OPEN) {
                ws.terminate();
            }
        }, 15000);

        ws.on('open', () => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            wsConnected = true;
            retryCount = 0;
            retryDelay = INITIAL_RETRY_DELAY;
            
            console.log('✅ WebSocket CONNECTED!');
            
            // Update game status
            gameData.lastUpdate = new Date().toISOString();
            
            // Send subscription
            const subscribeMsg = JSON.stringify({
                action: 'subscribe',
                channel: 'game_data',
                timestamp: Date.now()
            });
            ws.send(subscribeMsg);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleGameMessage(message);
            } catch (e) {
                console.log('📦 Raw message received');
            }
        });

        ws.on('error', (error) => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            wsConnected = false;
            
            console.error('❌ WS Error:', error.message);
            
            if (error.message.includes('403')) {
                retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
            }
            
            cleanup();
            scheduleReconnect();
        });

        ws.on('close', (code, reason) => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            wsConnected = false;
            
            console.log(`🔌 Disconnected: ${code}`);
            
            if (code === 1000) {
                retryCount = 0;
                retryDelay = INITIAL_RETRY_DELAY;
            }
            
            cleanup();
            scheduleReconnect();
        });

    } catch (error) {
        isConnecting = false;
        wsConnected = false;
        console.error('❌ Exception:', error.message);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        scheduleReconnect();
    }
}

function handleGameMessage(message) {
    const msgType = message.action || message.type || 'unknown';
    
    switch (msgType) {
        case 'game_data':
        case 'phien_update':
            if (message.data || message.phien) {
                const phienData = message.data || message;
                
                // Update game data
                gameData.currentPhien = phienData.phien || phienData.Phien;
                gameData.lastUpdate = new Date().toISOString();
                
                // Add to history
                if (phienData.ket_qua || phienData.Ket_qua) {
                    const result = phienData.ket_qua || phienData.Ket_qua;
                    gameData.history.unshift({
                        phien: gameData.currentPhien,
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Update stats
                    gameData.stats.totalPhien++;
                    if (result === 'Tài' || result === 'tai') {
                        gameData.stats.taiCount++;
                    } else {
                        gameData.stats.xiuCount++;
                    }
                    
                    // Keep only last 100
                    if (gameData.history.length > 100) {
                        gameData.history = gameData.history.slice(0, 100);
                    }
                    
                    // Auto prediction
                    makePrediction();
                }
            }
            break;
            
        case 'pong':
            // Ping/pong keep-alive
            break;
            
        default:
            console.log('📨 Message:', msgType);
    }
}

// ==================== PREDICTION ENGINE ====================
function analyzePatterns(history) {
    if (history.length < 5) return null;
    
    const results = history.map(h => h.result);
    const patterns = [];
    
    // 1. Streak detection
    let streakType = results[0];
    let streakLength = 1;
    for (let i = 1; i < results.length; i++) {
        if (results[i] === streakType) {
            streakLength++;
        } else {
            break;
        }
    }
    
    if (streakLength >= 3) {
        patterns.push({
            type: 'streak',
            name: `${streakType} streak ${streakLength}`,
            prediction: streakLength >= 5 ? (streakType === 'Tài' ? 'Xỉu' : 'Tài') : streakType,
            weight: Math.min(streakLength * 2, 15)
        });
    }
    
    // 2. Alternating pattern
    let alternating = true;
    for (let i = 1; i < Math.min(10, results.length); i++) {
        if (results[i] === results[i - 1]) {
            alternating = false;
            break;
        }
    }
    
    if (alternating && results.length >= 4) {
        patterns.push({
            type: 'alternating',
            name: 'Alternating pattern',
            prediction: results[0] === 'Tài' ? 'Xỉu' : 'Tài',
            weight: 10
        });
    }
    
    // 3. Distribution analysis
    const last10 = results.slice(0, 10);
    const taiCount = last10.filter(r => r === 'Tài' || r === 'tai').length;
    
    if (taiCount >= 7) {
        patterns.push({
            type: 'distribution',
            name: `Tài heavy (${taiCount}/10)`,
            prediction: 'Xỉu',
            weight: 12
        });
    } else if (taiCount <= 3) {
        patterns.push({
            type: 'distribution',
            name: `Xỉu heavy (${10 - taiCount}/10)`,
            prediction: 'Tài',
            weight: 12
        });
    }
    
    return patterns;
}

function makePrediction() {
    if (gameData.history.length < 5) return null;
    
    const patterns = analyzePatterns(gameData.history);
    
    if (!patterns || patterns.length === 0) {
        // Default to random với bias nhẹ
        const taiRatio = gameData.stats.totalPhien > 0 ? 
            gameData.stats.taiCount / gameData.stats.totalPhien : 0.5;
        const prediction = taiRatio > 0.55 ? 'Xỉu' : (taiRatio < 0.45 ? 'Tài' : 
            (Math.random() > 0.5 ? 'Tài' : 'Xỉu'));
        
        return {
            prediction: prediction,
            confidence: 50,
            patterns: ['random'],
        };
    }
    
    // Weight voting
    let taiScore = 0;
    let xiuScore = 0;
    
    patterns.forEach(p => {
        if (p.prediction === 'Tài') {
            taiScore += p.weight;
        } else {
            xiuScore += p.weight;
        }
    });
    
    const totalScore = taiScore + xiuScore;
    const prediction = taiScore >= xiuScore ? 'Tài' : 'Xỉu';
    const confidence = Math.round((Math.max(taiScore, xiuScore) / totalScore) * 100);
    
    // Save prediction
    const nextPhien = gameData.currentPhien ? gameData.currentPhien + 1 : null;
    
    if (nextPhien) {
        predictionHistory.predictions.unshift({
            phien: nextPhien,
            prediction: prediction,
            confidence: confidence,
            patterns: patterns.map(p => p.name),
            timestamp: new Date().toISOString()
        });
        
        if (predictionHistory.predictions.length > 100) {
            predictionHistory.predictions = predictionHistory.predictions.slice(0, 100);
        }
    }
    
    return {
        prediction,
        confidence,
        patterns: patterns.map(p => p.name),
    };
}

function scheduleReconnect() {
    const delay = retryDelay + Math.floor(Math.random() * 2000);
    setTimeout(connectWebSocket, delay);
}

function cleanup() {
    if (ws) {
        try {
            ws.removeAllListeners();
            ws.terminate();
        } catch (e) {}
        ws = null;
    }
}

// ==================== PING SYSTEM ====================
let pingInterval = null;

function startPing() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 25000);
}

// ==================== EXPRESS API ROUTES ====================

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

app.use(express.json());

// Homepage
app.get('/', (req, res) => {
    res.json({
        name: 'Game Prediction API',
        version: '2.0.0',
        status: wsConnected ? 'connected' : 'disconnected',
        endpoints: [
            '/api/status',
            '/api/predict',
            '/api/history',
            '/api/stats',
            '/api/proxies'
        ]
    });
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        websocket: {
            connected: wsConnected,
            retryCount: retryCount,
            proxy: currentProxy ? currentProxy.replace(/\/\/.*@/, '//***@') : 'direct',
        },
        game: {
            currentPhien: gameData.currentPhien,
            lastUpdate: gameData.lastUpdate,
            historyCount: gameData.history.length,
        },
        server: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        }
    });
});

// Prediction endpoint
app.get('/api/predict', (req, res) => {
    const prediction = makePrediction();
    
    if (!prediction) {
        return res.json({
            error: 'Not enough data',
            message: 'Cần ít nhất 5 phiên để dự đoán',
            currentHistory: gameData.history.length
        });
    }
    
    const nextPhien = gameData.currentPhien ? gameData.currentPhien + 1 : null;
    
    res.json({
        phien: nextPhien,
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        patterns: prediction.patterns,
        timestamp: new Date().toISOString()
    });
});

// History endpoint
app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    
    res.json({
        total: predictionHistory.predictions.length,
        predictions: predictionHistory.predictions.slice(0, limit),
        gameHistory: gameData.history.slice(0, limit),
    });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    const total = predictionHistory.stats.total;
    const correct = predictionHistory.stats.correct;
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(2) : 'N/A';
    
    res.json({
        predictions: {
            total: total,
            correct: correct,
            accuracy: accuracy + '%',
        },
        game: {
            totalPhien: gameData.stats.totalPhien,
            taiCount: gameData.stats.taiCount,
            xiuCount: gameData.stats.xiuCount,
            taiRatio: gameData.stats.totalPhien > 0 ? 
                ((gameData.stats.taiCount / gameData.stats.totalPhien) * 100).toFixed(2) + '%' : 'N/A',
        },
        websocket: {
            connected: wsConnected,
            retries: retryCount,
            proxy: currentProxy ? 'active' : 'direct',
        }
    });
});

// Proxy status endpoint
app.get('/api/proxies', (req, res) => {
    res.json({
        totalProxies: proxyList.length,
        workingProxies: workingProxies.length,
        currentProxy: currentProxy ? currentProxy.replace(/\/\/.*@/, '//***@') : null,
        workingList: workingProxies.map(p => ({
            url: p.url,
            latency: p.latency + 'ms'
        }))
    });
});

// Refresh proxies manually
app.get('/api/refresh-proxies', async (req, res) => {
    await getWorkingProxies(5);
    res.json({
        success: true,
        workingProxies: workingProxies.length,
        proxies: workingProxies.map(p => p.url)
    });
});

// Latest game data
app.get('/api/game-data', (req, res) => {
    if (gameData.history.length === 0) {
        return res.json({ error: 'No game data yet' });
    }
    
    res.json({
        currentPhien: gameData.currentPhien,
        lastUpdate: gameData.lastUpdate,
        latestResults: gameData.history.slice(0, 10),
        stats: {
            total: gameData.stats.totalPhien,
            tai: gameData.stats.taiCount,
            xiu: gameData.stats.xiuCount,
        }
    });
});

// ==================== AUTO PREDICTION ENDPOINT ====================
// Endpoint này trả về dự đoán format giống yêu cầu
app.get('/789', async (req, res) => {
    if (gameData.history.length < 5) {
        return res.json({
            error: 'Chưa đủ dữ liệu',
            message: 'Cần ít nhất 5 phiên để dự đoán'
        });
    }
    
    const prediction = makePrediction();
    const nextPhien = gameData.currentPhien ? gameData.currentPhien + 1 : null;
    
    res.json({
        phien: nextPhien,
        du_doan: prediction.prediction === 'Tài' ? 'tai' : 'xiu',
        ti_le: prediction.confidence + '%',
        patterns: prediction.patterns,
        id: '@tranhoang2286',
        timestamp: new Date().toISOString()
    });
});

// Xác minh dự đoán
app.get('/789/verify', async (req, res) => {
    const { phien } = req.query;
    
    if (!phien) {
        return res.json({ error: 'Thiếu phien parameter' });
    }
    
    const prediction = predictionHistory.predictions.find(p => p.phien.toString() === phien.toString());
    
    if (!prediction) {
        return res.json({ error: 'Không tìm thấy dự đoán cho phiên này' });
    }
    
    const actualResult = gameData.history.find(h => h.phien.toString() === phien.toString());
    
    if (!actualResult) {
        return res.json({
            phien: phien,
            prediction: prediction.prediction,
            status: 'Chưa có kết quả'
        });
    }
    
    const isCorrect = prediction.prediction === actualResult.result;
    
    // Update stats
    if (!prediction.verified) {
        prediction.verified = true;
        prediction.actual = actualResult.result;
        prediction.isCorrect = isCorrect;
        
        predictionHistory.stats.total++;
        if (isCorrect) predictionHistory.stats.correct++;
    }
    
    res.json({
        phien: phien,
        prediction: prediction.prediction,
        actual: actualResult.result,
        correct: isCorrect,
        confidence: prediction.confidence
    });
});

// Lịch sử dự đoán
app.get('/789/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    
    const history = predictionHistory.predictions.slice(0, limit).map(p => ({
        phien: p.phien,
        du_doan: p.prediction === 'Tài' ? 'tai' : 'xiu',
        ti_le: p.confidence + '%',
        patterns: p.patterns,
        verified: p.verified || false,
        actual: p.actual || null,
        correct: p.isCorrect || null,
        timestamp: p.timestamp
    }));
    
    res.json({
        total: predictionHistory.predictions.length,
        accuracy: predictionHistory.stats.total > 0 ? 
            ((predictionHistory.stats.correct / predictionHistory.stats.total) * 100).toFixed(2) + '%' : 'N/A',
        predictions: history
    });
});

// ==================== START SERVER ====================
loadData();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════╗
║  🎮 GAME PREDICTION API                 ║
║  Port: ${PORT}                          ║
║  Endpoints:                             ║
║  GET /              - API Info          ║
║  GET /api/status    - Status            ║
║  GET /api/predict   - Prediction        ║
║  GET /api/history   - History           ║
║  GET /api/stats     - Statistics        ║
║  GET /789           - Quick Predict     ║
║  GET /789/history   - Predict History   ║
║  GET /789/verify    - Verify Predict    ║
╚══════════════════════════════════════════╝
    `);
    
    // Start WebSocket connection after API is ready
    setTimeout(async () => {
        await getWorkingProxies(5);
        connectWebSocket();
    }, 2000);
});

// ==================== PROCESS HANDLERS ====================
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    saveData();
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    saveData();
    cleanup();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        scheduleReconnect();
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});