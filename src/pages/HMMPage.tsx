/**
 * pages/HMMPage.tsx
 * Drop into: frontend/src/pages/HMMPage.tsx
 */

import React, { useState, useEffect } from 'react';
import { Brain, Play } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import axios from 'axios';

const REGIME_COLORS: Record<string, string> = {
  trending_bull: '#10b981', trending_bear: '#ef4444',
  mean_reverting: '#8b5cf6', high_volatility: '#f59e0b',
  low_volatility: '#06b6d4', consolidation: '#6b7280', breakout: '#3b82f6',
};

export default function HMMPage() {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels]   = useState<any[]>([]);
  const [error, setError]     = useState('');
  const [params, setParams]   = useState({
    symbol: 'SPY', startDate: '2020-01-01', endDate: '2024-12-31', nStates: 4,
  });

  useEffect(() => {
    axios.get('/api/hmm/models').then(r => setModels(r.data)).catch(() => {});
  }, []);

  const fit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await axios.post('/api/hmm/fit', params);
      setResult(r.data);
      axios.get('/api/hmm/models').then(r => setModels(r.data));
    } catch (e: any) {
      setError(e.response?.data?.error || 'HMM fitting failed');
    } finally { setLoading(false); }
  };

  // Merge price + regime labels for chart
  const chartData = result?.priceChart?.map((p: any, i: number) => ({
    ...p,
    regime: result.regimeLabels[i] || 'consolidation',
  })) || [];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={18} color="var(--purple)" /> HMM Regime Detection
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Hidden Markov Model learns regime structure from price data.
        Outputs probabilistic regime assignments — softer, more accurate transitions than rule-based detection.
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Model Parameters</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label>Symbol</label>
            <input className="input" style={{ width: 120 }} value={params.symbol}
              onChange={e => setParams(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label>Start Date</label>
            <input className="input" type="date" value={params.startDate}
              onChange={e => setParams(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div>
            <label>End Date</label>
            <input className="input" type="date" value={params.endDate}
              onChange={e => setParams(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <div>
            <label>Hidden States (N)</label>
            <select className="input" style={{ width: 80 }} value={params.nStates}
              onChange={e => setParams(p => ({ ...p, nStates: +e.target.value }))}>
              {[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fit} disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Fitting HMM...</> : <><Play size={14} /> Fit HMM</>}
          </button>
        </div>
        {error && <div className="alert-box alert-error" style={{ marginTop: 12 }}>{error}</div>}
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 5, fontSize: 11, color: 'var(--text2)' }}>
          Note: HMM fitting runs Baum-Welch EM algorithm in TypeScript. May take 5–15 seconds for large datasets.
        </div>
      </div>

      {result && (
        <>
          {/* Model quality */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'States Fitted', value: result.nStates },
              { label: 'Log-Likelihood', value: result.model.logLikelihood?.toFixed(1) },
              { label: 'AIC', value: result.model.aic?.toFixed(1) },
              { label: 'Total Bars', value: result.totalBars },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Price chart with HMM regime overlay */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Price Series with HMM Regime Labels ({result.dataSource})</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {Object.entries(REGIME_COLORS).map(([r, c]) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text2)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  {r.split('_').join(' ')}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(0,7)} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}
                  formatter={(v: any, _: any, p: any) => [`$${Number(v).toFixed(2)}  [${p.payload?.regime?.split('_').join(' ')}]`, 'Close']}
                />
                {result.segments?.map((seg: any, i: number) => (
                  <ReferenceArea key={i} x1={seg.startDate} x2={seg.endDate}
                    fill={REGIME_COLORS[seg.label] || '#6b7280'} fillOpacity={0.07} />
                ))}
                <Area type="monotone" dataKey="close" stroke="var(--accent)" fill="rgba(59,130,246,0.07)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* State properties */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Learned State Properties</div>
            <table>
              <thead>
                <tr><th>State</th><th>Regime Label</th><th>Mean Return</th><th>Volatility</th><th>Interpretation</th></tr>
              </thead>
              <tbody>
                {result.model.states?.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="mono">S{i}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGIME_COLORS[s.label] || '#6b7280', display: 'inline-block' }} />
                        {s.label?.split('_').join(' ')}
                      </span>
                    </td>
                    <td className={s.mean > 0 ? 'positive' : 'negative'}>
                      <span className="mono">{(s.mean * 100).toFixed(4)}%</span>
                    </td>
                    <td><span className="mono">{(Math.sqrt(s.variance * 252) * 100).toFixed(1)}% ann.</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {s.mean > 0.0003 ? 'Sustained uptrend' : s.mean < -0.0003 ? 'Sustained downtrend' :
                       Math.sqrt(s.variance) > 0.02 ? 'High volatility regime' : 'Low volatility / consolidation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transition matrix */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Transition Matrix — P(next state | current state)</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>From \ To</th>
                    {result.model.states?.map((_: any, j: number) => <th key={j}>S{j} ({result.model.states[j]?.label?.split('_')[0]})</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.model.transitionMatrix?.map((row: number[], i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>S{i} ({result.model.states[i]?.label?.split('_')[0]})</td>
                      {row.map((p: number, j: number) => (
                        <td key={j} style={{
                          background: i === j ? `rgba(59,130,246,${p * 0.4})` : `rgba(239,68,68,${(1-p) * 0.1})`,
                          fontFamily: 'var(--mono)', fontSize: 12,
                          color: p > 0.5 ? 'var(--accent)' : 'var(--text)',
                        }}>
                          {(p * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              Diagonal = probability of staying in current regime. Off-diagonal = transition probability.
            </div>
          </div>

          {/* Segments */}
          <div className="card">
            <div className="section-title">HMM Regime Segments ({result.segments?.length})</div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <table>
                <thead><tr><th>Regime</th><th>Start</th><th>End</th><th>Confidence</th><th>State</th></tr></thead>
                <tbody>
                  {result.segments?.map((seg: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGIME_COLORS[seg.label] || '#6b7280', flexShrink: 0 }} />
                          {seg.label?.split('_').join(' ')}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>{seg.startDate}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{seg.endDate}</td>
                      <td><span className="mono" style={{ color: 'var(--text2)' }}>{(seg.confidence * 100).toFixed(0)}%</span></td>
                      <td><span className="mono">S{seg.stateIndex}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Saved models */}
      {models.length > 0 && !result && (
        <div className="card">
          <div className="section-title">Saved HMM Models</div>
          <table>
            <thead><tr><th>Symbol</th><th>States</th><th>Log-Likelihood</th><th>AIC</th><th>Trained On</th><th>Trained At</th></tr></thead>
            <tbody>
              {models.map((m: any) => (
                <tr key={`${m.symbol}-${m.n_states}`}>
                  <td className="mono" style={{ fontWeight: 600 }}>{m.symbol}</td>
                  <td className="mono">{m.n_states}</td>
                  <td className="mono">{parseFloat(m.log_likelihood || 0).toFixed(1)}</td>
                  <td className="mono">{parseFloat(m.aic || 0).toFixed(1)}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{m.trained_on_end}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{new Date(m.trained_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
