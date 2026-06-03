import { useState, useEffect, useCallback, useRef } from "react";
import { getProducts, getCategories, getFlavors, getSizes } from "@/api/productApi";

const DEFAULT_FILTER = {
  page: 0,
  size: 12,
  categoryId: null,
  keyword: "",
  sortBy: "newest",
  minRating: null,
  minPrice: "",
  maxPrice: "",
  tags: [],
  flavorIds: [],
  sizeIds: [],
  inStock: null,
  onSale: null,
};

// ── Helpers ──────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall < limit) return;
    lastCall = now;
    return fn(...args);
  };
}
// ─────────────────────────────────────────────────────────────

export function useProducts() {
  const [filter, setFilter]           = useState(DEFAULT_FILTER);
  const [products, setProducts]       = useState([]);
  const [totalElements, setTotal]     = useState(0);
  const [hasMore, setHasMore]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories, setCategories] = useState([]);
  const [flavors, setFlavors]       = useState([]);
  const [sizes, setSizes]           = useState([]);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  // Load filter options một lần
  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(() => {});
    getFlavors().then(r => setFlavors(r.data)).catch(() => {});
    getSizes().then(r => setSizes(r.data)).catch(() => {});
  }, []);

  // Fetch products — debounce 300ms để tránh spam khi gõ input
  const fetchProducts = useCallback(
    debounce((params) => {
      setLoading(true);
      setProducts([]);
      getProducts(params)
        .then(r => {
          setProducts(r.data.content);
          setTotal(r.data.totalElements);
          setHasMore(!r.data.last);
          setFilter(prev => ({ ...prev, page: 0 }));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300),
    []
  );

  useEffect(() => {
    const params = buildParams({ ...filter, page: 0 });
    fetchProducts(params);
    return () => fetchProducts.cancel();
  }, [
    filter.categoryId, filter.keyword, filter.sortBy, filter.minRating,
    filter.minPrice, filter.maxPrice, filter.tags, filter.flavorIds,
    filter.sizeIds, filter.inStock, filter.onSale,
  ]);

  // Load thêm — throttle 1s để tránh IntersectionObserver bắn liên tục
  const loadMore = useCallback(
    throttle(() => {
      if (loadingMore || !hasMore) return;

      const nextPage = filterRef.current.page + 1;
      setLoadingMore(true);

      const params = buildParams({ ...filterRef.current, page: nextPage });
      getProducts(params)
        .then(r => {
          setProducts(prev => [...prev, ...r.data.content]);
          setHasMore(!r.data.last);
          setFilter(prev => ({ ...prev, page: nextPage }));
        })
        .catch(() => {})
        .finally(() => setLoadingMore(false));
    }, 1000),
    [loadingMore, hasMore]
  );

  // updateFilter thông thường — instant cho checkbox/radio/tag
  const updateFilter = useCallback((patch) => {
    setFilter(prev => ({ ...prev, ...patch }));
  }, []);

  const resetFilter = useCallback(() => setFilter(DEFAULT_FILTER), []);

  return {
    filter, products, totalElements, hasMore, loading, loadingMore,
    categories, flavors, sizes,
    updateFilter, loadMore, resetFilter,
  };
}

function buildParams(filter) {
  const raw = {
    ...filter,
    tags:      filter.tags?.length      ? filter.tags.join(",")      : undefined,
    flavorIds: filter.flavorIds?.length ? filter.flavorIds.join(",") : undefined,
    sizeIds:   filter.sizeIds?.length   ? filter.sizeIds.join(",")   : undefined,
  };
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) =>
      v !== null && v !== undefined && v !== "" &&
      !(Array.isArray(v) && v.length === 0)
    )
  );
}