import { categoriesData } from "../assets/assets";

export const categories = categoriesData;

export const getCategoryName = (slug: string) =>
  categories.find((category) => category.slug === slug)?.name ?? "Groceries";
