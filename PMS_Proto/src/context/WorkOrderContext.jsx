import { createContext, useContext, useState } from 'react';
import { WORK_ORDERS, CONTRACTORS, CONTRACTS, generateWOHistory } from '../data/constants';

const MAX_EXISTING_NUM = Math.max(
  ...WORK_ORDERS.map((wo) => parseInt(wo.id.split('-')[2], 10))
);

const WorkOrderContext = createContext({
  workOrders: [],
  contracts: [],
  contractors: [],
  addWorkOrder: () => {},
  updateWorkOrderStatus: () => {},
  deleteWorkOrder: () => {},
  getNextWoId: () => '',
  updateControlSheet: () => {},
});

export function WorkOrderProvider({ children }) {
  const [workOrders, setWorkOrders] = useState([...WORK_ORDERS]);
  const [controlSheets, setControlSheets] = useState({});
  const [nextNum, setNextNum] = useState(MAX_EXISTING_NUM + 1);

  const getNextWoId = () => {
    const num = nextNum;
    setNextNum((n) => n + 1);
    return `WO-2026-${String(num).padStart(4, '0')}`;
  };

  const addWorkOrder = (wo) => {
    setWorkOrders((prev) => [wo, ...prev]);
  };

  const updateWorkOrderStatus = (woId, newStatus) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === woId ? { ...wo, status: newStatus } : wo))
    );
  };

  const deleteWorkOrder = (woId) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== woId));
  };

  const updateControlSheet = (woId, data) => {
    setControlSheets((prev) => ({ ...prev, [woId]: { ...(prev[woId] || {}), ...data } }));
  };

  const getControlSheet = (woId) => controlSheets[woId] || null;

  const woWithHistory = workOrders.map((wo) => ({
    ...wo,
    history: generateWOHistory(wo),
  }));

  return (
    <WorkOrderContext.Provider value={{
      workOrders: woWithHistory,
      contracts: CONTRACTS,
      contractors: CONTRACTORS,
      addWorkOrder,
      updateWorkOrderStatus,
      deleteWorkOrder,
      getNextWoId,
      updateControlSheet,
      getControlSheet,
    }}>
      {children}
    </WorkOrderContext.Provider>
  );
}

export function useWorkOrders() {
  return useContext(WorkOrderContext);
}
