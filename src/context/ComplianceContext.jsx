import { createContext, useContext, useState, useCallback } from 'react';
import { COMPLIANCE_DOCS as INITIAL_DOCS } from '../data/constants';

const ComplianceContext = createContext({
  docs: [],
  addDoc: () => {},
  updateDoc: () => {},
  removeDoc: () => {},
});

function computeStatus(doc) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(doc.expiry);
  const next = new Date(doc.nextInspection);
  if (exp < today) return 'Expired';
  const diffDays = (next - today) / (1000 * 60 * 60 * 24);
  if (diffDays <= 30) return 'Expiring';
  return 'Valid';
}

export function ComplianceProvider({ children }) {
  const [docs, setDocs] = useState(() =>
    INITIAL_DOCS.map((d) => ({ ...d, status: computeStatus(d), removed: false }))
  );

  const addDoc = useCallback((newDoc) => {
    setDocs((prev) => {
      const maxId = Math.max(0, ...prev.map((d) => d.id));
      const doc = { ...newDoc, id: maxId + 1, status: computeStatus(newDoc), removed: false };
      return [doc, ...prev];
    });
  }, []);

  const updateDoc = useCallback((id, updates) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        updated.status = computeStatus(updated);
        return updated;
      })
    );
  }, []);

  const removeDoc = useCallback((id) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, removed: true } : d)));
  }, []);

  return (
    <ComplianceContext.Provider value={{ docs, addDoc, updateDoc, removeDoc }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  return useContext(ComplianceContext);
}
