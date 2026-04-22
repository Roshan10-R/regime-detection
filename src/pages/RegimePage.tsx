import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { regimeApi } from '../api/client';

const REGIME_COLORS: Record<string, string> = {
  trending_bull: '#10b981', trending_bear: '#ef4444', mean_reverting: '#8b5cf6',
  high_volatility: '#f59e0b', low_volatility: '#06b6d4', breakout: '#3b82f6', consolidation: '#6b7280'
};
const REGIME_DESC: Record<string, string> = {
  trending_bull: 'Sustained upward price movement with momentum',
  trending_bear: 'Sustained downward price movement with momentum',
  mean_reverting: 'Price oscillates around a stable mean',
  high_volatility: 'Large price swings, elevated risk',
  low_volatility: 'Calm, compressed price action',
  breakout: 'Directional move from consolidation',
  consolidation: 'Sideways, range-bound movement'
};

export default function RegimePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ symbol: 'SIM', startDate: '2022-01-01', endDate: '2024-12-31' });

  const detect = async () => {
    setLoading(true);
    const r = await regimeApi.detect(params);
    setResult(r);
    setLoading(false);
  };

  // Merge regime info into price chart for coloring
  const chartData = result?.priceChart?.map((d: any) => {
    const seg = result.segments?.find((s: any) => d.date >= s.startDate && d.date <= s.endDate);
    return { ...d, regime: seg?.label || 'consolidation', regimeColor: REGIME_COLORS[seg?.label] || '#6b7280' };
  }) || [];

  // Regime summary stats
  const regimeSummary = result?.segments?.reduce((acc: any, seg: any) => {
    if (!acc[seg.label]) acc[seg.label] = { count: 0, totalDays: 0 };
    const days = Math.round((new Date(seg.endDate).getTime() - new Date(seg.startDate).getTime()) / 86400000);
    acc[seg.label].count++;
    acc[seg.label].totalDays += days;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Regime Detection Engine</div>

      {/* Config */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Detection Parameters</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Symbol</label>
            <input className="input" value={params.symbol} onChange={e => setParams(p => ({ ...p, symbol: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Start Date</label>
            <input className="input" type="date" value={params.startDate} onChange={e => setParams(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label>End Date</label>
            <input className="input" type="date" value={params.endDate} onChange={e => setParams(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={detect} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={14} />}
            {loading ? 'Detecting...' : 'Detect Regimes'}
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(REGIME_COLORS).map(([regime, color]) => (
              <div key={regime} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 4, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{regime.split('_').join(' ')}</span>
              </div>
            ))}
          </div>

          {/* Price Chart with regime background */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Price Series with Regime Labels ({result.totalBars} bars)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={d => d.slice(0, 7)} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                  formatter={(v: any, n: string, props: any) => [
                    `$${Number(v).toFixed(2)}  [${props.payload?.regime?.split('_').join(' ') || ''}]`, 'Close'
                  ]} />
                {/* Regime reference areas */}
                {result.segments?.map((seg: any, i: number) => (
                  <ReferenceArea key={i} x1={seg.startDate} x2={seg.endDate}
                    fill={REGIME_COLORS[seg.label] || '#6b7280'} fillOpacity={0.06} />
                ))}
                <Area type="monotone" dataKey="close" stroke="var(--accent)" fill="rgba(59,130,246,0.07)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Regime segments table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="section-title">Regime Segments ({result.segments?.length})</div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                <table>
                  <thead><tr><th>Regime</th><th>Start</th><th>End</th><th>Confidence</th></tr></thead>
                  <tbody>
                    {result.segments?.map((seg: any, i: number) => (
                      <tr key={i}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGIME_COLORS[seg.label], flexShrink: 0 }} />
                            <span style={{ fontSize: 11 }}>{seg.label.split('_').join(' ')}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{seg.startDate}</td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{seg.endDate}</td>
                        <td><span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{(seg.confidence * 100).toFixed(0)}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="section-title">Regime Distribution</div>
              {regimeSummary && Object.entries(regimeSummary).map(([regime, data]: [string, any]) => {
                const total = Object.values(regimeSummary).reduce((a: number, d: any) => a + d.totalDays, 0) as number;
                const pct = (data.totalDays / total * 100).toFixed(1);
                return (
                  <div key={regime} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGIME_COLORS[regime], display: 'inline-block' }} />
                        {regime.split('_').join(' ')}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)', fontSize: 11 }}>{pct}% · {data.totalDays}d</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: REGIME_COLORS[regime], borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{REGIME_DESC[regime]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
