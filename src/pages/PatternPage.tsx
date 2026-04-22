import React, { useEffect, useState } from 'react';
import { Layers, Search } from 'lucide-react';
import { patternApi } from '../api/client';

const EDGE_COLORS: Record<string, string> = {
  emerging: 'tag-blue', validated: 'tag-green', weakening: 'tag-yellow', retired: 'tag-red'
};
const REGIME_COLORS: Record<string, string> = {
  trending_bull: '#10b981', trending_bear: '#ef4444', mean_reverting: '#8b5cf6',
  high_volatility: '#f59e0b', low_volatility: '#06b6d4', breakout: '#3b82f6', consolidation: '#6b7280'
};

export default function PatternPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [filter, setFilter] = useState({ regime: '', edgeState: '' });

  const load = () => {
    setLoading(true);
    patternApi.getAll(filter).then(p => { setPatterns(p); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  const selectPattern = async (p: any) => {
    setSelected(p);
    const s = await patternApi.getSimilar(p.id);
    setSimilar(s);
  };

  const FeatureBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.abs(value) / max * 100)}%`, background: value >= 0 ? 'var(--accent)' : 'var(--red)', borderRadius: 2 }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Pattern List */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Pattern Library</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" style={{ width: 160 }} value={filter.regime} onChange={e => setFilter(f => ({ ...f, regime: e.target.value }))}>
              <option value="">All Regimes</option>
              {['trending_bull','trending_bear','mean_reverting','high_volatility','low_volatility','breakout','consolidation'].map(r =>
                <option key={r} value={r}>{r.split('_').join(' ')}</option>)}
            </select>
            <select className="input" style={{ width: 140 }} value={filter.edgeState} onChange={e => setFilter(f => ({ ...f, edgeState: e.target.value }))}>
              <option value="">All States</option>
              {['emerging','validated','weakening','retired'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : patterns.length === 0 ? (
          <div className="empty-state">
            <Layers size={32} />
            No patterns found. Run a backtest to extract patterns.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {patterns.map(p => (
              <div key={p.id} className="card" onClick={() => selectPattern(p)}
                style={{ cursor: 'pointer', border: `1px solid ${selected?.id === p.id ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`, transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, flex: 1, marginRight: 8 }}>{p.name}</div>
                  <span className={`tag ${EDGE_COLORS[p.edgeState]}`}>{p.edgeState}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGIME_COLORS[p.regime], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p.regime.split('_').join(' ')} · {p.asset}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                  {[
                    { label: 'Win Rate', value: `${p.winRate}%`, good: p.winRate > 55 },
                    { label: 'Avg Ret', value: `${p.avgReturn}%`, good: p.avgReturn > 0 },
                    { label: 'Sharpe', value: p.rollingSharpe, good: p.rollingSharpe > 0.5 },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--bg)', borderRadius: 4, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{stat.label}</div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: stat.good ? 'var(--green)' : 'var(--red)' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                  <span>{p.tradeCount} trades</span>
                  <span>Decay: {p.hitRateDecay}%</span>
                  <span>Last: {p.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pattern Detail */}
      {selected && (
        <div style={{ width: 320, flexShrink: 0, overflow: 'auto', padding: 20, background: 'var(--bg2)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>{selected.description}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`tag ${EDGE_COLORS[selected.edgeState]}`}>{selected.edgeState}</span>
              <span className="tag tag-gray">{selected.asset}</span>
            </div>
          </div>

          <div className="section-title">Feature Profile</div>
          <div style={{ marginBottom: 16 }}>
            {Object.entries(selected.features).map(([key, val]: [string, any]) => (
              <FeatureBar key={key} label={key.split('_').join(' ')} value={val} max={key === 'win_rate' ? 100 : key.includes('sharpe') ? 3 : 10} />
            ))}
          </div>

          <div className="section-title">Pattern Lifecycle</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {['emerging', 'validated', 'weakening', 'retired'].map(state => (
              <div key={state} style={{
                flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 4, fontSize: 9,
                fontFamily: 'var(--mono)', textTransform: 'uppercase',
                background: selected.edgeState === state ? (EDGE_COLORS[state].includes('green') ? 'rgba(16,185,129,0.15)' : EDGE_COLORS[state].includes('blue') ? 'rgba(59,130,246,0.15)' : EDGE_COLORS[state].includes('yellow') ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--bg)',
                color: selected.edgeState === state ? 'var(--text)' : 'var(--text3)',
                border: `1px solid ${selected.edgeState === state ? 'var(--border2)' : 'var(--border)'}`,
              }}>{state}</div>
            ))}
          </div>

          {similar.length > 0 && (
            <>
              <div className="section-title">Similar Patterns</div>
              {similar.map((s: any) => (
                <div key={s.patternId} className="card" style={{ marginBottom: 8, padding: 12, cursor: 'pointer' }} onClick={() => selectPattern(s.pattern)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, flex: 1, marginRight: 6 }}>{s.pattern.name}</div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cyan)' }}>{(s.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${s.similarity * 100}%`, background: 'var(--cyan)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
