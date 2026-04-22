import React, { useState } from 'react';
import {
  Activity, BarChart2, BookOpen, Bell,
  TrendingUp, Layers, Home, GitBranch,
  Briefcase, Send, Brain,
} from 'lucide-react';

import Dashboard       from './pages/Dashboard';
import StrategyPage    from './pages/StrategyPage';
import BacktestPage    from './pages/BacktestPage';
import RegimePage      from './pages/RegimePage';
import PatternPage     from './pages/PatternPage';
import MonitoringPage  from './pages/MonitoringPage';
import WalkForwardPage from './pages/WalkForwardPage';
import PortfolioPage   from './pages/PortfolioPage';
import BrokerPage      from './pages/BrokerPage';
import HMMPage         from './pages/HMMPage';

type Page =
  | 'dashboard' | 'strategy' | 'backtest' | 'regime'
  | 'patterns'  | 'monitoring'
  | 'walkforward' | 'portfolio' | 'broker' | 'hmm';

const NAV: { id: Page; label: string; icon: any; isNew?: boolean }[] = [
  { id: 'dashboard',   label: 'Dashboard',       icon: Home       },
  { id: 'strategy',    label: 'Strategy Builder', icon: BookOpen   },
  { id: 'backtest',    label: 'Backtesting',      icon: BarChart2  },
  { id: 'walkforward', label: 'Walk-Forward',     icon: GitBranch, isNew: true },
  { id: 'regime',      label: 'Regime Detector',  icon: TrendingUp },
  { id: 'hmm',         label: 'HMM Regimes',      icon: Brain,     isNew: true },
  { id: 'patterns',    label: 'Pattern Library',  icon: Layers     },
  { id: 'portfolio',   label: 'Portfolio Engine', icon: Briefcase, isNew: true },
  { id: 'monitoring',  label: 'Monitoring',       icon: Bell       },
  { id: 'broker',      label: 'Broker',           icon: Send,      isNew: true },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard onNavigate={setPage as any} />;
      case 'strategy':    return <StrategyPage />;
      case 'backtest':    return <BacktestPage />;
      case 'walkforward': return <WalkForwardPage />;
      case 'regime':      return <RegimePage />;
      case 'hmm':         return <HMMPage />;
      case 'patterns':    return <PatternPage />;
      case 'portfolio':   return <PortfolioPage />;
      case 'monitoring':  return <MonitoringPage />;
      case 'broker':      return <BrokerPage />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 228, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>REGIME</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>PLATFORM v3.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
          {NAV.map((item, idx) => {
            const Icon   = item.icon;
            const active = page === item.id;
            const showDivider = item.isNew && !NAV[idx - 1]?.isNew;
            return (
              <React.Fragment key={item.id}>
                {showDivider && (
                  <div style={{
                    fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '8px 10px 4px', opacity: 0.6,
                  }}>New modules</div>
                )}
                <button
                  onClick={() => setPage(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '8px 10px', borderRadius: 5,
                    background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color:  active ? 'var(--accent)' : item.isNew ? 'var(--purple)' : 'var(--text2)',
                    border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    marginBottom: 2, transition: 'all 0.15s', textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <Icon size={15} />
                  {item.label}
                  {item.isNew && !active && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--mono)',
                      background: 'rgba(139,92,246,0.2)', color: 'var(--purple)',
                      padding: '1px 5px', borderRadius: 3,
                    }}>NEW</span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          RESEARCH GRADE MVP
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {renderPage()}
      </main>
    </div>
  );
}
