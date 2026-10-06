import SystemSetting from '../models/SystemSetting.js';

export async function getSetting(key, fallback = null) {
  const row = await SystemSetting.findOne({ key }).lean();
  return row ? row.value : fallback;
}
