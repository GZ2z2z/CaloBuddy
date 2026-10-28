import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { FoodItem } from '@/types';
import { db } from '@/db';

export function useFoodSearch() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    db.foods.toArray().then(setFoods);
  }, []);

  useEffect(() => {
    db.foods
      .orderBy('lastUsedAt')
      .reverse()
      .limit(10)
      .toArray()
      .then((items) => setRecentFoods(items.filter((f) => f.lastUsedAt)));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(foods, {
        keys: [
          { name: 'name', weight: 0.5 },
          { name: 'pinyinIndex', weight: 0.3 },
          { name: 'nameEn', weight: 0.2 },
        ],
        threshold: 0.3,
        minMatchCharLength: 1,
      }),
    [foods],
  );

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const searchResults = fuse.search(q, { limit: 20 });
      setResults(searchResults.map((r) => r.item));
    },
    [fuse],
  );

  return { query, search, results, recentFoods, setQuery };
}
