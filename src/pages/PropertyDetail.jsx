import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, User, Phone, Mail, ShieldCheck, AlertTriangle, CheckCircle, Clock, Package, ClipboardList, ChevronDown, ChevronUp, Hammer, Database } from 'lucide-react';
import { PROPERTIES, COMPLIANCE_DOCS, getDocStatus, ASSETS, WORK_ORDERS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { TC01_ROOMS, MIGRATED_RENOVATIONS } from '../sample/tc01SampleData';
import { useAssets } from '../context/AssetsContext';

const RENOVATION_WINDOW_YEARS = 5;

export default function PropertyDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { assets: tc01Assets } = useAssets();
  const [expandedSection, setExpandedSection] = useState({ compliance: true, attachments: false, wo: false, assets: false, renovation: false });
  const prop = PROPERTIES.find((p) => String(p.id) === String(id));

  if (!prop) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('propertyDetail.back')}
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>Property not found</div>
      </div>
    );
  }

  const isTC01 = prop.unitCode === 'TC-01';
  const propDocs = COMPLIANCE_DOCS.filter((d) => d.center === prop.name);
  const propAssets = isTC01 ? tc01Assets : ASSETS.filter((a) => a.location === prop.name);
  const propWOs = isTC01 ? MIGRATED_RENOVATIONS : WORK_ORDERS.filter((w) => w.center === prop.name);

  const validDocs = propDocs.filter((d) => getDocStatus(d.nextInspection) === 'Valid').length;
  const expiringDocs = propDocs.filter((d) => getDocStatus(d.nextInspection) === 'Expiring').length;
  const expiredDocs = propDocs.filter((d) => getDocStatus(d.nextInspection) === 'Expired').length;

  const toggleSection = (key) => setExpandedSection((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentYear = new Date().getFullYear();
  const migrationByRoom = {};
  MIGRATED_RENOVATIONS.forEach((m) => {
    migrationByRoom[`${m.floor}|${m.room}`] = m;
  });
  const renovationRows = TC01_ROOMS.map((r) => {
    const m = migrationByRoom[`${r.floor}|${r.name}`] || null;
    const lastYear = m ? m.year : null;
    const nextAllowed = lastYear === null ? null : lastYear + RENOVATION_WINDOW_YEARS;
    const eligible = nextAllowed === null ? true : nextAllowed <= currentYear;
    return { floor: r.floor, room: r.name, migration: m, lastYear, nextAllowed, eligible };
  }).sort((a, b) => (a.floor === b.floor ? a.room.localeCompare(b.room, 'zh-Hant') : a.floor.localeCompare(b.floor)));
  const eligibleCount = renovationRows.filter((r) => r.eligible).length;
  const notEligibleCount = renovationRows.length - eligibleCount;

  const statusColors = {
    Valid: { bg: 'var(--success-bg)', color: 'var(--success)' },
    Expiring: { bg: '#FEF3C7', color: '#B45309' },
    Expired: { bg: '#FEE2E2', color: '#DC2626' },
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('propertyDetail.back')}
      </button>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 6, background: 'linear-gradient(90deg, var(--info), var(--primary))' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={24} color="var(--info)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{prop.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{prop.service}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: 'var(--info-bg)', color: 'var(--info)', fontFamily: 'monospace' }}>{prop.unitCode}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: prop.lsgNlsg === 'LSG' ? '#EFF6FF' : prop.lsgNlsg === 'NLSG' ? '#F0FDFA' : '#FFF7ED', color: prop.lsgNlsg === 'LSG' ? '#1E40AF' : prop.lsgNlsg === 'NLSG' ? '#0D9488' : '#EA580C' }}>{prop.lsgNlsg}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748B', fontSize: 13 }}>
              <MapPin size={14} /> {prop.address}
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid + Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Property Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow icon={<Building2 size={14} />} label="Service" value={prop.service} />
            <InfoRow icon={<Building2 size={14} />} label="Unit Code" value={prop.unitCode} />
            <InfoRow icon={<Building2 size={14} />} label="Unit" value={prop.unit} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Contact Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow icon={<User size={14} />} label="Contact Person" value={prop.contact} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Phone size={14} color="#94A3B8" />
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
                <a href={`tel:${prop.phone}`} style={{ fontSize: 13, color: 'var(--info)', textDecoration: 'none', fontWeight: 500 }}>{prop.phone}</a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color="#94A3B8" />
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                <a href={`mailto:${prop.email}`} style={{ fontSize: 13, color: 'var(--info)', textDecoration: 'none', fontWeight: 500 }}>{prop.email}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} color="var(--success)" /></div>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>{validDocs}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Valid</div></div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: expiringDocs > 0 ? '#FEF3C7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={20} color={expiringDocs > 0 ? '#B45309' : '#94A3B8'} /></div>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: expiringDocs > 0 ? '#B45309' : '#94A3B8' }}>{expiringDocs}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Expiring Soon</div></div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: expiredDocs > 0 ? '#FEE2E2' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} color={expiredDocs > 0 ? '#DC2626' : '#94A3B8'} /></div>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: expiredDocs > 0 ? '#DC2626' : '#94A3B8' }}>{expiredDocs}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Expired</div></div>
        </div>
      </div>

      {/* Compliance Documents */}
      <SectionHeader title="Compliance Documents" count={propDocs.length} icon={<ShieldCheck size={16} />} expanded={expandedSection.compliance} toggle={() => toggleSection('compliance')} />
      {expandedSection.compliance && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {['Document', 'Category', 'Ref', 'Inspected', 'Next Inspection', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {propDocs.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{doc.name}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{doc.category}</span></td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{doc.documentRef}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{doc.inspectionDate}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{doc.nextInspection}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {(() => { const s = getDocStatus(doc.nextInspection); return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: statusColors[s]?.bg, color: statusColors[s]?.color }}>{s}</span>; })()}
                  </td>
                </tr>
              ))}
              {propDocs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No compliance documents for this property</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Renovation History (Floor / Room) */}
      {isTC01 && (
        <>
          <SectionHeader title={t('propertyDetail.renovation.title')} count={renovationRows.length} icon={<Hammer size={16} />} expanded={expandedSection.renovation} toggle={() => toggleSection('renovation')} />
          {expandedSection.renovation && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
                <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={14} color="var(--info)" />
                  <span>{t('propertyDetail.renovation.migrated')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{t('propertyDetail.renovation.eligibleCount', { count: eligibleCount })}</div>
                <div style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>{t('propertyDetail.renovation.notEligibleCount', { count: notEligibleCount })}</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {[t('propertyDetail.renovation.property'), t('propertyDetail.renovation.floor'), t('propertyDetail.renovation.room'), t('propertyDetail.renovation.latest'), t('propertyDetail.renovation.year'), t('propertyDetail.renovation.nextAllowed'), t('propertyDetail.renovation.eligibility')].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renovationRows.map((row) => (
                    <tr key={`${row.floor}|${row.room}`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--foreground)' }}>{prop.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#475569' }}>{row.floor}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--foreground)' }}>{row.room}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: row.migration ? '#334155' : '#94A3B8' }}>{row.migration ? `${row.migration.title} (${row.migration.id})` : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: row.lastYear === null ? '#94A3B8' : '#334155' }}>{row.lastYear === null ? '—' : row.lastYear}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: row.nextAllowed === null ? '#94A3B8' : '#334155' }}>{row.nextAllowed === null ? '—' : row.nextAllowed}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {row.eligible
                          ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: 'var(--success-bg)', color: 'var(--success)' }}>{t('propertyDetail.renovation.eligible')}</span>
                          : <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#FEF3C7', color: '#B45309' }}>{t('propertyDetail.renovation.notEligible', { year: row.nextAllowed })}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Related Work Orders */}
      <SectionHeader title="Work Orders" count={propWOs.length} icon={<ClipboardList size={16} />} expanded={expandedSection.wo} toggle={() => toggleSection('wo')} />
      {expandedSection.wo && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Title', 'Priority', 'Status', 'Due Date'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {propWOs.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{wo.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--foreground)' }}>
                    {wo.title}
                    {wo.floor && wo.room && <div style={{ fontSize: 11, color: '#94A3B8' }}>{wo.floor} &middot; {wo.room}</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {wo.source === 'data-migration'
                      ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: 'var(--info-bg)', color: 'var(--info)' }}>{t('propertyDetail.renovation.migratedTag')}</span>
                      : <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : wo.priority === 'Medium' ? 'var(--info-bg)' : '#F1F5F9', color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : wo.priority === 'Medium' ? 'var(--info)' : '#64748B' }}>{wo.priority}</span>}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{wo.source === 'data-migration' ? t('propertyDetail.renovation.migratedStatus') : wo.status}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{wo.year ?? wo.dueDate}</td>
                </tr>
              ))}
              {propWOs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No work orders for this property</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Related Assets */}
      <SectionHeader title="Assets" count={propAssets.length} icon={<Package size={16} />} expanded={expandedSection.assets} toggle={() => toggleSection('assets')} />
      {expandedSection.assets && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Name', 'Type', 'Status', 'Last Service', 'Next Service'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {propAssets.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{a.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--foreground)' }}>
                    {a.name || `${a.room || ''} — ${a.category || ''}`}
                    {a.floor && <div style={{ fontSize: 11, color: '#94A3B8' }}>{a.floor} &middot; {a.room}</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{a.type || a.category}</span></td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: a.status === 'Operational' ? 'var(--success-bg)' : a.status === 'Needs Inspection' ? '#FEF3C7' : '#FEE2E2', color: a.status === 'Operational' ? 'var(--success)' : a.status === 'Needs Inspection' ? '#B45309' : '#DC2626' }}>{a.status}</span></td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{a.lastService || a.installYear || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{a.nextService || '—'}</td>
                </tr>
              ))}
              {propAssets.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No assets at this property</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: '#94A3B8' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, icon, expanded, toggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }} onClick={toggle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ color: 'var(--info)' }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{title}</span>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({count})</span>
      </div>
      {expanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
    </div>
  );
}
