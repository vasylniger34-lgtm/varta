'use client'

import React from 'react'
import { Shield, Zap, Activity, Battery, Wifi, Cpu } from 'lucide-react'

export default function MobileHomeView() {
  return (
    <div className="mobile-home-view">
      <div className="system-status-header">
        <div className="status-item">
          <Battery size={12} className="text-dim" />
          <span>98%</span>
        </div>
        <div className="status-item">
          <Wifi size={12} className="text-dim" />
          <span>LINK_STABLE</span>
        </div>
        <div className="status-item">
          <Cpu size={12} className="text-dim" />
          <span>VARTA_OS_CORE_V1.0</span>
        </div>
      </div>

      <div className="home-hero">
        <div className="hero-logo">V</div>
        <div className="hero-text">
          <h1 className="mono uppercase tracking-widest text-xl">VARTA_OS</h1>
          <p className="text-dim text-xs mono">NEURAL_INTERFACE_ACTIVE</p>
        </div>
      </div>

      <div className="home-stats-grid">
        <div className="stat-box">
          <Shield size={20} className="text-accent" />
          <div className="stat-label">PROTECTION</div>
          <div className="stat-value">ACTIVE</div>
        </div>
        <div className="stat-box">
          <Zap size={20} className="text-accent" />
          <div className="stat-label">ENERGY</div>
          <div className="stat-value">MAX</div>
        </div>
        <div className="stat-box">
          <Activity size={20} className="text-accent" />
          <div className="stat-label">COGNITIVE</div>
          <div className="stat-value">STABLE</div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <span className="card-title">System_Log</span>
        </div>
        <div className="system-log-mini mono">
          <div className="log-line"><span className="text-dim">[00:01]</span> MOBILE_OS_INITIALIZED</div>
          <div className="log-line"><span className="text-dim">[00:02]</span> AI_CORE_SYNC_COMPLETE</div>
          <div className="log-line"><span className="text-dim">[00:05]</span> BIOMETRIC_VAL_SUCCESS</div>
          <div className="log-line"><span className="text-accent"> [ALERT] </span> DAILY_MISSION_PENDING</div>
        </div>
      </div>

      <style jsx>{`
        .mobile-home-view {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .system-status-header {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: var(--text-dim);
          border-bottom: 1px solid var(--border-default);
          padding-bottom: 12px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .home-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          padding: 40px 0;
        }
        .hero-logo {
          width: 80px;
          height: 80px;
          border: 1px solid var(--accent-mid);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 900;
          color: var(--accent-bright);
          box-shadow: 0 0 30px var(--accent-glow);
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
        }
        .home-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .stat-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .stat-label {
          font-size: 8px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
        }
        .stat-value {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .system-log-mini {
          font-size: 9px;
          line-height: 1.8;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}
