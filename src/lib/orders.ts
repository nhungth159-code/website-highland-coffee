export type OrderStatus =
  | "pending"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

export interface StoredOrder {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    notes: string;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
    img: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  status: OrderStatus;
}

const KEY = "highlands_orders";

export const saveOrder = (order: StoredOrder): void => {
  const existing = getOrders();
  existing.unshift(order);
  localStorage.setItem(KEY, JSON.stringify(existing));
};

export const getOrders = (): StoredOrder[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const updateOrderStatus = (id: string, status: OrderStatus): StoredOrder[] => {
  const orders = getOrders().map((o) => (o.id === id ? { ...o, status } : o));
  localStorage.setItem(KEY, JSON.stringify(orders));
  return orders;
};
