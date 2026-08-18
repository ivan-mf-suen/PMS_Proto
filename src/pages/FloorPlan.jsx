import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FLOOR_PLAN_ASSETS } from '../data/constants';
import { Plus, ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';

const STATUS_COLORS = {
  active: '#10B981',
  alert: '#DC2626',
  maintenance: '#F59E0B',
};

const STATUS_LABELS = {
  active: 'Operational',
  alert: 'Alert',
  maintenance: 'Maintenance',
};

const TYPE_ICONS = {
  HVAC: '❄',
  Fire: '🔥',
  Elevator: '🛗',
  Generator: '⚡',
  Pump: '💧',
  CCTV: '📷',
};

export default function FloorPlan() {
  const { permissions } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredAsset, setHoveredAsset] = useState(null);

  return (
    <div style={{ padding: 24, maxWidth: 1400, height: 'calc(100vh - 56px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Floor Plan</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Interactive asset map &middot; Kowloon East District Hub</p>
        </div>
        {permissions?.canAddMapAssets && (
          <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Asset
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 80px)' }}>
        {/* Map */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}>
          {/* Zoom Controls */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
            <button onClick={() => setZoom(Math.min(zoom + 0.2, 2))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomIn size={16} color="#475569" /></button>
            <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomOut size={16} color="#475569" /></button>
            <button onClick={() => setZoom(1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><RotateCcw size={16} color="#475569" /></button>
            <button onClick={() => setShowLegend(!showLegend)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: showLegend ? 'var(--info-bg)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Layers size={16} color={showLegend ? 'var(--info)' : '#475569'} /></button>
          </div>

          {/* Building Outline */}
          <div style={{ width: '100%', height: '100%', padding: 40, transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC' }}>
              {/* Building Grid */}
              {[20, 40, 60, 80].map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="#E2E8F0" strokeWidth={0.3} />)}
              {[20, 40, 60, 80].map((y) => <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="#E2E8F0" strokeWidth={0.3} />)}

              {/* Room Labels */}
              <text x={10} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Lobby</text>
              <text x={30} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Office A</text>
              <text x={60} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Office B</text>
              <text x={10} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Meeting</text>
              <text x={30} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Central</text>
              <text x={60} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Server</text>
              <text x={10} y={62} fill="#94A3B8" fontSize={3} fontWeight={500}>Storage</text>
              <text x={60} y={62} fill="#94A3B8" fontSize={3} fontWeight={500}>Workshop</text>

              {/* Assets */}
              {FLOOR_PLAN_ASSETS.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const isHovered = hoveredAsset?.id === asset.id;
                return (
                  <g key={asset.id}
                    onClick={() => setSelectedAsset(isSelected ? null : asset)}
                    onMouseEnter={() => setHoveredAsset(asset)}
                    onMouseLeave={() => setHoveredAsset(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={asset.x} cy={asset.y}
                      r={isSelected ? 3.5 : isHovered ? 3.2 : 2.5}
                      fill={STATUS_COLORS[asset.status]}
                      stroke={isSelected ? '#0B132B' : '#fff'}
                      strokeWidth={isSelected ? 0.8 : 0.4}
                      opacity={0.9}
                    />
                    <circle cx={asset.x} cy={asset.y} r={2.5} fill="none" stroke={STATUS_COLORS[asset.status]} strokeWidth={0.3} opacity={0.4}>
                      <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <text x={asset.x} y={asset.y + 1} textAnchor="middle" fill="#fff" fontSize={1.8} fontWeight={600}>{TYPE_ICONS[asset.type]}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          {showLegend && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Asset Status</div>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[key] }} />
                  <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Asset Details */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Asset Details</div>
            {selectedAsset ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: STATUS_COLORS[selectedAsset.status] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {TYPE_ICONS[selectedAsset.type]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{selectedAsset.label}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{selectedAsset.type}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[selectedAsset.status], marginTop: 2 }}>{STATUS_LABELS[selectedAsset.status]}</div>
                  </div>
                  <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Type</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{selectedAsset.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>View History</button>
                  <button style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Create WO</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Click an asset on the map to view details</div>
            )}
          </div>

          {/* Asset List */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>All Assets ({FLOOR_PLAN_ASSETS.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FLOOR_PLAN_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  style={{
                    padding: 10, borderRadius: 8, cursor: 'pointer',
                    border: selectedAsset?.id === asset.id ? '1px solid var(--info)' : '1px solid var(--border)',
                    background: selectedAsset?.id === asset.id ? 'var(--info-bg)' : '#F8FAFC',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[asset.status], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{asset.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{asset.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
