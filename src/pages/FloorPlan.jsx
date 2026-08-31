import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FLOOR_PLAN_ASSETS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Image, MapPin, X, Pencil, Trash2 } from 'lucide-react';

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

const ASSET_TYPES = ['HVAC', 'Fire', 'Elevator', 'Generator', 'Pump', 'CCTV'];

const LS_KEY = 'floorPlanImage';

function getStoredImage() {
  try { return localStorage.getItem(LS_KEY) || null; } catch { return null; }
}

export default function FloorPlan() {
  const { permissions } = useAuth();
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [floorImage, setFloorImage] = useState(getStoredImage);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [pinning, setPinning] = useState(false);
  const [pinCoords, setPinCoords] = useState(null);
  const [pinForm, setPinForm] = useState({ type: 'HVAC', label: '', status: 'active' });
  const [allAssets, setAllAssets] = useState(FLOOR_PLAN_ASSETS);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ type: 'HVAC', label: '', status: 'active' });
  const [deleting, setDeleting] = useState(null);

  const nextId = useRef(allAssets.length + 1);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const handleMapContextMenu = useCallback((e) => {
    if (!permissions?.canAddMapAssets) return;
    e.preventDefault();
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setContextMenu({ x: e.clientX, y: e.clientY, mapX: x, mapY: y });
  }, [permissions]);

  const handlePinHere = useCallback(() => {
    setPinCoords({ x: contextMenu.mapX, y: contextMenu.mapY });
    setPinning(true);
    setSelectedAsset(null);
    setContextMenu(null);
  }, [contextMenu]);

  const handleSavePin = useCallback(() => {
    if (!pinForm.label.trim()) return;
    const newAsset = {
      id: `A${nextId.current++}`,
      type: pinForm.type,
      x: pinCoords.x,
      y: pinCoords.y,
      status: pinForm.status,
      label: pinForm.label.trim(),
    };
    setAllAssets((prev) => [...prev, newAsset]);
    setPinning(false);
    setPinCoords(null);
    setPinForm({ type: 'HVAC', label: '', status: 'active' });
    setSelectedAsset(newAsset);
  }, [pinForm, pinCoords]);

  const handleCancelPin = useCallback(() => {
    setPinning(false);
    setPinCoords(null);
    setPinForm({ type: 'HVAC', label: '', status: 'active' });
  }, []);

  const handleEditPin = useCallback(() => {
    if (!selectedAsset) return;
    setEditForm({ type: selectedAsset.type, label: selectedAsset.label, status: selectedAsset.status });
    setEditing(true);
  }, [selectedAsset]);

  const handleSaveEdit = useCallback(() => {
    if (!editForm.label.trim() || !selectedAsset) return;
    setAllAssets((prev) => prev.map((a) => a.id === selectedAsset.id ? { ...a, type: editForm.type, label: editForm.label.trim(), status: editForm.status } : a));
    setSelectedAsset((prev) => prev ? { ...prev, type: editForm.type, label: editForm.label.trim(), status: editForm.status } : null);
    setEditing(false);
  }, [editForm, selectedAsset]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setEditForm({ type: 'HVAC', label: '', status: 'active' });
  }, []);

  const handleDeletePin = useCallback(() => {
    if (!selectedAsset) return;
    setDeleting(selectedAsset);
  }, [selectedAsset]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleting) return;
    setAllAssets((prev) => prev.filter((a) => a.id !== deleting.id));
    setSelectedAsset(null);
    setDeleting(null);
  }, [deleting]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmUpload = () => {
    if (previewImage) {
      setFloorImage(previewImage);
      try { localStorage.setItem(LS_KEY, previewImage); } catch {}
    }
    setShowUploadModal(false);
    setPreviewImage(null);
  };

  const handleRemoveImage = () => {
    setFloorImage(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
    setShowUploadModal(false);
    setPreviewImage(null);
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setPreviewImage(null);
  };

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', outline: 'none', color: 'var(--foreground)' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 };

  return (
    <div style={{ padding: 24, maxWidth: 1400, height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('floorPlan.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Interactive asset map &middot; PLK Lee Chiu Kong Memorial Centre</p>
        </div>
        {permissions?.canEditFloorMap && (
          <button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--card-shadow)' }}>
            <Image size={16} /> Edit Floor Map
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 80px)' }}>
        {/* Map */}
        <div ref={mapRef} onContextMenu={handleMapContextMenu} style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}>
          {/* Zoom Controls */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
            <button onClick={() => setZoom(Math.min(zoom + 0.2, 2))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomIn size={16} color="#475569" /></button>
            <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomOut size={16} color="#475569" /></button>
            <button onClick={() => setZoom(1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><RotateCcw size={16} color="#475569" /></button>
            <button onClick={() => setShowLegend(!showLegend)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: showLegend ? 'var(--info-bg)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Layers size={16} color={showLegend ? 'var(--info)' : '#475569'} /></button>
          </div>

          {/* Map Content */}
          <div style={{ width: '100%', height: '100%', padding: 40, transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s', position: 'relative' }}>
            {floorImage ? (
              /* Image Mode */
              <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                <img src={floorImage} alt="Floor Plan" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                {/* Asset Pins Overlay */}
                {allAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isHovered = hoveredAsset?.id === asset.id;
                  return (
                    <div key={asset.id} onClick={() => setSelectedAsset(isSelected ? null : asset)} onMouseEnter={() => setHoveredAsset(asset)} onMouseLeave={() => setHoveredAsset(null)} style={{ position: 'absolute', left: `${asset.x}%`, top: `${asset.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: isSelected ? 5 : 2 }}>
                      <div style={{ width: isSelected ? 36 : isHovered ? 32 : 28, height: isSelected ? 36 : isHovered ? 32 : 28, borderRadius: '50%', background: STATUS_COLORS[asset.status], border: isSelected ? '2px solid #0B132B' : '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.15s' }}>
                        {TYPE_ICONS[asset.type]}
                      </div>
                      <div style={{ position: 'absolute', top: -6, right: -6, width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[asset.status], border: '1.5px solid #fff' }} />
                    </div>
                  );
                })}
                {/* Pin Preview */}
                {pinning && pinCoords && (
                  <div style={{ position: 'absolute', left: `${pinCoords.x}%`, top: `${pinCoords.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', border: '2px dashed #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(37,99,235,0.4)', animation: 'pulse 1.5s infinite' }}>
                      <MapPin size={14} color="#fff" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SVG Grid Mode (fallback) */
              <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC' }}>
                {[20, 40, 60, 80].map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="#E2E8F0" strokeWidth={0.3} />)}
                {[20, 40, 60, 80].map((y) => <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="#E2E8F0" strokeWidth={0.3} />)}
                <text x={10} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Lobby</text>
                <text x={30} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Office A</text>
                <text x={60} y={12} fill="#94A3B8" fontSize={3} fontWeight={500}>Office B</text>
                <text x={10} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Meeting</text>
                <text x={30} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Central</text>
                <text x={60} y={42} fill="#94A3B8" fontSize={3} fontWeight={500}>Server</text>
                <text x={10} y={62} fill="#94A3B8" fontSize={3} fontWeight={500}>Storage</text>
                <text x={60} y={62} fill="#94A3B8" fontSize={3} fontWeight={500}>Workshop</text>
                {allAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isHovered = hoveredAsset?.id === asset.id;
                  return (
                    <g key={asset.id} onClick={() => setSelectedAsset(isSelected ? null : asset)} onMouseEnter={() => setHoveredAsset(asset)} onMouseLeave={() => setHoveredAsset(null)} style={{ cursor: 'pointer' }}>
                      <circle cx={asset.x} cy={asset.y} r={isSelected ? 3.5 : isHovered ? 3.2 : 2.5} fill={STATUS_COLORS[asset.status]} stroke={isSelected ? '#0B132B' : '#fff'} strokeWidth={isSelected ? 0.8 : 0.4} opacity={0.9} />
                      <circle cx={asset.x} cy={asset.y} r={2.5} fill="none" stroke={STATUS_COLORS[asset.status]} strokeWidth={0.3} opacity={0.4}>
                        <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <text x={asset.x} y={asset.y + 1} textAnchor="middle" fill="#fff" fontSize={1.8} fontWeight={600}>{TYPE_ICONS[asset.type]}</text>
                    </g>
                  );
                })}
                {pinning && pinCoords && (
                  <circle cx={pinCoords.x} cy={pinCoords.y} r={3} fill="none" stroke="var(--primary)" strokeWidth={0.6} strokeDasharray="1.5 1" opacity={0.8}>
                    <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            )}
          </div>

          {/* Context Menu */}
          {contextMenu && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100, background: '#fff', borderRadius: 8, border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 4, minWidth: 180 }}>
              <button onClick={handlePinHere} style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, borderRadius: 6, border: 'none', background: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                <MapPin size={14} color="var(--primary)" /> Pin Asset Here
              </button>
            </div>
          )}

          {/* Pin Floating Popup — Super Admin only */}
          {selectedAsset && !pinning && !editing && permissions?.canAddMapAssets && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: `${selectedAsset.x}%`, top: `${selectedAsset.y}%`, transform: 'translate(-50%, calc(-100% - 22px))', zIndex: 20, background: '#fff', borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '12px 14px', minWidth: 200, pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: STATUS_COLORS[selectedAsset.status] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{TYPE_ICONS[selectedAsset.type]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{selectedAsset.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{selectedAsset.type} &middot; {STATUS_LABELS[selectedAsset.status]}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEditPin} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={handleDeletePin} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--critical)', background: '#fff', color: 'var(--critical)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--critical-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              {/* Arrow */}
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: '#fff', border: '1px solid var(--border)', borderTop: 'none', borderLeft: 'none' }} />
            </div>
          )}

          {/* Legend */}
          {showLegend && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{t('floorPlan.legend')}</div>
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
          {/* Asset Details / Pin Form */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            {pinning ? (
              /* Pin Asset Form */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Pin Asset</div>
                  <button onClick={handleCancelPin} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="#64748B" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 10, background: 'var(--info-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span style={{ fontSize: 12, color: 'var(--info)', fontWeight: 500 }}>Position: {pinCoords?.x.toFixed(1)}%, {pinCoords?.y.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div style={labelStyle}>Asset Type</div>
                    <select value={pinForm.type} onChange={(e) => setPinForm({ ...pinForm, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ASSET_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Asset Label</div>
                    <input value={pinForm.label} onChange={(e) => setPinForm({ ...pinForm, label: e.target.value })} placeholder="e.g. AHU-09" style={inputStyle} autoFocus />
                  </div>
                  <div>
                    <div style={labelStyle}>Status</div>
                    <select value={pinForm.status} onChange={(e) => setPinForm({ ...pinForm, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleCancelPin} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
                    <button onClick={handleSavePin} disabled={!pinForm.label.trim()} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: pinForm.label.trim() ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: pinForm.label.trim() ? 'pointer' : 'not-allowed' }}>Save Pin</button>
                  </div>
                </div>
              </>
            ) : editing ? (
              /* Edit Asset Form */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Edit Asset</div>
                  <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="#64748B" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={labelStyle}>Asset Type</div>
                    <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ASSET_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Asset Label</div>
                    <input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} placeholder="e.g. AHU-09" style={inputStyle} autoFocus />
                  </div>
                  <div>
                    <div style={labelStyle}>Status</div>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleCancelEdit} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={!editForm.label.trim()} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: editForm.label.trim() ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: editForm.label.trim() ? 'pointer' : 'not-allowed' }}>Save Changes</button>
                  </div>
                </div>
              </>
            ) : selectedAsset ? (
              /* Asset Details View */
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('floorPlan.assetDetails')}</div>
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
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('floorPlan.status')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[selectedAsset.status], marginTop: 2 }}>{STATUS_LABELS[selectedAsset.status]}</div>
                    </div>
                    <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('assets.col.type')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{selectedAsset.type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.viewHistory')}</button>
                    <button style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.createWO')}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('floorPlan.assetDetails')}</div>
                <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{t('floorPlan.clickAsset')}</div>
                {permissions?.canAddMapAssets && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                    <MapPin size={16} color="#94A3B8" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>Right-click the map to pin an asset</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Asset List */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>{t('floorPlan.allAssets')} ({allAssets.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allAssets.map((asset) => (
                <div key={asset.id} onClick={() => { setSelectedAsset(asset); setPinning(false); }} style={{ padding: 10, borderRadius: 8, cursor: 'pointer', border: selectedAsset?.id === asset.id ? '1px solid var(--info)' : '1px solid var(--border)', background: selectedAsset?.id === asset.id ? 'var(--info-bg)' : '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
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

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleting(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--critical-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="var(--critical)" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>Delete Asset Pin</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>This action cannot be undone.</div>
              </div>
            </div>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{deleting.label}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{deleting.type} &middot; {STATUS_LABELS[deleting.status]}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleting(null)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
              <button onClick={handleConfirmDelete} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: 'var(--critical)', color: '#fff', cursor: 'pointer' }}>Delete Pin</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={handleCancelUpload} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>Edit Floor Map</div>
              <button onClick={handleCancelUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#64748B" /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {previewImage ? (
                <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: '#F8FAFC' }}>
                  <img src={previewImage} alt="Preview" style={{ width: '100%', height: 240, objectFit: 'contain', display: 'block' }} />
                </div>
              ) : floorImage ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Current Floor Map</div>
                  <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: '#F8FAFC' }}>
                    <img src={floorImage} alt="Current" style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block' }} />
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40, border: '2px dashed var(--border)', borderRadius: 8, textAlign: 'center', background: '#F8FAFC' }}>
                  <Image size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>No floor map uploaded</div>
                  <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>Upload a PNG, JPG, or SVG file</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {floorImage && !previewImage && (
                  <button onClick={handleRemoveImage} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--critical)', background: '#fff', color: 'var(--critical)', cursor: 'pointer' }}>Remove Image</button>
                )}
                <button onClick={handleUploadClick} style={{ flex: 1, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--primary)', background: 'var(--info-bg)', color: 'var(--primary)', cursor: 'pointer' }}>{floorImage ? 'Replace Image' : 'Upload Image'}</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={handleCancelUpload} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
              <button onClick={handleConfirmUpload} disabled={!previewImage} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: previewImage ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: previewImage ? 'pointer' : 'not-allowed' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.2); } }`}</style>
    </div>
  );
}
