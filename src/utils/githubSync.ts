import { db } from '@/db';
import type { UserProfile, DailyLog, FoodItem } from '@/types';

interface SyncPayload {
  version: number;
  exportedAt: string;
  profile: UserProfile;
  logs: DailyLog[];
  customFoods: FoodItem[];
}

const GIST_FILENAME = 'calobuddy-sync-data.json';

/**
 * Upload all local database records to a private GitHub Gist
 */
export async function uploadToGist(
  token: string,
  existingGistId?: string
): Promise<{ gistId: string }> {
  const profiles = await db.profile.toArray();
  const profile = profiles[0];
  if (!profile) throw new Error('未找到用户资料');

  const logs = await db.dailyLogs.toArray();
  const customFoods = await db.foods
    .where('source')
    .anyOf(['USER_CUSTOM', 'OCR_SCANNED'])
    .toArray();

  const payload: SyncPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    logs,
    customFoods,
  };

  const bodyData = {
    description: 'CaloBuddy 个人私有饮食与减脂数据同步',
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  };

  let gistId = existingGistId;
  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  if (gistId) {
    // Update existing Gist
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(bodyData),
    });
    if (!res.ok) {
      if (res.status === 404) {
        // Gist was deleted or invalid, fallback to create
        gistId = undefined;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '更新 Gist 失败');
      }
    }
  }

  if (!gistId) {
    // Create new Gist
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '创建 Gist 失败，请检查 Token 权限');
    }
    const json = await res.json();
    gistId = json.id;
  }

  // Update profile with gistId and lastSyncAt
  await db.profile.update(profile.id!, {
    gistId,
    lastSyncAt: Date.now(),
  });

  return { gistId: gistId! };
}

/**
 * Download data from GitHub Gist and merge into local IndexedDB
 */
export async function downloadFromGist(
  token: string,
  gistId: string
): Promise<{ logCount: number }> {
  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github+json',
  };

  const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error('无法拉取云端数据，请检查 Gist ID 和 Token');
  }

  const json = await res.json();
  const file = json.files?.[GIST_FILENAME];
  if (!file || !file.content) {
    throw new Error('Gist 中未找到 CaloBuddy 数据文件');
  }

  const payload: SyncPayload = JSON.parse(file.content);

  // Bulk put logs
  if (payload.logs && payload.logs.length > 0) {
    await db.dailyLogs.bulkPut(payload.logs);
  }

  // Bulk put custom foods
  if (payload.customFoods && payload.customFoods.length > 0) {
    await db.foods.bulkPut(payload.customFoods);
  }

  // Update profile
  const profiles = await db.profile.toArray();
  const currentProfile = profiles[0];
  if (currentProfile && payload.profile) {
    await db.profile.update(currentProfile.id!, {
      ...payload.profile,
      id: currentProfile.id,
      gistId,
      githubSyncToken: token,
      lastSyncAt: Date.now(),
    });
  }

  return { logCount: payload.logs?.length ?? 0 };
}
