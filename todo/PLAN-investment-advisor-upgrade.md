# PLAN: Nâng cấp Thuật toán Cố vấn Đầu tư — Research-Backed

> **Ngày tạo:** 2026-04-26
> **Deadline:** 2 tuần (backend logic) + 1 tuần (UI)
> **Status:** 🟡 In progress — P1/P2 đã commit, P3 Monte Carlo đang thực hiện

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
| 5 Smart Asset Guide APIs (crypto/stock/gold/savings/bonds) | ✅ Giữ nguyên | Không liên quan đến allocation logic |
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
- [ ] Test: fallback khi 1 ticker fail → dataQuality = 'partial'
- [ ] Test: fallback khi tất cả fail → dataQuality = 'fallback', dùng ASSET_CLASSES
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
      - SOLVER_CONFIG: { maxIterations: 1000, learningRate: 0.01, tolerance: 1e-6 }

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

- [ ] MODIFY server/src/utils/calculations.js:
      - Thêm comment block trước getAllocation():
        // [LEGACY] Hệ thống overlay 5 lớp — đã thay thế bởi Markowitz MVO
        // Xem: server/src/services/portfolioOptimizer.service.js
        // Giữ lại để tham khảo và rollback nếu cần
      - Export mới: getOptimalAllocation (re-export từ service)

- [x] MODIFY client/src/utils/calculations.js:
      - Comment [LEGACY] tương tự (client dùng data từ API, không chạy optimizer)

- [x] Test: weights sum = 100% (tolerance < 0.5%)
- [x] Test: tất cả weights nằm trong bounds
- [ ] Test: LOW risk → savings+gold+bonds > 60%
- [x] Test: HIGH risk → stocks+crypto > 40%
- [ ] Test: sentiment FEAR → stocks allocation giảm so với NEUTRAL
- [ ] Test: convergence trong < 500 iterations
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

- [ ] Cập nhật `INVESTMENT_LOGIC.md`:
  - Section 7: "Markowitz Mean-Variance Optimization"
  - Section 8: "Monte Carlo Projection Engine"
  - Section 9: "Risk Metrics (Sharpe, VaR, CVaR)"
  - Section 10: "Luồng xử lý mới"
- [ ] Cập nhật `AI_PROJECT_CONTEXT.md`:
  - Thêm new services vào file map
  - Cập nhật dependencies (mathjs)
  - Cập nhật Investment Advisor architecture
- [ ] Comment `[LEGACY]` trong code cũ cho dễ phân biệt

---

## 10. UI Plan (Tuần 3 — chưa thực hiện)

> Kế hoạch chi tiết, thực hiện sau khi backend hoàn thiện.

### 10.1 Risk Metrics Panel (component mới)
- Hiển thị: Sharpe Ratio gauge, VaR/CVaR bars, Risk Grade badge
- Vị trí: dưới PortfolioHealthMetrics hoặc thay thế

### 10.2 Monte Carlo Chart (enhance WealthProjection)
- Fan chart: P5-P95 shaded area, P25-P75 darker, median line
- Thay thế 3-line chart hiện tại

### 10.3 Efficient Frontier Visualization (component mới)
- Scatter plot: risk (x) vs return (y)
- Highlight user's portfolio position trên frontier
- Interactive: hover để xem weights

### 10.4 Data Quality Indicator
- Badge nhỏ hiển thị: "Historical data: 5y" hoặc "Fallback mode"
- Tooltip giải thích data source

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
