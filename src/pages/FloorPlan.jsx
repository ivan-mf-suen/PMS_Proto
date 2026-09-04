import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetsContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, X, Pencil, Trash2, PlusCircle,
} from 'lucide-react';

const CATEGORY_COLORS = {
  '櫃': '#2563EB',
  '冷氣/風扇/抽氣扇': '#0EA5E9',
  '煮食設備': '#F59E0B',
};

export default function FloorPlan() {
  const { permissions } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { assets, floors, getPlots, addPlot, updatePlot, removePlot, getAsset } = useAssets();

  const floorTabs = floors;
  const queryFloor = searchParams.get('floor');
  const queryAsset = searchParams.get('asset');

  const [activeFloor, setActiveFloor] = useState(() => (queryFloor && ['4F', '5F'].includes(queryFloor) ? queryFloor : '4F'));
  const mapRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [pinning, setPinning] = useState(false);
  const [pinCoords, setPinCoords] = useState(null);
  const [pinAssetId, setPinAssetId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [editingPlot, setEditingPlot] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const plots = getPlots(activeFloor);
  const floorAssets = useMemo(() => assets.filter((a) => a.floor === activeFloor), [assets, activeFloor]);

  const selectedPlot = plots.find((p) => p.id === selectedAssetId) || null;
  const selectedAsset = selectedPlot ? getAsset(selectedPlot.assetId) : null;

  useEffect(() => {
    window.addEventListener('click', () => setContextMenu(null));
    return () => window.removeEventListener('click', () => setContextMenu(null));
  }, []);

  useEffect(() => {
    if (queryAsset && queryFloor) {
      const plot = getPlots(queryFloor).find((p) => p.assetId === queryAsset);
      if (plot) setSelectedAssetId(plot.id);
    }
  }, [queryAsset, queryFloor, getPlots]);

  const currentFloorDef = floors.find((f) => f.key === activeFloor);
  const hasImage = !!currentFloorDef?.image;

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
    setSelectedAssetId(null);
    setPinAssetId('');
    setContextMenu(null);
  }, [contextMenu]);

  const handleSavePin = useCallback(() => {
    if (!pinAssetId) return;
    const asset = getAsset(pinAssetId);
    if (!asset) return;
    const plot = {
      id: `PLOT-${Date.now()}`,
      assetId: asset.id,
      x: pinCoords.x,
      y: pinCoords.y,
    };
    addPlot(activeFloor, plot);
    setPinning(false);
    setPinCoords(null);
    setPinAssetId('');
    setSelectedAssetId(plot.id);
  }, [pinAssetId, pinCoords, getAsset, addPlot, activeFloor]);

  const handleCancelPin = useCallback(() => {
    setPinning(false);
    setPinCoords(null);
    setPinAssetId('');
  }, []);

  const handleEditPlot = useCallback(() => {
    if (!selectedPlot) return;
    setEditingPlot({ ...selectedPlot });
  }, [selectedPlot]);

  const handleSaveEdit = useCallback(() => {
    if (!editingPlot || !editingPlot.assetId) return;
    updatePlot(activeFloor, editingPlot.id, { assetId: editingPlot.assetId, x: editingPlot.x, y: editingPlot.y });
    setSelectedAssetId(editingPlot.id);
    setEditingPlot(null);
  }, [editingPlot, updatePlot, activeFloor]);

  const handleCancelEdit = useCallback(() => setEditingPlot(null), []);

  const handleDeletePlot = useCallback(() => {
    if (!selectedPlot) return;
    setDeleting(selectedPlot);
  }, [selectedPlot]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleting) return;
    removePlot(activeFloor, deleting.id);
    setSelectedAssetId(null);
    setDeleting(null);
  }, [deleting, removePlot, activeFloor]);

  const assetLabel = (id) => {
    const a = getAsset(id);
    if (!a) return '';
    return `${a.room} · ${a.category} (${a.qty})`;
  };

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', outline: 'none', color: 'var(--foreground)' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 };

  const plotColor = (plot) => {
    const a = getAsset(plot.assetId);
    return a ? CATEGORY_COLORS[a.category] || '#2563EB' : '#64748B';
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, height: 'calc(100vh - 56px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('floorPlan.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('floorPlan.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {floorTabs.map((f) => (
            <button
              key={f.key}
              onClick={() => { setActiveFloor(f.key); setSelectedAssetId(null); setPinning(false); setEditingPlot(null); }}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: activeFloor === f.key ? '2px solid var(--primary)' : '1px solid var(--border)', background: activeFloor === f.key ? 'var(--info-bg)' : '#fff', color: activeFloor === f.key ? 'var(--primary)' : '#64748B', cursor: 'pointer' }}
            >
              {f.key}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 80px)' }}>
        <div ref={mapRef} onContextMenu={handleMapContextMenu} style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
            <button onClick={() => setZoom(Math.min(zoom + 0.2, 2))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomIn size={16} color="#475569" /></button>
            <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomOut size={16} color="#475569" /></button>
            <button onClick={() => setZoom(1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><RotateCcw size={16} color="#475569" /></button>
            <button onClick={() => setShowLegend(!showLegend)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: showLegend ? 'var(--info-bg)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Layers size={16} color={showLegend ? 'var(--info)' : '#475569'} /></button>
          </div>

          <div style={{ width: '100%', height: '100%', padding: 40, transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s', position: 'relative' }}>
            {hasImage ? (
              <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                <img src={currentFloorDef.image} alt={`Floor ${activeFloor}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                {plots.map((plot) => {
                  const selected = selectedPlot?.id === plot.id;
                  return (
                    <div key={plot.id} onClick={() => setSelectedAssetId(selected ? null : plot.id)} style={{ position: 'absolute', left: `${plot.x}%`, top: `${plot.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: selected ? 5 : 2 }}>
                      <div style={{ width: selected ? 30 : 24, height: selected ? 30 : 24, borderRadius: '50%', background: plotColor(plot), border: selected ? '2px solid #0B132B' : '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: 11, color: '#fff', fontWeight: 700 }}>{assetLabel(plot.assetId).slice(0, 1)}</div>
                    </div>
                  );
                })}
                {pinning && pinCoords && (
                  <div style={{ position: 'absolute', left: `${pinCoords.x}%`, top: `${pinCoords.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: '2px dashed #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(37,99,235,0.4)', animation: 'pulse 1.5s infinite' }}>
                      <MapPin size={13} color="#fff" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{activeFloor}</div>
                  {t('floorPlan.noMapImage')}
                </div>
              </div>
            )}
          </div>

          {contextMenu && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100, background: '#fff', borderRadius: 8, border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 4, minWidth: 180 }}>
              <button onClick={handlePinHere} style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, borderRadius: 6, border: 'none', background: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                <MapPin size={14} color="var(--primary)" /> {t('floorPlan.pinAssetHere')}
              </button>
            </div>
          )}

          {showLegend && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{t('floorPlan.legend')}</div>
              {Object.keys(CATEGORY_COLORS).map((key) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[key] }} />
                  <span style={{ fontSize: 11, color: '#475569' }}>{key}</span>
                </div>
              ))}
            </div>
          )}

          {selectedPlot && !pinning && !editingPlot && permissions?.canAddMapAssets && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: `${selectedPlot.x}%`, top: `${selectedPlot.y}%`, transform: 'translate(-50%, calc(-100% - 22px))', zIndex: 20, background: '#fff', borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '12px 14px', minWidth: 220, pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: plotColor(selectedPlot) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: plotColor(selectedPlot) }}>{assetLabel(selectedPlot.assetId).slice(0, 1)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{selectedAsset?.room || selectedPlot.assetId}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{selectedAsset?.category}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => selectedAsset && navigate(`/work-orders/new?property=TC-01&asset=${selectedAsset.id}`)} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--primary)', background: 'var(--info-bg)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <PlusCircle size={12} /> {t('floorPlan.createWO')}
                </button>
                <button onClick={handleEditPlot} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                  <Pencil size={12} /> {t('floorPlan.edit')}
                </button>
                <button onClick={handleDeletePlot} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--critical)', background: '#fff', color: 'var(--critical)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--critical-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                  <Trash2 size={12} /> {t('floorPlan.delete')}
                </button>
              </div>
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: '#fff', border: '1px solid var(--border)', borderTop: 'none', borderLeft: 'none' }} />
            </div>
          )}
        </div>

        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            {pinning ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{t('floorPlan.pinAsset')}</div>
                  <button onClick={handleCancelPin} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="#64748B" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 10, background: 'var(--info-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span style={{ fontSize: 12, color: 'var(--info)', fontWeight: 500 }}>{t('floorPlan.position')}: {pinCoords?.x.toFixed(1)}%, {pinCoords?.y.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div style={labelStyle}>{t('floorPlan.assetName')}</div>
                    <select value={pinAssetId} onChange={(e) => setPinAssetId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">{t('floorPlan.selectAsset')}</option>
                      {floorAssets.map((a) => <option key={a.id} value={a.id}>{a.room} · {a.category} ({a.qty})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleCancelPin} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
                    <button onClick={handleSavePin} disabled={!pinAssetId} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: pinAssetId ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: pinAssetId ? 'pointer' : 'not-allowed' }}>{t('floorPlan.savePin')}</button>
                  </div>
                </div>
              </>
            ) : editingPlot ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{t('floorPlan.editAsset')}</div>
                  <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="#64748B" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={labelStyle}>{t('floorPlan.assetName')}</div>
                    <select value={editingPlot.assetId} onChange={(e) => setEditingPlot({ ...editingPlot, assetId: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {floorAssets.map((a) => <option key={a.id} value={a.id}>{a.room} · {a.category} ({a.qty})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleCancelEdit} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
                    <button onClick={handleSaveEdit} disabled={!editingPlot.assetId} style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: editingPlot.assetId ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: editingPlot.assetId ? 'pointer' : 'not-allowed' }}>{t('floorPlan.saveChanges')}</button>
                  </div>
                </div>
              </>
            ) : selectedPlot ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('floorPlan.assetDetails')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: plotColor(selectedPlot) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: plotColor(selectedPlot) }}>{assetLabel(selectedPlot.assetId).slice(0, 1)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{selectedAsset?.room || selectedPlot.assetId}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{selectedAsset?.category} · {t('assets.col.qty')} {selectedAsset?.qty}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => selectedAsset && navigate(`/assets/${selectedAsset.id}`)} style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.viewHistory')}</button>
                    <button onClick={() => selectedAsset && navigate(`/work-orders/new?property=TC-01&asset=${selectedAsset.id}`)} style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.createWO')}</button>
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
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{t('floorPlan.rightClickHint')}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>{t('floorPlan.allAssets')} ({floorAssets.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {floorAssets.map((a) => {
                const plotted = plots.find((p) => p.assetId === a.id);
                return (
                  <div key={a.id} onClick={() => { if (plotted) { setSelectedAssetId(plotted.id); setPinning(false); } else { setPinCoords({ x: 50, y: 50 }); setPinAssetId(a.id); setPinning(true); setSelectedAssetId(null); } }} style={{ padding: 10, borderRadius: 8, cursor: 'pointer', border: selectedPlot?.assetId === a.id ? '1px solid var(--info)' : '1px solid var(--border)', background: selectedPlot?.assetId === a.id ? 'var(--info-bg)' : '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: plotted ? CATEGORY_COLORS[a.category] : '#CBD5E1', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{a.room}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{a.category} · {plotted ? t('floorPlan.plotted') : t('floorPlan.notPlotted')}</div>
                    </div>
                    {!plotted && <MapPin size={12} color="#94A3B8" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleting(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--critical-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="var(--critical)" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{t('floorPlan.deleteTitle')}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{t('floorPlan.deleteWarning')}</div>
              </div>
            </div>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{assetLabel(deleting.assetId)}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{t('assets.floorLabel')} {activeFloor}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleting(null)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
              <button onClick={handleConfirmDelete} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: 'var(--critical)', color: '#fff', cursor: 'pointer' }}>{t('floorPlan.deletePin')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.2); } }`}</style>
    </div>
  );
}
