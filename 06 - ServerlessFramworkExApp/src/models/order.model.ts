export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totals: OrderTotals;
  shipping: ShippingInfo;
  payment: PaymentInfo;
  tracking?: TrackingInfo;
  metadata: OrderMetadata;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export interface ShippingInfo {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  method: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  reference?: string;
  processedAt?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: string;
  estimatedDelivery?: string;
}

export interface OrderMetadata {
  source: string;
  customerNotes?: string;
  internalNotes?: string;
  promotionCodes: string[];
  referralCode?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export interface CreateOrderRequest {
  userId: string;
  items: Omit<OrderItem, 'productName' | 'productSku' | 'totalPrice'>[];
  shipping: ShippingInfo;
  payment: Omit<PaymentInfo, 'status' | 'processedAt'>;
  metadata?: Partial<OrderMetadata>;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  shipping?: Partial<ShippingInfo>;
  payment?: Partial<PaymentInfo>;
  tracking?: TrackingInfo;
  metadata?: Partial<OrderMetadata>;
}

export interface OrderSearchCriteria {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAfter?: string;
  createdBefore?: string;
  totalMin?: number;
  totalMax?: number;
  limit?: number;
  lastKey?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  nextToken?: string;
  totalCount?: number;
}
