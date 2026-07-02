import api from "./axiosConfig";

export const adminProductApi = {
    // ── Products ──────────────────────────────────────────────────────────────
    getProducts: (params) => api.get("/admin/products", { params }),
    getProduct: (id) => api.get(`/admin/products/${id}`),
    createProduct: (data) => api.post("/admin/products", data),
    updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
    toggleActive: (id) => api.patch(`/admin/products/${id}/toggle-active`),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`),
    restoreProduct: (id) => api.post(`/admin/products/${id}/restore`),

    // ── Variants ──────────────────────────────────────────────────────────────
    createVariant: (productId, data) => api.post(`/admin/products/${productId}/variants`, data),
    updateVariant: (variantId, data) => api.put(`/admin/products/variants/${variantId}`, data),
    deleteVariant: (variantId) => api.delete(`/admin/products/variants/${variantId}`),

    // ── Categories ────────────────────────────────────────────────────────────
    getCategories: () => api.get("/admin/products/categories"),
    createCategory: (data) => api.post("/admin/products/categories", data),
    updateCategory: (id, data) => api.put(`/admin/products/categories/${id}`, data),
    toggleCategoryActive: (id) => api.patch(`/admin/products/categories/${id}/toggle-active`),
    deleteCategory: (id) => api.delete(`/admin/products/categories/${id}`),


    // ── Flavors ───────────────────────────────────────────────────────────────
    getFlavors: () => api.get("/admin/products/flavors"),
    createFlavor: (data) => api.post("/admin/products/flavors", data),
    updateFlavor: (id, data) => api.put(`/admin/products/flavors/${id}`, data),
    toggleFlavorActive: (id) => api.patch(`/admin/products/flavors/${id}/toggle-active`),
    deleteFlavor: (id) => api.delete(`/admin/products/flavors/${id}`),


    // ── Sizes ─────────────────────────────────────────────────────────────────
    getSizes: () => api.get("/admin/products/sizes"),
    createSize: (data) => api.post("/admin/products/sizes", data),
    updateSize: (id, data) => api.put(`/admin/products/sizes/${id}`, data),
    toggleSizeActive: (id) => api.patch(`/admin/products/sizes/${id}/toggle-active`),
    deleteSize: (id) => api.delete(`/admin/products/sizes/${id}`),


    // ── Tags ──────────────────────────────────────────────────────────────────
    getTags: () => api.get("/admin/tags"),
    createTag: (name) => api.post("/admin/tags", { name }),
    deleteTag: (id) => api.delete(`/admin/tags/${id}`),
    toggleTag: (id) => api.patch(`/admin/tags/${id}/toggle`),
};