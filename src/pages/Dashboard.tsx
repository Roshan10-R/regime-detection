import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, Layers, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import { strategyApi, backtestApi, patternApi, monitoringApi } from '../api/client';

type Page = 'dashboard' | 'strategy' | 'backtest' | 'regime' | 'patterns' | 'monitoring';

interface Props { onNavigate: (p: Page) => void; }

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState({ strategies: 0, backtests: 0, patterns: 0, alerts: 0 });
  const [recentBacktests, setRecentBacktests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      strategyApi.getAll(),
      backtestApi.getAll(),
      patternApi.getAll(),
      monitoringApi.getAlerts()
    ]).then(([s, b, p, a]) => {
      setStats({ strategies: s.length, backtests: b.length, patterns: p.length, alerts: a.filter((x: any) => !x.acknowledged).length });
      setRecentBacktests(b.slice(-5).reverse());
    }).finally(() => setLoading(false));
  }, []);

  const CARDS = [
    { label: 'Strategies', value: stats.strategies, icon: BarChart2, color: 'var(--accent)', page: 'strategy' as Page },
    { label: 'Backtests Run', value: stats.backtests, icon: Activity, color: 'var(--green)', page: 'backtest' as Page },
    { label: 'Patterns', value: stats.patterns, icon: Layers, color: 'var(--purple)', page: 'patterns' as Page },
    { label: 'Active Alerts', value: stats.alerts, icon: Bell, color: 'var(--yellow)', page: 'monitoring' as Page },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Research Dashboard</div>
        <div style={{ color: 'var(--text2)', fontSize: 12 }}>Regime-Aware Strategy Simulation & Pattern Intelligence Platform</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate(card.page)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                <Icon size={15} color={card.color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--mono)', color: card.color }}>
                {loading ? '—' : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('strategy')}>
              <BarChart2 size={14} /> Create New Strategy
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('backtest')}>
              <Activity size={14} /> Run Backtest
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('regime')}>
              <TrendingUp size={14} /> Detect Market Regime
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('monitoring')}>
              <Bell size={14} /> Check Alerts
            </button>
          </div>
        </div>

        {/* System philosophy */}
        <div className="card">
          <div className="section-title">System Philosophy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Markets are non-stationary', desc: 'Regime-aware evaluation at all times' },
              { label: 'Statistical rigor first', desc: 'Deflated Sharpe, PBO, confidence intervals' },
              { label: 'Pattern over prediction', desc: 'Edge states: Emerging → Validated → Retired' },
              { label: 'Robustness by design', desc: 'Walk-forward, Monte Carlo, out-of-sample' },
            ].map(item => (
              <div key={item.label} style={{ padding: '8px', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Backtests */}
      <div className="card">
        <div className="section-title">Recent Backtests</div>
        {recentBacktests.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <Activity size={24} />
            No backtests yet. Run your first backtest to see results.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Strategy</th><th>Symbol</th><th>Period</th><th>Sharpe</th><th>Win Rate</th><th>Trades</th><th>Max DD</th>
              </tr>
            </thead>
            <tbody>
              {recentBacktests.map((b: any) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.config?.symbol}</td>
                  <td><span className="mono">{b.config?.symbol}</span></td>
                  <td style={{ color: 'var(--text2)', fontSize: 11 }}>{b.config?.startDate} → {b.config?.endDate}</td>
                  <td className={b.stats?.sharpeRatio > 1 ? 'positive' : b.stats?.sharpeRatio > 0 ? 'neutral' : 'negative'}>
                    <span className="mono">{b.stats?.sharpeRatio?.toFixed(2)}</span>
                  </td>
                  <td><span className="mono">{b.stats?.winRate?.toFixed(1)}%</span></td>
                  <td><span className="mono">{b.stats?.totalTrades}</span></td>
                  <td className="negative"><span className="mono">{b.stats?.maxDrawdown?.toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
