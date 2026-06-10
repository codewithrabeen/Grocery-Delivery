import api from "../config/api";
import type { User } from "../types";

export type ProfileUpdate = Pick<User, "name" | "phone" | "avatar">;

export const profileService = {
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post<{ data?: string; url?: string }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data.data ?? data.url ?? "";
  },

  async updateProfile(update: ProfileUpdate) {
    const { data } = await api.put<{ user?: User }>("/auth/profile", update);
    return data.user;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },
};
