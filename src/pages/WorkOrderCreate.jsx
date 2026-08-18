import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CENTERS } from '../data/constants';
import {
  ArrowLeft, Save, X, MapPin, Plus, Pencil, Image, Paperclip, Trash2,
  ChevronDown, ChevronRight, Map, AlertTriangle, Info,
} from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: '#64748B' },
  { value: 'medium', label: 'Medium Priority', color: 'var(--info)' },
  { value: 'high', label: 'High Priority', color: '#B45309' },
  { value: 'critical', label: 'Critical Priority', color: 'var(--critical)' },
];

const FUNDING_SOURCES = [
  'Select Funding Code / Grant',
  'AMSL-2026-CAPEX',
  'GOV-MAINT-GRANT',
  'SSD-OPS-BUDGET',
  'PWD-TECH-FUND',
  'FIRE-SAFE-CERT',
  'BUILD-MAINT-FUND',
];

const MOCK_ASSETS = [
  {
    id: 1,
    name: '惠而浦 10KG 前置式洗衣機',
    tag: 'DS56-A-2020-006',
    location: 'Laundry Area',
    attachment: 'laundry_setup.jpg',
    remarks: 'test',
  },
];

export default function WorkOrderCreate({ onBack }) {
  const { permissions } = useAuth();
  const today = 'Tuesday, 18 August 2026';
  const portfolio = '\u5029\u6587\u73B2(\u6DF1\u6C34\u57D7)\u5152\u7AE5\u53D1\u5C55\u4E2D\u5FC3';

  const [form, setForm] = useState({
    title: '',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: '',
    fundingSource: 0,
    pwdInvolvement: 'without',
  });

  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [editingTask, setEditingTask] = useState(null);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [section1Open, setSection1Open] = useState(true);
  const [section2Open, setSection2Open] = useState(true);
  const [iasHovered, setIasHovered] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Page Header Bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)', flexShrink: 0,
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569',
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Work Order Tracking</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
              {today} &middot; Portfolio: {portfolio}
            </div>
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
              background: 'var(--info-bg)', border: '1px solid rgba(37,99,235,0.2)',
              fontSize: 13, fontWeight: 600, color: 'var(--info)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Plus size={14} /> Create New Work Order Request
            </div>
            <div style={{
              padding: '7px 14px', borderRadius: 6,
              background: '#fff', border: '1px solid var(--border)',
              fontSize: 12, color: '#475569',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Map size={14} color="var(--info)" />
              Asset Location Tracker Mode | Portfolio: Central Children Development Centre
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button
              onClick={onBack}
              style={{
                padding: '7px 16px', borderRadius: 6,
                border: '1px solid var(--border)', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <X size={14} /> Cancel
            </button>
            <div
              onMouseEnter={() => setIasHovered(true)}
              onMouseLeave={() => setIasHovered(false)}
              style={{ position: 'relative' }}
            >
              <button
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: '1px solid #7C3AED', background: '#F5F3FF',
                  fontSize: 13, fontWeight: 600, color: '#7C3AED', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Info size={14} /> Create in IAS
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
                    <Info size={14} color="#A78BFA" /> IAS Integration
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li>After all parties have endorsed the work order, this button will appear.</li><li>Once clicked, the WO status updates to <span style={{ color: '#A78BFA', fontWeight: 600 }}>"Submitted to IAS for Tendering"</span> and the WO becomes <span style={{ color: '#F87171', fontWeight: 600 }}>read-only</span>.</li>
                    <li>When clicked, it sends an API call to IAS with the endorsed WO details, so the user can continue input in IAS for the approval process (e.g. Tender analysis, quotation, etc.).</li>
                    <li>When the WO is approved in IAS, the user can return to this system to continue the WO process (e.g. assign tasks, schedule, etc.).</li>
                    
                  </ul>
                  <div style={{
                    position: 'absolute', top: -5, right: 16,
                    width: 10, height: 10, background: '#0F172A',
                    transform: 'rotate(45deg)',
                  }} />
                </div>
              )}
            </div>
            <button
              style={{
                padding: '7px 16px', borderRadius: 6,
                border: 'none', background: 'var(--primary)',
                fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Save size={14} /> Save & Exit
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* Section 1: Administrative Details */}
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
            marginBottom: 24, overflow: 'hidden',
          }}>
            {/* Section Header - Collapsible */}
            <div
              onClick={() => setSection1Open(!section1Open)}
              style={{
                padding: '16px 24px', borderBottom: section1Open ? '1px solid var(--border)' : 'none',
                background: '#F8FAFC', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>1</span>
                Administrative Details
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!section1Open && (
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Click to expand</span>
                )}
                <ChevronDown
                  size={16} color="#94A3B8"
                  style={{ transform: section1Open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                />
              </div>
            </div>

            {/* Form Fields */}
            {section1Open && (<div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Work Order Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g., Urgent Repair Request"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 13,
                    outline: 'none', background: '#fff',
                    color: form.title ? 'var(--foreground)' : '#94A3B8',
                  }}
                />
              </div>

              {/* Priority + Dates Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                {/* Priority Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Urgency / Priority Level
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setPriorityOpen(!priorityOpen)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 13,
                        background: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: 'var(--foreground)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: PRIORITY_OPTIONS.find((p) => p.value === form.priority)?.color,
                        }} />
                        {PRIORITY_OPTIONS.find((p) => p.value === form.priority)?.label}
                      </span>
                      <ChevronDown size={14} color="#94A3B8" />
                    </button>
                    {priorityOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setPriorityOpen(false)} />
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                          background: '#fff', border: '1px solid var(--border)',
                          borderRadius: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
                          zIndex: 100, overflow: 'hidden',
                        }}>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => { update('priority', opt.value); setPriorityOpen(false); }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px',
                                background: form.priority === opt.value ? 'var(--info-bg)' : 'transparent',
                                border: 'none', cursor: 'pointer', fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 8,
                                color: 'var(--foreground)',
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Start Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update('startDate', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 13,
                      outline: 'none', background: '#fff', color: 'var(--foreground)',
                    }}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    End Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => update('endDate', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 13,
                      outline: 'none', background: '#fff', color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>

              {/* Budget + Funding + PWD Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                {/* Budget */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Estimated Budget ($)
                  </label>
                  <input
                    value={form.budget}
                    onChange={(e) => update('budget', e.target.value)}
                    placeholder="Enter amount in HKD"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 13,
                      outline: 'none', background: '#fff',
                      color: form.budget ? 'var(--foreground)' : '#94A3B8',
                    }}
                  />
                </div>

                {/* Funding Source */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Initial Funding Source
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setFundingOpen(!fundingOpen)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 13,
                        background: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: form.fundingSource === 0 ? '#94A3B8' : 'var(--foreground)',
                      }}
                    >
                      <span>{FUNDING_SOURCES[form.fundingSource]}</span>
                      <ChevronDown size={14} color="#94A3B8" />
                    </button>
                    {fundingOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setFundingOpen(false)} />
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                          background: '#fff', border: '1px solid var(--border)',
                          borderRadius: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
                          zIndex: 100, overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
                        }}>
                          {FUNDING_SOURCES.map((src, idx) => (
                            <button
                              key={src}
                              onClick={() => { update('fundingSource', idx); setFundingOpen(false); }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px',
                                background: form.fundingSource === idx ? 'var(--info-bg)' : 'transparent',
                                border: 'none', cursor: 'pointer', fontSize: 13,
                                color: idx === 0 ? '#94A3B8' : 'var(--foreground)',
                                fontWeight: form.fundingSource === idx ? 600 : 400,
                              }}
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* PWD Involvement */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    PWD Involvement
                  </label>
                  <div style={{
                    display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden',
                  }}>
                    {[
                      { value: 'without', label: 'Without PWD' },
                      { value: 'with', label: 'With PWD' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => update('pwdInvolvement', value)}
                        style={{
                          flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: 600,
                          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                          background: form.pwdInvolvement === value ? 'var(--primary)' : '#F8FAFC',
                          color: form.pwdInvolvement === value ? '#fff' : '#64748B',
                          borderRight: value === 'without' ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
            overflow: 'hidden',
          }}>
            {/* Section Header - Collapsible */}
            <div
              onClick={() => setSection2Open(!section2Open)}
              style={{
                padding: '16px 24px', borderBottom: section2Open ? '1px solid var(--border)' : 'none',
                background: '#F8FAFC', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>2</span>
                Selected Assets & Items List ({assets.length} Items)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {section2Open && (
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '7px 14px', borderRadius: 6,
                      border: '1px dashed var(--info)', background: 'var(--info-bg)',
                      fontSize: 12, fontWeight: 600, color: 'var(--info)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add Asset / Item via Floor Plan Map
                  </button>
                )}
                {!section2Open && (
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Click to expand</span>
                )}
                <ChevronDown
                  size={16} color="#94A3B8"
                  style={{ transform: section2Open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                />
              </div>
            </div>

            {/* Asset Cards */}
            {section2Open && (<div style={{ padding: 20 }}>
              {assets.length === 0 ? (
                <div style={{
                  padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14,
                  border: '2px dashed var(--border)', borderRadius: 8,
                }}>
                  <Map size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <div>No assets selected yet. Use the floor plan to add assets.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {assets.map((asset) => (
                    <div key={asset.id} style={{
                      border: '1px solid var(--border)', borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                      {/* Asset Card Content */}
                      <div style={{ padding: 20 }}>
                        {/* Asset Title Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 10,
                            background: 'var(--info-bg)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <AlertTriangle size={22} color="var(--info)" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                              {asset.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Tag: {asset.tag}
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 12px', background: '#F8FAFC', borderRadius: 6,
                          marginBottom: 12,
                        }}>
                          <MapPin size={14} color="#64748B" />
                          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{asset.location}</span>
                        </div>

                        {/* Attachment */}
                        {asset.attachment && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', background: '#F8FAFC', borderRadius: 8,
                            marginBottom: 12,
                          }}>
                            <div style={{
                              width: 56, height: 42, borderRadius: 6,
                              background: '#E2E8F0', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Image size={20} color="#94A3B8" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                                {asset.attachment}
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Attached image</div>
                            </div>
                            <button style={{
                              padding: '4px 8px', borderRadius: 4,
                              border: '1px solid var(--border)', background: '#fff',
                              cursor: 'pointer', fontSize: 11, color: '#64748B',
                            }}>
                              <Paperclip size={12} />
                            </button>
                          </div>
                        )}

                        {/* Remarks */}
                        <div style={{
                          padding: '8px 12px', background: '#F8FAFC', borderRadius: 6,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 3 }}>
                            Remarks
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--foreground)' }}>
                            {asset.remarks || 'No remarks'}
                          </div>
                        </div>
                      </div>

                      {/* Asset Card Footer */}
                      <div style={{
                        padding: '10px 20px', borderTop: '1px solid var(--border)',
                        background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <button
                          onClick={() => setEditingTask(editingTask === asset.id ? null : asset.id)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            border: '1px solid var(--border)', background: '#fff',
                            fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <Pencil size={13} /> Edit Task Details
                        </button>
                        <div style={{ flex: 1 }} />
                        <button style={{
                          padding: '6px 10px', borderRadius: 6,
                          border: '1px solid var(--border)', background: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}>
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </div>

                      {/* Edit Task Details Panel */}
                      {editingTask === asset.id && (
                        <div style={{
                          borderTop: '1px solid var(--border)',
                          padding: 20, background: '#F8FAFC',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Pencil size={14} color="var(--info)" /> Task Details
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Task Description</label>
                              <textarea
                                rows={3}
                                defaultValue="Describe the work required for this asset..."
                                style={{
                                  width: '100%', padding: '10px 14px', borderRadius: 8,
                                  border: '1px solid var(--border)', fontSize: 13,
                                  outline: 'none', background: '#fff', resize: 'vertical',
                                  fontFamily: 'Inter, sans-serif',
                                }}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Skill Required</label>
                                <select style={{
                                  width: '100%', padding: '9px 12px', borderRadius: 8,
                                  border: '1px solid var(--border)', fontSize: 13,
                                  outline: 'none', background: '#fff',
                                }}>
                                  <option>General Maintenance</option>
                                  <option>Electrical</option>
                                  <option>Plumbing</option>
                                  <option>HVAC</option>
                                  <option>Fire Safety</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Estimated Hours</label>
                                <input
                                  type="number"
                                  defaultValue={4}
                                  style={{
                                    width: '100%', padding: '9px 12px', borderRadius: 8,
                                    border: '1px solid var(--border)', fontSize: 13,
                                    outline: 'none', background: '#fff',
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Parts / Materials Needed</label>
                              <input
                                defaultValue=""
                                placeholder="List required parts..."
                                style={{
                                  width: '100%', padding: '9px 12px', borderRadius: 8,
                                  border: '1px solid var(--border)', fontSize: 13,
                                  outline: 'none', background: '#fff',
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setEditingTask(null)}
                                style={{
                                  padding: '7px 14px', borderRadius: 6,
                                  border: '1px solid var(--border)', background: '#fff',
                                  fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button style={{
                                padding: '7px 14px', borderRadius: 6,
                                border: 'none', background: 'var(--primary)',
                                fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
                              }}>
                                Save Task Details
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>

          {/* Bottom Spacing */}
          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
