// ---------------------------------------------------------------------------
// SAMPLE / DEMO SEED DATA — 東涌護老院 (TC-01)
// ---------------------------------------------------------------------------
// This module contains the TC-01 elderly home asset registry used ONLY to
// demo the application. It is sample/demo data, NOT production data.
//
// Real assets will be entered into the system by users (via the Add Asset
// flow) and persisted in localStorage. The constants below merely seed the
// demo asset list so reviewers can see the pages populated.
//
// Do not treat this as the source of truth for real inventories.
// ---------------------------------------------------------------------------

import floor4 from '../assets/floormaps/4F.jpg';
import floor5 from '../assets/floormaps/5F.jpg';

// Marker that this module is demo/sample scaffolding, not real data.
export const IS_SAMPLE_DATA = true;
export const SAMPLE_ASSET_SOURCE = 'demo-sample';

export const PROPERTY = {
  id: 13,
  unitCode: 'TC-01',
  name: '保良局東涌護老院',
  unit: 'Elderly Home',
};

// Seed floor plans for the TC-01 demo. These are treated like any other
// user-entered floor once seeded: they are stored in localStorage and the
// user can add, edit, or delete floors through the Floor Plan page. The 3F/4F/5F
// floors and all TC-01 assets are kept (mapped together) — nothing is deleted.
export const FLOORS = [
  { key: '3F', label: '3F', propertyCode: PROPERTY.unitCode },
  { key: '4F', label: '4F', propertyCode: PROPERTY.unitCode, image: floor4 },
  { key: '5F', label: '5F', propertyCode: PROPERTY.unitCode, image: floor5 },
];

// 冷氣/風扇/抽氣扇 is not stored in PMS anymore, so it is no longer a valid
// equipment category. Only equipment that PMS tracks is exposed.
export const EQUIPMENT_CATEGORIES = ['櫃', '煮食設備'];

// Per-room inventory from 東涌護老院_房間及傢俱表.xlsx (機電及傢俱數量).
// Sample data only — for demoing purposes.
// Each room lists, per equipment category, the quantity and the install/purchase
// year, plus the most recent renovation project and year (if any).
// [n, year] means n units installed in `year`.
const INVENTORY = {
  '3F': [
    { room: '廚房', 櫃: [0, 2011], 冷氣: [1, 2018], 煮食: [1, 2011], project: '更換廚房爐具設備', projectYear: 2022 },
    { room: '女廁/303', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '浴室/304', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '男廁/305', 櫃: [0, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '傷殘廁/306', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '洗衣房', 櫃: [3, 2011], 冷氣: [6, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '倉/310', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '更衣室/311', 櫃: [1, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '更衣室/312', 櫃: [1, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '儲物倉/313', 櫃: [0, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '倉/314', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '治療室/315', 櫃: [1, 2011], 冷氣: [13, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '多功能廳/316,317', 櫃: [3, 2011], 冷氣: [6, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '三樓正門大廳', 櫃: [1, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '護理及康健經理室/318', 櫃: [1, 2011], 冷氣: [3, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣', projectYear: 2022 },
    { room: '護理站/319', 櫃: [1, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '辦公室/320', 櫃: [1, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '營運經理/321', 櫃: [2, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '面談室/322', 櫃: [3, 2024], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '會議室/323', 櫃: [2, 2011], 冷氣: [4, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '診症房室/324', 櫃: [1, 2011], 冷氣: [3, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '配藥房/325', 櫃: [2, 2011], 冷氣: [4, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '小組室/326', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '電制房/327', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '聚賢軒/328', 櫃: [0, 2011], 冷氣: [10, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '悅容室/331', 櫃: [1, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '傷殘廁所/333', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '社工室/334', 櫃: [2, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '儲物倉/336', 櫃: [0, 2011], 冷氣: [0, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '隔離室/A12', 櫃: [1, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '廁所/A14', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '面談室/A15', 櫃: [3, 2016], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
  ],
  '4F': [
    { room: '4樓飯廳', 櫃: [4, 2011], 冷氣: [7, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '傷殘廁所/A3', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '長者房間/401', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/403', 櫃: [12, 2011], 冷氣: [9, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/405', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '大浴室/A5', 櫃: [0, 2011], 冷氣: [3, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '寧養室/A6', 櫃: [1, 2011], 冷氣: [3, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '長者房間/407', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/409', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/411', 櫃: [2, 2011], 冷氣: [5, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/413', 櫃: [3, 2011], 冷氣: [6, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/415', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/417', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/419', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '長者房間/421', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '長者房間/423', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '懐舊閣', 櫃: [0, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '隔離室/B7', 櫃: [1, 2011], 冷氣: [2, 2011], 煮食: [0, 2011], project: '更換地𥱊', projectYear: 2022 },
    { room: '廁所/B9', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '面談室/B10', 櫃: [3, 2016], 冷氣: [1, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
  ],
  '5F': [
    { room: '5樓飯廳', 櫃: [3, 2011], 冷氣: [5, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '傷殘廁所/B13', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '長者房間/501', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/503', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/505', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '大浴室/B4', 櫃: [0, 2011], 冷氣: [3, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '儲物室', 櫃: [0, 2011], 冷氣: [1, 2011], 煮食: [0, 2011], project: null, projectYear: null },
    { room: '長者房間/507', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '長者房間/509', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '長者房間/511', 櫃: [8, 2011], 冷氣: [7, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/513', 櫃: [8, 2011], 冷氣: [7, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/515', 櫃: [8, 2011], 冷氣: [7, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/517', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '長者房間/519', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/521', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
    { room: '長者房間/523', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、冷氣、油漆', projectYear: 2022 },
    { room: '長者房間/525', 櫃: [10, 2011], 冷氣: [8, 2011], 煮食: [0, 2011], project: '更換地𥱊、油漆', projectYear: 2022 },
  ],
};

export const TC01_ROOMS = Object.entries(INVENTORY).flatMap(([floor, rooms]) =>
  rooms.map((r) => ({ floor, name: r.room }))
);

// ---------------------------------------------------------------------------
// Asset builders — each physical unit becomes its own asset row.
// (Sample data expansion for the demo.)
// ---------------------------------------------------------------------------

let seq = 0;
function nextId(floor, roomName, category) {
  seq += 1;
  const roomNum = roomName.replace(/\D/g, '') || '00';
  const catCode = category === '櫃' ? 'CP' : 'CK';
  return `TC01-${floor}-${roomNum}-${catCode}${String(seq).padStart(2, '0')}`;
}

function buildAsset({ floor, room, category, installYear }) {
  return {
    id: nextId(floor, room, category),
    propertyId: PROPERTY.id,
    propertyCode: PROPERTY.unitCode,
    propertyName: PROPERTY.name,
    floor,
    room,
    category,
    equipment: category,
    installYear,
    status: 'Operational',
    condition: 'Good',
    lastService: '',
    nextService: '',
    serviceHistory: [],
  };
}

export const TC01_ASSETS = [];
Object.entries(INVENTORY).forEach(([floor, rooms]) => {
  rooms.forEach(({ room, 櫃, 煮食 }) => {
    const groups = [
      [櫃, '櫃'],
      [煮食, '煮食設備'],
    ];
    groups.forEach(([[count, year], category]) => {
      for (let i = 0; i < count; i += 1) {
        TC01_ASSETS.push(buildAsset({ floor, room, category, installYear: year }));
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Migrated renovation work orders (reference only)
// ---------------------------------------------------------------------------
// The room renovation history (project + year) in the Excel sample was migrated
// into the system as work orders for REFERENCE / PLANNING only. These records:
//   - were NOT created by a user,
//   - did NOT go through the normal work-order system process,
//   - are flagged `source: 'data-migration'` so the UI can label them clearly.
// Users use them to plan future renovations under the policy that a room cannot
// be renovated again within 5 years of its last renovation.
let migSeq = 0;
export const MIGRATED_RENOVATIONS = [];
Object.entries(INVENTORY).forEach(([floor, rooms]) => {
  rooms.forEach(({ room, project, projectYear }) => {
    if (!project || !projectYear) return;
    migSeq += 1;
    MIGRATED_RENOVATIONS.push({
      id: `MIG-TC01-${floor}-${String(migSeq).padStart(2, '0')}`,
      propertyCode: PROPERTY.unitCode,
      propertyName: PROPERTY.name,
      floor,
      room,
      title: project,
      year: projectYear,
      source: 'data-migration',
    });
  });
});
