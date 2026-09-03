import { Filter } from 'lucide-react';

export default function FilterBar({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'visible', padding: '12px 16px', marginBottom: 12, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Filter size={14} color="#64748B" />
        {children}
      </div>
    </div>
  );
}
