import { useState, useMemo } from 'react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { COMPLIANCE_DOCS, PROPERTIES, ASSETS, WORK_ORDER_STATUSES } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  ClipboardList,
  Clock, CheckCircle, FileText,
  DollarSign, Package, Hammer, Wrench, Filter, X, ChevronDown,
} from 'lucide-react';

const CURRENT_YEAR = 2026;

const BUILDER_CATS = ['Concrete Repair', 'Waterproofing/Re-roofing Works', 'Painting', 'Tile Replacement', 'Vinyl Flooring Replacement', 'Timber Door/Cabinet Replacement', 'Timber Furring/Dado Replacement', 'Window Replacement', 'Replacement of False Ceiling', 'Replacement of Sanitary Fitments'];
const SERVICE_CATS = ['Air-conditioning/Ventilation System Addition/Replacement', 'Lighting/Electrical System Addition/Replacement', 'PD System Addition/Replacement', 'ELV System (Call Bell, PA, etc.) Addition/Replacement', 'Gas System Addition/Replacement'];

const PIE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

function Card({ title, children, style = {}, headerRight }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', ...style }}>
      {(title || headerRight) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

function KPISquare({ icon: Icon, iconBg, value, label, sub, color }) {
  return (
    <div style={{ flex: 1, minWidth: 155, background: '#fff', borderRadius: 12, padding: '18px 16px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color || iconBg} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</div>}
    </div>
  );
}

function FilterPill({ label, value, onClear }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'var(--info-bg)', fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
      {label}: {value}
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
    </div>
  );
}

function FilterDropdown({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const isAll = !selected || selected === 'All';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        border: `1px solid ${isAll ? 'var(--border)' : 'var(--primary)'}`,
        background: isAll ? '#fff' : 'var(--info-bg)', color: isAll ? '#64748B' : 'var(--primary)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {label} <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.12)', zIndex: 100, minWidth: 160, maxHeight: 240, overflowY: 'auto' }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setOpen(false); }} style={{
                width: '100%', textAlign: 'left', padding: '7px 12px', background: opt === selected ? 'var(--info-bg)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--foreground)', fontWeight: opt === selected ? 600 : 400,
              }}>{opt}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const ChartTooltipStyle = { contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' } };

export default function Dashboard({ selectedCenter }) {
  const { t } = useTranslation();
  const { workOrders, contracts, contractors } = useWorkOrders();

  // ── FILTERS ──────────────────────────────────────────
  const [districtFilter, setDistrictFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [contractorFilter, setContractorFilter] = useState('All');

  const serviceTypes = ['All', ...new Set(PROPERTIES.map((p) => p.service))];
  const lsgNlsgTypes = ['All', ...new Set(PROPERTIES.map((p) => p.lsgNlsg))];
  const workCategories = ['All', ...BUILDER_CATS, ...SERVICE_CATS];
  const contractorNames = ['All', ...contractors.map((c) => c.name)];

  const filteredWOs = useMemo(() => {
    let list = workOrders;
    if (selectedCenter && selectedCenter !== 'All') list = list.filter((w) => w.center === selectedCenter);
    if (districtFilter !== 'All') {
      const centreNames = PROPERTIES.filter((p) => p.service === districtFilter).map((p) => p.name);
      list = list.filter((w) => centreNames.includes(w.center));
    }
    if (typeFilter !== 'All') {
      const centreNames = PROPERTIES.filter((p) => p.lsgNlsg === typeFilter).map((p) => p.name);
      list = list.filter((w) => centreNames.includes(w.center));
    }
    if (categoryFilter !== 'All') list = list.filter((w) => w.category === categoryFilter);
    if (dateFrom) list = list.filter((w) => w.created >= dateFrom);
    if (dateTo) list = list.filter((w) => w.created <= dateTo);
    if (contractorFilter !== 'All') {
      const ctr = contractors.find((c) => c.name === contractorFilter);
      if (ctr) {
        const ctrWOs = contracts.filter((ct) => ct.contractorId === ctr.id).flatMap((ct) => ct.workOrders);
        list = list.filter((w) => ctrWOs.includes(w.id));
      }
    }
    return list;
  }, [workOrders, selectedCenter, districtFilter, typeFilter, categoryFilter, dateFrom, dateTo, contractorFilter, contractors, contracts]);

  const filteredDocs = useMemo(() => {
    let docs = COMPLIANCE_DOCS;
    if (selectedCenter && selectedCenter !== 'All') docs = docs.filter((d) => d.center === selectedCenter);
    if (districtFilter !== 'All') {
      const centreNames = PROPERTIES.filter((p) => p.service === districtFilter).map((p) => p.name);
      docs = docs.filter((d) => centreNames.includes(d.center));
    }
    return docs;
  }, [selectedCenter, districtFilter]);

  const hasFilters = districtFilter !== 'All' || typeFilter !== 'All' || categoryFilter !== 'All' || dateFrom || dateTo || contractorFilter !== 'All';
  const clearFilters = () => { setDistrictFilter('All'); setTypeFilter('All'); setCategoryFilter('All'); setDateFrom(''); setDateTo(''); setContractorFilter('All'); };

  // ── COMPUTED METRICS ─────────────────────────────────
  const activeWOs = filteredWOs.filter((w) => w.status !== 'Completed');
  const completedWOs = filteredWOs.filter((w) => w.status === 'Completed');
  const pendingApproval = filteredWOs.filter((w) => w.status.startsWith('Pending'));
  const underPWD = filteredWOs.filter((w) => w.status === 'Under PWD Grouping');
  const tendering = filteredWOs.filter((w) => w.status === 'Submitted to IAS for Tendering' || w.status === 'Approved IAS');
  const inProgress = filteredWOs.filter((w) => w.status === 'In Progress');

  const activeContracts = contracts.filter((c) => c.status === 'Active');
  const beingFormed = contracts.filter((c) => c.status === 'Being Formed');
  const totalContractSum = activeContracts.reduce((s, c) => s + c.contractSum, 0);

  const totalBudget = filteredWOs.reduce((s, w) => s + (w.budget || 0), 0);
  const committedCost = activeWOs.reduce((s, w) => s + (w.budget || 0), 0);
  const avgCost = filteredWOs.length > 0 ? Math.round(totalBudget / filteredWOs.length) : 0;

  const expiredDocs = filteredDocs.filter((d) => d.status === 'Expired');

  // Upcoming inspections (next 3 months)
  const today = new Date(CURRENT_YEAR, 7, 24);
  const threeMonths = new Date(CURRENT_YEAR, 10, 24);
  const upcomingInspections = filteredDocs.filter((d) => {
    const ni = new Date(d.nextInspection);
    return ni >= today && ni <= threeMonths;
  });

  // Equipment end-of-life (installed > 8 years)
  const eolAssets = ASSETS.filter((a) => CURRENT_YEAR - a.installYear >= 8);

  // ── CHART DATA ───────────────────────────────────────
  const statusData = WORK_ORDER_STATUSES.map((s) => ({
    name: s.length > 20 ? s.slice(0, 18) + '...' : s,
    fullName: s,
    count: filteredWOs.filter((w) => w.status === s).length,
  })).filter((d) => d.count > 0);

  const buildersBudget = filteredWOs.filter((w) => BUILDER_CATS.includes(w.category)).reduce((s, w) => s + (w.budget || 0), 0);
  const servicesBudget = filteredWOs.filter((w) => SERVICE_CATS.includes(w.category)).reduce((s, w) => s + (w.budget || 0), 0);
  const costByTypeData = [
    { name: t('dashboard.financial.buildersWorks'), value: buildersBudget },
    { name: t('dashboard.financial.buildingServices'), value: servicesBudget },
  ];

  const typeCounts = {};
  PROPERTIES.forEach((p) => { typeCounts[p.lsgNlsg] = (typeCounts[p.lsgNlsg] || 0) + 1; });
  const facilityByTypeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const serviceCounts = {};
  PROPERTIES.forEach((p) => { serviceCounts[p.service] = (serviceCounts[p.service] || 0) + 1; });
  const facilityByDistrictData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));

  const agingAssets = ASSETS.filter((a) => CURRENT_YEAR - a.installYear >= 8).sort((a, b) => a.installYear - b.installYear);
  const over30 = agingAssets.filter((a) => CURRENT_YEAR - a.installYear >= 15);

  // Top facilities by WO count
  const woByCenter = {};
  filteredWOs.forEach((w) => { woByCenter[w.center] = (woByCenter[w.center] || 0) + 1; });
  const topFacilities = Object.entries(woByCenter).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Monthly WO trend (last 12 months)
  const monthlyTrend = [];
  for (let m = 0; m < 12; m++) {
    const monthNum = (7 + m) % 12;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthWOs = filteredWOs.filter((w) => {
      const d = new Date(w.created);
      return d.getMonth() === monthNum && (m < 5 ? d.getFullYear() === CURRENT_YEAR : d.getFullYear() === CURRENT_YEAR - 1);
    });
    monthlyTrend.push({
      month: monthNames[monthNum],
      count: monthWOs.length,
      cost: monthWOs.reduce((s, w) => s + (w.budget || 0), 0),
    });
  }

  // Repeat failures — WOs with same category on same center
  const repeatMap = {};
  filteredWOs.filter((w) => w.status === 'Completed').forEach((w) => {
    const key = `${w.center}|||${w.category}`;
    if (!repeatMap[key]) repeatMap[key] = [];
    repeatMap[key].push(w);
  });
  const repeatFailures = Object.entries(repeatMap).filter(([, arr]) => arr.length >= 2).map(([key, arr]) => {
    const [center, category] = key.split('|||');
    return { center, category, count: arr.length };
  });

  // High-cost facilities
  const costByCenter = {};
  filteredWOs.forEach((w) => { costByCenter[w.center] = (costByCenter[w.center] || 0) + (w.budget || 0); });
  const highCostFacilities = Object.entries(costByCenter).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Spend vs Budget (simulated — 65% spent)
  const spentRatio = 0.65;
  const spentAmount = Math.round(totalBudget * spentRatio);

  const centreLabel = selectedCenter && selectedCenter !== 'All' ? selectedCenter : t('dashboard.allCentres');

  // ── RENDER ───────────────────────────────────────────
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1500 }}>
      {/* ── FILTER BAR ──────────────────────────────── */}
      <Card style={{ padding: '12px 16px', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={14} color="#64748B" />
          <FilterDropdown label={t('dashboard.filter.district')} options={serviceTypes} selected={districtFilter} onSelect={setDistrictFilter} />
          <FilterDropdown label={t('dashboard.filter.facilityType')} options={lsgNlsgTypes} selected={typeFilter} onSelect={setTypeFilter} />
          <FilterDropdown label={t('dashboard.filter.workCategory')} options={workCategories} selected={categoryFilter} onSelect={setCategoryFilter} />
          <FilterDropdown label={t('dashboard.filter.contractor')} options={contractorNames} selected={contractorFilter} onSelect={setContractorFilter} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
            <span>{t('dashboard.filter.from')}</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
            <span>{t('dashboard.filter.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--critical)', background: '#FEF2F2', color: 'var(--critical)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {t('dashboard.filter.clearAll')}
            </button>
          )}
        </div>
        {hasFilters && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {districtFilter !== 'All' && <FilterPill label={t('dashboard.filter.district')} value={districtFilter} onClear={() => setDistrictFilter('All')} />}
            {typeFilter !== 'All' && <FilterPill label={t('dashboard.filter.facilityType')} value={typeFilter} onClear={() => setTypeFilter('All')} />}
            {categoryFilter !== 'All' && <FilterPill label={t('dashboard.filter.workCategory')} value={categoryFilter} onClear={() => setCategoryFilter('All')} />}
            {contractorFilter !== 'All' && <FilterPill label={t('dashboard.filter.contractor')} value={contractorFilter} onClear={() => setContractorFilter('All')} />}
            {dateFrom && <FilterPill label={t('dashboard.filter.from')} value={dateFrom} onClear={() => setDateFrom('')} />}
            {dateTo && <FilterPill label={t('dashboard.filter.to')} value={dateTo} onClear={() => setDateTo('')} />}
          </div>
        )}
      </Card>

      {/* ── KPI ROW (Req 1) ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPISquare icon={ClipboardList} iconBg="var(--info-bg)" value={activeWOs.length} label={t('dashboard.overview.activeWO')} sub={`${filteredWOs.length} ${t('dashboard.kpi.openWO')} total`} color="var(--info)" />
        <KPISquare icon={Clock} iconBg="var(--warning-bg)" value={pendingApproval.length} label={t('dashboard.overview.pendingApproval')} color="#B45309" />
        <KPISquare icon={Wrench} iconBg="#EDE9FE" value={underPWD.length} label={t('dashboard.overview.underPWD')} color="#7C3AED" />
        <KPISquare icon={Package} iconBg="#FEF3C7" value={tendering.length} label={t('dashboard.overview.tendering')} color="#D97706" />
        <KPISquare icon={Hammer} iconBg="#ECFDF5" value={inProgress.length} label={t('dashboard.overview.inProgress')} color="#059669" />
        <KPISquare icon={CheckCircle} iconBg="var(--success-bg)" value={completedWOs.length} label={t('dashboard.overview.completed')} color="var(--success)" />
        <KPISquare icon={FileText} iconBg="#FCE7F3" value={activeContracts.length} label={t('dashboard.overview.contractsAwarded')} sub={`HK$ ${(totalContractSum / 1000).toFixed(0)}K`} color="#DB2777" />
        <KPISquare icon={DollarSign} iconBg="#FEF2F2" value={`HK$ ${(totalContractSum / 1000).toFixed(0)}K`} label={t('dashboard.overview.totalContractSum')} color="var(--critical)" />
      </div>

      {/* ── PIPELINE CHART (Req 2) ──────────────────── */}
      <Card title={t('dashboard.pipeline.title')}>
        <div style={{ padding: 20 }}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip {...ChartTooltipStyle} formatter={(val, name, props) => [val, props.payload.fullName]} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>{t('common.noData')}</div>
          )}
        </div>
      </Card>

      {/* ── FINANCIAL + CONTRACTS ROW (Req 7 + Req 3) ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Financial Overview */}
        <Card title={t('dashboard.financial.title')} style={{ flex: 3, minWidth: 400 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150, padding: 14, borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{t('dashboard.financial.totalBudget')}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>HK$ {totalBudget.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 150, padding: 14, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{t('dashboard.financial.totalCommitted')}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>HK$ {committedCost.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 150, padding: 14, borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{t('dashboard.financial.avgCostPerWO')}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>HK$ {avgCost.toLocaleString()}</div>
              </div>
            </div>
            {/* Spent vs Budget bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>{t('dashboard.financial.spentVsBudget')}</span>
                <span style={{ color: '#64748B' }}>HK$ {spentAmount.toLocaleString()} / HK$ {totalBudget.toLocaleString()}</span>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(spentRatio * 100, 100)}%`, borderRadius: 6, background: spentRatio > 0.8 ? 'var(--critical)' : spentRatio > 0.6 ? '#F59E0B' : 'var(--success)', transition: 'width 0.5s' }} />
              </div>
            </div>
            {/* Cost by type chart */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{t('dashboard.financial.costByType')}</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={costByTypeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} width={120} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [`HK$ ${v.toLocaleString()}`, '']} />
                  <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Contract Packaging (Req 3) */}
        <Card title={t('dashboard.contracts.title')} style={{ flex: 2, minWidth: 340 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {beingFormed.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.contracts.beingFormed')}</div>
                {beingFormed.map((c) => (
                  <div key={c.id} style={{ padding: 10, borderRadius: 8, border: '1px solid #FDE68A', background: '#FFFBEB', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {c.facilities.length} {t('dashboard.contracts.facilities').toLowerCase()} &middot; HK$ {c.contractSum.toLocaleString()}
                    </div>
                    {c.plannedTenderDate && <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>{t('dashboard.contracts.tenderDate')}: {c.plannedTenderDate}</div>}
                  </div>
                ))}
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.contracts.activeContracts')}</div>
              {activeContracts.map((c) => {
                const ctr = contractors.find((ct) => ct.id === c.contractorId);
                return (
                  <div key={c.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{c.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      <span>{t('dashboard.contracts.contractor')}: {ctr ? ctr.name : t('dashboard.contracts.noContractor')}</span>
                      <span>{t('dashboard.contracts.facilityCount', { count: c.facilities.length })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                      <span style={{ color: 'var(--foreground)' }}>HK$ {c.contractSum.toLocaleString()}</span>
                      <span style={{ color: '#64748B', fontSize: 11 }}>{t('dashboard.contracts.awardedDate')}: {c.awardedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── FACILITY SNAPSHOT + COMPLIANCE (Req 4 + Req 5) ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Facility & Asset Snapshot */}
        <Card title={t('dashboard.facility.title')} style={{ flex: 3, minWidth: 400 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* By Type */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{t('dashboard.facility.byType')}</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={facilityByTypeData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                      {facilityByTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...ChartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* By District */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{t('dashboard.facility.byDistrict')}</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={facilityByDistrictData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip {...ChartTooltipStyle} />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Aging Assets */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{t('dashboard.facility.agingBuildings')} <span style={{ fontWeight: 400, color: '#94A3B8' }}>({agingAssets.length} {t('dashboard.facility.over20yr')}, {over30.length} {t('dashboard.facility.over30yr')})</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {agingAssets.map((a) => {
                  const age = CURRENT_YEAR - a.installYear;
                  return (
                    <div key={a.id} style={{ padding: '6px 10px', borderRadius: 6, background: age >= 15 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${age >= 15 ? '#FECACA' : '#FDE68A'}`, fontSize: 11 }}>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{a.name}</span>
                      <span style={{ color: age >= 15 ? '#DC2626' : '#D97706', marginLeft: 4 }}>({age}yr)</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Top Maintenance Facilities */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{t('dashboard.facility.topMaintenance')}</div>
              {topFacilities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {topFacilities.map(([center, count], i) => {
                    const maxCount = topFacilities[0][1];
                    return (
                      <div key={center} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#94A3B8', width: 16, textAlign: 'right' }}>{i + 1}.</span>
                        <span style={{ fontSize: 11, color: 'var(--foreground)', width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{center.replace('PLK ', '')}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, borderRadius: 3, background: '#6366F1' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', width: 30 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{t('common.noData')}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Compliance + Equipment Alerts (Req 5) */}
        <Card title={t('dashboard.complianceAlerts')} style={{ flex: 2, minWidth: 320 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Overdue */}
            {expiredDocs.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.compliance.overdue')} ({expiredDocs.length})</div>
                {expiredDocs.slice(0, 3).map((doc) => (
                  <div key={doc.id} style={{ padding: 8, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{doc.center}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Upcoming */}
            {upcomingInspections.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.compliance.upcoming')} ({upcomingInspections.length})</div>
                {upcomingInspections.slice(0, 3).map((doc) => (
                  <div key={doc.id} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: '#FFFBEB', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#B45309' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{doc.nextInspection} &middot; {doc.center}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Equipment EOL */}
            {eolAssets.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.compliance.equipmentEOL')} ({eolAssets.length})</div>
                {eolAssets.map((a) => (
                  <div key={a.id} style={{ padding: 8, borderRadius: 6, border: '1px solid #EDE9FE', background: '#F5F3FF', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{t('dashboard.compliance.installYear')}: {a.installYear} ({CURRENT_YEAR - a.installYear} {t('dashboard.compliance.yearsOld')})</div>
                  </div>
                ))}
              </div>
            )}
            {expiredDocs.length === 0 && upcomingInspections.length === 0 && eolAssets.length === 0 && (
              <div style={{ padding: 16, borderRadius: 8, background: '#F0FDF4', textAlign: 'center' }}>
                <CheckCircle size={16} color="var(--success)" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{t('dashboard.allUpToDate')}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── PM INSIGHTS + MONTHLY TREND (Req 6) ────── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Monthly Trend */}
        <Card title={t('dashboard.pm.trend')} style={{ flex: 3, minWidth: 400 }}>
          <div style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip {...ChartTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#6366F1" fill="#E0E7FF" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Repeat Failures + High Cost */}
        <Card title={t('dashboard.pm.title')} style={{ flex: 2, minWidth: 320 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{t('dashboard.pm.repeatFailures')}</div>
              {repeatFailures.length > 0 ? (
                repeatFailures.map((r, i) => (
                  <div key={i} style={{ padding: 8, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{r.category}</span>
                    <span style={{ color: '#64748B' }}> @ {r.center.replace('PLK ', '')}</span>
                    <span style={{ float: 'right', fontWeight: 700, color: '#DC2626' }}>{r.count}x</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#94A3B8', padding: 8 }}>{t('dashboard.pm.noRepeatFailures')}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{t('dashboard.pm.highCost')}</div>
              {highCostFacilities.map(([center, cost], i) => (
                <div key={center} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 16 }}>{i + 1}.</span>
                  <span style={{ fontSize: 11, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{center.replace('PLK ', '')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>HK$ {cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── RECENT WORK ORDERS TABLE ────────────────── */}
      <Card title={t('dashboard.recentWO')} headerRight={<span style={{ fontSize: 12, color: '#94A3B8' }}>{centreLabel}</span>}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t('dashboard.col.id'), t('dashboard.col.title'), t('dashboard.col.priority'), t('dashboard.col.status'), t('dashboard.col.due')].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredWOs.slice(0, 8).map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{wo.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--foreground)' }}>{wo.title}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : wo.priority === 'Medium' ? 'var(--info-bg)' : '#F1F5F9',
                      color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : wo.priority === 'Medium' ? 'var(--info)' : '#64748B',
                    }}>{wo.priority}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: wo.status === 'Completed' ? 'var(--success-bg)' : wo.status === 'In Progress' ? '#ECFDF5' : wo.status.includes('Pending') ? 'var(--warning-bg)' : wo.status === 'Draft' ? '#F1F5F9' : '#EFF6FF',
                      color: wo.status === 'Completed' ? 'var(--success)' : wo.status === 'In Progress' ? '#059669' : wo.status.includes('Pending') ? '#B45309' : wo.status === 'Draft' ? '#64748B' : '#2563EB',
                    }}>{wo.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748B' }}>{wo.dueDate}</td>
                </tr>
              ))}
              {filteredWOs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{t('workOrders.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
