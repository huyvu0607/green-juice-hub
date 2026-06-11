import axiosInstance from "./axiosConfig";

const reviewApi = {
  createReview: (data) =>
    axiosInstance.post("/reviews", data).then((r) => r.data),

  getProductReviews: (productId, page = 0, size = 5, rating = null) =>
    axiosInstance
        .get(`/reviews/product/${productId}`, {
            params: {
                page, size,
                sort: "createdAt,desc",
                ...(rating ? { rating } : {})  // chỉ gửi nếu có filter
            }
        })
        .then((r) => r.data),

  getProductRating: (productId) =>
    axiosInstance.get(`/reviews/product/${productId}/rating`).then((r) => r.data),

  hasReviewed: (orderId, productId) =>
    axiosInstance
      .get("/reviews/check", { params: { orderId, productId } })
      .then((r) => r.data),
};

export default reviewApi;