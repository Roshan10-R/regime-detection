/**
 * pages/WalkForwardPage.tsx
 * Drop into: frontend/src/pages/WalkForwardPage.tsx
 */

import React, { useEffect, useState } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';

export default function WalkForwardPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [result, setResult]         = useState<any>(null);
  const [running, setRunning]       = useState(false);
  const [error, setError]           = useState('');
  const [config, setConfig] = useState({
    strategyId: '', symbol: 'SPY',
    startDate: '2019-01-01', endDate: '2024-12-31',
    nWindows: 4, initialCapital: 100000,
    slippageBps: 5, commissionBps: 10,
  });

  useEffect(() => {
    axios.get('/api/strategy').then(r => {
      setStrategies(r.data);
      if (r.data.length) setConfig(c => ({ ...c, strategyId: r.data[0].id }));
    });
  }, []);

  const run = async () => {
    if (!config.strategyId) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const r = await axios.post('/api/walkforward/run', config);
      setResult(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Walk-forward failed');
    } finally { setRunning(false); }
  };

  const verdictColor = (v: string) =>
    v === 'pass' ? 'var(--green)' : v === 'marginal' ? 'var(--yellow)' : 'var(--red)';
  const verdictIcon  = (v: string) =>
    v === 'pass' ? <CheckCircle size={16} /> : v === 'marginal' ? <AlertTriangle size={16} /> : <XCircle size={16} />;

  const StatBox = ({ label, value, color }: any) => (
    <div className="stat-card">
      <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: color || 'var(--text)' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Walk-Forward Validation</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Splits date range into N windows. Trains on preceding data, reports only out-of-sample performance.
        The honest alternative to full in-sample backtesting.
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label>Strategy</label>
            <select className="input" value={config.strategyId}
              onChange={e => setConfig(c => ({ ...c, strategyId: e.target.value }))}>
              <option value="">Select...</option>
              {strategies.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Symbol</label>
            <input className="input" value={config.symbol}
              onChange={e => setConfig(c => ({ ...c, symbol: e.target.value.toUpperCase() }))} />
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
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div>
            <label>Windows (N)</label>
            <input className="input" type="number" min={2} max={10} value={config.nWindows}
              onChange={e => setConfig(c => ({ ...c, nWindows: +e.target.value }))} />
          </div>
          <div>
            <label>Initial Capital</label>
            <input className="input" type="number" value={config.initialCapital}
              onChange={e => setConfig(c => ({ ...c, initialCapital: +e.target.value }))} />
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
        {error && <div className="alert-box alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" onClick={run} disabled={running || !config.strategyId}>
          {running ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Running {config.nWindows} windows...</> : <><Play size={14} /> Run Walk-Forward</>}
        </button>
      </div>

      {result && (
        <>
          {/* Verdict banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 8, marginBottom: 20,
            background: `${verdictColor(result.verdict)}18`,
            border: `1px solid ${verdictColor(result.verdict)}44`,
            color: verdictColor(result.verdict),
          }}>
            {verdictIcon(result.verdict)}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Verdict: {result.verdict.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {result.verdict === 'pass'     && 'OOS Sharpe > 0.5 and overfitting score < 0.4 — strategy shows genuine out-of-sample edge.'}
                {result.verdict === 'marginal' && 'Some OOS edge detected but results are inconsistent across windows — trade with reduced size.'}
                {result.verdict === 'fail'     && 'OOS performance too poor or overfitting too high — strategy likely curve-fitted to historical data.'}
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatBox label="Avg OOS Sharpe"      value={result.avgOosSharpe}
              color={result.avgOosSharpe > 0.5 ? 'var(--green)' : result.avgOosSharpe > 0 ? 'var(--yellow)' : 'var(--red)'} />
            <StatBox label="Avg IS Sharpe"        value={result.avgInSampleSharpe} color="var(--cyan)" />
            <StatBox label="Overfitting Score"    value={`${(result.overfittingScore * 100).toFixed(0)}%`}
              color={result.overfittingScore > 0.5 ? 'var(--red)' : 'var(--green)'} />
            <StatBox label="Avg OOS Win Rate"     value={`${result.avgOosWinRate}%`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            <StatBox label="Avg OOS Max DD"       value={`${result.avgOosMaxDrawdown}%`} color="var(--red)" />
            <StatBox label="Avg OOS Total Return" value={`${result.avgOosTotalReturn}%`}
              color={result.avgOosTotalReturn > 0 ? 'var(--green)' : 'var(--red)'} />
            <StatBox label="Windows"              value={`${result.nWindows} (~${result.windowSizeDays}d each)`} />
          </div>

          {/* IS vs OOS Sharpe comparison chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="section-title">In-Sample vs Out-of-Sample Sharpe per Window</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.windows} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="windowIndex" tickFormatter={v => `W${v}`} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="var(--border2)" />
                  <Bar dataKey="inSampleSharpe" name="In-Sample"     fill="var(--cyan)"   radius={[3,3,0,0]} />
                  <Bar dataKey="oosSharpe"       name="Out-of-Sample" fill="var(--accent)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Overfit Ratio per Window (OOS / IS Sharpe — ideal = 1.0)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.windows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="windowIndex" tickFormatter={v => `W${v}`} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }} />
                  <ReferenceLine y={1} stroke="var(--green)"   strokeDasharray="4 3" label={{ value: 'ideal', fill: 'var(--green)', fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="var(--border2)" />
                  <Line type="monotone" dataKey="overfitRatio" stroke="var(--yellow)" strokeWidth={2} dot={{ fill: 'var(--yellow)' }} name="Overfit Ratio" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Window table */}
          <div className="card">
            <div className="section-title">Window Details</div>
            <table>
              <thead>
                <tr>
                  <th>Window</th><th>Train Period</th><th>Test Period</th>
                  <th>IS Sharpe</th><th>OOS Sharpe</th><th>OOS Win Rate</th>
                  <th>OOS Max DD</th><th>OOS Trades</th><th>Overfit Ratio</th>
                </tr>
              </thead>
              <tbody>
                {result.windows.map((w: any) => (
                  <tr key={w.windowIndex}>
                    <td className="mono">W{w.windowIndex}</td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>{w.trainStart} → {w.trainEnd}</td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>{w.testStart}  → {w.testEnd}</td>
                    <td className="mono" style={{ color: 'var(--cyan)' }}>{w.inSampleSharpe}</td>
                    <td className="mono" style={{ color: w.oosSharpe > 0 ? 'var(--green)' : 'var(--red)' }}>{w.oosSharpe}</td>
                    <td className="mono">{w.oosWinRate}%</td>
                    <td className="mono negative">{w.oosMaxDrawdown}%</td>
                    <td className="mono">{w.oosTrades}</td>
                    <td className="mono" style={{ color: w.overfitRatio > 0.7 ? 'var(--green)' : w.overfitRatio > 0.3 ? 'var(--yellow)' : 'var(--red)' }}>
                      {w.overfitRatio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
