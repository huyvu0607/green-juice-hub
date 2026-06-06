// useProducts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories, getFlavors, getSizes } from "@/api/productApi";

const PAGE_SIZE = 12;
const SESSION_KEY = "products_session";

const DEFAULT_FILTER = {
  page: 0,
  size: PAGE_SIZE,
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

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(page, scroll) {
  try {
    const prev = readSession() ?? {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...prev, page, scroll }));
  } catch { }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useProducts() {
  // ── Đọc keyword từ URL (?keyword=...) ───────────────────
  const [searchParams] = useSearchParams();
  const urlKeyword = searchParams.get("keyword") ?? "";

  const [filter, setFilter] = useState(() => {
    const s = readSession();
    return s?.filter
      ? { ...DEFAULT_FILTER, ...s.filter, page: s.page ?? 0, keyword: urlKeyword }
      : { ...DEFAULT_FILTER, keyword: urlKeyword };
  });

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

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(() => { });
    getFlavors().then(r => setFlavors(r.data)).catch(() => { });
    getSizes().then(r => setSizes(r.data)).catch(() => { });
  }, []);

  // ── Sync keyword từ URL vào filter ──────────────────────
  // Khi Header navigate với ?keyword=..., effect này bắt và cập nhật filter
  useEffect(() => {
    setFilter(prev => {
      if (prev.keyword === urlKeyword) return prev;
      clearSession();
      return { ...prev, keyword: urlKeyword, page: 0 };
    });
  }, [urlKeyword]);

  // ── Fetch ────────────────────────────────────────────────
  const fetchProducts = useCallback(
    debounce((params, restoredPage = 0) => {
      setLoading(true);
      setProducts([]);

      const fetchParams =
        restoredPage > 0
          ? { ...params, page: 0, size: (restoredPage + 1) * PAGE_SIZE }
          : { ...params, page: 0, size: PAGE_SIZE };

      getProducts(fetchParams)
        .then(r => {
          setProducts(r.data.content);
          setTotal(r.data.totalElements);
          const totalPages = Math.ceil(r.data.totalElements / PAGE_SIZE);
          setHasMore(restoredPage < totalPages - 1);
          setFilter(prev => ({ ...prev, page: restoredPage }));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }, 300),
    []
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    const session = isFirstMount.current ? readSession() : null;
    isFirstMount.current = false;

    const params = buildParams({ ...filter, page: 0 });

    if (session?.page > 0) {
      fetchProducts(params, session.page);
    } else {
      fetchProducts(params, 0);
    }

    return () => fetchProducts.cancel();
  }, [
    filter.categoryId,
    filter.keyword,       // ✅ keyword thay đổi → fetch lại
    filter.sortBy,
    filter.minRating,
    filter.minPrice,
    filter.maxPrice,
    filter.inStock,
    filter.onSale,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filter.tags?.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filter.flavorIds?.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filter.sizeIds?.join(","),
  ]);

  // ── Lưu scroll ───────────────────────────────────────────
  useEffect(() => {
    const handleScroll = throttle(() => {
      saveSession(filterRef.current.page, window.scrollY);
    }, 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Load thêm ────────────────────────────────────────────
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
          saveSession(nextPage, window.scrollY);
        })
        .catch(() => { })
        .finally(() => setLoadingMore(false));
    }, 1000),
    [loadingMore, hasMore]
  );

  // ── updateFilter ─────────────────────────────────────────
  const updateFilter = useCallback((patch) => {
    const isDataFilter = Object.keys(patch).some(k => k !== "_sidebarOpen");
    if (isDataFilter) clearSession();
    setFilter(prev => ({ ...prev, ...patch }));
  }, []);

  const resetFilter = useCallback(() => {
    clearSession();
    setFilter({ ...DEFAULT_FILTER, keyword: urlKeyword }); // giữ lại keyword từ URL
  }, [urlKeyword]);

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
