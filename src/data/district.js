export const HK_DISTRICTS = [
  'Islands',
  'Kwai Tsing',
  'North',
  'Sai Kung',
  'Sha Tin',
  'Tai Po',
  'Tsuen Wan',
  'Tuen Mun',
  'Yuen Long',
  'Kowloon City',
  'Kwun Tong',
  'Sham Shui Po',
  'Wong Tai Sin',
  'Yau Tsim Mong',
  'Central & Western',
  'Eastern',
  'Southern',
  'Wan Chai',
];

const DISTRICT_MATCHES = [
  ['Islands', ['tung chung', 'lantau', 'cheung chau', 'discovery bay', 'peng chau', 'lamma']],
  ['Yuen Long', ['yuen long', 'tin shui wai', 'tin shui']],
  ['Kwun Tong', ['kwun tong', 'kowloon bay', 'ngau tau kok', 'lam tin']],
  ['Sham Shui Po', ['sham shui po', 'shek kip mei', 'cheung sha wan', 'lai chi kok', 'yen chow street', 'la chi street']],
  ['Southern', ['aberdeen', 'stanley', 'repulse bay', 'pokfulam', 'ap lei chau', 'wong chuk hang']],
  ['Wan Chai', ['wan chai', 'causeway bay', 'leighton road', 'johnston road', 'happy valley', 'tin hau']],
  ['Central & Western', ['central', 'sheung wan', 'sai ying pun', 'sai wan', 'kennedy town', 'queen\'s road west', 'connaught']],
  ['Eastern', ['north point', 'quarry bay', 'shau kei wan', 'chai wan', 'taikoo', 'fortress hill']],
  ['Sai Kung', ['sai kung', 'tseung kwan o', 'hang hau', 'po lam']],
  ['Kowloon City', ['kowloon city', 'hung hom', 'to kwa wan', 'ma tau kok', 'kai tak']],
  ['Yau Tsim Mong', ['yau ma tei', 'tsim sha tsui', 'mong kok', 'prince edward', 'jordan']],
  ['Wong Tai Sin', ['wong tai sin', 'lok fu', 'diamond hill', 'ngau chi wan']],
  ['Kwai Tsing', ['kwai chung', 'tsing yi', 'kwai fong']],
  ['Tsuen Wan', ['tsuen wan', 'lei muk shue']],
  ['Tuen Mun', ['tuen mun', 'castle peak']],
  ['Sha Tin', ['sha tin', 'ma on shan', 'fo tan', 'tai wai']],
  ['Tai Po', ['tai po', 'fanling', 'ta kwu ling']],
  ['North', ['sheung shui', 'fanling', 'ta kwa ling', 'kwu tung']],
];

export function deriveDistrict(address) {
  const a = String(address || '').toLowerCase();
  if (!a) return 'Unknown';
  for (const [district, keywords] of DISTRICT_MATCHES) {
    if (keywords.some((k) => a.includes(k))) return district;
  }
  return 'Unknown';
}
