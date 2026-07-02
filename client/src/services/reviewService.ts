import api from "../config/api";

export type ProductReview = {
  id: string;
  userId?: string;
  productId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
};

type ReviewsResponse = {
  review?: ProductReview;
  reviews?: ProductReview[];
};

export const reviewService = {
  async getProductReviews(productId: string) {
    const { data } = await api.get<ReviewsResponse>(`/reviews/product/${productId}`);
    return data.reviews ?? [];
  },

  async saveReview(payload: {
    productId: string;
    orderId?: string;
    rating: number;
    comment?: string;
  }) {
    const { data } = await api.post<ReviewsResponse>("/reviews", payload);
    return data.review;
  },

  async updateReview(id: string, payload: { rating?: number; comment?: string }) {
    const { data } = await api.put<ReviewsResponse>(`/reviews/${id}`, payload);
    return data.review;
  },

  async deleteReview(id: string) {
    await api.delete(`/reviews/${id}`);
  },
};
