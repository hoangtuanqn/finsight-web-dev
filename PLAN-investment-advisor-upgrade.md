# PLAN: Nâng cấp Thuật toán Cố vấn Đầu tư — Research-Backed

> **Ngày tạo:** 2026-04-26
> **Deadline:** 2 tuần (backend logic) + 1 tuần (UI)
> **Status:** 🟡 Backend done — UI core implemented, Smart Asset monthly history đang chờ manual QA

---

## 1. Mục tiêu

Nâng cấp hệ thống cố vấn đầu tư từ **heuristic overlay** sang **thuật toán có cơ sở học thuật**:

1. Thu thập **historical data 5 năm** thay vì hardcode expected returns
2. Triển khai **Markowitz Mean-Variance Optimization** thay thế 5-layer overlay
3. Dự phóng bằng **Monte Carlo simulation** (5000 sims) thay vì heuristic ×1.3/×0.5
4. Bổ sung **risk metrics chuẩn** (Sharpe, VaR, CVaR, Max Drawdown)

### Nguyên tắc

- **Thay thế hẳn** hệ thống cũ sau khi hoàn thiện (không dùng env flag)
- **Giữ lại code cũ** bằng comment `// [LEGACY] ...` để phân biệt, không xóa
- **Tái sử dụng** tối đa: risk assessment quiz, DB schema, API routes, UI components
- Code mới nằm trong **services mới**, controller chỉ sửa phần gọi service

### Nguyên tắc thực thi, commit và test

- **Chia nhỏ theo atomic steps**: mỗi checkbox lớn phải được tách thành bước nhỏ có thể hoàn thành và kiểm chứng độc lập; không gộp P1/P2/P3/P4 trong cùng một thay đổi.
- **Commit sau mỗi bước hoàn chỉnh**: sau khi một bước nhỏ pass test/verification, commit ngay để dễ review và rollback. Commit message gợi ý: `investment-advisor: <mô tả ngắn>`.
- **Không commit code chưa kiểm chứng**: trước mỗi commit phải chạy test liên quan đến phần vừa sửa; nếu chỉ sửa docs thì kiểm tra diff/readability.
- **TDD mặc định cho logic tài chính mới**: viết test fail trước (RED), implement tối thiểu để pass (GREEN), rồi refactor khi test vẫn pass.
- **Unit test là bắt buộc cho pure functions**: historical stats, covariance/correlation, optimizer, projection, VaR/CVaR, drawdown đều phải có unit test theo AAA pattern.
- **Mock external dependencies trong unit test**: không gọi thật Yahoo Finance, Alternative.me, Redis hoặc DB trong unit test; dùng fixtures/fakes để test fallback và edge cases.
- **Monte Carlo phải test được ổn định**: inject hoặc seed RNG để test percentile/probLoss không flaky.
- **Integration test sau khi nối controller**: kiểm tra shape response backward-compatible cho `/investment/allocation` và `/investment/strategies/generate`.
- **Checklist test trong từng P phải được tự động hóa** nếu có thể; không chỉ tick bằng kiểm tra thủ công.

### Hạn chế đã biết (note cho tương lai)

| # | Hạn chế | Kế hoạch tương lai |
|---|---------|-------------------|
| 1 | Yahoo `^VNINDEX` API không chính thức, có thể mất ổn định | Backup: `FUEVFVND.VN` hoặc hardcode data |
| 2 | Monte Carlo 5000 sims có thể chậm trên server yếu | Upgrade lên Worker thread khi cần |
| 3 | Fear & Greed Index phản ánh crypto/Mỹ, không VN | Cần VN-specific sentiment source |

---

## 2. Dependency Graph & Timeline

```
Tuần 1 (Ngày 1-7):
  P1: Historical Data Engine ──────► P2: Mean-Variance Optimization
  (Ngày 1-3)                         (Ngày 4-7)

Tuần 2 (Ngày 8-14):
  P3: Monte Carlo Simulation ──────► P4: Risk Metrics + Integration
  (Ngày 8-11)                        (Ngày 12-14)

Tuần 3 (Ngày 15-21) — sau khi backend done:
  P5: UI hiển thị risk metrics, efficient frontier, Monte Carlo chart
```

---

## 3. Tái sử dụng từ hệ thống cũ

| Phần cũ | Giữ / Thay | Lý do |
|---------|-----------|-------|
| Risk Assessment Quiz (`submitRiskAssessment`) | ✅ Giữ nguyên | Weighted scoring + riskLevel vẫn đúng |
| `InvestorProfile` DB model | ✅ Giữ nguyên | Schema không cần thay đổi |
| `Allocation` DB model (history) | ✅ Giữ nguyên | Lưu kết quả phân bổ |
| `AIStrategy` + `UserPortfolio` | ✅ Giữ nguyên | Portfolio flow không đổi |
| API routes (`investment.routes.js`) | ✅ Giữ nguyên | Endpoints không đổi |
| `getAllocation()` trong `calculations.js` | 🔄 Comment `[LEGACY]`, thay bằng MVO | Core logic thay đổi |
| `BASE_ALLOCATIONS`, overlay constants | 🔄 Comment `[LEGACY]`, dùng làm init guess cho MVO | Constraints vẫn tham khảo |
| `ASSET_CLASSES` hardcode returns | 🔄 Comment `[LEGACY]`, thay bằng historical data | Data thực thay thế |
| `buildRenderData()` trong InvestmentPage | 🔄 Sửa input/output format | Adapt cho Monte Carlo output |
| `fetchFearGreedIndex()` | ✅ Giữ nguyên | Vẫn dùng sentiment, chỉ thay cách sử dụng |
| 5 Smart Asset Guide APIs (crypto/stock/gold/savings/bonds) | ✅ Giữ nguyên + bổ sung history endpoint riêng | Không đổi contract snapshot hiện có |
| UI Components (AllocationEngine, WealthProjection, etc.) | ✅ Giữ nguyên (adapt data shape tuần 3) | UI sửa sau |

---

## 4. Problem 1: Historical Data Engine

### 4.1 PRD

**Input:** 4 Yahoo Finance tickers (5y monthly data)
**Output:** `marketParams` object = { means[5], stdDevs[5], covMatrix[5×5], corrMatrix[5×5] }

| Asset | Yahoo Ticker | Đã dùng trong project |
|-------|-------------|----------------------|
| Savings | N/A (dùng profile.savingsRate) | — |
| Gold | `GC=F` | ✅ `getGoldPrices()` |
| Stocks | `^VNINDEX` | Mới (hạn chế: API không chính thức) |
| Bonds | `^TNX` | ✅ `getBondsRates()` |
| Crypto | `BTC-USD` | Mới (CoinGecko đã dùng, Yahoo backup) |

### 4.2 Academic Basis

- **Log returns:** `r_t = ln(P_t / P_{t-1})` — tính chất cộng, xấp xỉ normal distribution
- **Sample covariance:** `Σ = (1/(n-1)) × R^T × R` (R = demeaned returns matrix)
- Ref: Sharpe, W. (1994). "The Sharpe Ratio"

### 4.3 Files

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `server/src/services/historicalData.service.js` | Core: fetch, parse, tính toán |
| NEW | `server/src/constants/assetTickers.js` | Ticker mapping + config |

### 4.4 Checklist

```
- [x] Tạo `server/src/constants/assetTickers.js`:
      export const ASSET_TICKERS = {
        gold: 'GC=F', stocks: '^VNINDEX', bonds: '^TNX', crypto: 'BTC-USD'
      };
      export const HISTORY_CONFIG = { years: 5, interval: '1mo' };

- [x] Tạo `server/src/services/historicalData.service.js`

- [x] Implement fetchAssetHistory(ticker, years=5):
      - URL: `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=${years}y`
      - Headers: User-Agent + Accept (giống pattern getGoldPrices)
      - Parse: meta + timestamps[] + indicators.adjclose[0].adjclose[]
      - Cache Redis: `hist:${ticker}` TTL 86400 (24h)
      - Fallback: return null (không crash)

- [x] Implement calcLogReturns(closes):
      - returns[i] = Math.log(closes[i+1] / closes[i])
      - Return Float64Array (performance)

- [x] Implement calcAnnualizedMean(monthlyReturns):
      - mean = sum(returns) / returns.length
      - annualized = mean × 12
      
- [x] Implement calcAnnualizedStdDev(monthlyReturns):
      - variance = sum((r - mean)^2) / (n-1)
      - annualized = sqrt(variance) × sqrt(12)

- [x] Implement calcCovarianceMatrix(returnsMap):
      - Input: { gold: returns[], stocks: [...], bonds: [...], crypto: [...] }
      - Align lengths (truncate to shortest)
      - Build matrix R [n × 4] (demeaned)
      - Cov = R^T × R / (n-1) — dùng math.js
      - Expand to 5×5 (savings row/col = near-zero variance)
      - Return: math.matrix result

- [x] Implement calcCorrelationMatrix(covMatrix, stdDevs):
      - corr[i][j] = cov[i][j] / (σi × σj)

- [x] Implement buildMarketParams():
      - const histories = await Promise.allSettled(4 fetches)
      - Handle partial failures: dùng ASSET_CLASSES fallback cho ticker lỗi
      - Return: { means, stdDevs, covMatrix, corrMatrix, dataQuality, updatedAt }
      - dataQuality: 'full' | 'partial' | 'fallback'

- [x] Implement getMarketParams():
      - Redis cache `market:params` TTL 86400
      - If miss: buildMarketParams()

- [x] npm install mathjs (dependency mới)

- [x] Test: covMatrix đối xứng (cov[i][j] === cov[j][i])
- [x] Test: diagonal covMatrix === variance (stdDev^2)
- [x] Test: correlation trong [-1, 1]
- [x] Test: fallback khi 1 ticker fail → dataQuality = 'partial'
- [x] Test: fallback khi tất cả fail → dataQuality = 'fallback', dùng ASSET_CLASSES
```

---

## 5. Problem 2: Mean-Variance Optimization (Markowitz)

### 5.1 PRD

**Input:** marketParams (từ P1) + profile (riskLevel, capital, horizon, goal) + sentimentValue
**Output:** weights[5] tối ưu theo Efficient Frontier, respect user constraints

**Thay thế:** `getAllocation()` trong `calculations.js` (comment `[LEGACY]`)

### 5.2 Academic Basis

- **Markowitz, H. (1952)** — "Portfolio Selection", Journal of Finance, 7(1), 77-91
- **Objective:** max `w^T μ − (λ/2) w^T Σ w` (utility maximization)
- **λ (risk aversion):** cao = conservative, thấp = aggressive
  - Mapping: `{ LOW: 8, MEDIUM: 4, HIGH: 1.5 }` (He & Litterman 1999)
- **Sentiment integration:** Adjust expected returns μ (Black-Litterman style views)
  - EXTREME_FEAR: μ_stocks × 0.85, μ_crypto × 0.80 (giảm kỳ vọng)
  - FEAR: μ_stocks × 0.92
  - NEUTRAL: không đổi
  - GREED: μ_stocks × 1.05
  - EXTREME_GREED: μ_stocks × 1.08, μ_crypto × 1.10

### 5.3 Constraint Bounds (tái sử dụng tư tưởng BASE_ALLOCATIONS)

```
LOW:    savings [40-70]%  gold [10-35]%  bonds [5-25]%   stocks [0-15]%   crypto [0-0]%
MEDIUM: savings [15-45]%  gold [5-30]%   bonds [5-25]%   stocks [10-45]%  crypto [0-10]%
HIGH:   savings [5-25]%   gold [0-20]%   bonds [0-15]%   stocks [25-70]%  crypto [0-20]%
```

### 5.4 Files

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `server/src/services/portfolioOptimizer.service.js` | MVO solver |
| NEW | `server/src/constants/optimizationConfig.js` | λ, constraints, solver params |
| MODIFY | `server/src/controllers/investment.controller.js` | Gọi optimizer thay getAllocation |
| MODIFY | `server/src/controllers/strategy.controller.js` | Tương tự |
| MODIFY | `server/src/utils/calculations.js` | Comment [LEGACY] getAllocation |
| MODIFY | `client/src/utils/calculations.js` | Comment [LEGACY] getAllocation |

### 5.5 Checklist

```
- [x] Tạo `server/src/constants/optimizationConfig.js`:
      - RISK_AVERSION: { LOW: 8, MEDIUM: 4, HIGH: 1.5 }
      - WEIGHT_BOUNDS: { LOW: {...}, MEDIUM: {...}, HIGH: {...} }
      - SENTIMENT_ADJUSTMENTS: { EXTREME_FEAR: {...}, ... }
      - SOLVER_CONFIG: { maxIterations: 1000, learningRate: 0.05, tolerance: 1e-6 }

- [x] Tạo `server/src/services/portfolioOptimizer.service.js`

- [x] Implement portfolioReturn(weights, means):
      - return math.dot(weights, means)

- [x] Implement portfolioVariance(weights, covMatrix):
      - return w^T × Σ × w (math.js multiply chain)

- [x] Implement adjustReturnsForSentiment(means, sentimentValue, adjustments):
      - Lấy sentiment band (tái sử dụng getSentimentLabel từ calculations.js)
      - Apply multipliers lên means
      - Return adjusted means

- [x] Implement projectOntoConstraints(weights, bounds):
      - Clamp mỗi weight vào [min, max]
      - Re-normalize tổng = 1 (redistribute proportionally)

- [x] Implement optimizePortfolio(marketParams, riskLevel, sentimentValue, profile):
      Algorithm: Projected Gradient Ascent
      1. adjustedMeans = adjustReturnsForSentiment(means, sentimentValue)
      2. lambda = RISK_AVERSION[riskLevel]
      3. bounds = WEIGHT_BOUNDS[riskLevel]
      4. weights = init từ midpoint of bounds (hoặc BASE_ALLOCATIONS[riskLevel] / 100)
      5. Loop maxIterations:
         a. gradient[i] = adjustedMeans[i] - lambda × (Σ × w)[i]
         b. weights[i] += learningRate × gradient[i]
         c. weights = projectOntoConstraints(weights, bounds)
         d. if |change| < tolerance → break
      6. Tính: portfolioReturn, portfolioRisk (stdDev), sharpeRatio
      7. Return { weights (as percentages), metrics, converged, iterations }

- [x] Implement getOptimalAllocation(profile, sentimentValue):
      - Wrapper function thay thế getAllocation()
      - marketParams = await getMarketParams()
      - result = optimizePortfolio(marketParams, profile.riskLevel, sentimentValue, profile)
      - Build recommendation text (tái sử dụng RECOMMENDATION_TEXTS pattern)
      - Return format tương thích getAllocation() output:
        { savings, gold, stocks, bonds, crypto, sentimentValue, sentimentLabel,
          sentimentVietnamese, recommendation, optimizationMethod: 'markowitz' }

- [x] MODIFY investment.controller.js → getAllocationRecommendation():
      - Comment [LEGACY]: const allocation = getAllocation(profile, sentimentValue)
      - Thay bằng: const allocation = await getOptimalAllocation(profile, sentimentValue)
      - Giữ nguyên: portfolioBreakdown, projection logic, cryptoWarning
      - Thêm vào response: allocation.optimizationMethod

- [x] MODIFY strategy.controller.js → generateStrategy():
      - Comment [LEGACY]: const result = getAllocation(...)
      - Thay bằng: const result = await getOptimalAllocation(...)

- [x] MODIFY server/src/utils/calculations.js:
      - Thêm comment block trước getAllocation():
        // [LEGACY] Hệ thống overlay 5 lớp — đã thay thế bởi Markowitz MVO
        // Xem: server/src/services/portfolioOptimizer.service.js
        // Giữ lại để tham khảo và rollback nếu cần
      - Quyết định: không re-export `getOptimalAllocation` từ service để tránh vòng import ESM; controller import service trực tiếp

- [x] MODIFY client/src/utils/calculations.js:
      - Comment [LEGACY] tương tự (client dùng data từ API, không chạy optimizer)

- [x] Test: weights sum = 100% (tolerance < 0.5%)
- [x] Test: tất cả weights nằm trong bounds
- [x] Test: LOW risk → savings+gold+bonds > 60%
- [x] Test: HIGH risk → stocks+crypto > 40%
- [x] Test: sentiment FEAR → stocks allocation giảm so với NEUTRAL
- [x] Test: convergence trong < 500 iterations
- [x] Test: output format tương thích getAllocation() (backward compat)
```

---

## 6. Problem 3: Monte Carlo Simulation

### 6.1 PRD

**Input:** capital, monthlyAdd, weights[5], marketParams, years
**Output:** Percentile-based projections (P5, P25, P50, P75, P95) + probLoss

**Thay thế:** Heuristic `calcFV` + `×1.3`/`×0.5` trong controller (comment `[LEGACY]`)

### 6.2 Academic Basis

- **Geometric Brownian Motion (GBM):** `dS = μS dt + σS dW` (Black & Scholes 1973)
- **Discrete:** `S(t+1) = S(t) × exp((μ - σ²/2)Δt + σ√Δt × Z)`
- **Correlated returns:** Cholesky decomposition `L` where `LL^T = Σ`
- **Config:** 5000 simulations (note: upgrade lên 10,000 + Worker thread khi cần)
- Ref: Glasserman, P. (2004). "Monte Carlo Methods in Financial Engineering", Springer

### 6.3 Files

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `server/src/services/monteCarloSimulation.service.js` | Simulation engine |
| MODIFY | `server/src/controllers/investment.controller.js` | Thay projection logic |

### 6.4 Checklist

```
- [x] Tạo `server/src/services/monteCarloSimulation.service.js`

- [x] Implement boxMullerTransform():
      - U1, U2 = Math.random()
      - Z = Math.sqrt(-2 × Math.log(U1)) × Math.cos(2π × U2)
      - Return Z (standard normal)

- [x] Implement choleskyDecomposition(matrix):
      - Input: n×n symmetric positive-definite matrix
      - Output: lower triangular L where LL^T = matrix
      - Algorithm: Cholesky–Banachiewicz
      - L[i][j] = (A[i][j] - Σ(L[i][k]×L[j][k])) / L[j][j]  (j < i)
      - L[i][i] = sqrt(A[i][i] - Σ(L[i][k]^2))
      - Validation: nếu diagonal <= 0 → matrix không positive-definite → fallback

- [x] Implement generateCorrelatedNormals(choleskyL, numAssets):
      - Z_independent = [boxMuller() for each asset]
      - Z_correlated = choleskyL × Z_independent
      - Return Z_correlated

- [x] Implement simulatePortfolio(params):
      params = { capital, monthlyAdd, weights[5], means[5], covMatrix[5×5], years, numSims: 5000 }
      
      1. choleskyL = choleskyDecomposition(covMatrix monthly)
         - covMonthly[i][j] = covAnnual[i][j] / 12
      2. monthlyMeans[i] = means[i] / 12
      3. monthlyStdDevs[i] = stdDevs[i] / Math.sqrt(12)
      
      4. results = Float64Array(numSims)
      5. For sim = 0..numSims-1:
           value = capital
           For month = 0..years×12-1:
             Z = generateCorrelatedNormals(choleskyL, 5)
             For asset j:
               monthlyReturn[j] = monthlyMeans[j] + monthlyStdDevs[j] × Z[j]
             portfolioReturn = dot(weights, monthlyReturn)
             value = value × (1 + portfolioReturn) + monthlyAdd
           results[sim] = value
      
      6. results.sort()
      7. Return:
         { p5:  results[floor(0.05 × numSims)],
           p25: results[floor(0.25 × numSims)],
           median: results[floor(0.50 × numSims)],
           p75: results[floor(0.75 × numSims)],
           p95: results[floor(0.95 × numSims)],
           mean: average(results),
           probLoss: count(r < capital) / numSims }

- [x] Implement generateProjectionTable(params):
      - Gọi simulatePortfolio cho years = [1, 3, 5, 10]
      - Return: { '1y': {p5,...,probLoss}, '3y': {...}, '5y': {...}, '10y': {...} }

- [x] MODIFY getAllocationRecommendation() trong investment.controller.js:
      - Comment [LEGACY]: projection logic cũ (calcFV, ×1.3, ×0.5)
      - Thay bằng: generateProjectionTable()
      - Backward compat response:
        projection.base = { '1y': table['1y'].median, ... }
        projection.optimistic = { '1y': table['1y'].p95, ... }
        projection.pessimistic = { '1y': table['1y'].p5, ... }
      - Thêm: projection.monteCarlo = table (full percentiles)
      - Thêm: projection.probLoss = table['10y'].probLoss

- [x] Performance test: 5000 sims × 120 months phải < 2 giây
- [x] Test: median ≈ analytical FV (sai lệch < 10%)
- [x] Test: p5 < p25 < median < p75 < p95
- [x] Test: HIGH risk → probLoss cao hơn LOW risk
- [x] Test: probLoss 10y cho LOW risk < 10%
```

> **Note tương lai:** Khi cần 10,000+ sims, chuyển simulation sang Node.js Worker thread (`worker_threads` module) để không block event loop. Tạo file `server/src/workers/monteCarloWorker.js`.

---

## 7. Problem 4: Risk Metrics

### 7.1 PRD

**Input:** Monte Carlo simulation results + allocation weights + marketParams
**Output:** `riskMetrics` object trong API response

### 7.2 Academic Basis

| Metric | Reference | Formula |
|--------|-----------|---------|
| Sharpe Ratio | Sharpe, W. (1966) "Mutual Fund Performance" | `(Rp - Rf) / σp` |
| VaR 95% | Jorion, P. (2006) "Value at Risk" | Percentile thứ 5 of loss distribution |
| CVaR / ES | Rockafellar & Uryasev (2000) "Optimization of CVaR" | Mean of losses beyond VaR |
| Max Drawdown | Magdon-Ismail et al. (2004) | Max peak-to-trough decline |

### 7.3 Files

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `server/src/services/riskMetrics.service.js` | Risk calculations |
| MODIFY | `server/src/controllers/investment.controller.js` | Thêm riskMetrics vào response |

### 7.4 Checklist

```
- [x] Tạo `server/src/services/riskMetrics.service.js`

- [x] Implement calcSharpeRatio(portfolioReturn, riskFreeRate, portfolioStdDev):
      - return (portfolioReturn - riskFreeRate) / portfolioStdDev
      - riskFreeRate = profile.savingsRate/100 || 0.05

- [x] Implement calcVaR(simResults, capital, confidence=0.95):
      - sorted = [...simResults].sort((a,b) => a-b)
      - idx = Math.floor((1 - confidence) × sorted.length)
      - VaR = capital - sorted[idx]
      - Return VaR (dương = mức lỗ tiềm năng)

- [x] Implement calcCVaR(simResults, capital, confidence=0.95):
      - idx = Math.floor((1 - confidence) × sorted.length)
      - tail = sorted.slice(0, idx)
      - CVaR = capital - mean(tail)

- [x] Implement calcMaxDrawdown(simPaths):
      - Từ monthly snapshots (cần sửa simulatePortfolio lưu paths)
      - Sample 500 paths (không cần tất cả 5000)
      - Cho mỗi path: tính max(peak - trough) / peak
      - Return: { median: P50 of drawdowns, worst: P95 }

- [x] Implement buildRiskMetrics(params):
      params = { weights, marketParams, simResults, capital, profile }
      Return: {
        sharpeRatio: float,
        sharpeLabel: 'Tốt' | 'Trung bình' | 'Kém',
        var95_1y: { amount, percentage, description },
        cvar95_1y: { amount, percentage, description },
        maxDrawdown: { median, worst, description },
        probLoss: { '1y': float, '5y': float, '10y': float },
        riskGrade: 'A' | 'B' | 'C' | 'D' | 'F'
      }

- [x] riskGrade calculation:
      - A: Sharpe > 1.0 AND VaR < 15% capital
      - B: Sharpe > 0.5 AND VaR < 25%
      - C: Sharpe > 0.2 AND VaR < 40%
      - D: Sharpe > 0
      - F: Sharpe <= 0

- [x] MODIFY getAllocationRecommendation():
      - Thêm: riskMetrics = buildRiskMetrics(...)
      - Thêm vào response: riskMetrics

- [x] Test: Sharpe > 0 cho mọi riskLevel
- [x] Test: VaR > 0, CVaR >= VaR
- [x] Test: LOW risk → VaR nhỏ hơn HIGH risk
- [x] Test: riskGrade hợp lý (LOW → A/B, HIGH → C/D)
```

---

## 8. New Files Summary

```
server/src/
├── constants/
│   ├── assetTickers.js           [NEW] — Ticker mapping
│   └── optimizationConfig.js     [NEW] — MVO constraints, λ
├── services/
│   ├── historicalData.service.js       [NEW] — P1: data engine
│   ├── portfolioOptimizer.service.js   [NEW] — P2: Markowitz MVO
│   ├── monteCarloSimulation.service.js [NEW] — P3: Monte Carlo
│   └── riskMetrics.service.js          [NEW] — P4: risk metrics
├── controllers/
│   └── investment.controller.js  [MODIFY] — integrate P2+P3+P4
│   └── strategy.controller.js    [MODIFY] — integrate P2
└── utils/
    └── calculations.js           [MODIFY] — comment [LEGACY]

client/src/
└── utils/
    └── calculations.js           [MODIFY] — comment [LEGACY]

Dependencies mới: mathjs (npm install mathjs)
```

---

## 9. Documentation Updates (sau khi code done)

- [x] Cập nhật `INVESTMENT_LOGIC.md`:
  - Section 7: "Markowitz Mean-Variance Optimization"
  - Section 8: "Monte Carlo Projection Engine"
  - Section 9: "Risk Metrics (Sharpe, VaR, CVaR)"
  - Section 10: "Luồng xử lý mới"
- [x] Cập nhật `AI_PROJECT_CONTEXT.md`:
  - Thêm new services vào file map
  - Cập nhật dependencies (mathjs)
  - Cập nhật Investment Advisor architecture
- [x] Comment `[LEGACY]` trong code cũ cho dễ phân biệt

---

## 10. UI Plan chi tiết (Tuần 3)

> Mục tiêu UI: nâng cấp trang `client/src/pages/InvestmentPage.jsx` dựa trên nền hiện có, không redesign toàn trang, không làm mất flow tạo chiến lược, apply strategy, portfolio cá nhân, quota, Smart Asset Guide, Market Pulse và news feed.

### 10.0 Nguyên tắc UI/UX bắt buộc

- Giữ phong cách hiện tại: dark fintech dashboard, `bg-slate-900/60`, `border-white/5`, accent blue/emerald/amber/purple/pink, `backdrop-blur-xl`, shadow nhẹ, card spacing rộng.
- Không tạo landing/hero mới; màn hình đầu tiên vẫn là công cụ cố vấn đầu tư đang dùng.
- Không thêm thư viện chart mới nếu `recharts` đã đủ; ưu tiên `AreaChart`, `ComposedChart`, `ReferenceLine`, `ScatterChart` trong Recharts.
- Không thay đổi route hiện có: `/investment`, `/investment/my-portfolio`, `/risk-assessment`.
- Không phá các chức năng hiện có: generate strategy, quota, apply strategy modal, portfolio update, SmartAssetGuide, MarketLivePulse, EconomicNewsFeed.
- Mọi component mới phải có fallback khi backend chưa trả đủ field, để strategy cũ trong DB vẫn render được.
- Text trong UI phải ngắn, dùng số liệu/label trực tiếp; không thêm đoạn hướng dẫn dài trong app.
- Mobile first: các panel mới phải collapse về 1 cột, chart không tràn ngang, bảng lịch sử vẫn scroll ngang như hiện tại.
- Không gọi API mới theo vòng lặp hoặc trên mỗi render; mọi fetch phải nằm trong `useEffect`/handler rõ ràng và có loading/error state.

### 10.1 Data contract & adapter trước khi làm visual

**Lý do:** `InvestmentPage` hiện render từ `AIStrategy` history (`getStrategies()`), trong khi backend analytics mới nằm ở `/investment/allocation` gồm `projection`, `riskMetrics`, `optimization`, `allocationMetrics`. Cần adapter để UI mới có dữ liệu nhưng không phá strategy history cũ.

**Files dự kiến**

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `client/src/utils/investmentAdvisorAdapter.js` | Chuẩn hóa response mới + strategy legacy thành 1 view model |
| MODIFY | `client/src/pages/InvestmentPage.jsx` | Thêm state `advisorAnalysis`, truyền props mới xuống components |
| MODIFY | `client/src/api/index.js` | Giữ `investmentAPI.getAllocation(params)` hiện có, chỉ dùng lại |

**View model đề xuất**

```js
{
  allocation,
  portfolioBreakdown,
  pieData,
  projectionBase,
  projectionData,
  monteCarloData,
  riskMetrics,
  optimization,
  allocationMetrics,
  dataQuality,
  source: 'allocation-api' | 'strategy-legacy'
}
```

**Checklist**

- [x] Tạo `investmentAdvisorAdapter.js`
- [x] Implement `normalizeAllocationAnalysis(apiData, profile)` cho response `/investment/allocation`
- [x] Implement `normalizeStrategy(strategy, profile)` để strategy cũ vẫn dùng được
- [x] Adapter ưu tiên backend `projection.base/optimistic/pessimistic` nếu có, fallback về `calcFV` legacy nếu thiếu
- [x] Adapter chuyển `projection.monteCarlo` thành chart rows: `{ year, p5, p25, median, p75, p95 }`
- [x] Adapter giữ `portfolioBreakdown` từ backend nếu có, fallback tự tính từ allocation + capital
- [x] Không xóa `buildRenderData()` ngay; comment `[LEGACY]` trước, sau khi adapter ổn mới thay usage
- [x] Test thủ công: strategy cũ không có `riskMetrics/projection` vẫn render không crash

**Quyết định cần giữ an toàn**

- Không tự động gọi `/investment/allocation` nhiều lần khi user đổi tab/history.
- Nếu dùng `/investment/allocation` để lấy analytics mới, chỉ gọi 1 lần khi vào trang hoặc sau khi user bấm tạo/làm mới phân tích; ghi chú vì endpoint hiện có side effect lưu `Allocation` history.
- Nếu sau này muốn tránh side effect hoàn toàn, tạo backend endpoint preview riêng là một task backend nhỏ, không trộn vào UI step.

### 10.2 Nâng cấp data flow trong `InvestmentPage`

**Mục tiêu:** page hiện tại vẫn hoạt động với strategy list, nhưng có thêm analytics mới khi available.

**Files dự kiến**

| Action | File | Mô tả |
|--------|------|-------|
| MODIFY | `client/src/pages/InvestmentPage.jsx` | Thêm fetch advisor analysis + view model |
| MODIFY | `client/src/components/investment/PortfolioHealthMetrics.jsx` | Nhận thêm `riskMetrics`, `allocationMetrics` optional |

**Checklist**

- [x] Thêm state `advisorAnalysis`, `advisorLoading`, `advisorError`
- [x] Initial load vẫn chạy song song `getStrategies`, `getPortfolio`, `getSummary`
- [x] Thêm fetch `investmentAPI.getAllocation()` có `catch` riêng; nếu lỗi thì page vẫn dùng strategy legacy
- [x] Sau `handleGenerate()`, cập nhật strategy mới như cũ và optionally refresh analytics 1 lần
- [x] Thay `buildRenderData(activeAllocation, mockProfile)` bằng adapter view model
- [x] Giữ nguyên NoStrategyPopup, ApplyStrategyModal, history table, SmartAssetGuide
- [x] Không đổi behavior điều hướng `/investment/my-portfolio`
- [x] Kiểm tra loading: skeleton chính không bị treo nếu analytics mới fail

### 10.3 Risk Metrics Panel

**Mục tiêu:** hiển thị `riskMetrics` backend trả về, đồng bộ với card dashboard cũ, đặt ngay dưới `PortfolioHealthMetrics` hoặc trong grid cạnh sentiment/health.

**Component mới**

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `client/src/components/investment/RiskMetricsPanel.jsx` | Sharpe, Risk Grade, VaR, CVaR, Max Drawdown, Prob Loss |

**Layout đề xuất**

- Header compact: icon `ShieldCheck` hoặc `Activity`, title "Chỉ số rủi ro".
- Top row 4 cards nhỏ:
  - `riskGrade` badge lớn A/B/C/D/F
  - Sharpe Ratio + label
  - VaR 95% 1y amount/percentage
  - CVaR 95% 1y amount/percentage
- Bottom row:
  - Max Drawdown median/worst bar
  - Prob Loss chips cho `1y`, `5y`, `10y`
- Nếu thiếu `riskMetrics`: render mini fallback state "Đang dùng dữ liệu chiến lược cũ" với style muted, không crash.

**Checklist**

- [x] Tạo `RiskMetricsPanel.jsx`
- [x] Dùng `formatVND`, `formatPercent` hiện có
- [x] Grade color map: A emerald, B blue, C amber, D orange, F red
- [x] VaR/CVaR bars scale theo percentage, clamp 0-100
- [x] Max drawdown dùng 2 bars median/worst
- [x] ProbLoss dùng chips, không dùng text dài
- [x] Tích hợp vào `InvestmentPage` dưới `PortfolioHealthMetrics`
- [x] Responsive 1 cột mobile, 2/4 cột desktop

### 10.4 Monte Carlo Fan Chart trong `WealthProjection`

**Mục tiêu:** thay 3-line heuristic chart bằng fan chart percentile khi có `projection.monteCarlo`, vẫn fallback chart cũ nếu thiếu dữ liệu.

**Files dự kiến**

| Action | File | Mô tả |
|--------|------|-------|
| MODIFY | `client/src/components/investment/WealthProjection.jsx` | Support fan chart + legacy line chart fallback |
| MODIFY | `client/src/utils/investmentAdvisorAdapter.js` | Build `monteCarloData` |

**Chart design**

- Dùng `ComposedChart`/`AreaChart`:
  - P5-P95: area mờ đỏ/blue thấp opacity
  - P25-P75: area đậm hơn
  - Median: line blue nổi bật
  - Savings baseline: dashed slate line nếu adapter có tính được
- Legend ngắn: "Vùng 90%", "Vùng 50%", "Trung vị", "Tiết kiệm".
- Tooltip hiển thị đầy đủ P5/P25/Median/P75/P95 bằng VND.
- Giữ header hiện tại, đổi "Mô hình: Xác suất" thành badge thật khi có Monte Carlo.

**Checklist**

- [x] `WealthProjection` nhận props `{ projectionData, monteCarloData, mockProfile }`
- [x] Nếu `monteCarloData?.length >= 2` thì render fan chart
- [x] Nếu không có Monte Carlo thì render line chart cũ không đổi
- [x] Tooltip không overflow mobile
- [x] Y-axis formatter giữ triệu/tỷ gọn
- [ ] Snapshot thủ công desktop/mobile: chart không tràn khỏi card

### 10.5 Data Quality & Optimization Summary

**Mục tiêu:** giúp user biết allocation đến từ Markowitz + data quality mà không biến UI thành tài liệu kỹ thuật.

**Component mới**

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `client/src/components/investment/OptimizationSummaryStrip.jsx` | Badge method, convergence, dataQuality, iterations |

**Vị trí đề xuất**

- Đặt dưới AI recommendation, trước AllocationEngine.
- Nếu không có `optimization`, ẩn component hoặc render legacy badge nhỏ.

**Nội dung ngắn**

- Method: `Markowitz MVO`
- Data: `Historical 5y` / `Partial fallback` / `Fallback`
- Solver: `Converged` + iterations
- Expected Return/Risk từ `allocationMetrics`

**Checklist**

- [x] Tạo `OptimizationSummaryStrip.jsx`
- [x] Map `optimization.marketDataQuality`: full/partial/fallback sang màu
- [x] Hiển thị `allocationMetrics.expectedReturn`, `portfolioRisk`, `sharpeRatio`
- [x] Không hiển thị matrix/covariance trong UI chính
- [x] Tích hợp sau recommendation block

### 10.6 Efficient Frontier Visualization

**Trạng thái dependency:** backend hiện chưa trả frontier points; `allocationMetrics` chỉ có current portfolio risk/return/sharpe. Không fake frontier nếu thiếu dữ liệu.

**Plan an toàn**

- Phase MVP: tạo panel "Vị trí danh mục" dạng risk-return dot dùng current `allocationMetrics`:
  - x = `portfolioRisk`
  - y = `expectedReturn`
  - color theo `riskGrade` hoặc risk level
- Phase sau khi backend expose frontier:
  - `optimization.frontierPoints = [{ risk, return, sharpe, weights }]`
  - UI nâng cấp thành scatter/frontier curve.

**Files dự kiến**

| Action | File | Mô tả |
|--------|------|-------|
| NEW | `client/src/components/investment/EfficientFrontierPanel.jsx` | MVP current portfolio dot, future-ready frontier |

**Checklist**

- [x] Tạo component với fallback "current portfolio only"
- [x] Dùng `ScatterChart` nếu có `frontierPoints`, nếu không dùng compact risk-return card
- [x] Highlight user's portfolio position
- [x] Tooltip hiển thị expected return/risk/sharpe
- [x] Không block release UI nếu frontierPoints chưa có
- [x] Ghi note trong plan nếu cần backend frontier endpoint sau

### 10.7 AIRationalPanel copy update

**Mục tiêu:** panel này hiện mô tả "mạng nơ-ron"/layer heuristic cũ, dễ gây hiểu sai sau MVO. Cập nhật copy để phù hợp thuật toán mới nhưng giữ component behavior accordion hiện có.

**Files dự kiến**

| Action | File | Mô tả |
|--------|------|-------|
| MODIFY | `client/src/components/investment/AIRationalPanel.jsx` | Copy/title + optional metrics |
| MODIFY | `client/src/components/investment/InvestmentUtils.jsx` | `explainAsset()` legacy note hoặc MVO-aware text |

**Checklist**

- [x] Đổi title từ "Ma trận Quyết định AI" sang label phù hợp MVO hơn
- [x] Không nói "mạng nơ-ron" nếu không có model neural thật
- [x] `explainAsset()` nhận optional `{ optimization, allocationMetrics }`
- [x] Nếu không có metrics, giữ explanation cũ nhưng mark legacy/fallback trong code
- [x] Không làm accordion layout thay đổi mạnh

### 10.8 History table enhancement không phá apply flow

**Mục tiêu:** bảng lịch sử vẫn là nơi chọn/apply strategy; chỉ thêm thông tin mới nếu available.

**Checklist**

- [x] Giữ click row để set `activeStrategyIndex`
- [x] Giữ nút "Áp dụng" và modal hiện tại
- [x] Thêm badge method/dataQuality chỉ khi active analysis có field tương ứng
- [x] Không thêm risk metrics vào từng row nếu DB strategy cũ không lưu field
- [x] Nếu cần metrics theo từng strategy, tạo task backend riêng, không fake trên UI

### 10.9 MyPortfolioPage compatibility

**Mục tiêu:** không làm ảnh hưởng trang `/investment/my-portfolio`.

**Checklist**

- [x] Không đổi contract `getPortfolio`, `upsertPortfolio`, `updatePortfolio`
- [x] Không đưa riskMetrics vào portfolio cá nhân khi DB chưa lưu
- [x] Nếu thêm link "Phân tích bằng cố vấn AI", chỉ điều hướng về `/investment`, không gọi API phụ
- [ ] Smoke test edit allocation tổng 100% vẫn hoạt động

### 10.10 Testing & verification UI

**Commands**

```bash
cd client
npm.cmd run build
```

**Build result 2026-04-26:** `npm.cmd run build` pass; chỉ còn warning bundle lớn hiện có.

**Manual QA bắt buộc**

- [ ] Desktop `/investment`: có strategy, analytics API success
- [ ] Desktop `/investment`: analytics API fail, strategy legacy vẫn render
- [ ] Mobile `/investment`: chart/panels không overflow
- [ ] User không có strategy: NoStrategyPopup vẫn hiện
- [ ] Generate strategy: quota giảm, strategy mới lên đầu list
- [ ] Apply strategy: modal validate tổng 100%, save vẫn chuyển `/investment/my-portfolio`
- [ ] `/investment/my-portfolio`: edit/save allocation vẫn hoạt động
- [ ] `/risk-assessment`: không bị ảnh hưởng

**Visual QA**

- [ ] Panel mới dùng cùng card style với `PortfolioHealthMetrics`, `AllocationEngine`, `WealthProjection`
- [ ] Không có text tràn trong button/badge/card
- [ ] Tooltip chart không che toàn bộ chart trên mobile
- [ ] Không có layout shift lớn khi riskMetrics/projection loading xong
- [ ] Không thêm gradient/orb trang trí mới ngoài pattern đang có trong page

### 10.11 Smart Asset Guide: mở rộng card + biểu đồ lịch sử tháng

**Mục tiêu:** khi user nhấp vào card trong `Hướng dẫn Đầu tư Thông minh` (ưu tiên chứng khoán/ETF như `ETF E1VFVN30`), card mở rộng tại chỗ và hiển thị biểu đồ cột theo tháng với toggle `6 / 12 / 18 tháng`. UI phải đồng bộ với card/list/tab hiện có, không ảnh hưởng các flow investment khác.

**Phạm vi v1**

- Ưu tiên `stocks`/ETF vì đã có dữ liệu monthly close từ Yahoo Finance qua historical data engine.
- Không fake dữ liệu cho savings/bonds/gold/crypto nếu chưa có source lịch sử theo item tương ứng.
- Không preload lịch sử cho toàn bộ card; chỉ fetch khi user mở card.

**Files**

| Action | File | Mô tả |
|--------|------|-------|
| MODIFY | `server/src/controllers/investment.controller.js` | Thêm `getAssetHistory`, validate ticker theo `STOCK_UNIVERSE`, format monthly bars |
| MODIFY | `server/src/routes/investment.routes.js` | Thêm route `GET /investment/asset-history` |
| MODIFY | `client/src/api/index.js` | Thêm `investmentAPI.getAssetHistory()` |
| MODIFY | `client/src/api/queryKeys.js` | Thêm query key `ASSET_HISTORY(asset,ticker,months)` |
| MODIFY | `client/src/hooks/useInvestmentQuery.js` | Thêm `useAssetMonthlyHistory()` lazy hook |
| MODIFY | `client/src/components/investment/SmartAssetGuide.jsx` | Card expand, range toggle, Recharts monthly bar chart |

**Data contract**

```js
GET /api/investment/asset-history?asset=stocks&ticker=E1VFVN30.VN&months=12

{
  asset: 'stocks',
  ticker: 'E1VFVN30.VN',
  symbol: 'E1VFVN30',
  name: 'ETF E1VFVN30',
  sector: 'ETF',
  months: 12,
  history: [
    { month: '2025-05', label: '05/25', close: 32100, changePct: 1.2 }
  ],
  updatedAt: 'ISO date',
  dataSource: 'Yahoo Finance monthly close'
}
```

**Checklist**

- [x] Backend: thêm `historyTicker` vào stock card để frontend có ticker đầy đủ `.VN`
- [x] Backend: thêm allowlist resolver, chỉ nhận ticker nằm trong `STOCK_UNIVERSE`
- [x] Backend: thêm `GET /investment/asset-history` cho `asset=stocks`
- [x] Backend: format dữ liệu thành monthly bars `{ month, label, close, changePct }`
- [x] Backend: thêm log `asset-history:start`, `asset-history:no-data`, `asset-history:complete`
- [x] Frontend API: thêm `investmentAPI.getAssetHistory`
- [x] Frontend React Query: thêm query key + hook `useAssetMonthlyHistory`
- [x] SmartAssetGuide: thêm state `expandedCardKey`, reset khi đổi asset tab
- [x] SmartAssetGuide: card mở rộng tại chỗ, desktop dùng `md:col-span-2` để chart không bị chật
- [x] SmartAssetGuide: thêm toggle dài `6 tháng / 12 tháng / 18 tháng`, style đồng bộ với tab danh mục
- [x] SmartAssetGuide: thêm Recharts bar chart, tooltip tháng + giá + thay đổi % so với tháng trước
- [x] SmartAssetGuide: lazy fetch chỉ khi card mở, không preload toàn bộ card
- [x] SmartAssetGuide: fallback gọn khi nhóm tài sản chưa có history source
- [x] Verify: `node --check src/controllers/investment.controller.js`
- [x] Verify: `node --check src/routes/investment.routes.js`
- [x] Verify: `npm.cmd run build` client pass sau khi chạy ngoài sandbox
- [ ] Manual QA: mở `/investment`, chọn `Chứng khoán`, click `ETF E1VFVN30`
- [ ] Manual QA: toggle `6/12/18 tháng` đổi dữ liệu/chart không lỗi
- [ ] Manual QA: mobile chart không overflow, tooltip không che toàn bộ chart
- [ ] Manual QA: đổi tab danh mục reset expanded card, các card cũ không giữ state sai
- [ ] Manual QA: click savings/gold/bonds/crypto không crash và hiển thị fallback phù hợp nếu chưa hỗ trợ

**Ghi chú quyết định**

- V1 chưa tạo history giả cho tiết kiệm/trái phiếu/vàng/crypto theo từng card để tránh dữ liệu gây hiểu nhầm.
- Endpoint dùng allowlist từ `STOCK_UNIVERSE`, không nhận ticker tự do để tránh biến server thành proxy Yahoo.
- `fetchAssetHistory()` đang dùng cache 24h hiện có; endpoint mới dùng lại hạ tầng đó thay vì tạo cache riêng.
- Smoke import controller bằng `node -e import(...)` đã bị dừng do chạy quá lâu trong môi trường hiện tại, nên chưa tick manual server runtime check; syntax check và client build đã pass.

### 10.12 Smart Asset Guide: mở rộng history cho vàng/trái phiếu/tiết kiệm

**Hiện trạng sau manual QA 2026-04-27**

- `Chứng khoán` hoạt động đúng: card có `historyTicker`, frontend fetch lazy, backend trả monthly bars từ Yahoo.
- `Vàng`, `Trái phiếu`, `Tiết kiệm` vẫn mở fallback "chưa có nguồn lịch sử phù hợp" vì v1 cố tình chỉ hỗ trợ `stocks`.

**Nguyên nhân kỹ thuật**

1. Frontend đang khóa history theo điều kiện:

```js
const canShowHistory = type === 'stocks' && Boolean(historyTicker);
```

Do đó mọi card không thuộc `stocks` không bao giờ gọi `useAssetMonthlyHistory()`.

2. `getHistoryTicker()` hiện chỉ hiểu ticker chứng khoán (`historyTicker`, `ticker`, `symbol`, hoặc `STOCK_SYMBOLS`). Các item vàng/trái phiếu/tiết kiệm chưa có metadata history source.

3. Backend `getAssetHistory()` hiện reject mọi asset khác `stocks`:

```js
if (asset !== 'stocks') {
  return error(res, 'Asset history hiện chỉ hỗ trợ nhóm chứng khoán/ETF', 400);
}
```

4. Nguồn dữ liệu từng nhóm không giống nhau:

| Nhóm | Có lịch sử thật trong code? | Nguồn khả dụng | Quyết định |
|------|------------------------------|----------------|------------|
| Vàng | Có cho vàng thế giới | Yahoo `GC=F` qua `fetchAssetHistory()` | V2 hỗ trợ chart cho `Vàng thế giới (GC=F)` trước; SJC/nhẫn chỉ dùng proxy nếu label rõ "tham chiếu GC=F" |
| Trái phiếu | Có cho US 10Y | Yahoo `^TNX` qua `fetchAssetHistory()` | V2 hỗ trợ chart yield cho `US Treasury 10Y`; TPCP VN/quỹ TP chỉ dùng proxy nếu label rõ |
| Tiết kiệm | Chưa có lịch sử theo tháng | `SAVINGS_DATA` chỉ là snapshot hiện tại theo bank/tenor | Không fake. Cần dataset lịch sử đã kiểm chứng hoặc snapshot collector trước khi vẽ monthly history |

**Data contract mới cần generalize**

```js
GET /api/investment/asset-history?asset=gold&source=world&months=12
GET /api/investment/asset-history?asset=bonds&source=us10y&months=12
GET /api/investment/asset-history?asset=savings&bankId=msb&tenor=t24&months=12

{
  asset: 'gold',
  source: 'world',
  name: 'Vàng thế giới (GC=F)',
  metric: {
    key: 'price',
    unit: 'USD/oz',
    changeUnit: 'percent'
  },
  months: 12,
  history: [
    { month: '2025-05', label: '05/25', value: 3340.2, change: 1.2 }
  ],
  dataSource: 'Yahoo Finance monthly close'
}
```

**Thiết kế backend**

- [x] Tạo resolver chung `resolveAssetHistorySource(asset, query)` thay cho resolver chỉ stocks.
- [x] Tạo allowlist `ASSET_HISTORY_SOURCES`:
  - `stocks`: ticker nằm trong `STOCK_UNIVERSE`
  - `gold/world`: Yahoo ticker `GC=F`, metric `price`, unit `USD/oz`
  - `bonds/us10y`: Yahoo ticker `^TNX`, metric `yield`, unit `%`
  - `savings`: tiếp tục bị chặn cho đến khi có `SAVINGS_RATE_HISTORY` thật
- [x] Tách formatter history:
  - price close: `{ value, change }` theo %
  - yield/rate: `{ value, change }` theo basis points hoặc percentage point, không ghi là biến động giá
- [x] Thêm metadata `historySource` vào item:
  - Gold world item: `{ asset: 'gold', source: 'world' }`
  - Bonds US 10Y item: `{ asset: 'bonds', source: 'us10y' }`
  - Savings item: `{ asset: 'savings', bankId, tenor }` sau khi có history dataset
- [x] Với SJC/nhẫn/TPCP VN/quỹ trái phiếu: không tự gắn history nếu chỉ có proxy; nếu dùng proxy phải trả `proxy: true` và `proxyLabel`.
- [x] Log rõ `asset-history:start/complete/no-data` có `asset`, `source`, `metric`, `points`.

**Thiết kế dữ liệu tiết kiệm**

- [ ] Không sinh ngược dữ liệu 6/12/18 tháng từ `SAVINGS_DATA` hiện tại.
- [ ] Chọn một trong hai hướng trước khi implement:
  - Hướng A: thêm file curated `server/src/data/savingsRateHistory.js` với dữ liệu đã kiểm chứng theo tháng cho các bank/tenor đang hiển thị.
  - Hướng B: thêm snapshot collector/DB table để lưu lãi suất định kỳ từ thời điểm deploy, chart chỉ đủ dữ liệu sau khi tích lũy.
- [ ] Nếu chưa có dataset lịch sử tiết kiệm, UI không nên mở chart lớn cho savings; nên hiển thị compact unavailable state hoặc không hiện chevron.
- [ ] Nếu cần chart ngay cho savings mà không có monthly history, đổi label thành "So sánh kỳ hạn hiện tại" và bỏ toggle 6/12/18 để không gây hiểu nhầm.

**Thiết kế frontend**

- [x] Thay `getHistoryTicker()` bằng `getHistoryRequest(item, type)` để lấy `historySource` generic.
- [x] Thay `canShowHistory = type === 'stocks'...` bằng `canShowHistory = Boolean(historyRequest)`.
- [x] `useAssetMonthlyHistory()` nhận params generic: `{ asset, ticker/source/bankId/tenor, months }`.
- [x] `MonthlyHistoryChart` nhận `metric` để format:
  - `VND` cho chứng khoán VN
  - `USD/oz` cho vàng thế giới
  - `%` cho yield/rate
  - tooltip đổi copy theo metric, không dùng "giá đóng cửa" cho yield/rate
- [x] Toggle 6/12/18 giữ nguyên style, nhưng chỉ hiện khi có monthly history thật.
- [x] Card không có history source không nên mở panel chart trống quá lớn; nếu vẫn mở, copy phải nói đúng nguyên nhân.

**Thứ tự thực thi đề xuất**

1. [x] Backend generalize endpoint cho `gold/world` và `bonds/us10y`, không đụng savings trước.
2. [x] Frontend generalize request/chart formatter để vàng và US10Y dùng cùng UI.
3. [ ] Manual QA vàng: click `Vàng thế giới (GC=F)`, toggle 6/12/18, unit hiển thị `USD/oz`.
4. [ ] Manual QA trái phiếu: click `US Treasury 10Y`, toggle 6/12/18, unit hiển thị `%`.
5. Quyết định hướng dữ liệu tiết kiệm A hoặc B, rồi mới implement savings monthly history.
6. Cập nhật checklist, chạy `node --check`, `npm.cmd run build`, commit riêng.

**Verification 2026-04-27**

- [x] `node --check src/controllers/investment.controller.js`
- [x] `node --check src/routes/investment.routes.js`
- [x] `npm.cmd run build` client pass ngoài sandbox; còn warning bundle lớn hiện có
- [ ] Manual QA trên app thật cho gold/bonds/mobile

**Checklist điều tra/plan**

- [x] Xác định frontend đang khóa history ở `type === 'stocks'`
- [x] Xác định backend đang reject asset khác `stocks`
- [x] Xác định vàng có source lịch sử thật `GC=F`
- [x] Xác định trái phiếu có source lịch sử thật `^TNX`
- [x] Xác định tiết kiệm hiện chỉ có snapshot `SAVINGS_DATA`, chưa có monthly history thật
- [x] Ghi plan mở rộng vào `PLAN-investment-advisor-upgrade.md`

### 10.13 Smart Asset Guide: chọn lại nguồn dữ liệu lịch sử cho toàn bộ card

**Kết luận nguồn dữ liệu 2026-04-27**

Không có một API miễn phí/chính thức duy nhất bao phủ đủ tất cả card. Cần chọn nguồn theo từng loại card và ghi rõ `sourceType`:

- `direct`: dữ liệu lịch sử trực tiếp của sản phẩm/card đó.
- `officialCurve`: dữ liệu đường cong/lợi suất chính thức hoặc bán chính thức theo kỳ hạn, dùng cho TPCP.
- `proxy`: dữ liệu tham chiếu, không phải lịch sử trực tiếp của card.
- `collectorRequired`: hiện chỉ có snapshot/current; cần tự lưu snapshot hoặc backfill curated trước khi có chart 6/12/18 tháng.

**Nguồn được chọn cho danh mục vàng**

| Card hiện tại | Nguồn đề xuất | Loại | Ghi chú triển khai |
|---------------|---------------|------|--------------------|
| `Vàng thế giới (GC=F)` | Yahoo Finance `GC=F` hoặc XAU/USD | `direct` | Đã có chart 6/12/18 tháng |
| `Vàng miếng SJC` | `vang.today` type `VNGSJC` hoặc `SJL1L10` | `direct` ngắn hạn / `collectorRequired` dài hạn | API public có history tối đa 30 ngày; muốn 6/12/18 tháng cần collector/backfill |
| `Nhẫn tròn trơn VRTL` | `vang.today` type `BT9999NTT` hoặc `SJ9999` tùy mapping sản phẩm | `direct` ngắn hạn / `collectorRequired` dài hạn | Cần map đúng loại nhẫn BTMC/SJC trước khi dùng |
| `ETF Vàng (VFMVF1)` | Chưa xác thực được sản phẩm/ticker vàng Việt Nam phù hợp | `proxy` hoặc sửa card | Nên đổi thành `Vàng thế giới quy đổi VND` hoặc bỏ nếu không có sản phẩm thật |
| `Tích lũy vàng DCA` | Dùng series của SJC/nhẫn nếu có; fallback `GC=F` | `proxy` | Đây là chiến lược, không phải sản phẩm có giá riêng |

**Nguồn được chọn cho danh mục trái phiếu**

| Card hiện tại | Nguồn đề xuất | Loại | Ghi chú triển khai |
|---------------|---------------|------|--------------------|
| `US Treasury 10Y (tham chiếu)` | Yahoo Finance `^TNX` | `direct` nhưng là Mỹ | Giữ làm tham chiếu toàn cầu, không dùng thay TPCP Việt Nam |
| `Trái phiếu Chính phủ 5/10/15 năm` | VBMA Government Bond Yield Fixing + HNX/VBMA auction results | `officialCurve` | Ưu tiên VBMA curve theo tenor; HNX/VBMA auction làm backup/đối chiếu |
| `Quỹ VCBF-BCF` | Không phù hợp: VCBF-BCF là quỹ cổ phiếu | sửa card | Thay bằng `VCBF-FIF` nếu muốn quỹ thu nhập cố định |
| `Quỹ SSISCA` | Không phù hợp: SSI-SCA là quỹ cổ phiếu | sửa card | Thay bằng `SSIBF` nếu muốn quỹ trái phiếu SSI |
| `Quỹ MBBOND` | MB Capital MBBOND page | `direct` nếu lấy được NAV history, nếu không `collectorRequired` | Cần kiểm tra endpoint/list NAV lịch sử |
| `Quỹ TCBF` | Techcom Capital TCBF page | `direct` nếu lấy được NAV history, nếu không `collectorRequired` | Cần kiểm tra endpoint/list NAV lịch sử |

**Nguồn được chọn cho danh mục tiết kiệm**

| Card hiện tại | Nguồn đề xuất | Loại | Ghi chú triển khai |
|---------------|---------------|------|--------------------|
| MSB/OCB/VPBank/HDBank/ACB/Techcombank/Vietcombank | Trang lãi suất chính thức từng ngân hàng hoặc aggregator hiện tại | `collectorRequired` | Không thấy public API lịch sử theo bank/tenor đủ 6/12/18 tháng |
| Macro lãi suất tiền gửi Việt Nam | World Bank/Trading Economics | `proxy` macro | Chỉ annual/national average, không thay được chart từng ngân hàng |

**Quyết định sản phẩm**

- [x] Không dùng `^TNX` cho card `Trái phiếu Chính phủ Việt Nam`; chỉ giữ `^TNX` cho card tham chiếu riêng.
- [ ] Sửa lại bond fund cards sai phân loại: `VCBF-BCF` và `SSI-SCA` không phải quỹ trái phiếu.
- [ ] Với vàng trong nước, nếu chưa có 6/12/18 tháng thật thì chọn một trong hai UX:
  - Hiển thị chart 30 ngày từ `vang.today` với toggle riêng `7/14/30 ngày`.
  - Hoặc bật collector để tích lũy dữ liệu, giữ toggle 6/12/18 khi đủ dữ liệu.
- [x] Với tiết kiệm, không vẽ chart 6/12/18 tháng từ dữ liệu hiện tại; chỉ vẽ khi có snapshot collector/backfill.
- [ ] Mọi chart dùng `proxy` phải có label rõ: `Tham chiếu`, `Quy đổi`, hoặc `Proxy`, không ghi như dữ liệu trực tiếp.

**Thứ tự triển khai tiếp theo**

1. [ ] Gold source adapter: thêm `vang.today` cho SJC/nhẫn, hỗ trợ range ngắn hạn 7/14/30 ngày hoặc collector mode.
2. [ ] Bond source cleanup: thay card quỹ sai (`VCBF-BCF`, `SSI-SCA`) bằng bond funds thật (`VCBF-FIF`, `SSIBF`, optionally `MBBOND`, `TCBF`).
3. [ ] VN government bond yield adapter: ingest VBMA/HNX monthly/auction data cho tenor 5Y/10Y/15Y.
4. [ ] UI source label: phân biệt `direct`, `officialCurve`, `proxy`, `collectorRequired`.
5. [ ] Savings collector/backfill decision: chọn official bank pages/aggregator và lưu snapshot theo bank+tenor.

**Phạm vi thực thi đợt này**

- [ ] Backend: `asset-history` nhận cả `months=6/12/18` và `days=7/14/30` để vàng trong nước dùng dữ liệu thật ngắn hạn từ `vang.today`.
- [ ] Backend: thêm `historySource` cho `Vàng miếng SJC`, `Nhẫn tròn trơn`, và các card chiến lược/proxy vàng; proxy phải ghi rõ nguồn tham chiếu.
- [ ] Backend: cập nhật card TPCP Việt Nam theo yield đấu thầu VBMA mới nhất, thêm lịch sử curated từ các bài auction VBMA theo tháng cho 5Y/10Y/15Y.
- [ ] Backend: thay `VCBF-BCF` và `SSI-SCA` bằng `VCBF-FIF` và `SSIBF`; nếu chưa có NAV history ổn định thì chỉ gắn benchmark proxy có nhãn.
- [ ] Frontend: đổi toggle theo `rangeType` (`6/12/18 tháng` hoặc `7/14/30 ngày`) và hiển thị nhãn nguồn `direct`/`officialCurve`/`proxy`.
- [ ] Tiết kiệm: giữ trạng thái không vẽ chart 6/12/18 cho đến khi có collector/backfill thật, không tạo dữ liệu giả.

### 10.14 Thứ tự commit đề xuất cho UI

1. `investment-advisor-ui: add advisor data adapter`
2. `investment-advisor-ui: render risk metrics panel`
3. `investment-advisor-ui: upgrade monte carlo projection chart`
4. `investment-advisor-ui: add optimization summary`
5. `investment-advisor-ui: add portfolio risk return panel`
6. `investment-advisor-ui: align rationale copy with optimizer`
7. `investment-advisor-ui: verify investment advisor page`
8. `investment-advisor-ui: add smart asset monthly history`
9. `investment-advisor-ui: support gold and bond monthly history`
10. `investment-advisor-ui: add verified savings rate history`

---

## 11. Ghi chú tiến độ

- 2026-04-26: P1 Historical Data Engine đã commit trong `investment-advisor: test historical market parameters`; còn thiếu unit test tự động cho fallback partial/all-fallback theo checklist.
- 2026-04-26: Ticker stocks đổi từ `^VNINDEX` sang `VCB.VN` vì Yahoo Finance trả 404 không ổn định cho `^VNINDEX`; giữ ghi chú backup trong `assetTickers.js`.
- 2026-04-26: P2 Markowitz optimizer đã commit và đã nối vào `/investment/allocation` + `/investment/strategies/generate`; chưa re-export `getOptimalAllocation` từ `calculations.js` để tránh vòng import ESM, controller import service trực tiếp.
- 2026-04-26: Một số test P2 vẫn chưa đủ theo checklist chi tiết: LOW defensive allocation, FEAR vs NEUTRAL allocation, convergence < 500 iterations.
- 2026-04-26: P3 Monte Carlo service đã có unit test deterministic bằng seeded RNG và đã thêm vào `npm.cmd run test:investment`; controller integration, performance test và probLoss theo riskLevel chưa thực hiện.
- 2026-04-26: P3 đã nối Monte Carlo vào `getAllocationRecommendation()`: giữ `projection.base/optimistic/pessimistic`, thêm `projection.monteCarlo` và `projection.probLoss`; đã có syntax check controller và test helper response shape, full route integration test vẫn chưa làm.
- 2026-04-26: P3 performance/probLoss tests đã pass: 5000 simulations × 120 months chạy ~682ms trong unit test; investment suite 20/20.
- 2026-04-26: P4 Risk Metrics service đã implement và test đủ Sharpe, VaR, CVaR, Max Drawdown, riskGrade; investment suite 28/28. Controller integration `riskMetrics` vẫn chưa tick.
- 2026-04-26: P4 đã nối `riskMetrics` vào `getAllocationRecommendation()` từ Monte Carlo `1y.results` và `10y.samplePaths`; syntax check controller và investment suite 28/28 pass.
- 2026-04-26: P1 fallback tests đã bổ sung bằng fake `fetchAssetHistory` injection trong `buildMarketParams`, không gọi Yahoo/Redis thật; investment suite 30/30.
- 2026-04-26: P2 test gaps đã bổ sung LOW defensive allocation, FEAR giảm stocks, convergence <500; tăng `SOLVER_CONFIG.learningRate` từ `0.01` lên `0.05`, giữ `tolerance=1e-6`; investment suite 32/32.
- 2026-04-26: Documentation đã cập nhật `INVESTMENT_LOGIC.md` và `AI_PROJECT_CONTEXT.md`; `[LEGACY]` markers đã có trong server/client calculations và controller migration points.
- 2026-04-26: UI plan chi tiết đã bổ sung vào Section 10, ưu tiên adapter dữ liệu trước khi vẽ risk metrics/Monte Carlo để không phá strategy history và các flow hiện có.
- 2026-04-26: UI 10.1 adapter đã tạo `investmentAdvisorAdapter.js`; syntax check và smoke test legacy/new analytics view model đã pass.
- 2026-04-26: UI 10.2 đã nối adapter vào `InvestmentPage`; analytics mới chỉ áp dụng cho strategy mới nhất, strategy cũ fallback legacy; `npm.cmd run build` pass với warning bundle lớn hiện có.
- 2026-04-26: UI 10.3 đã thêm `RiskMetricsPanel` hiển thị Sharpe, risk grade, VaR/CVaR, max drawdown và probLoss; `npm.cmd run build` pass với warning bundle lớn hiện có.
- 2026-04-26: UI 10.4 đã thêm Monte Carlo fan chart vào `WealthProjection`, adapter bổ sung savings baseline + percentile bands; smoke test adapter và `npm.cmd run build` pass với warning bundle lớn hiện có. Snapshot desktop/mobile chưa tick vì chưa chạy được đúng page bằng browser harness.
- 2026-04-26: UI 10.5 đã thêm `OptimizationSummaryStrip` sau recommendation, hiển thị Markowitz/data quality/solver/return-risk-sharpe và không expose matrix/covariance; adapter giữ thêm `optimizationMethod`; smoke test adapter và `npm.cmd run build` pass.
- 2026-04-26: UI 10.6 đã thêm `EfficientFrontierPanel`; hiện dùng current portfolio risk-return card khi backend chưa có `optimization.frontierPoints`, nhưng đã future-ready ScatterChart nếu backend expose frontier points sau này; `npm.cmd run build` pass.
- 2026-04-26: UI 10.7 đã cập nhật `AIRationalPanel` sang copy MVO, truyền `{ optimization, allocationMetrics }` vào `explainAsset()` và giữ legacy fallback có comment; `npm.cmd run build` pass.
- 2026-04-26: UI 10.8 đã thêm badge method/dataQuality ở header lịch sử chỉ khi active latest analysis có field; giữ nguyên click row, nút Áp dụng và không fake risk metrics cho từng strategy row; `npm.cmd run build` pass.
- 2026-04-26: UI 10.9 đã rà MyPortfolio compatibility: không đổi API contract portfolio, không đưa riskMetrics/optimization vào DB portfolio, link hiện có chỉ điều hướng `/investment`; smoke edit allocation 100% còn pending vì chưa chạy app/browser thật.
- 2026-04-26: UI 10.10 đã chạy `npm.cmd run build` cuối pass sau toàn bộ thay đổi UI; manual QA/visual QA desktop-mobile vẫn để unchecked vì cần chạy app với auth/API thật để xác nhận.
- 2026-04-26: Pre-merge cleanup đã gỡ test modules/script nội bộ của investment advisor và xóa `getAllocation()` heuristic khỏi client/server utils vì không còn runtime dùng; giữ các fallback UI đang phục vụ strategy history cũ.
- 2026-04-27: Bổ sung Section 10.11 cho Smart Asset Guide monthly history; đã implement endpoint `GET /investment/asset-history`, hook lazy React Query, card expand + chart cột 6/12/18 tháng cho stocks/ETF. Backend `node --check` pass, client `npm.cmd run build` pass ngoài sandbox; manual QA trên app thật còn pending.
- 2026-04-27: Điều tra nguyên nhân vàng/trái phiếu/tiết kiệm chưa có chart: frontend đang khóa `type === 'stocks'`, backend chỉ nhận `asset=stocks`; vàng có thể dùng `GC=F`, trái phiếu có thể dùng `^TNX`, tiết kiệm chưa có monthly history thật vì `SAVINGS_DATA` chỉ là snapshot hiện tại. Đã bổ sung Section 10.12 làm plan mở rộng, chưa implement runtime.
- 2026-04-27: Đã implement phần runtime đầu tiên của Section 10.12: `asset-history` hỗ trợ `gold/world` (`GC=F`) và `bonds/us10y` (`^TNX`), frontend dùng `getHistoryRequest()` generic và chart format theo metric `VND`/`USD/oz`/`%`. Tiết kiệm vẫn chưa bật history để tránh dữ liệu giả. Syntax check backend và client build pass; manual QA app thật còn pending.
- 2026-04-27: Đã chọn lại nguồn dữ liệu lịch sử cho các card chưa đủ data trong Section 10.13. Kết luận: vàng trong nước dùng `vang.today` nhưng chỉ đủ history ngắn hạn tối đa 30 ngày nếu chưa có collector; TPCP Việt Nam dùng VBMA/HNX thay vì `^TNX`; `VCBF-BCF` và `SSI-SCA` đang sai phân loại bond fund nên cần thay card; tiết kiệm cần snapshot collector/backfill, không vẽ 6/12/18 tháng từ snapshot hiện tại.
