/**
 * pages/PortfolioPage.tsx
 * Drop into: frontend/src/pages/PortfolioPage.tsx
 */

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

interface Allocation { strategyId: string; symbol: string; weight: number; nativeRegime: string; }

const REGIMES = ['', 'trending_bull', 'trending_bear', 'mean_reverting', 'high_volatility', 'low_volatility', 'consolidation'];
const REGIME_COLORS: Record<string, string> = {
  trending_bull: '#10b981', trending_bear: '#ef4444', mean_reverting: '#8b5cf6',
  high_volatility: '#f59e0b', low_volatility: '#06b6d4', consolidation: '#6b7280'
};

export default function PortfolioPage() {
  const [strategies, setStrategies]   = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([
    { strategyId: '', symbol: 'SPY', weight: 0.5, nativeRegime: 'trending_bull' },
    { strategyId: '', symbol: 'QQQ', weight: 0.5, nativeRegime: 'mean_reverting' },
  ]);
  const [config, setConfig] = useState({
    name: 'My Portfolio', startDate: '2020-01-01', endDate: '2024-12-31',
    initialCapital: 100000, slippageBps: 5, commissionBps: 10, rebalanceDays: 20,
  });
  const [result, setResult]   = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [error, setError]     = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/strategy').then(r => {
      setStrategies(r.data);
      if (r.data.length >= 2) {
        setAllocations(a => a.map((al, i) => ({ ...al, strategyId: r.data[Math.min(i, r.data.length-1)].id })));
      }
    });
    axios.get('/api/portfolio/runs').then(r => setHistory(r.data));
  }, []);

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const weightValid = Math.abs(totalWeight - 1) < 0.01;

  const updateAlloc = (i: number, field: string, val: any) => {
    setAllocations(a => a.map((al, idx) => idx === i ? { ...al, [field]: val } : al));
  };
  const addAlloc = () => setAllocations(a => [...a, { strategyId: strategies[0]?.id || '', symbol: 'GLD', weight: 0, nativeRegime: '' }]);
  const removeAlloc = (i: number) => setAllocations(a => a.filter((_, idx) => idx !== i));

  const run = async () => {
    if (!weightValid) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const r = await axios.post('/api/portfolio/run', { ...config, allocations });
      setResult(r.data);
      axios.get('/api/portfolio/runs').then(r => setHistory(r.data));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Portfolio run failed');
    } finally { setRunning(false); }
  };

  const StatBox = ({ label, value, color }: any) => (
    <div className="stat-card">
      <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: color || 'var(--text)' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Portfolio Engine</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Run multiple strategies on multiple assets simultaneously. Capital shifts toward strategies
        whose native regime matches the current detected market regime.
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Portfolio Settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label>Portfolio Name</label>
            <input className="input" value={config.name}
              onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} />
          </div>
          <div>
            <label>Start Date</label>
            <input className="input" type="date" value={config.startDate}
              onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))} />
          </div>
          <div>
            <label>End Date</label>
            <input className="input" type="date" value={config.endDate}
              onChange={e => setConfig(c => ({ ...c, endDate: e.target.value }))} />
          </div>
          <div>
            <label>Initial Capital</label>
            <input className="input" type="number" value={config.initialCapital}
              onChange={e => setConfig(c => ({ ...c, initialCapital: +e.target.value }))} />
          </div>
          <div>
            <label>Rebalance Every (days)</label>
            <input className="input" type="number" value={config.rebalanceDays}
              onChange={e => setConfig(c => ({ ...c, rebalanceDays: +e.target.value }))} />
          </div>
          <div>
            <label>Slippage (bps)</label>
            <input className="input" type="number" value={config.slippageBps}
              onChange={e => setConfig(c => ({ ...c, slippageBps: +e.target.value }))} />
          </div>
          <div>
            <label>Commission (bps)</label>
            <input className="input" type="number" value={config.commissionBps}
              onChange={e => setConfig(c => ({ ...c, commissionBps: +e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Allocations */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Strategy Allocations</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: weightValid ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
              Total weight: {totalWeight.toFixed(2)} {weightValid ? '✓' : '≠ 1.0'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={addAlloc}><Plus size={12} /> Add</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '0 4px' }}>
          <div style={{ flex: 2, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Strategy</div>
          <div style={{ flex: 1, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Symbol</div>
          <div style={{ flex: 1, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Weight</div>
          <div style={{ flex: 2, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Native Regime (for boost)</div>
          <div style={{ width: 32 }} />
        </div>
        {allocations.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ flex: 2 }}>
              <select className="input" value={a.strategyId}
                onChange={e => updateAlloc(i, 'strategyId', e.target.value)}>
                <option value="">Select strategy...</option>
                {strategies.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <input className="input" value={a.symbol}
                onChange={e => updateAlloc(i, 'symbol', e.target.value.toUpperCase())} />
            </div>
            <div style={{ flex: 1 }}>
              <input className="input" type="number" step="0.05" min={0} max={1} value={a.weight}
                onChange={e => updateAlloc(i, 'weight', +e.target.value)} />
            </div>
            <div style={{ flex: 2 }}>
              <select className="input" value={a.nativeRegime}
                onChange={e => updateAlloc(i, 'nativeRegime', e.target.value)}>
                <option value="">No regime boost</option>
                {REGIMES.filter(r => r).map(r => <option key={r} value={r}>{r.split('_').join(' ')}</option>)}
              </select>
            </div>
            {allocations.length > 1 && (
              <button className="btn btn-danger btn-sm" onClick={() => removeAlloc(i)}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
        {error && <div className="alert-box alert-error" style={{ margin: '8px 0' }}>{error}</div>}
        <button className="btn btn-primary" style={{ marginTop: 8 }}
          onClick={run} disabled={running || !weightValid || allocations.some(a => !a.strategyId)}>
          {running ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Running portfolio...</> : <><Play size={14} /> Run Portfolio</>}
        </button>
      </div>

      {result && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatBox label="Total Return"  value={`${result.totalReturn}%`}
              color={result.totalReturn > 0 ? 'var(--green)' : 'var(--red)'} />
            <StatBox label="Sharpe Ratio"  value={result.sharpe}
              color={result.sharpe > 1 ? 'var(--green)' : result.sharpe > 0 ? 'var(--yellow)' : 'var(--red)'} />
            <StatBox label="Sortino Ratio" value={result.sortino} color="var(--cyan)" />
            <StatBox label="Max Drawdown"  value={`${result.maxDrawdown}%`} color="var(--red)" />
          </div>

          {/* Equity + strategy breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="section-title">Portfolio Equity Curve</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.equityCurve.filter((_: any, i: number) => i % 3 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Portfolio']} />
                  <Area type="monotone" dataKey="equity" stroke="var(--accent)" fill="rgba(59,130,246,0.1)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Strategy Contributions (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.strategyResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="symbol" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}
                    formatter={(v: any) => [`${v}%`, 'Contribution']} />
                  <Bar dataKey="contribution" fill="var(--accent)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy table */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Individual Strategy Performance</div>
            <table>
              <thead>
                <tr><th>Symbol</th><th>Sharpe</th><th>Win Rate</th><th>Total Return</th><th>Max DD</th><th>Trades</th><th>Contribution</th></tr>
              </thead>
              <tbody>
                {result.strategyResults.map((sr: any) => (
                  <tr key={sr.symbol + sr.strategyId}>
                    <td className="mono">{sr.symbol}</td>
                    <td className={sr.sharpe > 0 ? 'positive' : 'negative'}><span className="mono">{sr.sharpe}</span></td>
                    <td><span className="mono">{sr.winRate}%</span></td>
                    <td className={sr.totalReturn > 0 ? 'positive' : 'negative'}><span className="mono">{sr.totalReturn}%</span></td>
                    <td className="negative"><span className="mono">{sr.maxDrawdown}%</span></td>
                    <td><span className="mono">{sr.tradeCount}</span></td>
                    <td className={sr.contribution > 0 ? 'positive' : 'negative'}><span className="mono">{sr.contribution}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Correlation matrix */}
          <div className="card">
            <div className="section-title">Return Correlation Matrix</div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(result.correlationMatrix).map(([symA, row]: [string, any]) => (
                Object.entries(row).map(([symB, corr]: [string, any]) => {
                  const c = parseFloat(corr);
                  const bg = c > 0.7 ? 'rgba(239,68,68,0.3)' : c > 0.3 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)';
                  return (
                    <div key={`${symA}-${symB}`} style={{
                      padding: '8px 12px', borderRadius: 4, background: bg,
                      textAlign: 'center', minWidth: 80,
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)' }}>{symA} / {symB}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{c.toFixed(2)}</div>
                    </div>
                  );
                })
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              Green = low correlation (good diversification) · Red = high correlation (no diversification benefit)
            </div>
          </div>
        </>
      )}

      {/* History */}
      {history.length > 0 && !result && (
        <div className="card">
          <div className="section-title">Recent Portfolio Runs</div>
          <table>
            <thead><tr><th>Period</th><th>Capital</th><th>Return</th><th>Sharpe</th><th>Max DD</th><th>Run At</th></tr></thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{h.start_date} → {h.end_date}</td>
                  <td className="mono">${parseFloat(h.initial_capital).toLocaleString()}</td>
                  <td className={parseFloat(h.total_return) > 0 ? 'positive' : 'negative'}><span className="mono">{parseFloat(h.total_return).toFixed(2)}%</span></td>
                  <td className={parseFloat(h.sharpe) > 1 ? 'positive' : 'neutral'}><span className="mono">{parseFloat(h.sharpe).toFixed(2)}</span></td>
                  <td className="negative"><span className="mono">{parseFloat(h.max_drawdown).toFixed(1)}%</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{new Date(h.run_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
