export declare const Role: {
    readonly CUSTOMER: "CUSTOMER";
    readonly ADMIN: "ADMIN";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const OrderStatus: {
    readonly PENDING: "PENDING";
    readonly PAID: "PAID";
    readonly SHIPPING: "SHIPPING";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export declare const PaymentProvider: {
    readonly VNPAY: "VNPAY";
    readonly MOMO: "MOMO";
    readonly COD: "COD";
};
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];
export declare const PaymentStatus: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
};
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
