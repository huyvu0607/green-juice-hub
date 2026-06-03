import { useState, useEffect, useCallback } from "react";
import { getProductBySlug } from "@/api/productApi";

export function useProductDetail(slug) {
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchDetail = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getProductBySlug(slug)
      .then((r) => setProduct(r.data))
      .catch((err) => setError(err?.response?.data?.message ?? "Không tìm thấy sản phẩm"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { product, loading, error, refetch: fetchDetail };
}