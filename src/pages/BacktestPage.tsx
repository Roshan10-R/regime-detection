import React, { useEffect, useState } from 'react';
import { Play, ChevronDown } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { strategyApi, backtestApi } from '../api/client';

const SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'BTC', 'GLD', 'SIM'];
const COLORS: Record<string, string> = {
  trending_bull: '#10b981', trending_bear: '#ef4444', mean_reverting: '#8b5cf6',
  high_volatility: '#f59e0b', low_volatility: '#06b6d4', breakout: '#3b82f6', consolidation: '#6b7280'
};

export default function BacktestPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({
    strategyId: '', symbol: 'SIM', startDate: '2020-01-01', endDate: '2024-12-31',
    initialCapital: 100000, slippageBps: 5, commissionBps: 10
  });

  useEffect(() => {
    strategyApi.getAll().then(s => { setStrategies(s); if (s.length) setConfig(c => ({ ...c, strategyId: s[0].id })); });
    backtestApi.getAll().then(setResults);
  }, []);

  const run = async () => {
    if (!config.strategyId) return;
    setRunning(true); setError('');
    try {
      const r = await backtestApi.run(config);
      setResult(r);
      backtestApi.getAll().then(setResults);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Backtest failed');
    } finally { setRunning(false); }
  };

  const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <div className="stat-card">
      <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: color || 'var(--text)' }}>{value}</div>
    </div>
  );

  const stats = result?.stats;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Backtesting Engine</div>

      {/* Config */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Backtest Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label>Strategy</label>
            <select className="input" value={config.strategyId} onChange={e => setConfig(c => ({ ...c, strategyId: e.target.value }))}>
              <option value="">Select strategy...</option>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Symbol</label>
            <select className="input" value={config.symbol} onChange={e => setConfig(c => ({ ...c, symbol: e.target.value }))}>
              {SYMBOLS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Start Date</label>
            <input className="input" type="date" value={config.startDate} onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))} />
          </div>
          <div>
            <label>End Date</label>
            <input className="input" type="date" value={config.endDate} onChange={e => setConfig(c => ({ ...c, endDate: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div>
            <label>Initial Capital ($)</label>
            <input className="input" type="number" value={config.initialCapital} onChange={e => setConfig(c => ({ ...c, initialCapital: +e.target.value }))} />
          </div>
          <div>
            <label>Slippage (bps)</label>
            <input className="input" type="number" value={config.slippageBps} onChange={e => setConfig(c => ({ ...c, slippageBps: +e.target.value }))} />
          </div>
          <div>
            <label>Commission (bps)</label>
            <input className="input" type="number" value={config.commissionBps} onChange={e => setConfig(c => ({ ...c, commissionBps: +e.target.value }))} />
          </div>
        </div>
        {error && <div className="alert-box alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" onClick={run} disabled={running || !config.strategyId}>
          {running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
          {running ? 'Running Backtest...' : 'Run Backtest'}
        </button>
      </div>

      {/* Results */}
      {result && stats && (
        <>
          {/* Key Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatBox label="Sharpe Ratio" value={stats.sharpeRatio} color={stats.sharpeRatio > 1 ? 'var(--green)' : stats.sharpeRatio > 0 ? 'var(--yellow)' : 'var(--red)'} />
            <StatBox label="Sortino Ratio" value={stats.sortinoRatio} color="var(--cyan)" />
            <StatBox label="Calmar Ratio" value={stats.calmarRatio} color="var(--purple)" />
            <StatBox label="Max Drawdown" value={`${stats.maxDrawdown}%`} color="var(--red)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatBox label="Win Rate" value={`${stats.winRate}%`} />
            <StatBox label="Expectancy" value={`${stats.expectancy}%`} />
            <StatBox label="Profit Factor" value={stats.profitFactor} color={stats.profitFactor > 1.5 ? 'var(--green)' : 'var(--yellow)'} />
            <StatBox label="Total Trades" value={stats.totalTrades} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            <StatBox label="Deflated Sharpe" value={stats.deflatedSharpe} color={stats.deflatedSharpe > 0 ? 'var(--green)' : 'var(--red)'} />
            <StatBox label="Prob. Overfitting" value={`${(stats.probabilityOfOverfitting * 100).toFixed(1)}%`} color={stats.probabilityOfOverfitting > 0.5 ? 'var(--red)' : 'var(--green)'} />
            <StatBox label="Avg Win" value={`${stats.avgWin}%`} color="var(--green)" />
            <StatBox label="Avg Loss" value={`${stats.avgLoss}%`} color="var(--red)" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Equity Curve */}
            <div className="card">
              <div className="section-title">Equity Curve</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.equityCurve.filter((_: any, i: number) => i % 3 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, 'Equity']} />
                  <Area type="monotone" dataKey="equity" stroke="var(--accent)" fill="rgba(59,130,246,0.1)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown */}
            <div className="card">
              <div className="section-title">Drawdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.equityCurve.filter((_: any, i: number) => i % 3 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                    formatter={(v: any) => [`${v.toFixed(2)}%`, 'Drawdown']} />
                  <Area type="monotone" dataKey="drawdown" stroke="var(--red)" fill="rgba(239,68,68,0.1)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rolling Sharpe */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="section-title">Rolling Sharpe (20-trade)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.rollingSharpe.filter((_: any, i: number) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="var(--border2)" />
                  <Line type="monotone" dataKey="value" stroke="var(--cyan)" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Returns */}
            <div className="card">
              <div className="section-title">Monthly Returns</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.monthlyReturns.slice(-24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 9 }} tickFormatter={d => d.slice(2)} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                    formatter={(v: any) => [`${v}%`, 'Return']} />
                  <Bar dataKey="return" fill="var(--accent)" radius={[2, 2, 0, 0]}
                    label={false}
                    // Color bars green/red
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regime Breakdown */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Performance by Regime</div>
            <table>
              <thead>
                <tr>
                  <th>Regime</th><th>Trades</th><th>Win Rate</th><th>Avg Return</th><th>Sharpe</th><th>Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {result.regimeBreakdown.map((r: any) => (
                  <tr key={r.regime}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[r.regime] || '#6b7280', display: 'inline-block' }} />
                        {r.regime.split('_').join(' ')}
                      </span>
                    </td>
                    <td className="mono">{r.tradeCount}</td>
                    <td className={r.winRate > 50 ? 'positive' : 'negative'}><span className="mono">{r.winRate}%</span></td>
                    <td className={r.avgReturn > 0 ? 'positive' : 'negative'}><span className="mono">{r.avgReturn}%</span></td>
                    <td className={r.sharpe > 0.5 ? 'positive' : r.sharpe > 0 ? 'neutral' : 'negative'}><span className="mono">{r.sharpe}</span></td>
                    <td className={r.totalPnl > 0 ? 'positive' : 'negative'}><span className="mono">${r.totalPnl.toLocaleString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Confidence Intervals */}
          <div className="card">
            <div className="section-title">Statistical Confidence Intervals (95%)</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {stats.confidenceInterval.map((ci: any) => (
                <div key={ci.metric} style={{ flex: 1, background: 'var(--bg)', borderRadius: 5, padding: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{ci.metric}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>[</span>
                    <span style={{ color: 'var(--green)' }}>{ci.lower}</span>
                    <span style={{ color: 'var(--text3)' }}>, </span>
                    <span style={{ color: 'var(--cyan)' }}>{ci.upper}</span>
                    <span style={{ color: 'var(--text3)' }}>]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* History */}
      {results.length > 0 && !result && (
        <div className="card">
          <div className="section-title">Backtest History</div>
          <table>
            <thead><tr><th>Symbol</th><th>Period</th><th>Sharpe</th><th>Win Rate</th><th>Max DD</th><th>Trades</th></tr></thead>
            <tbody>
              {results.slice().reverse().map((b: any) => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setResult(b)}>
                  <td className="mono">{b.config?.symbol}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{b.config?.startDate} → {b.config?.endDate}</td>
                  <td className={b.stats?.sharpeRatio > 1 ? 'positive' : 'negative'}><span className="mono">{b.stats?.sharpeRatio}</span></td>
                  <td><span className="mono">{b.stats?.winRate}%</span></td>
                  <td className="negative"><span className="mono">{b.stats?.maxDrawdown}%</span></td>
                  <td><span className="mono">{b.stats?.totalTrades}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
