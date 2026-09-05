/**
 * Pre-default AI Vector Avatar Generator & Presets
 * Generates deterministic, high-quality vector AI avatars using Dicebear Avataaars & Lorelei
 * No third-party photos / Unsplash dependencies.
 */
export function getAiAvatar(seed?: string, style: 'avataaars' | 'lorelei' | 'bottts' = 'avataaars'): string {
  const cleanSeed = (seed || 'User').trim();
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(cleanSeed)}`;
}

export interface PresetVectorAvatar {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const PRESET_VECTOR_AVATARS: PresetVectorAvatar[] = [
  { id: 'vec_1', name: 'Executive Alex', category: 'Executive', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=System' },
  { id: 'vec_2', name: 'Amara', category: 'Creative', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara' },
  { id: 'vec_3', name: 'Jordan', category: 'Tech', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { id: 'vec_4', name: 'Taylor', category: 'Creative', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
  { id: 'vec_5', name: 'Morgan', category: 'Executive', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan' },
  { id: 'vec_6', name: 'Riley', category: 'Tech', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley' },
  { id: 'vec_7', name: 'Avery', category: 'Specialist', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery' },
  { id: 'vec_8', name: 'Sam', category: 'Creative', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
  { id: 'vec_9', name: 'Casey', category: 'Executive', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey' },
  { id: 'vec_10', name: 'Quinn', category: 'Tech', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn' },
  { id: 'vec_11', name: 'Kai', category: 'Specialist', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
  { id: 'vec_12', name: 'Rowan', category: 'Creative', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rowan' },
  { id: 'vec_13', name: 'Cyber Nova', category: 'Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova' },
  { id: 'vec_14', name: 'Pixel Apex', category: 'Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex' },
  { id: 'vec_15', name: 'Studio Maya', category: 'Modern', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya' },
  { id: 'vec_16', name: 'Studio Leo', category: 'Modern', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo' },
];


