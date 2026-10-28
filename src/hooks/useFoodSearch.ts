import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Fuse from 'fuse.js';
import type { FoodItem } from '@/types';
import { db } from '@/db';

export function useFoodSearch() {
  const allFoods = useLiveQuery(() => db.foods.toArray(), []) ?? [];
  const recentFoods = (
    useLiveQuery(
      () => db.foods.orderBy('lastUsedAt').reverse().limit(20).toArray(),
      [],
    ) ?? []
  ).filter((f) => f.lastUsedAt);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);

  const fuse = useMemo(
    () =>
      new Fuse(allFoods, {
        keys: [
          { name: 'name', weight: 0.5 },
          { name: 'pinyinIndex', weight: 0.35 },
          { name: 'nameEn', weight: 0.15 },
        ],
        threshold: 0.35,
        minMatchCharLength: 1,
      }),
    [allFoods],
  );

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const searchResults = fuse.search(q, { limit: 50 });
      setResults(searchResults.map((r) => r.item));
    },
    [fuse],
  );

  return { query, search, results, recentFoods, allFoods, setQuery };
}
