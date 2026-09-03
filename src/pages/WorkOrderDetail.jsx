import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  ArrowLeft, Paperclip, AlertTriangle, RotateCcw, Send, Info,
  CheckCircle, Circle, Download, Upload, FileText, X, Check,
  CheckSquare, Plus, Trash2, MinusCircle,
} from 'lucide-react';
import { WO_TYPE_KEY_MAP } from '../data/workOrders';

const STATUS_STYLES = {
  'Draft': { background: '#64748B', color: '#fff' },
  'Pending SSD Service Manager Endorsement': { background: '#D97706', color: '#fff' },
  'Pending SSD G&C Review': { background: '#EA580C', color: '#fff' },
  'Pending SSD AS Endorsement': { background: '#B45309', color: '#fff' },
  'Under PWD Grouping': { background: '#2563EB', color: '#fff' },
  'Pending OIC Review': { background: '#C2410C', color: '#fff' },
  'Pending PWD Proceed IAS': { background: '#D97706', color: '#fff' },
  'Submitted to IAS for Tendering': { background: '#7C3AED', color: '#fff' },
  'Approved IAS': { background: '#059669', color: '#fff' },
  'In Progress': { background: '#059669', color: '#fff' },
  'Completed': { background: '#16A34A', color: '#fff' },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { background: '#64748B', color: '#fff' };
}

const PRIORITY_STYLES = {
  'Critical': { bg: 'var(--critical-bg)', color: 'var(--critical)' },
  'High': { bg: 'var(--warning-bg)', color: '#B45309' },
  'Medium': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Low': { bg: '#F1F5F9', color: '#64748B' },
};

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function FieldValue({ children, highlight }) {
  return (
    <div style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: 'var(--foreground)' }}>
      {children || '—'}
    </div>
  );
}

function DetailCard({ title, number, children, compact }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
      marginBottom: 24, overflow: 'hidden',
    }}>
      <div style={{
        padding: compact ? '10px 20px' : '14px 24px', background: '#F8FAFC',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {typeof number === 'string' ? (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>{number}</span>
        ) : (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{number}</span>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{title}</div>
      </div>
      <div style={{ padding: compact ? '12px 20px' : 24 }}>
        {children}
      </div>
    </div>
  );
}

const INPUT_BASE = {
  width: '100%', padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--border)', fontSize: 13,
  color: 'var(--foreground)', background: '#fff', boxSizing: 'border-box',
};

const INPUT_DISABLED = { ...INPUT_BASE, background: '#F8FAFC', color: '#64748B', cursor: 'default' };

const BTN_PRIMARY = {
  padding: '8px 18px', borderRadius: 6, border: 'none',
  fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const BTN_SECONDARY = {
  padding: '8px 18px', borderRadius: 6,
  border: '1px solid var(--border)', background: '#fff',
  fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const BTN_SM = {
  padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: '#fff',
  fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
};

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '90%', maxWidth: 720,
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ChecklistIcon({ state }) {
  if (state === 'completed') return <CheckCircle size={16} color="#059669" />;
  if (state === 'noNeed') return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#FFF7ED',
      border: '1.5px solid #FB923C', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <MinusCircle size={10} color="#FB923C" />
    </div>
  );
  return <Circle size={16} color="#CBD5E1" />;
}

function ChecklistBadge({ state }) {
  const { t } = useTranslation();
  if (state === 'completed') return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
      background: '#DCFCE7', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.04em',
      marginLeft: 6, flexShrink: 0,
    }}>{t('workOrderDetail.badgeComplete')}</span>
  );
  if (state === 'noNeed') return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
      background: '#FFF7ED', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.04em',
      marginLeft: 6, flexShrink: 0,
    }}>{t('workOrderDetail.badgeNoNeed')}</span>
  );
  return null;
}

export default function WorkOrderDetail() {
  const { role } = useAuth();
  const { workOrders, updateWorkOrderStatus } = useWorkOrders();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const wo = workOrders.find((w) => w.id === id);

  const [iasHovered, setIasHovered] = useState(false);

  const isSM = role === 'SERVICE_MANAGER' && wo?.status === 'Pending SSD Service Manager Endorsement';
  const isAS = role === 'SSD_AS' && wo?.status === 'Pending SSD AS Endorsement';
  const isGC = role === 'SSD_GC' && wo?.status === 'Pending SSD G&C Review';
  const isOIC = role === 'OIC' && wo?.status === 'Pending OIC Review';
  const isOICDraft = wo?.status === 'Draft' && role === 'OIC';
  const isPWDGrouping = role === 'PWD' && wo?.status === 'Under PWD Grouping';
  const isPendingIAS = wo?.status === 'Pending PWD Proceed IAS';
  const isSubmittedIAS = wo?.status === 'Submitted to IAS for Tendering';
  const isApprovedIAS = wo?.status === 'Approved IAS';
  const isInProgress = wo?.status === 'In Progress';
  const isCompleted = wo?.status === 'Completed';

  // ── Checklist item states ──
  const [itemStates, setItemStates] = useState({
    tender: 'pending',
    loa: 'pending',
    csA: 'pending',
    csB: 'pending',
    eot: 'pending',
    interimInvoice: 'pending',
    vo: 'pending',
    finalInvoice: 'pending',
  });

  const setItem = (key, state) => setItemStates((prev) => ({ ...prev, [key]: state }));

  // ── Tender ──
  const [tenderFile, setTenderFile] = useState(null);
  const tenderInputRef = useRef(null);

  // ── LOA ──
  const [loaPopupOpen, setLoaPopupOpen] = useState(false);
  const [loaState, setLoaState] = useState('initial');
  const [loaSignedFile, setLoaSignedFile] = useState(null);
  const loaSignedInputRef = useRef(null);

  // ── Control Sheet A ──
  const [csAPopupOpen, setCsAPopupOpen] = useState(false);
  const [controlSheet, setControlSheet] = useState({
    natureOfWorks: '', contractor: '', architect: '', consultants: '',
    contractSum: wo?.budget || 0, equipment: '', contingency: 0, provisionalSum: 0,
    archPercent: '', consultantFees: '', paymentConditions: '',
    completionDate: wo?.dueDate || '', laDamages: '', retentionPercent: '',
    retentionLimit: '', subRetention: '', retentionReleaseDate: '',
  });

  // ── Control Sheet B ──
  const [csBPopupOpen, setCsBPopupOpen] = useState(false);
  const [csBRows, setCsBRows] = useState([
    { centre: wo?.center || '', funding: wo?.fundingSource || '', hkd: '', auth: '' },
  ]);

  // ── EOT ──
  const [eotPopupOpen, setEotPopupOpen] = useState(false);
  const [eot, setEot] = useState({ reason: '', days: '', newDate: '', remarks: '' });

  // ── Interim Invoice ──
  const [interimFile, setInterimFile] = useState(null);
  const interimInputRef = useRef(null);

  // ── V.O. ──
  const [voPopupOpen, setVoPopupOpen] = useState(false);
  const [vo, setVo] = useState({ description: '', amount: '', justification: '', status: 'Pending' });

  // ── Final Invoice ──
  const [finalFile, setFinalFile] = useState(null);
  const finalInputRef = useRef(null);

  // ── Manual Approval ──
  const [manualApprovalOpen, setManualApprovalOpen] = useState(false);
  const [manualFiles, setManualFiles] = useState([]);
  const [manualRemarks, setManualRemarks] = useState('');
  const manualInputRef = useRef(null);

  if (!wo) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
        {t('common.noData')}
      </div>
    );
  }

  const today = 'Tuesday, 18 August 2026';
  const portfolio = 'PLK Shek Kip Mei Community Services Centre';
  const pStyle = PRIORITY_STYLES[wo.priority] || PRIORITY_STYLES['Medium'];
  const sStyle = statusStyle(wo.status);

  const csATotal = Number(controlSheet.contractSum || 0) + Number(controlSheet.contingency || 0) + Number(controlSheet.provisionalSum || 0);
  const csBTotal = csBRows.reduce((sum, r) => sum + Number(r.hkd || 0), 0);

  const handleCsField = (field, value) => setControlSheet((p) => ({ ...p, [field]: value }));

  const csBRowField = (idx, field, value) => {
    setCsBRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Page Header Bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)', flexShrink: 0,
        }}>
          <button
            onClick={() => navigate('/work-orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569',
            }}
          >
            <ArrowLeft size={14} /> {t('workOrderDetail.backToWOs')}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{t('workOrderDetail.tracking')}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
              {today} &middot; {t('workOrderDetail.portfolio', { portfolio })}
            </div>
          </div>
          {/* Status badge — flat label style */}
          <div style={{
            padding: '5px 14px', borderRadius: 6,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
            background: sStyle.background, color: sStyle.color,
          }}>
            {t('workOrderDetail.currentStatus', { status: wo.status })}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{
          background: '#F8FAFC', borderBottom: '1px solid var(--border)',
          padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              padding: '7px 16px', borderRadius: 6,
              background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)',
              fontSize: 13, fontWeight: 600, color: '#059669',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontWeight: 800 }}>{wo.id}</span> — {wo.title}
            </div>
          </div>
          {isSM && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); navigate('/work-orders'); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> {t('workOrderDetail.returnDraft')}
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD AS Endorsement'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitAS')}
              </button>
            </div>
          )}
          {isAS && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); navigate('/work-orders'); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> {t('workOrderDetail.returnDraft')}
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD G&C Review'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitGC')}
              </button>
            </div>
          )}
          {isGC && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); navigate('/work-orders'); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> {t('workOrderDetail.returnDraft')}
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending OIC Review'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitOIC')}
              </button>
            </div>
          )}
          {isOIC && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); navigate('/work-orders'); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> {t('workOrderDetail.returnDraft')}
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Under PWD Grouping'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitPWD')}
              </button>
            </div>
          )}
          {isOICDraft && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD Service Manager Endorsement'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitSM')}
              </button>
            </div>
          )}
          {isPWDGrouping && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending PWD Proceed IAS'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
              >
                <Send size={14} /> {t('workOrderDetail.submitIAS')}
              </button>
            </div>
          )}
          {isPendingIAS && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setIasHovered(true)}
                onMouseLeave={() => setIasHovered(false)}
              >
                <button style={{
                  ...BTN_PRIMARY, background: '#7C3AED',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                }}>
                  <Send size={14} /> {t('workOrderDetail.createInIAS')}
                </button>
                {iasHovered && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 420, padding: '14px 18px', borderRadius: 8,
                    background: '#0F172A', color: '#CBD5E1',
                    fontSize: 12, lineHeight: 1.6, zIndex: 200,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#F8FAFC' }}>
                      <Info size={14} color="#A78BFA" /> {t('workOrderDetail.iasIntegration')}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <li>{t('workOrderDetail.iasTip1')}</li>
                      <li>{t('workOrderDetail.iasTip2a')} <span style={{ color: '#A78BFA', fontWeight: 600 }}>{t('workOrderDetail.iasTip2submitted')}</span> {t('workOrderDetail.iasTip2b')} <span style={{ color: '#F87171', fontWeight: 600 }}>{t('workOrderDetail.iasTip2readonly')}</span>.</li>
                      <li>{t('workOrderDetail.iasTip3')}</li>
                      <li>{t('workOrderDetail.iasTip4')}</li>
                    </ul>
                    <div style={{ position: 'absolute', top: -5, right: 16, width: 10, height: 10, background: '#0F172A', transform: 'rotate(45deg)' }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => setManualApprovalOpen((v) => !v)}
                style={{
                  ...BTN_SECONDARY, border: '1px solid #B45309', background: manualApprovalOpen ? '#FFFBEB' : '#fff', color: '#B45309',
                }}
              >
                <Check size={14} /> {t('workOrderDetail.manualApproval')}
              </button>
            </div>
          )}
          {isApprovedIAS && (role === 'PWD' || role === 'SSD_GC') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'In Progress'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#2563EB' }}
              >
                <Send size={14} /> {t('workOrderDetail.startWork')}
              </button>
            </div>
          )}
          {isInProgress && (role === 'PWD' || role === 'SSD_GC') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Completed'); navigate('/work-orders'); }}
                style={{ ...BTN_PRIMARY, background: '#16A34A' }}
              >
                <CheckCircle size={14} /> {t('workOrderDetail.markComplete')}
              </button>
            </div>
          )}
          {isCompleted && (
            <div style={{ padding: '6px 14px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> {t('workOrderDetail.woCompleted')}
            </div>
          )}
        </div>

        {/* IAS Status Banner — PENDING */}
        {isSubmittedIAS && (
          <div style={{
            margin: '0 32px', marginTop: 24, padding: '16px 24px', borderRadius: 10,
            background: '#F5F3FF', borderLeft: '4px solid #7C3AED',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <Info size={20} color="#7C3AED" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{t('workOrderDetail.iasPending')}</div>
              <div style={{ fontSize: 12, color: '#6D28D9', marginTop: 2 }}>
                {t('workOrderDetail.iasPendingMsg')}
              </div>
            </div>
          </div>
        )}

        {/* IAS Status Banner — APPROVED */}
        {isApprovedIAS && (
          <div style={{
            margin: '0 32px', marginTop: 24, padding: '16px 24px', borderRadius: 10,
            background: '#F0FDF4', borderLeft: '4px solid #059669',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <CheckCircle size={20} color="#059669" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{t('workOrderDetail.iasApproved')}</div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                {t('workOrderDetail.iasApprovedMsg')}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* ═══ Manual Approval Section ═══ */}
          {isPendingIAS && manualApprovalOpen && (
            <DetailCard title={t('workOrderDetail.manualApproval')} number={<Check size={14} color="#fff" />} compact>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>{t('workOrderDetail.approvalAttachments')}</FieldLabel>
                  <input ref={manualInputRef} type="file" multiple style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).map((f) => f.name);
                        setManualFiles((prev) => [...prev, ...newFiles]);
                      }
                    }} />
                  <button onClick={() => manualInputRef.current?.click()} style={BTN_SM}>
                    <Upload size={12} /> {t('workOrderDetail.chooseFiles')}
                  </button>
                  {manualFiles.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {manualFiles.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
                          borderRadius: 5, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)',
                          fontSize: 12, color: '#059669',
                        }}>
                          <FileText size={12} /> {f}
                          <button onClick={() => setManualFiles((prev) => prev.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0, marginLeft: 'auto' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>{t('workOrderDetail.remarks')}</FieldLabel>
                  <textarea
                    style={{ ...INPUT_BASE, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
                    value={manualRemarks}
                    onChange={(e) => setManualRemarks(e.target.value)}
                    placeholder={t('workOrderDetail.remarksPh')}
                  />
                </div>
              </div>
            </DetailCard>
          )}

          {/* ═══ Checklist ═══ */}
          {isApprovedIAS && (
            <DetailCard title={t('workOrderDetail.checklist')} number={<CheckSquare size={14} color="#fff" />} compact>
              <div style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Item 1: Upload Tender Document */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.tender} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.tender === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.uploadTender')}
                  </span>
                  <ChecklistBadge state={itemStates.tender} />
                  {itemStates.tender === 'pending' && (
                    <>
                      <input ref={tenderInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setTenderFile(e.target.files[0].name); setItem('tender', 'completed'); } }} />
                      <button onClick={() => tenderInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> {t('workOrderDetail.chooseFile')}
                      </button>
                    </>
                  )}
                  {itemStates.tender === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{tenderFile}
                      </span>
                      <button onClick={() => tenderInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> {t('workOrderDetail.replace')}
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> {t('common.download')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Item 2: Letter of Award (LOA) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.loa} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.loa === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.loa')}
                  </span>
                  <ChecklistBadge state={itemStates.loa} />
                  {itemStates.loa !== 'completed' && (
                    <button onClick={() => { setLoaPopupOpen(true); setLoaState('initial'); }}
                      style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                      <FileText size={12} /> {t('workOrderDetail.loaBtn')}
                    </button>
                  )}
                  {itemStates.loa === 'completed' && (
                    <button onClick={() => { setLoaPopupOpen(true); setLoaState('confirmed'); }}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <Download size={12} /> {t('common.download')}
                    </button>
                  )}
                </div>

                {/* Item 3: Control Sheet Part A */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.csA} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.csA === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.csA')}
                  </span>
                  <ChecklistBadge state={itemStates.csA} />
                  {itemStates.csA !== 'completed' && (
                    <button onClick={() => setCsAPopupOpen(true)}
                      style={{ ...BTN_SM, border: '1px solid #B45309', background: '#FFFBEB', color: '#B45309' }}>
                      <FileText size={12} /> {t('workOrderDetail.csAbtn')}
                    </button>
                  )}
                  {itemStates.csA === 'completed' && (
                    <button onClick={() => setCsAPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> {t('common.view')}
                    </button>
                  )}
                </div>

                {/* Item 4: Control Sheet Part B */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.csB} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.csB === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.csB')}
                  </span>
                  <ChecklistBadge state={itemStates.csB} />
                  {itemStates.csB !== 'completed' && (
                    <button onClick={() => setCsBPopupOpen(true)}
                      style={{ ...BTN_SM, border: '1px solid #B45309', background: '#FFFBEB', color: '#B45309' }}>
                      <FileText size={12} /> {t('workOrderDetail.csBbtn')}
                    </button>
                  )}
                  {itemStates.csB === 'completed' && (
                    <button onClick={() => setCsBPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> {t('common.view')}
                    </button>
                  )}
                </div>

                {/* Item 5: Extension Of Time (EOT) — optional */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.eot} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.eot === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.eot')}
                  </span>
                  <ChecklistBadge state={itemStates.eot} />
                  {itemStates.eot === 'pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setEotPopupOpen(true)}
                        style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                        <FileText size={12} /> {t('workOrderDetail.eotBtn')}
                      </button>
                      <button onClick={() => setItem('eot', 'noNeed')}
                        style={{ fontSize: 11, color: '#FB923C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                        {t('workOrderDetail.noNeed')}
                      </button>
                    </div>
                  )}
                  {itemStates.eot === 'completed' && (
                    <button onClick={() => setEotPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> {t('common.view')}
                    </button>
                  )}
                  {itemStates.eot === 'noNeed' && (
                    <button onClick={() => setItem('eot', 'pending')}
                      style={{ fontSize: 11, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                      {t('workOrderDetail.undo')}
                    </button>
                  )}
                </div>

                {/* Item 6: Upload Interim Invoice — required */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.interimInvoice} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.interimInvoice === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.interimInvoice')}
                  </span>
                  <ChecklistBadge state={itemStates.interimInvoice} />
                  {itemStates.interimInvoice === 'pending' && (
                    <>
                      <input ref={interimInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setInterimFile(e.target.files[0].name); setItem('interimInvoice', 'completed'); } }} />
                      <button onClick={() => interimInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> {t('workOrderDetail.chooseFile')}
                      </button>
                    </>
                  )}
                  {itemStates.interimInvoice === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{interimFile}
                      </span>
                      <button onClick={() => interimInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> {t('workOrderDetail.replace')}
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> {t('common.download')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Item 7: Add V.O. — optional */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.vo} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.vo === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.vo')}
                  </span>
                  <ChecklistBadge state={itemStates.vo} />
                  {itemStates.vo === 'pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setVoPopupOpen(true)}
                        style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                        <Plus size={12} /> {t('workOrderDetail.vo')}
                      </button>
                      <button onClick={() => setItem('vo', 'noNeed')}
                        style={{ fontSize: 11, color: '#FB923C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                        {t('workOrderDetail.noNeed')}
                      </button>
                    </div>
                  )}
                  {itemStates.vo === 'completed' && (
                    <button onClick={() => setVoPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> {t('common.view')}
                    </button>
                  )}
                  {itemStates.vo === 'noNeed' && (
                    <button onClick={() => setItem('vo', 'pending')}
                      style={{ fontSize: 11, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                      {t('workOrderDetail.undo')}
                    </button>
                  )}
                </div>

                {/* Item 8: Upload Final Invoice — required */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC' }}>
                  <ChecklistIcon state={itemStates.finalInvoice} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.finalInvoice === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    {t('workOrderDetail.finalInvoice')}
                  </span>
                  <ChecklistBadge state={itemStates.finalInvoice} />
                  {itemStates.finalInvoice === 'pending' && (
                    <>
                      <input ref={finalInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setFinalFile(e.target.files[0].name); setItem('finalInvoice', 'completed'); } }} />
                      <button onClick={() => finalInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> {t('workOrderDetail.chooseFile')}
                      </button>
                    </>
                  )}
                  {itemStates.finalInvoice === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{finalFile}
                      </span>
                      <button onClick={() => finalInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> {t('workOrderDetail.replace')}
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> {t('common.download')}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </DetailCard>
          )}

          {/* Section 1: Administrative Details */}
          <DetailCard title={t('workOrderDetail.adminDetails')} number="1">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
              <div><FieldLabel>{t('workOrderDetail.woId')}</FieldLabel><FieldValue highlight>{wo.id}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.title')}</FieldLabel><FieldValue highlight>{wo.title}</FieldValue></div>
              <div>
                <FieldLabel>{t('workOrderDetail.priority')}</FieldLabel>
                <FieldValue>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 10, background: pStyle.bg, color: pStyle.color, fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: pStyle.color }} />{wo.priority}
                  </span>
                </FieldValue>
              </div>
              <div><FieldLabel>{t('workOrderDetail.startDate')}</FieldLabel><FieldValue>{wo.created}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.dueDate')}</FieldLabel><FieldValue>{wo.dueDate}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.budget')}</FieldLabel><FieldValue highlight>${wo.budget.toLocaleString()}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.fundingSource')}</FieldLabel><FieldValue>{wo.fundingSource}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.pwd')}</FieldLabel><FieldValue>{wo.pwdInvolvement === 'with' ? t('workOrderCreate.pwdWith') : t('workOrderCreate.pwdWithout')}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.category')}</FieldLabel><FieldValue>{t(WO_TYPE_KEY_MAP[wo.category] || wo.category)}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.center')}</FieldLabel><FieldValue>{wo.center}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.assignee')}</FieldLabel><FieldValue>{wo.assignee}</FieldValue></div>
              <div><FieldLabel>{t('workOrderDetail.createdBy')}</FieldLabel><FieldValue>{wo.createdBy}</FieldValue></div>
            </div>
            <div style={{ marginTop: 20 }}>
              <FieldLabel>{t('workOrderDetail.description')}</FieldLabel>
              <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.7, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                {wo.description}
              </div>
            </div>
          </DetailCard>

          {/* Section 2: Selected Assets */}
          <DetailCard title={t('workOrderDetail.assetsSection', { count: wo.assets?.length || 0 })} number="2">
            {wo.assets && wo.assets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {wo.assets.map((tag, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={18} color="var(--info)" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{t('workOrderDetail.assetTag', { tag })}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: 13 }}>{t('workOrderDetail.noAssets')}</div>
            )}
          </DetailCard>

          {/* Section 3: Attachments */}
          <DetailCard title={t('workOrderDetail.attachments')} number="3">
            {wo.attachments && wo.attachments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wo.attachments.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Paperclip size={14} color="#64748B" />
                    <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{file}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: 13 }}>{t('workOrderDetail.noAttachments')}</div>
            )}
          </DetailCard>

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          POPUPS
         ═══════════════════════════════════════════════════════════════════ */}

      {/* ── LOA Popup ── */}
      {loaPopupOpen && (
        <ModalOverlay onClose={() => setLoaPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('workOrderDetail.loaTitle')}</span>
          </div>

          {(loaState === 'initial' || loaState === 'preview') && (
            <div>
              {loaState === 'initial' && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
                    {t('workOrderDetail.loaGenerateMsg')}
                  </div>
                  <button onClick={() => setLoaState('preview')} style={{ ...BTN_PRIMARY, background: '#7C3AED', padding: '10px 24px', fontSize: 14 }}>
                    <FileText size={16} /> {t('workOrderDetail.loaGenerate')}
                  </button>
                </div>
              )}
              {loaState === 'preview' && (
                <div>
                  <div style={{ padding: 20, borderRadius: 8, border: '1px solid var(--border)', background: '#F8FAFC', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('workOrderDetail.loaDocTitle')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><FieldLabel>{t('workOrderDetail.woId')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.id}</div></div>
                      <div><FieldLabel>{t('workOrderDetail.title')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div></div>
                      <div><FieldLabel>{t('workOrderDetail.loaBudget')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>${wo.budget.toLocaleString()}</div></div>
                      <div><FieldLabel>{t('workOrderDetail.loaDue')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.dueDate}</div></div>
                      <div style={{ gridColumn: '1 / -1' }}><FieldLabel>{t('workOrderDetail.description')}</FieldLabel><div style={{ fontSize: 13, lineHeight: 1.6 }}>{wo.description}</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button onClick={() => { setLoaState('confirmed'); setItem('loa', 'completed'); }} style={{ ...BTN_PRIMARY, background: '#059669' }}>
                      <Check size={14} /> {t('workOrderDetail.confirmLoa')}
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <FieldLabel>{t('workOrderDetail.uploadSignedLoa')}</FieldLabel>
                    <input ref={loaSignedInputRef} type="file" style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files?.[0]) setLoaSignedFile(e.target.files[0].name); }}
                    />
                    <button onClick={() => loaSignedInputRef.current?.click()} style={{ ...BTN_SECONDARY, fontSize: 12 }}>
                      <Upload size={14} /> {t('workOrderDetail.chooseSignedLoa')}
                    </button>
                    {loaSignedFile && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, color: '#059669' }}>
                        <FileText size={14} /> {loaSignedFile}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {loaState === 'confirmed' && (
            <div>
              <div style={{ padding: 20, borderRadius: 8, border: '1px solid var(--border)', background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('workOrderDetail.loaDocTitle')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><FieldLabel>{t('workOrderDetail.woId')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.id}</div></div>
                  <div><FieldLabel>{t('workOrderDetail.title')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div></div>
                  <div><FieldLabel>{t('workOrderDetail.loaBudget')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>${wo.budget.toLocaleString()}</div></div>
                  <div><FieldLabel>{t('workOrderDetail.loaDue')}</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.dueDate}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><FieldLabel>{t('workOrderDetail.description')}</FieldLabel><div style={{ fontSize: 13, lineHeight: 1.6 }}>{wo.description}</div></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button style={{ ...BTN_PRIMARY, background: '#059669' }}><Download size={14} /> {t('workOrderDetail.downloadLoa')}</button>
                <button onClick={() => setLoaPopupOpen(false)} style={BTN_SECONDARY}>{t('common.close')}</button>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <FieldLabel>{t('workOrderDetail.uploadSignedLoa')}</FieldLabel>
                <input ref={loaSignedInputRef} type="file" style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) setLoaSignedFile(e.target.files[0].name); }}
                />
                <button onClick={() => loaSignedInputRef.current?.click()} style={{ ...BTN_SECONDARY, fontSize: 12 }}>
                  <Upload size={14} /> {t('workOrderDetail.chooseSignedLoa')}
                </button>
                {loaSignedFile && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, color: '#059669' }}>
                    <FileText size={14} /> {loaSignedFile}
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalOverlay>
      )}

      {/* ── Control Sheet Part A Popup ── */}
      {csAPopupOpen && (
        <ModalOverlay onClose={() => setCsAPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#B45309" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('workOrderDetail.csATitle')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>{t('workOrderDetail.csA1')}</FieldLabel><input style={INPUT_DISABLED} value={wo.title} readOnly /></div>
            <div><FieldLabel>{t('workOrderDetail.csA2')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.natureOfWorks} onChange={(e) => handleCsField('natureOfWorks', e.target.value)} placeholder={t('workOrderDetail.csAeotPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA3')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.contractor} onChange={(e) => handleCsField('contractor', e.target.value)} placeholder={t('workOrderDetail.csAcontractorPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA4')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.architect} onChange={(e) => handleCsField('architect', e.target.value)} placeholder={t('workOrderDetail.csAarchitectPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA5')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.consultants} onChange={(e) => handleCsField('consultants', e.target.value)} placeholder={t('workOrderDetail.csAconsultantsPh')} /></div>
            <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: '#FAFBFC' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{t('workOrderDetail.csA6')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><FieldLabel>{t('workOrderDetail.csA6a')}</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.contractSum} onChange={(e) => handleCsField('contractSum', e.target.value)} /></div>
                <div><FieldLabel>{t('workOrderDetail.csA6b')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.equipment} onChange={(e) => handleCsField('equipment', e.target.value)} placeholder={t('workOrderDetail.csAequipmentPh')} /></div>
                <div><FieldLabel>{t('workOrderDetail.csA6c')}</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.contingency} onChange={(e) => handleCsField('contingency', e.target.value)} /></div>
                <div><FieldLabel>{t('workOrderDetail.csA6d')}</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.provisionalSum} onChange={(e) => handleCsField('provisionalSum', e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 12 }}><FieldLabel>{t('workOrderDetail.csA6e')}</FieldLabel><input style={INPUT_DISABLED} value={csATotal.toLocaleString()} readOnly /></div>
            </div>
            <div><FieldLabel>{t('workOrderDetail.csA7')}</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 120 }} type="number" value={controlSheet.archPercent} onChange={(e) => handleCsField('archPercent', e.target.value)} placeholder="%" /><span style={{ fontSize: 13, color: '#64748B' }}>%</span></div></div>
            <div><FieldLabel>{t('workOrderDetail.csA8')}</FieldLabel><input style={INPUT_BASE} value={controlSheet.consultantFees} onChange={(e) => handleCsField('consultantFees', e.target.value)} placeholder={t('workOrderDetail.csAfeesPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA9')}</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={controlSheet.paymentConditions} onChange={(e) => handleCsField('paymentConditions', e.target.value)} placeholder={t('workOrderDetail.csAconditionsPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA10')}</FieldLabel><input style={INPUT_BASE} type="date" value={controlSheet.completionDate} onChange={(e) => handleCsField('completionDate', e.target.value)} /></div>
            <div><FieldLabel>{t('workOrderDetail.csA11')}</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 160 }} type="number" value={controlSheet.laDamages} onChange={(e) => handleCsField('laDamages', e.target.value)} placeholder="$" /><span style={{ fontSize: 13, color: '#64748B' }}>{t('workOrderDetail.perDay')}</span></div></div>
            <div><FieldLabel>{t('workOrderDetail.csA12')}</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 120 }} type="number" value={controlSheet.retentionPercent} onChange={(e) => handleCsField('retentionPercent', e.target.value)} placeholder="%" /><span style={{ fontSize: 12, color: '#94A3B8' }}>{t('workOrderDetail.csA12note')}</span></div></div>
            <div><FieldLabel>{t('workOrderDetail.csA13')}</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={controlSheet.retentionLimit} onChange={(e) => handleCsField('retentionLimit', e.target.value)} placeholder="$" /></div>
            <div><FieldLabel>{t('workOrderDetail.csA14')}</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={controlSheet.subRetention} onChange={(e) => handleCsField('subRetention', e.target.value)} placeholder="$" /></div>
            <div><FieldLabel>{t('workOrderDetail.csA15')}</FieldLabel><input style={INPUT_BASE} type="date" value={controlSheet.retentionReleaseDate} onChange={(e) => handleCsField('retentionReleaseDate', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('csA', 'completed'); setCsAPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> {t('workOrderDetail.confirmCsA')}
            </button>
            <button onClick={() => setCsAPopupOpen(false)} style={BTN_SECONDARY}>{t('common.cancel')}</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Control Sheet Part B Popup ── */}
      {csBPopupOpen && (
        <ModalOverlay onClose={() => setCsBPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileText size={20} color="#B45309" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('workOrderDetail.csBTitle')}</span>
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
            {t('workOrderDetail.csBMsg', { sum: `$${csATotal.toLocaleString()}` })}
          </div>

          {/* Funding Table */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '30%' }}>{t('workOrderDetail.csBcentre')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '25%' }}>{t('workOrderDetail.csBfunding')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '25%' }}>{t('workOrderDetail.csBhkd')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '15%' }}>{t('workOrderDetail.csBauth')}</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {csBRows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.centre} onChange={(e) => csBRowField(idx, 'centre', e.target.value)} placeholder={t('workOrderDetail.csBcentrePh')} />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.funding} onChange={(e) => csBRowField(idx, 'funding', e.target.value)} placeholder={t('workOrderDetail.csBfundingPh')} />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12, textAlign: 'right' }} type="number" value={row.hkd} onChange={(e) => csBRowField(idx, 'hkd', e.target.value)} placeholder={t('workOrderDetail.csBhkdPh')} />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.auth} onChange={(e) => csBRowField(idx, 'auth', e.target.value)} placeholder={t('workOrderDetail.csBauthPh')} />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {csBRows.length > 1 && (
                        <button onClick={() => setCsBRows((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC' }}>
                  <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border)' }}>{t('workOrderDetail.total')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border)' }}>${csBTotal.toLocaleString()}</td>
                  <td style={{ borderTop: '2px solid var(--border)' }}></td>
                  <td style={{ borderTop: '2px solid var(--border)' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button onClick={() => setCsBRows((prev) => [...prev, { centre: '', funding: '', hkd: '', auth: '' }])}
            style={{ ...BTN_SECONDARY, fontSize: 12, padding: '6px 14px', marginBottom: 20 }}>
            <Plus size={14} /> {t('workOrderDetail.addRow')}
          </button>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button onClick={() => { setItem('csB', 'completed'); setCsBPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> {t('workOrderDetail.confirmCsB')}
            </button>
            <button onClick={() => setCsBPopupOpen(false)} style={BTN_SECONDARY}>{t('common.cancel')}</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── EOT Popup ── */}
      {eotPopupOpen && (
        <ModalOverlay onClose={() => setEotPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('workOrderDetail.eotTitle')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>{t('workOrderDetail.eotReason')}</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={eot.reason} onChange={(e) => setEot((p) => ({ ...p, reason: e.target.value }))} placeholder={t('workOrderDetail.eotReasonPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.eotDays')}</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={eot.days} onChange={(e) => setEot((p) => ({ ...p, days: e.target.value }))} placeholder={t('workOrderDetail.eotDaysPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.eotNewDate')}</FieldLabel><input style={INPUT_BASE} type="date" value={eot.newDate} onChange={(e) => setEot((p) => ({ ...p, newDate: e.target.value }))} /></div>
            <div><FieldLabel>{t('workOrderDetail.eotRemarks')}</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={eot.remarks} onChange={(e) => setEot((p) => ({ ...p, remarks: e.target.value }))} placeholder={t('workOrderDetail.eotRemarksPh')} /></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('eot', 'completed'); setEotPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> {t('workOrderDetail.eotSubmit')}
            </button>
            <button onClick={() => setEotPopupOpen(false)} style={BTN_SECONDARY}>{t('common.cancel')}</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── V.O. Popup ── */}
      {voPopupOpen && (
        <ModalOverlay onClose={() => setVoPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Plus size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('workOrderDetail.voTitle')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>{t('workOrderDetail.voDesc')}</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={vo.description} onChange={(e) => setVo((p) => ({ ...p, description: e.target.value }))} placeholder={t('workOrderDetail.voDescPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.voAmount')}</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={vo.amount} onChange={(e) => setVo((p) => ({ ...p, amount: e.target.value }))} placeholder={t('workOrderDetail.voAmountPh')} /></div>
            <div><FieldLabel>{t('workOrderDetail.voJust')}</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={vo.justification} onChange={(e) => setVo((p) => ({ ...p, justification: e.target.value }))} placeholder={t('workOrderDetail.voJustPh')} /></div>
            <div>
              <FieldLabel>{t('workOrderDetail.voApprovalStatus')}</FieldLabel>
              <select style={{ ...INPUT_BASE, padding: '8px 12px' }} value={vo.status} onChange={(e) => setVo((p) => ({ ...p, status: e.target.value }))}>
                <option value="Pending">{t('workOrderDetail.voStatusPending')}</option>
                <option value="Approved">{t('workOrderDetail.voStatusApproved')}</option>
                <option value="Rejected">{t('workOrderDetail.voStatusRejected')}</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('vo', 'completed'); setVoPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> {t('workOrderDetail.vo')}
            </button>
            <button onClick={() => setVoPopupOpen(false)} style={BTN_SECONDARY}>{t('common.cancel')}</button>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}
