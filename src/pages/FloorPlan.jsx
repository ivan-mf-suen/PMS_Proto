import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetsContext';
import { useTranslation } from '../i18n/LanguageContext';
import { PROPERTIES } from '../data/constants';
import {
  ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, X, Pencil, Trash2, PlusCircle,
  Building2, Upload, FileText, Download, AlertTriangle,
} from 'lucide-react';

const CATEGORY_COLORS = {
  '櫃': '#2563EB',
  '煮食設備': '#F59E0B',
};

export default function FloorPlan({ selectedCenter }) {
  const { permissions } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    assets, getFloorsForProperty, getFloor,
    addFloor, updateFloor, removeFloor,
    getPlots, addPlot, updatePlot, removePlot, getAsset,
  } = useAssets();

  // ── Centre / property resolution ──────────────────────────────
  // If the header's centre is a concrete property, that wins and the in-page
  // centre step is skipped. Otherwise the user picks a centre (default TC-01).
  const headerProp = PROPERTIES.find((p) => p.name === selectedCenter);
  const [localCentre, setLocalCentre] = useState(() => PROPERTIES.find((p) => p.unitCode === 'TC-01') || PROPERTIES[0]);
  const activeProp = headerProp || localCentre;
  const centreLocked = !!headerProp;

  const floors = useMemo(
    () => getFloorsForProperty(activeProp.unitCode),
    [getFloorsForProperty, activeProp]
  );

  // ── Floor selection ────────────────────────────────────────────
  const queryFloor = searchParams.get('floor');
  const queryAsset = searchParams.get('asset');
  const [activeFloorId, setActiveFloorId] = useState(null);

  // Auto-select: a single floor is shown directly; otherwise select the first
  // (or the one requested via ?floor=).
  useEffect(() => {
    if (floors.length === 0) {
      setActiveFloorId(null);
      return;
    }
    setActiveFloorId((prev) => {
      const named = queryFloor && floors.find((f) => f.name === queryFloor);
      if (named) return named.id;
      if (prev && floors.some((f) => f.id === prev)) return prev;
      return floors[0].id;
    });
  }, [floors, queryFloor]);

  const activeFloor = activeFloorId ? getFloor(activeFloorId) : null;

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

  // Add / manage floor modal state
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [manageFloor, setManageFloor] = useState(null); // floor record being edited
  const [deleteFloor, setDeleteFloor] = useState(null); // floor pending removal confirm
  const [floorForm, setFloorForm] = useState({ name: '', file: null, fileData: null, fileType: '', validDate: '' });

  const plots = activeFloor ? getPlots(activeFloor.id) : [];
  const floorAssets = useMemo(
    () => (activeFloor ? assets.filter((a) => a.floor === activeFloor.name) : []),
    [assets, activeFloor]
  );

  const selectedPlot = plots.find((p) => p.id === selectedAssetId) || null;
  const selectedAsset = selectedPlot ? getAsset(selectedPlot.assetId) : null;

  useEffect(() => {
    window.addEventListener('click', () => setContextMenu(null));
    return () => window.removeEventListener('click', () => setContextMenu(null));
  }, []);

  useEffect(() => {
    if (queryAsset && activeFloor) {
      const plot = getPlots(activeFloor.id).find((p) => p.assetId === queryAsset);
      if (plot) setSelectedAssetId(plot.id);
    }
  }, [queryAsset, activeFloor, getPlots]);

  const hasImage = !!activeFloor?.image && activeFloor.type !== 'pdf';

  const handleSelectFloor = (id) => {
    setActiveFloorId(id);
    setSelectedAssetId(null);
    setPinning(false);
    setEditingPlot(null);
  };

  const handleMapContextMenu = useCallback((e) => {
    if (!permissions?.canAddMapAssets || !activeFloor) return;
    e.preventDefault();
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setContextMenu({ x: e.clientX, y: e.clientY, mapX: x, mapY: y });
  }, [permissions, activeFloor]);

  const handlePinHere = useCallback(() => {
    setPinCoords({ x: contextMenu.mapX, y: contextMenu.mapY });
    setPinning(true);
    setSelectedAssetId(null);
    setPinAssetId('');
    setContextMenu(null);
  }, [contextMenu]);

  const handleSavePin = useCallback(() => {
    if (!pinAssetId || !activeFloor) return;
    const asset = getAsset(pinAssetId);
    if (!asset) return;
    const plot = {
      id: `PLOT-${Date.now()}`,
      assetId: asset.id,
      x: pinCoords.x,
      y: pinCoords.y,
    };
    addPlot(activeFloor.id, plot);
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
    if (!editingPlot || !editingPlot.assetId || !activeFloor) return;
    updatePlot(activeFloor.id, editingPlot.id, { assetId: editingPlot.assetId, x: editingPlot.x, y: editingPlot.y });
    setSelectedAssetId(editingPlot.id);
    setEditingPlot(null);
  }, [editingPlot, updatePlot, activeFloor]);

  const handleCancelEdit = useCallback(() => setEditingPlot(null), []);

  const handleDeletePlot = useCallback(() => {
    if (!selectedPlot) return;
    setDeleting(selectedPlot);
  }, [selectedPlot]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleting || !activeFloor) return;
    removePlot(activeFloor.id, deleting.id);
    setSelectedAssetId(null);
    setDeleting(null);
  }, [deleting, removePlot, activeFloor]);

  // ── Add / manage floor ───────────────────────────────────────
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      setFloorForm((prev) => ({
        ...prev,
        file,
        fileData: reader.result,
        fileType: isPdf ? 'pdf' : 'image',
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetFloorForm = () => setFloorForm({ name: '', file: null, fileData: null, fileType: '', validDate: '' });

  const openAddFloor = () => {
    resetFloorForm();
    setShowAddFloor(true);
  };

  const canSaveFloor = floorForm.name.trim().length > 0 && (floorForm.fileData || manageFloor) && floorForm.validDate.trim().length > 0;

  const handleSaveFloor = () => {
    if (!canSaveFloor) return;
    if (manageFloor) {
      updateFloor(manageFloor.id, {
        name: floorForm.name.trim(),
        type: floorForm.fileType || manageFloor.type,
        image: floorForm.fileData || manageFloor.image,
        validDate: floorForm.validDate,
      });
      setManageFloor(null);
    } else {
      addFloor({
        propertyCode: activeProp.unitCode,
        name: floorForm.name.trim(),
        type: floorForm.fileType,
        image: floorForm.fileData,
        validDate: floorForm.validDate,
      });
    }
    setShowAddFloor(false);
    resetFloorForm();
  };

  const openManageFloor = (floor) => {
    setManageFloor(floor);
    setFloorForm({ name: floor.name, file: null, fileData: null, fileType: floor.type || '', validDate: floor.validDate || '' });
    setShowAddFloor(true);
  };

  const handleRequestDeleteFloor = (floor) => {
    const hasPins = (getPlots(floor.id) || []).length > 0;
    setDeleteFloor({ floor, hasPins });
  };

  const handleConfirmDeleteFloor = () => {
    if (!deleteFloor) return;
    removeFloor(deleteFloor.floor.id);
    setActiveFloorId(null);
    setDeleteFloor(null);
  };

  const assetLabel = (id) => {
    const a = getAsset(id);
    if (!a) return '';
    return `${a.room} · ${a.category}`;
  };

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', outline: 'none', color: 'var(--foreground)' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 };

  const plotColor = (plot) => {
    const a = getAsset(plot.assetId);
    return a ? CATEGORY_COLORS[a.category] || '#2563EB' : '#64748B';
  };

  const centerSelector = (locked) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ ...labelStyle, margin: 0 }}>{t('floorPlan.selectCentre')}</label>
      {locked ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{activeProp.name}</span>
      ) : (
        <select value={activeProp.id} onChange={(e) => setLocalCentre(PROPERTIES.find((p) => p.id === Number(e.target.value)) || PROPERTIES[0])} style={{ ...inputStyle, width: 260, cursor: 'pointer' }}>
          {PROPERTIES.map((p) => <option key={p.id} value={p.id}>{p.unitCode} — {p.name}</option>)}
        </select>
      )}
    </div>
  );

  // ── No floor plan guidance ───────────────────────────────────
  if (floors.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('floorPlan.title')}</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('floorPlan.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {centerSelector(centreLocked)}
            <button onClick={openAddFloor} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={15} /> {t('floorPlan.addFloor')}
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MapPin size={26} color="var(--info)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>{t('floorPlan.noFloorsTitle')}</div>
          <div style={{ fontSize: 13, color: '#64748B', maxWidth: 520, margin: '0 auto 24px' }}>{t('floorPlan.noFloorsHint')}</div>

          <div style={{ textAlign: 'left', maxWidth: 620, margin: '0 auto', background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>{t('floorPlan.guideTitle')}</div>
            {[
              t('floorPlan.guide1'),
              t('floorPlan.guide2'),
              t('floorPlan.guide3'),
              t('floorPlan.guide4'),
              t('floorPlan.guide5'),
            ].map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--info)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
        {renderFloorModal()}
      </div>
    );
  }

  // ── Main view: floor plan map ───────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1400, height: 'calc(100vh - 56px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--info)" /> {t('floorPlan.title')}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('floorPlan.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {centerSelector(centreLocked)}
          <button onClick={openAddFloor} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={15} /> {t('floorPlan.addFloor')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {floors.map((f) => {
          const active = activeFloor?.id === f.id;
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => handleSelectFloor(f.id)}
                style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: active ? '2px solid var(--primary)' : '1px solid var(--border)', background: active ? 'var(--info-bg)' : '#fff', color: active ? 'var(--primary)' : '#64748B', cursor: 'pointer' }}
              >
                {f.name}
                {f.validDate && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.7 }}>({t('floorPlan.until')}{f.validDate})</span>}
              </button>
              <button onClick={() => openManageFloor(f)} title={t('floorPlan.editFloor')} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={12} color="#64748B" /></button>
              <button onClick={() => handleRequestDeleteFloor(f)} title={t('floorPlan.deleteFloor')} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #FECACA', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} color="#DC2626" /></button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 140px)' }}>
        <div ref={mapRef} onContextMenu={handleMapContextMenu} style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}>
          {activeFloor && activeFloor.type === 'pdf' ? (
            <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 24 }}>
                <FileText size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{activeFloor.name}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>{t('floorPlan.pdfHint')}</div>
                {activeFloor.image && (
                  <a href={activeFloor.image} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--info)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <Download size={14} /> {t('floorPlan.openPdf')}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
                <button onClick={() => setZoom(Math.min(zoom + 0.2, 2))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomIn size={16} color="#475569" /></button>
                <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ZoomOut size={16} color="#475569" /></button>
                <button onClick={() => setZoom(1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><RotateCcw size={16} color="#475569" /></button>
                <button onClick={() => setShowLegend(!showLegend)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: showLegend ? 'var(--info-bg)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Layers size={16} color={showLegend ? 'var(--info)' : '#475569'} /></button>
              </div>

              <div style={{ width: '100%', height: '100%', padding: 40, transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s', position: 'relative' }}>
                {hasImage ? (
                  <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                    <img src={activeFloor.image} alt={`Floor ${activeFloor.name}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
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
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{activeFloor.name}</div>
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
                    <button onClick={() => selectedAsset && navigate(`/work-orders/new?property=${activeProp.unitCode}&asset=${selectedAsset.id}`)} style={{ flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--primary)', background: 'var(--info-bg)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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
            </>
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
                      {floorAssets.map((a) => <option key={a.id} value={a.id}>{a.room} · {a.category}</option>)}
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
                      {floorAssets.map((a) => <option key={a.id} value={a.id}>{a.room} · {a.category}</option>)}
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
                      <div style={{ fontSize: 12, color: '#64748B' }}>{selectedAsset?.category}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => selectedAsset && navigate(`/assets/${selectedAsset.id}`)} style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.viewHistory')}</button>
                    <button onClick={() => selectedAsset && navigate(`/work-orders/new?property=${activeProp.unitCode}&asset=${selectedAsset.id}`)} style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('floorPlan.createWO')}</button>
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
              {floorAssets.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 8 }}>
                  {t('floorPlan.noAssetsOnFloor')}
                </div>
              )}
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
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{t('assets.floorLabel')} {activeFloor?.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleting(null)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
              <button onClick={handleConfirmDelete} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: 'var(--critical)', color: '#fff', cursor: 'pointer' }}>{t('floorPlan.deletePin')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteFloor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteFloor(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: deleteFloor.hasPins ? '#FEF3C7' : 'var(--critical-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color={deleteFloor.hasPins ? '#B45309' : 'var(--critical)'} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{t('floorPlan.deleteFloorTitle')}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{deleteFloor.floor.name} · {deleteFloor.floor.propertyCode}</div>
              </div>
            </div>
            {deleteFloor.hasPins ? (
              <>
                <div style={{ padding: 12, background: '#FEF3C7', borderRadius: 8, fontSize: 13, color: '#B45309', marginBottom: 20 }}>
                  {t('floorPlan.deleteBlockedPins')}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteFloor(null)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                  {t('floorPlan.deleteFloorConfirm')}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteFloor(null)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
                  <button onClick={handleConfirmDeleteFloor} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: 'var(--critical)', color: '#fff', cursor: 'pointer' }}>{t('floorPlan.deleteFloor')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {renderFloorModal()}
      <style>{`@keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.2); } }`}</style>
    </div>
  );

  function renderFloorModal() {
    return (
      <>
        {showAddFloor && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowAddFloor(false); setManageFloor(null); }} />
            <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)' }}>{manageFloor ? t('floorPlan.editFloorTitle') : t('floorPlan.addFloorTitle')}</div>
                <button onClick={() => { setShowAddFloor(false); setManageFloor(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#64748B" /></button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('floorPlan.floorName')} <span style={{ color: 'var(--critical)' }}>*</span></label>
                <input value={floorForm.name} onChange={(e) => setFloorForm((p) => ({ ...p, name: e.target.value }))} placeholder={t('floorPlan.floorNamePh')} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('floorPlan.uploadPlan')} <span style={{ color: 'var(--critical)' }}>*</span></label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1.5px dashed var(--border)', borderRadius: 10, padding: '24px 16px', cursor: 'pointer', background: '#F8FAFC', textAlign: 'center' }}>
                  {floorForm.fileData ? (
                    floorForm.fileType === 'pdf' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--info)', fontSize: 13, fontWeight: 600 }}>
                        <FileText size={18} /> {floorForm.file?.name || 'PDF'}
                      </div>
                    ) : (
                      <img src={floorForm.fileData} alt="preview" style={{ maxWidth: 160, maxHeight: 100, objectFit: 'contain', borderRadius: 6 }} />
                    )
                  ) : (
                    <>
                      <Upload size={22} color="#94A3B8" />
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{t('floorPlan.uploadHint')}</div>
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" onChange={onFileChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('floorPlan.validDate')} <span style={{ color: 'var(--critical)' }}>*</span></label>
                <input type="date" value={floorForm.validDate} onChange={(e) => setFloorForm((p) => ({ ...p, validDate: e.target.value }))} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowAddFloor(false); setManageFloor(null); }} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: '#64748B' }}>{t('floorPlan.cancel')}</button>
                <button onClick={handleSaveFloor} disabled={!canSaveFloor} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: canSaveFloor ? 'var(--primary)' : '#CBD5E1', color: '#fff', cursor: canSaveFloor ? 'pointer' : 'not-allowed' }}>{manageFloor ? t('floorPlan.saveChanges') : t('floorPlan.addFloor')}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
