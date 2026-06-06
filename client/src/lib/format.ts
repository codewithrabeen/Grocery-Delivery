export const formatPrice = (amount: number) => `Rs. ${Math.round(amount).toLocaleString("en-NP")}`;

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

export const normalizeText = (value: string) => value.trim().toLowerCase();

