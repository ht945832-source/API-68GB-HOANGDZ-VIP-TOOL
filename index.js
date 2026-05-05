const http = require('http');
const fs = require('fs');
const { exec, execSync, spawn } = require('child_process');
const Bot68GB = require('./bot_unified');

// ─── ĐÃ DÁN TOKEN VÀ WSS URL VÀO ĐÂY ─────────────────────────────────────────
const TOKEN_HEX = "010000687b22636f6465223a3230302c22737973223a7b22686561727462656174223a31352c2273657269616c697a657222";
const WS_URL_ENV = "wss://mtsahwkvbim09mnwv.cq.qnwxdhwica.com/";

// ─── CẤU HÌNH ────────────────────────────────────────────────────────────────
const LANDING_URL = "https://68gbvn88.bar";
const TOKEN_FILE = "token_shared.bin";
const PORT = parseInt(process.env.PORT || "8080");
const CREATOR_ID = "@tranhoang2286";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    SUPER AI PREDICTION ENGINE v5.0                          ║
// ║         Học cầu thông minh - Tự sửa sai - Độ chính xác cực cao              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

class SuperAIEngine {
    constructor() {
        this.games = {
            txhu: this._createGameState(),
            txmd5: this._createGameState()
        };
        this.globalPatterns = new Map();
        this.learningRate = 0.01;
        this.momentum = 0.9;
    }

    _createGameState() {
        return {
            history: [],
            predictions: [],
            accuracy: { total: 0, correct: 0, rate: 0 },
            weights: {
                cau_bac_cau: 0.25,      // Cầu bắc cầu
                cau_1_1: 0.20,          // Cầu 1-1
                cau_2_2: 0.15,          // Cầu 2-2
                cau_3_3: 0.10,          // Cầu 3-3
                cau_doi_xung: 0.10,     // Cầu đối xứng
                cau_nghi: 0.05,         // Cầu nghỉ
                cau_dao: 0.05,          // Cầu đảo
                thong_ke_nang_cao: 0.05, // Thống kê nâng cao
                xu_huong_diem: 0.05      // Xu hướng điểm
            },
            cauPatterns: {},
            lastCorrection: null,
            correctionCount: 0,
            performanceHistory: []
        };
    }

    // ═══════════════════════════════════════════════════════════
    // PHÂN TÍCH CẦU - HỌC CẦU THÔNG MINH
    // ═══════════════════════════════════════════════════════════

    analyzeAllCau(history) {
        if (history.length < 2) return {};

        const results = history.map(h => h.result === 'TÀI' ? 'T' : 'X');
        const cauPatterns = {};

        // Cầu bệt (streak)
        cauPatterns.bet = this._analyzeCauBet(results);
        
        // Cầu 1-1 (luân phiên)
        cauPatterns.mot_mot = this._analyzeCau1_1(results);
        
        // Cầu 2-2
        cauPatterns.hai_hai = this._analyzeCau2_2(results);
        
        // Cầu 3-3
        cauPatterns.ba_ba = this._analyzeCau3_3(results);
        
        // Cầu bắc cầu (1-2-1, 2-1-2...)
        cauPatterns.bac_cau = this._analyzeCauBacCau(results);
        
        // Cầu đối xứng
        cauPatterns.doi_xung = this._analyzeCauDoiXung(results);
        
        // Cầu đảo chiều
        cauPatterns.dao_chieu = this._analyzeCauDaoChieu(results);
        
        // Cầu nhịp điệu (có chu kỳ)
        cauPatterns.nhip_dieu = this._analyzeCauNhipDieu(results);

        return cauPatterns;
    }

    _analyzeCauBet(results) {
        const last = results[results.length - 1];
        let streak = 1;
        for (let i = results.length - 2; i >= 0; i--) {
            if (results[i] === last) streak++;
            else break;
        }
        
        // Cầu bệt thường tiếp tục
        const continueProbability = streak >= 3 ? 0.7 : streak >= 2 ? 0.6 : 0.45;
        return {
            type: 'bệt',
            value: last,
            length: streak,
            predict: last === 'T' ? 'TÀI' : 'XỈU',
            confidence: continueProbability,
            breakSignal: streak >= 5 ? 0.3 : streak >= 7 ? 0.5 : 0.1
        };
    }

    _analyzeCau1_1(results) {
        if (results.length < 2) return null;
        
        let count1_1 = 0;
        for (let i = 2; i < results.length; i++) {
            if (results[i] !== results[i-1] && results[i-1] !== results[i-2]) {
                count1_1++;
            }
        }
        
        const pattern1_1 = count1_1 >= 3;
        const nextPredict = results[results.length - 1] === 'T' ? 'X' : 'T';
        
        return {
            type: '1-1',
            detected: pattern1_1,
            predict: nextPredict === 'T' ? 'TÀI' : 'XỈU',
            confidence: pattern1_1 ? 0.65 : 0.3,
            stability: count1_1 / Math.max(results.length - 2, 1)
        };
    }

    _analyzeCau2_2(results) {
        if (results.length < 4) return null;
        
        // Tìm pattern 2-2
        let patternFound = false;
        let nextPredict = results[results.length - 1];
        
        for (let i = results.length - 4; i >= 0; i -= 2) {
            if (i + 3 < results.length &&
                results[i] === results[i+1] &&
                results[i+2] === results[i+3] &&
                results[i] !== results[i+2]) {
                patternFound = true;
                nextPredict = results[i+2];
                break;
            }
        }
        
        return {
            type: '2-2',
            detected: patternFound,
            predict: nextPredict === 'T' ? 'TÀI' : 'XỈU',
            confidence: patternFound ? 0.7 : 0.25
        };
    }

    _analyzeCau3_3(results) {
        if (results.length < 6) return null;
        
        let patternFound = false;
        let nextPredict = results[results.length - 1];
        
        for (let i = results.length - 6; i >= 0; i -= 3) {
            if (i + 5 < results.length &&
                results[i] === results[i+1] && results[i+1] === results[i+2] &&
                results[i+3] === results[i+4] && results[i+4] === results[i+5] &&
                results[i] !== results[i+3]) {
                patternFound = true;
                nextPredict = results[i+3];
                break;
            }
        }
        
        return {
            type: '3-3',
            detected: patternFound,
            predict: nextPredict === 'T' ? 'TÀI' : 'XỈU',
            confidence: patternFound ? 0.75 : 0.2
        };
    }

    _analyzeCauBacCau(results) {
        if (results.length < 4) return null;
        
        // Tìm chuỗi 1-2-1 hoặc 2-1-2
        const last4 = results.slice(-4);
        const patterns = [
            ['T', 'X', 'X', 'T'],  // T-X-X-T
            ['X', 'T', 'T', 'X'],  // X-T-T-X
            ['T', 'T', 'X', 'T'],  // T-T-X-T
            ['X', 'X', 'T', 'X']   // X-X-T-X
        ];
        
        for (const pattern of patterns) {
            if (last4[0] === pattern[0] && last4[1] === pattern[1] && 
                last4[2] === pattern[2] && last4[3] === pattern[3]) {
                return {
                    type: 'bắc cầu',
                    detected: true,
                    predict: pattern[0] === 'T' ? 'TÀI' : 'XỈU',
                    confidence: 0.7
                };
            }
        }
        
        return { type: 'bắc cầu', detected: false };
    }

    _analyzeCauDoiXung(results) {
        if (results.length < 6) return null;
        
        const half1 = results.slice(-6, -3);
        const half2 = results.slice(-3).reverse();
        
        const symmetric = half1.every((val, idx) => val === half2[idx]);
        
        return {
            type: 'đối xứng',
            detected: symmetric,
            predict: symmetric ? (results[results.length - 4] === 'T' ? 'TÀI' : 'XỈU') : null,
            confidence: symmetric ? 0.75 : 0
        };
    }

    _analyzeCauDaoChieu(results) {
        if (results.length < 5) return null;
        
        // Tìm đỉnh và đáy gần đây
        const recent = results.slice(-10);
        let peaks = 0, valleys = 0;
        
        for (let i = 2; i < recent.length - 2; i++) {
            if (recent[i] !== recent[i-1] && recent[i] !== recent[i+1]) {
                if (recent[i-1] === 'T' && recent[i+1] === 'T') peaks++;
                if (recent[i-1] === 'X' && recent[i+1] === 'X') valleys++;
            }
        }
        
        const trendReversal = peaks >= 2 || valleys >= 2;
        
        return {
            type: 'đảo chiều',
            detected: trendReversal,
            predict: results[results.length - 1] === 'T' ? 'XỈU' : 'TÀI',
            confidence: trendReversal ? 0.6 : 0.2
        };
    }

    _analyzeCauNhipDieu(results) {
        if (results.length < 8) return null;
        
        // Tìm chu kỳ lặp
        for (let cycleLen = 3; cycleLen <= 6; cycleLen++) {
            const firstCycle = results.slice(-cycleLen * 2, -cycleLen);
            const secondCycle = results.slice(-cycleLen);
            
            if (firstCycle.every((val, idx) => val === secondCycle[idx])) {
                return {
                    type: 'nhịp điệu',
                    detected: true,
                    cycleLength: cycleLen,
                    predict: secondCycle[0] === 'T' ? 'TÀI' : 'XỈU',
                    confidence: 0.8
                };
            }
        }
        
        return { type: 'nhịp điệu', detected: false };
    }

    // ═══════════════════════════════════════════════════════════
    // THỐNG KÊ NÂNG CAO & PHÂN TÍCH ĐIỂM SỐ
    // ═══════════════════════════════════════════════════════════

    analyzeStatistics(history) {
        if (history.length < 5) return { prediction: null, confidence: 0 };

        const total = history.length;
        const taiCount = history.filter(h => h.result === 'TÀI').length;
        const xiuCount = total - taiCount;
        
        // Luật số lớn - cân bằng
        const imbalance = (taiCount - xiuCount) / total;
        const regressionPrediction = imbalance > 0.1 ? 'XỈU' : imbalance < -0.1 ? 'TÀI' : null;
        
        // Phân tích Markov chain
        const transitions = {};
        for (let i = 1; i < history.length; i++) {
            const prev = history[i-1].result;
            const curr = history[i].result;
            const key = `${prev}->${curr}`;
            transitions[key] = (transitions[key] || 0) + 1;
        }
        
        const lastResult = history[history.length - 1].result;
        const taiNext = transitions[`${lastResult}->TÀI`] || 0;
        const xiuNext = transitions[`${lastResult}->XỈU`] || 0;
        const markovPrediction = taiNext > xiuNext ? 'TÀI' : 'XỈU';
        const markovConfidence = Math.abs(taiNext - xiuNext) / Math.max(taiNext + xiuNext, 1);
        
        return {
            regression: regressionPrediction,
            markov: markovPrediction,
            markovConfidence: markovConfidence,
            taiRatio: taiCount / total,
            xiuRatio: xiuCount / total,
            imbalance
        };
    }

    analyzeDicePoints(history) {
        if (history.length < 5) return null;
        
        const points = history.map(h => {
            const d1 = h.dice1 || h['xúc xắc 1'] || 0;
            const d2 = h.dice2 || h['xúc xắc 2'] || 0;
            const d3 = h.dice3 || h['xúc xắc 3'] || 0;
            return { total: d1 + d2 + d3, dice: [d1, d2, d3] };
        });
        
        // Moving average
        const ma3 = points.slice(-3).reduce((sum, p) => sum + p.total, 0) / 3;
        const ma5 = points.slice(-5).reduce((sum, p) => sum + p.total, 0) / 5;
        const ma10 = points.length >= 10 ? points.slice(-10).reduce((sum, p) => sum + p.total, 0) / 10 : ma5;
        
        // Trend
        const trend = ma3 - ma10;
        
        // Phân tích tần suất số
        const freq = {};
        points.forEach(p => p.dice.forEach(d => { if (d > 0) freq[d] = (freq[d] || 0) + 1; }));
        
        // Dự đoán dựa trên trend điểm
        const pointPrediction = ma3 > 10.5 ? 'TÀI' : 'XỈU';
        const confidence = Math.min(Math.abs(ma3 - 10.5) / 5 + 0.5, 0.8);
        
        return {
            ma3, ma5, ma10,
            trend,
            pointPrediction,
            confidence,
            frequency: freq
        };
    }

    // ═══════════════════════════════════════════════════════════
    // ENSEMBLE VOTING - KẾT HỢP TẤT CẢ PHƯƠNG PHÁP
    // ═══════════════════════════════════════════════════════════

    predict(gameType, history) {
        const game = this.games[gameType];
        game.history = history;

        if (history.length === 0) {
            return Math.random() > 0.5 ? 'TÀI' : 'XỈU';
        }

        const votes = [];
        
        // 1. Phân tích tất cả các loại cầu
        const cauPatterns = this.analyzeAllCau(history);
        game.cauPatterns = cauPatterns;
        
        Object.entries(cauPatterns).forEach(([name, pattern]) => {
            if (pattern && pattern.detected !== false && pattern.predict) {
                const weight = game.weights[`cau_${name}`] || game.weights[Object.keys(game.weights).find(k => k.includes(name)) || 0] || 0.1;
                votes.push({
                    source: `cau_${name}`,
                    prediction: pattern.predict,
                    confidence: (pattern.confidence || 0.5) * weight,
                    weight
                });
            }
        });

        // 2. Thống kê nâng cao
        const stats = this.analyzeStatistics(history);
        if (stats.regression) {
            votes.push({
                source: 'regression',
                prediction: stats.regression,
                confidence: Math.abs(stats.imbalance) * game.weights.thong_ke_nang_cao,
                weight: game.weights.thong_ke_nang_cao
            });
        }
        if (stats.markov) {
            votes.push({
                source: 'markov',
                prediction: stats.markov,
                confidence: stats.markovConfidence * game.weights.thong_ke_nang_cao,
                weight: game.weights.thong_ke_nang_cao
            });
        }

        // 3. Phân tích điểm số
        const diceAnalysis = this.analyzeDicePoints(history);
        if (diceAnalysis) {
            votes.push({
                source: 'dice_points',
                prediction: diceAnalysis.pointPrediction,
                confidence: diceAnalysis.confidence * game.weights.xu_huong_diem,
                weight: game.weights.xu_huong_diem
            });
        }

        // 4. Tổng hợp vote
        let taiScore = 0, xiuScore = 0;
        votes.forEach(v => {
            if (v.prediction === 'TÀI') taiScore += v.confidence;
            else xiuScore += v.confidence;
        });

        // Thêm bias sửa sai từ lịch sử
        if (game.correctionCount > 0) {
            const correctionBias = Math.min(game.correctionCount * 0.02, 0.15);
            if (game.lastCorrection === 'TÀI') {
                taiScore += correctionBias;
            } else if (game.lastCorrection === 'XỈU') {
                xiuScore += correctionBias;
            }
        }

        const prediction = taiScore > xiuScore ? 'TÀI' : 'XỈU';
        const confidence = Math.abs(taiScore - xiuScore) / (taiScore + xiuScore || 1);

        // Lưu prediction
        game.predictions.push({
            prediction,
            confidence,
            votes,
            timestamp: Date.now()
        });

        console.log(`\n🎯 [AI] ${gameType.toUpperCase()} DỰ ĐOÁN: ${prediction} (T:${taiScore.toFixed(3)} vs X:${xiuScore.toFixed(3)})`);
        console.log(`   📊 Votes: ${votes.map(v => `${v.source}=${v.prediction}(${v.confidence.toFixed(3)})`).join(', ')}`);
        console.log(`   🎯 Độ chính xác hiện tại: ${(game.accuracy.rate * 100).toFixed(1)}%`);
        
        return prediction;
    }

    // ═══════════════════════════════════════════════════════════
    // TỰ ĐỘNG SỬA SAI - HỌC TỪ LỖI NGAY LẬP TỨC
    // ═══════════════════════════════════════════════════════════

    correctAndLearn(gameType, actualResult) {
        const game = this.games[gameType];
        
        if (game.predictions.length === 0) return;
        
        const lastPrediction = game.predictions[game.predictions.length - 1];
        const wasCorrect = lastPrediction.prediction === actualResult;
        
        game.accuracy.total++;
        if (wasCorrect) {
            game.accuracy.correct++;
        } else {
            // SAI - HỌC NGAY LẬP TỨC
            game.correctionCount++;
            game.lastCorrection = actualResult;
            
            // Phân tích lý do sai
            this._analyzeMistake(game, lastPrediction, actualResult);
            
            console.log(`\n❌ [SỬA SAI] ${gameType.toUpperCase()} - Dự đoán: ${lastPrediction.prediction} | Thực tế: ${actualResult}`);
            console.log(`   🔧 Điều chỉnh trọng số ngay lập tức...`);
        }
        
        game.accuracy.rate = game.accuracy.correct / game.accuracy.total;
        
        // Reset correction count nếu đúng liên tiếp 3 lần
        if (wasCorrect && game.correctionCount > 0) {
            game.consecutiveCorrect = (game.consecutiveCorrect || 0) + 1;
            if (game.consecutiveCorrect >= 3) {
                game.correctionCount = 0;
                game.consecutiveCorrect = 0;
                this._resetWeights(gameType);
                console.log(`   ✅ [PHỤC HỒI] Trọng số đã được reset về mặc định!`);
            }
        } else {
            game.consecutiveCorrect = 0;
        }
        
        // Lưu performance history
        game.performanceHistory.push({
            prediction: lastPrediction.prediction,
            actual: actualResult,
            correct: wasCorrect,
            timestamp: Date.now()
        });
        
        // Giới hạn history
        if (game.performanceHistory.length > 100) {
            game.performanceHistory = game.performanceHistory.slice(-100);
        }
    }

    _analyzeMistake(game, prediction, actual) {
        // Tìm pattern nào đã vote sai
        const wrongVotes = prediction.votes.filter(v => v.prediction !== actual);
        const correctVotes = prediction.votes.filter(v => v.prediction === actual);
        
        // Giảm trọng số của pattern sai
        wrongVotes.forEach(v => {
            const weightKey = Object.keys(game.weights).find(k => v.source.includes(k.replace('cau_', '')));
            if (weightKey && game.weights[weightKey] > 0.03) {
                game.weights[weightKey] -= 0.03;
            }
        });
        
        // Tăng trọng số của pattern đúng
        correctVotes.forEach(v => {
            const weightKey = Object.keys(game.weights).find(k => v.source.includes(k.replace('cau_', '')));
            if (weightKey && game.weights[weightKey] < 0.3) {
                game.weights[weightKey] += 0.02;
            }
        });
        
        // Chuẩn hóa trọng số
        this._normalizeWeights(game);
        
        console.log(`   📊 Trọng số mới:`, Object.fromEntries(
            Object.entries(game.weights).map(([k, v]) => [k, v.toFixed(3)])
        ));
    }

    _normalizeWeights(game) {
        const total = Object.values(game.weights).reduce((a, b) => a + b, 0);
        if (total > 0) {
            Object.keys(game.weights).forEach(k => {
                game.weights[k] /= total;
            });
        }
    }

    _resetWeights(gameType) {
        this.games[gameType].weights = this._createGameState().weights;
    }

    getStats(gameType) {
        const game = this.games[gameType];
        return {
            accuracy: game.accuracy,
            weights: game.weights,
            cauPatterns: game.cauPatterns,
            correctionCount: game.correctionCount,
            lastCorrection: game.lastCorrection,
            recentPerformance: game.performanceHistory.slice(-10)
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// KHỞI TẠO
// ═══════════════════════════════════════════════════════════════

const superAI = new SuperAIEngine();

const shared = {
    WS_URL: WS_URL_ENV,
    PKT_HANDSHAKE: Buffer.from('010000727b22737973223a7b22706c6174666f726d223a226a732d776562736f636b6574222c22636c69656e744275696c644e756d626572223a22302e302e31222c22636c69656e7456657273696f6e223a223061323134383164373436663932663834323865316236646565623736666561227d7d', 'hex'),
    PKT_HANDSHAKE_ACK: Buffer.from('02000000', 'hex'),
    PKT_HEARTBEAT: Buffer.from('03000000', 'hex'),
    PKT_AUTH: Buffer.from('', 'hex') 
};

if (TOKEN_HEX) {
    console.log("✅ Using TOKEN_HEX from config");
    shared.PKT_AUTH = Buffer.from(
        TOKEN_HEX.replace(/^0x/i, "").replace(/\s+/g, ""),
        "hex"
    );
    shared.SESSION_READY = true;
    console.log("📝 Token loaded, length:", shared.PKT_AUTH.length, "bytes");
} else {
    console.log("Using token_shared.bin");
    if (fs.existsSync(TOKEN_FILE)) {
        shared.PKT_AUTH = fs.readFileSync(TOKEN_FILE);
        shared.SESSION_READY = true;
        console.log("📝 Token loaded from file");
    } else {
        console.log("⚠️ [CONFIG] Không có Token tĩnh. Cần nạp qua POST /api/token.");
    }
}

// Override bot để tích hợp AI
class AIIntegratedBot extends Bot68GB {
    constructor(shared) {
        super(shared);
        this.ai = superAI;
    }

    // Hook vào method xử lý kết quả
    onGameResult(gameType, result) {
        // Cập nhật AI với kết quả thực tế
        this.ai.correctAndLearn(gameType, result.result);
        
        // Thêm dự đoán tiếp theo vào response
        const nextPrediction = this.ai.predict(gameType, this._getHistory(gameType));
        result.ai_prediction = nextPrediction;
        result.ai_accuracy = this.ai.getStats(gameType).accuracy.rate;
        result.creator = CREATOR_ID;
        
        return result;
    }

    _getHistory(gameType) {
        return this[gameType]?.history || [];
    }
}

const bot = new AIIntegratedBot(shared);

// Override processGameResult trong bot nếu có
const origProcessResult = bot.processGameResult;
if (origProcessResult) {
    bot.processGameResult = function(gameType, result) {
        const enhanced = this.onGameResult(gameType, result);
        return origProcessResult.call(this, gameType, enhanced);
    };
}

// ═══════════════════════════════════════════════════════════════
// SERVER VỚI API NÂNG CAO
// ═══════════════════════════════════════════════════════════════

const server = http.createServer((req, res) => {
    const _cors = (code, body = null, type = 'application/json') => {
        res.writeHead(code, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': type + '; charset=utf-8',
            'X-Creator': CREATOR_ID,
            'X-AI-Version': '5.0-SuperAI'
        });
        res.end(body ? (typeof body === 'string' ? body : JSON.stringify(body, null, 2)) : "");
    };

    if (req.method === 'POST' && (req.url === '/api/token')) {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const hex = data.token.replace(/b'|'|\\x| /g, "");
                shared.PKT_AUTH = Buffer.from(hex, 'hex');
                fs.writeFileSync(TOKEN_FILE, shared.PKT_AUTH);
                shared.SESSION_READY = true;
                if (bot.ws) bot.ws.close();
                else bot.run(LANDING_URL);
                _cors(200, { status: "ok", creator: CREATOR_ID });
            } catch (e) { _cors(400, { error: e.message }); }
        });
    } else if (req.url === '/api/68gb/txhu') {
        const result = { ...(bot.txhu?.last_result || { error: "No data" }), creator: CREATOR_ID };
        result.ai_stats = superAI.getStats('txhu');
        _cors(200, result);
    } else if (req.url === '/api/68gb/history/txhu') {
        _cors(200, (bot.txhu?.history || []).slice().reverse().map(i => ({ ...i, creator: CREATOR_ID })));
    } else if (req.url === '/api/68gb/txmd5' || req.url === '/api/data') {
        const result = { ...(bot.md5?.last_result || { error: "No data" }), creator: CREATOR_ID };
        result.ai_stats = superAI.getStats('txmd5');
        _cors(200, result);
    } else if (req.url === '/api/68gb/history/txmd5' || req.url === '/api/history') {
        _cors(200, (bot.md5?.history || []).slice().reverse().map(i => ({ ...i, creator: CREATOR_ID })));
    } else if (req.url === '/api/ai/stats') {
        _cors(200, {
            txhu: superAI.getStats('txhu'),
            txmd5: superAI.getStats('txmd5'),
            creator: CREATOR_ID
        });
    } else if (req.url === '/api/ai/predict') {
        const txhuHist = bot._getHistory('txhu');
        const md5Hist = bot._getHistory('txmd5');
        _cors(200, {
            txhu_next: superAI.predict('txhu', txhuHist),
            txmd5_next: superAI.predict('txmd5', md5Hist),
            creator: CREATOR_ID
        });
    } else if (req.url === '/api/ai/weights') {
        _cors(200, {
            txhu: superAI.games.txhu.weights,
            txmd5: superAI.games.txmd5.weights,
            creator: CREATOR_ID
        });
    } else if (req.url === '/api/ai/reset') {
        superAI._resetWeights('txhu');
        superAI._resetWeights('txmd5');
        _cors(200, { status: 'reset_ok', creator: CREATOR_ID });
    } else if (req.url === '/' || req.url === '/index.html') {
        _cors(200, getLandingPage(bot.isAlive()), 'text/html');
    } else {
        _cors(404, { error: "Not Found", creator: CREATOR_ID });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log(`║  🚀 SERVER: ${CREATOR_ID} - Port ${PORT}                          ║`);
    console.log('║  🧠 SUPER AI ENGINE v5.0 - HỌC CẦU THÔNG MINH           ║');
    console.log('║  🎯 Tự động sửa sai - Điều chỉnh trọng số realtime      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    
    if (shared.SESSION_READY) {
        console.log("✅ [INIT] Token sẵn sàng. Khởi động Bot...");
        bot.run(LANDING_URL);
    } else {
        console.log("🆕 [INIT] Chưa có Token. Đang chờ nạp qua API...");
    }
});

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE VỚI AI PANEL
// ═══════════════════════════════════════════════════════════════

function getLandingPage(botStatus) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>68GB - ${CREATOR_ID} - AI Prediction System</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0b10;
            --card: rgba(255, 255, 255, 0.05);
            --accent: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            --text: #f8fafc;
            --secondary: #94a3b8;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: var(--bg); 
            color: var(--text); 
            font-family: 'Outfit', sans-serif;
            overflow-x: hidden;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
            min-height: 100vh;
        }

        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

        header { text-align: center; margin-bottom: 40px; animation: fadeInDown 1s ease; }
        h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; background: var(--accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .creator-badge { 
            display: inline-block; padding: 4px 12px; 
            background: rgba(99, 102, 241, 0.2); 
            border: 1px solid rgba(99, 102, 241, 0.4); 
            border-radius: 8px; color: #a5b4fc; font-size: 0.85rem; margin-bottom: 12px; 
        }
        .ai-version {
            display: inline-block; padding: 4px 12px;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 8px; color: #6ee7b7; font-size: 0.8rem;
        }
        .status-badge { 
            display: inline-flex; align-items: center; padding: 6px 16px; border-radius: 999px; 
            background: ${botStatus ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; 
            color: ${botStatus ? '#4ade80' : '#f87171'}; font-weight: 600; 
            border: 1px solid ${botStatus ? '#4ade8044' : '#f8717144'}; 
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; margin-right: 8px; box-shadow: 0 0 10px currentColor; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 36px; }
        .card { 
            background: var(--card); backdrop-filter: blur(12px); border-radius: 20px; padding: 24px; 
            border: 1px solid rgba(255,255,255,0.08); 
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s; 
        }
        .card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); border-color: rgba(99, 102, 241, 0.3); }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .card-title { font-size: 1.3rem; font-weight: 700; }
        .phien { color: #6366f1; font-weight: 600; font-family: monospace; font-size: 0.9rem; }
        .result-val { font-size: 2.2rem; font-weight: 800; margin: 10px 0; letter-spacing: -1px; }
        .result-dice { font-size: 1rem; color: var(--secondary); letter-spacing: 3px; margin-bottom: 6px; }
        
        .ai-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ai-prediction { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .ai-label { font-size: 0.75rem; color: var(--secondary); text-transform: uppercase; letter-spacing: 1px; }
        .ai-next { font-size: 1.1rem; font-weight: 700; }
        .ai-accuracy { font-size: 0.8rem; }
        .ai-weights { font-size: 0.65rem; color: var(--secondary); margin-top: 6px; }
        
        .tai { color: #f87171; }
        .xiu { color: #60a5fa; }
        .accuracy-high { color: #4ade80; }
        .accuracy-mid { color: #f59e0b; }
        .accuracy-low { color: #f87171; }

        .controls { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin: 24px 0; }
        .btn { 
            padding: 12px 24px; border-radius: 14px; border: none; font-weight: 600; cursor: pointer; 
            transition: all 0.2s ease; text-decoration: none; display: inline-flex; align-items: center; 
            font-family: 'Outfit', sans-serif; font-size: 0.9rem; 
        }
        .btn-primary { background: var(--accent); color: white; box-shadow: 0 8px 16px rgba(168, 85, 247, 0.2); }
        .btn-primary:hover { transform: scale(1.03); box-shadow: 0 12px 24px rgba(168, 85, 247, 0.3); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }

        .api-links { margin-top: 36px; text-align: center; }
        .api-links h3 { margin-bottom: 16px; font-weight: 600; font-size: 0.9rem; color: var(--secondary); }
        .link-chip { 
            display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.03); 
            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; margin: 4px; 
            color: var(--secondary); text-decoration: none; transition: 0.2s; font-size: 0.8rem; 
        }
        .link-chip:hover { border-color: #6366f1; color: #fff; }

        footer { text-align: center; margin-top: 60px; color: var(--secondary); font-size: 0.85rem; padding-bottom: 40px; }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .loading-bar { height: 2px; width: 100%; background: rgba(255,255,255,0.05); position: fixed; top: 0; left: 0; z-index: 100; }
        .loading-progress { height: 100%; width: 0%; background: var(--accent); transition: width 0.4s; }
    </style>
</head>
<body>
    <div class="loading-bar"><div class="loading-progress" id="progress"></div></div>
    
    <div class="container">
        <header>
            <div class="creator-badge">🏷️ ${CREATOR_ID}</div>
            <div class="ai-version">🧠 AI Engine v5.0 - Học Cầu Thông Minh</div>
            <h1>68GB DASHBOARD</h1>
            <div class="status-badge">
                <div class="status-dot"></div>
                Bot: ${botStatus ? 'ACTIVE' : 'DISCONNECTED'}
            </div>
        </header>

        <div class="grid">
            <!-- TXHU Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">🎲 TÀI XỈU HŨ</span>
                    <span class="phien" id="txhu-sess">#------</span>
                </div>
                <div id="txhu-res" class="result-val">ĐANG TẢI...</div>
                <div id="txhu-dice" class="result-dice">0 - 0 - 0</div>
                <div class="ai-section">
                    <div class="ai-prediction">
                        <span class="ai-label">🤖 AI dự đoán tiếp:</span>
                        <span id="txhu-ai-pred" class="ai-next">--</span>
                    </div>
                    <div class="ai-prediction">
                        <span class="ai-label">Độ chính xác:</span>
                        <span id="txhu-ai-acc" class="ai-accuracy">--%</span>
                    </div>
                    <div id="txhu-ai-weights" class="ai-weights"></div>
                </div>
                <div style="margin-top: 12px;">
                    <a href="/api/68gb/txhu" class="link-chip">API Live</a>
                    <a href="/api/68gb/history/txhu" class="link-chip">Lịch sử</a>
                </div>
            </div>

            <!-- TXMD5 Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">🔐 TÀI XỈU MD5</span>
                    <span class="phien" id="md5-sess">#------</span>
                </div>
                <div id="md5-res" class="result-val">ĐANG TẢI...</div>
                <div id="md5-dice" class="result-dice">0 - 0 - 0</div>
                <div class="ai-section">
                    <div class="ai-prediction">
                        <span class="ai-label">🤖 AI dự đoán tiếp:</span>
                        <span id="md5-ai-pred" class="ai-next">--</span>
                    </div>
                    <div class="ai-prediction">
                        <span class="ai-label">Độ chính xác:</span>
                        <span id="md5-ai-acc" class="ai-accuracy">--%</span>
                    </div>
                    <div id="md5-ai-weights" class="ai-weights"></div>
                </div>
                <div style="margin-top: 12px;">
                    <a href="/api/68gb/txmd5" class="link-chip">API Live</a>
                    <a href="/api/68gb/history/txmd5" class="link-chip">Lịch sử</a>
                </div>
            </div>
        </div>

        <div class="controls">
            <button class="btn btn-primary" onclick="refreshData()">
                🔄 Làm Mới Dữ Liệu
            </button>
            <a href="/api/ai/stats" class="btn btn-secondary" target="_blank">
                📊 Chi Tiết AI
            </a>
            <button class="btn btn-danger" onclick="resetAI()">
                🔧 Reset Trọng Số AI
            </button>
        </div>

        <div class="api-links">
            <h3>🔗 HỆ THỐNG API NÂNG CAO</h3>
            <a href="/api/68gb/txhu" class="link-chip">/api/68gb/txhu</a>
            <a href="/api/68gb/txmd5" class="link-chip">/api/68gb/txmd5</a>
            <a href="/api/68gb/history/txhu" class="link-chip">/api/68gb/history/txhu</a>
            <a href="/api/68gb/history/txmd5" class="link-chip">/api/68gb/history/txmd5</a>
            <a href="/api/ai/predict" class="link-chip">/api/ai/predict</a>
            <a href="/api/ai/stats" class="link-chip">/api/ai/stats</a>
            <a href="/api/ai/weights" class="link-chip">/api/ai/weights</a>
        </div>

        <footer>
            ⚡ ${CREATOR_ID} | Super AI Engine v5.0 | Học Cầu - Tự Sửa Sai - Realtime
        </footer>
    </div>

    <script>
        async function refreshData() {
            const prog = document.getElementById('progress');
            prog.style.width = '20%';
            
            try {
                const [txhuRes, md5Res, aiPredict, aiWeights] = await Promise.all([
                    fetch('/api/68gb/txhu').then(r => r.json()),
                    fetch('/api/68gb/txmd5').then(r => r.json()),
                    fetch('/api/ai/predict').then(r => r.json()),
                    fetch('/api/ai/weights').then(r => r.json())
                ]);
                
                prog.style.width = '60%';
                
                // Update TXHU
                if (!txhuRes.error) {
                    document.getElementById('txhu-sess').innerText = '#' + (txhuRes['Phiên'] || txhuRes['Phiên trước'] || '-----');
                    const resEl = document.getElementById('txhu-res');
                    resEl.innerText = txhuRes['kết quả'] || '--';
                    resEl.className = 'result-val ' + (txhuRes['kết quả'] === 'TÀI' ? 'tai' : 'xiu');
                    document.getElementById('txhu-dice').innerText = 
                        (txhuRes['xúc xắc 1'] || 0) + ' - ' + (txhuRes['xúc xắc 2'] || 0) + ' - ' + (txhuRes['xúc xắc 3'] || 0);
                    
                    // AI predictions
                    const aiPred = aiPredict.txhu_next || txhuRes.ai_prediction || '--';
                    const predEl = document.getElementById('txhu-ai-pred');
                    predEl.innerText = aiPred;
                    predEl.className = 'ai-next ' + (aiPred === 'TÀI' ? 'tai' : 'xiu');
                    
                    const acc = txhuRes.ai_accuracy || txhuRes.ai_stats?.accuracy?.rate || 0;
                    const accEl = document.getElementById('txhu-ai-acc');
                    accEl.innerText = (acc * 100).toFixed(1) + '%';
                    accEl.className = 'ai-accuracy ' + (acc > 0.6 ? 'accuracy-high' : acc > 0.45 ? 'accuracy-mid' : 'accuracy-low');
                    
                    // Weights
                    const w = aiWeights.txhu || txhuRes.ai_stats?.weights || {};
                    document.getElementById('txhu-ai-weights').innerText = 'Trọng số: ' + 
                        Object.entries(w).slice(0, 3).map(([k,v]) => k.replace('cau_','') + '=' + (v*100).toFixed(0) + '%').join(', ');
                }
                
                // Update TXMD5
                if (!md5Res.error) {
                    document.getElementById('md5-sess').innerText = '#' + (md5Res['Phiên'] || md5Res['Phiên trước'] || '-----');
                    const resEl = document.getElementById('md5-res');
                    resEl.innerText = md5Res['kết quả'] || '--';
                    resEl.className = 'result-val ' + (md5Res['kết quả'] === 'TÀI' ? 'tai' : 'xiu');
                    document.getElementById('md5-dice').innerText = 
                        (md5Res['xúc xắc 1'] || 0) + ' - ' + (md5Res['xúc xắc 2'] || 0) + ' - ' + (md5Res['xúc xắc 3'] || 0);
                    
                    const aiPred = aiPredict.txmd5_next || md5Res.ai_prediction || '--';
                    const predEl = document.getElementById('md5-ai-pred');
                    predEl.innerText = aiPred;
                    predEl.className = 'ai-next ' + (aiPred === 'TÀI' ? 'tai' : 'xiu');
                    
                    const acc = md5Res.ai_accuracy || md5Res.ai_stats?.accuracy?.rate || 0;
                    const accEl = document.getElementById('md5-ai-acc');
                    accEl.innerText = (acc * 100).toFixed(1) + '%';
                    accEl.className = 'ai-accuracy ' + (acc > 0.6 ? 'accuracy-high' : acc > 0.45 ? 'accuracy-mid' : 'accuracy-low');
                    
                    const w = aiWeights.txmd5 || md5Res.ai_stats?.weights || {};
                    document.getElementById('md5-ai-weights').innerText = 'Trọng số: ' + 
                        Object.entries(w).slice(0, 3).map(([k,v]) => k.replace('cau_','') + '=' + (v*100).toFixed(0) + '%').join(', ');
                }
                
                prog.style.width = '100%';
                setTimeout(() => prog.style.width = '0%', 500);
            } catch (e) { 
                console.error('Update error:', e); 
                prog.style.width = '0%';
            }
        }
        
        async function resetAI() {
            if (!confirm('Xác nhận reset trọng số AI về mặc định?')) return;
            try {
                const res = await fetch('/api/ai/reset');
                const data = await res.json();
                if (data.status === 'reset_ok') {
                    alert('✅ Đã reset trọng số AI!');
                    refreshData();
                }
            } catch (e) {
                alert('❌ Lỗi khi reset!');
            }
        }

        // Auto refresh mỗi 5 giây
        setInterval(refreshData, 5000);
        refreshData();
    </script>
</body>
</html>
    `;
}