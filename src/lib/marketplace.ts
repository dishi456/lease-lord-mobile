export const CATEGORIES = [
  "Furniture", "Sofa", "Bed", "Mattress", "Dining Table", "Study Table", "Chair",
  "Refrigerator", "Washing Machine", "Television", "Microwave", "Kitchen Appliances",
  "Electronics", "Bicycle", "Home Decor", "Books", "Miscellaneous",
];
export const CONDITIONS = [
  { k: "NEW", l: "New" }, { k: "LIKE_NEW", l: "Like new" }, { k: "GOOD", l: "Good" }, { k: "FAIR", l: "Fair" },
];
export const condLabel = (k: string) => CONDITIONS.find((c) => c.k === k)?.l ?? k;
