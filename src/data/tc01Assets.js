import floor4 from '../assets/floormaps/4F.jpg';
import floor5 from '../assets/floormaps/5F.jpg';

export const PROPERTY = {
  id: 13,
  unitCode: 'TC-01',
  name: '保良局東涌護老院',
  unit: 'Elderly Home',
};

export const FLOORS = [
  { key: '3F', label: '3F' },
  { key: '4F', label: '4F', image: floor4 },
  { key: '5F', label: '5F', image: floor5 },
];

export const EQUIPMENT_CATEGORIES = ['櫃', '冷氣/風扇/抽氣扇', '煮食設備'];

const FLOOR_3F_ROOMS = [
  '廚房',
  '女廁/303',
  '浴室/304',
  '男廁/305',
  '傷殘廁/306',
  '洗衣房',
  '倉/310',
  '更衣室/311',
  '更衣室/312',
  '儲物倉/313',
  '倉/314',
  '治療室/315',
  '多功能廳/316,317',
  '三樓正門大廳',
  '護理及康健經理室/318',
  '護理站/319',
  '辦公室/320',
  '營運經理/321',
  '面談室/322',
  '會議室/323',
  '診症房室/324',
  '配藥房/325',
  '小組室/326',
  '電制房/327',
  '聚賢軒/328',
  '悅容室/331',
  '傷殘廁所/333',
  '社工室/334',
  '儲物倉/336',
  '隔離室/A12',
  '廁所/A14',
  '面談室/A15',
];

const FLOOR_4F_ROOMS = [
  '4樓飯廳',
  '傷殘廁所/A3',
  '長者房間/401',
  '長者房間/403',
  '長者房間/405',
  '長者房間/407',
  '長者房間/409',
  '長者房間/411',
  '長者房間/413',
  '長者房間/415',
  '長者房間/417',
  '長者房間/419',
  '長者房間/421',
  '長者房間/423',
  '大浴室/A5',
  '寧養室/A6',
  '懐舊閣',
  '隔離室/B7',
  '廁所/B9',
  '面談室/B10',
];

const FLOOR_5F_ROOMS = [
  '5樓飯廳',
  '傷殘廁所/B13',
  '長者房間/501',
  '長者房間/503',
  '長者房間/505',
  '長者房間/507',
  '長者房間/509',
  '長者房間/511',
  '長者房間/513',
  '長者房間/515',
  '長者房間/517',
  '長者房間/519',
  '長者房間/521',
  '長者房間/523',
  '長者房間/525',
  '大浴室/B4',
  '儲物室',
  '隔離室/B7b',
  '廁所/B9b',
  '面談室/B10b',
];

export const TC01_ROOMS = [
  ...FLOOR_3F_ROOMS.map((r) => ({ floor: '3F', name: r })),
  ...FLOOR_4F_ROOMS.map((r) => ({ floor: '4F', name: r })),
  ...FLOOR_5F_ROOMS.map((r) => ({ floor: '5F', name: r })),
];

// ---------------------------------------------------------------------------
// Asset builders
// ---------------------------------------------------------------------------

let seq = 0;
function nextId(floor, roomName, category) {
  seq += 1;
  const roomNum = roomName.replace(/\D/g, '') || '00';
  const catCode = category === '櫃' ? 'CP' : category === '煮食設備' ? 'CK' : 'AC';
  return `TC01-${floor}-${roomNum}-${catCode}${String(seq).padStart(2, '0')}`;
}

function buildAsset({ floor, room, category, qty = 1, installYear = 2011, renovation = null }) {
  if (!qty || qty <= 0) return null;
  return {
    id: nextId(floor, room, category),
    propertyId: PROPERTY.id,
    propertyCode: PROPERTY.unitCode,
    propertyName: PROPERTY.name,
    floor,
    room,
    category,
    equipment: category === '櫃' ? '櫃' : category === '煮食設備' ? '煮食設備' : '冷氣機/風扇/抽氣扇',
    qty,
    installYear,
    renovation: renovation || '',
    status: 'Operational',
    condition: 'Good',
    lastService: '',
    nextService: '',
    serviceHistory: [],
  };
}

const rooms = {
  '3F': FLOOR_3F_ROOMS,
  '4F': FLOOR_4F_ROOMS,
  '5F': FLOOR_5F_ROOMS,
};

// Default counts per category kind. Rooms with dedicated equipment get explicit
// qty so the registry reflects the real 東涌護老院 inventory.
const kitchenRooms = ['廚房', '4樓飯廳', '5樓飯廳'];

export const TC01_ASSETS = [];
FLOORS.forEach(({ key }) => {
  rooms[key].forEach((room) => {
    const isKitchen = kitchenRooms.includes(room);
    const qtyCupboard = isKitchen ? 6 : 2; // 櫃 (kitchen wardrobes higher)
    const qtyAc = isKitchen ? 0 : 1; // 冷氣 in kitchen (extractor instead)
    const qtyCook = isKitchen ? 2 : 0; // 煮食設備 only in cooking rooms

    const items = [
      buildAsset({ floor: key, room, category: '櫃', qty: qtyCupboard }),
      buildAsset({ floor: key, room, category: '冷氣/風扇/抽氣扇', qty: qtyAc }),
      buildAsset({ floor: key, room, category: '煮食設備', qty: qtyCook }),
    ].filter(Boolean);

    // Cooking rooms get a recent renovation (matches Excel).
    if (isKitchen) {
      items.forEach((a) => {
        a.renovation = '更換廚房爐具設備 2022';
        a.installYear = 2011;
      });
    }

    TC01_ASSETS.push(...items);
  });
});
