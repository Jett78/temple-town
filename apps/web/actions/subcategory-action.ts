"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Subcategory } from "@/types/category";

export async function getSubcategories(): Promise<Subcategory[]> {
  try {
    const response = await apiClient<{ data: Subcategory[] }>(
      `${API_ROUTES.SUBCATEGORY}?isActive=true&take=100`,
      { next: { revalidate: 300, tags: ["subcategories"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return [];
  }
}

export async function getSubcategoryById(id: string): Promise<Subcategory | null> {
  try {
    const response = await apiClient<{ data: Subcategory }>(
      `${API_ROUTES.SUBCATEGORY}/${id}`,
      { next: { tags: [`subcategory-${id}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return null;
  }
}
