import { createContext, useContext, useState, useCallback } from 'react';
import { COMPLIANCE_DOCS as INITIAL_DOCS } from '../data/constants';
import { getDocStatus } from '../data/complianceDocs';

const ComplianceContext = createContext({
  docs: [],
  addDoc: () => {},
  updateDoc: () => {},
  removeDoc: () => {},
});

function computeStatus(doc) {
  return getDocStatus(doc.nextInspection, doc.inspectionDate, doc.cycleMonths);
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
