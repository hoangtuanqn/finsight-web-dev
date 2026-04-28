# Logic Reference: Advanced Investment Advisor Algorithms

> Tài liệu kỹ thuật — Cơ sở toán học và thuật toán
> Đi kèm: `PLAN-investment-advisor-upgrade.md`

---

## 1. Mean-Variance Optimization (Markowitz 1952)

### Bài toán tối ưu

```
maximize    U(w) = w^T μ − (λ/2) w^T Σ w

subject to:
  Σ w_i = 1           (fully invested)
  w_i >= lb_i          (lower bound)
  w_i <= ub_i          (upper bound)
```

**Trong đó:**
- `w` = vector trọng số [5×1] (savings, gold, stocks, bonds, crypto)
- `μ` = vector expected annual returns [5×1] (từ historical data)
- `Σ` = covariance matrix [5×5] (từ historical data)
- `λ` = risk aversion coefficient (từ riskLevel)

### Gradient

```
∂U/∂w = μ − λ Σ w
```

### Projected Gradient Ascent

```
for iter = 1..maxIter:
  g = μ_adj − λ × (Σ × w)           // gradient
  w = w + α × g                       // step
  w = clamp(w, lb, ub)                // box constraints
  w = w / sum(w)                       // normalize
  if ||w_new - w_old|| < ε: break     // convergence
```

### Sentiment Integration (Black-Litterman style)

Thay vì sửa weights trực tiếp (overlay cũ), sentiment điều chỉnh **expected returns**:

```
μ_adj[stocks] = μ[stocks] × sentimentMultiplier[stocks]
μ_adj[crypto] = μ[crypto] × sentimentMultiplier[crypto]
```

Multipliers:
| Sentiment | Stocks | Crypto |
|-----------|--------|--------|
| EXTREME_FEAR | 0.85 | 0.80 |
| FEAR | 0.92 | 0.90 |
| NEUTRAL | 1.00 | 1.00 |
| GREED | 1.05 | 1.05 |
| EXTREME_GREED | 1.08 | 1.10 |

**Lý do:** Khi thị trường sợ hãi, expected returns thấp hơn → optimizer tự giảm weight rủi ro. Elegant hơn overlay ad-hoc.

---

## 2. Monte Carlo Simulation (GBM)

### Geometric Brownian Motion (discrete)

```
S(t+Δt) = S(t) × exp((μ − σ²/2)Δt + σ√Δt × Z)
```

Với Δt = 1/12 (monthly), Z ~ N(0,1)

### Correlated Returns via Cholesky

Khi có nhiều assets có tương quan, dùng **Cholesky decomposition**:

```
Σ = L × L^T    (L = lower triangular)

Z_independent = [Z1, Z2, ..., Z5]    (independent standard normals)
Z_correlated  = L × Z_independent     (correlated normals)
```

**Cholesky–Banachiewicz Algorithm:**
```
for i = 0..n-1:
  for j = 0..i:
    sum = Σ(L[i][k] × L[j][k], k=0..j-1)
    if i == j:
      L[i][j] = sqrt(A[i][i] - sum)
    else:
      L[i][j] = (A[i][j] - sum) / L[j][j]
```

### Box-Muller Transform (Standard Normal Generator)

```
U1, U2 ~ Uniform(0, 1)
Z = sqrt(-2 × ln(U1)) × cos(2π × U2)
```

### Percentile Interpretation

| Percentile | Ý nghĩa | Dùng cho |
|------------|---------|----------|
| P5 | 95% chance bạn kiếm được ít nhất mức này | Pessimistic scenario |
| P25 | 75% chance | Conservative estimate |
| P50 (Median) | Kết quả "nhiều khả năng nhất" | Base scenario |
| P75 | 25% chance đạt hoặc vượt | Optimistic estimate |
| P95 | 5% chance (kịch bản thuận lợi) | Best case |

---

## 3. Risk Metrics

### Sharpe Ratio (Sharpe 1966)

```
SR = (R_p - R_f) / σ_p
```

| SR Value | Đánh giá |
|----------|----------|
| > 1.0 | Xuất sắc |
| 0.5 - 1.0 | Tốt |
| 0.2 - 0.5 | Trung bình |
| < 0.2 | Kém |

### Value at Risk — VaR (Jorion 2006)

```
VaR(95%) = Capital - Percentile_5(SimulationResults)
```

Ý nghĩa: "Trong 95% trường hợp, bạn sẽ không mất quá VaR đồng trong 1 năm."

### Conditional VaR / Expected Shortfall (Rockafellar & Uryasev 2000)

```
CVaR(95%) = Capital - Mean(Results where Result < VaR_threshold)
```

Ý nghĩa: "Nếu rủi ro xảy ra (5% worst case), trung bình bạn sẽ mất CVaR đồng."

CVaR luôn ≥ VaR vì nó đo **severity** của tail risk, không chỉ threshold.

### Maximum Drawdown

```
Drawdown_t = (Peak_t - Trough_t) / Peak_t
MaxDrawdown = max(Drawdown_t) over all t
```

Tính từ monthly snapshots của Monte Carlo paths (sample 500 paths).

---

## 4. Covariance Matrix Estimation

### Log Returns

```
r_t = ln(P_t / P_{t-1})
```

Ưu điểm so với simple returns: tính cộng (additive), xấp xỉ normal distribution tốt hơn.

### Sample Covariance

```
R = [r1 - μ1, r2 - μ2, ..., r5 - μ5]    (demeaned returns matrix, n×5)
Σ = R^T × R / (n - 1)
```

### Correlation từ Covariance

```
ρ_ij = Σ_ij / (σ_i × σ_j)
```

### Annualization

```
μ_annual = μ_monthly × 12
σ_annual = σ_monthly × √12
Σ_annual = Σ_monthly × 12
```

---

## 5. References

1. Markowitz, H. (1952). "Portfolio Selection." *Journal of Finance*, 7(1), 77-91.
2. Black, F. & Litterman, R. (1992). "Global Portfolio Optimization." *Financial Analysts Journal*, 48(5), 28-43.
3. Sharpe, W. (1966). "Mutual Fund Performance." *Journal of Business*, 39(1), 119-138.
4. Sharpe, W. (1994). "The Sharpe Ratio." *Journal of Portfolio Management*, 21(1), 49-58.
5. Jorion, P. (2006). *Value at Risk: The New Benchmark for Managing Financial Risk*. McGraw-Hill.
6. Rockafellar, R.T. & Uryasev, S. (2000). "Optimization of Conditional Value-at-Risk." *Journal of Risk*, 2(3), 21-42.
7. Glasserman, P. (2004). *Monte Carlo Methods in Financial Engineering*. Springer.
8. He, G. & Litterman, R. (1999). "The Intuition Behind Black-Litterman Model Portfolios." Goldman Sachs.
9. Magdon-Ismail, M. et al. (2004). "On the Maximum Drawdown of a Brownian Motion." *Journal of Applied Probability*, 41(1), 147-161.
