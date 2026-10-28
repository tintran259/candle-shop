import * as runtime from "@prisma/client/runtime/client";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "7.10.1",
    engine: "d1b3f377ca835d73fd50954a5e22128b9ebdd6b8"
};
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    Category: 'Category',
    Product: 'Product',
    Cart: 'Cart',
    CartItem: 'CartItem',
    Order: 'Order',
    OrderItem: 'OrderItem',
    Payment: 'Payment',
    Review: 'Review',
    NewsletterSubscriber: 'NewsletterSubscriber'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    name: 'name',
    phone: 'phone',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const CategoryScalarFieldEnum = {
    id: 'id',
    name: 'name',
    slug: 'slug'
};
export const ProductScalarFieldEnum = {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    price: 'price',
    salePrice: 'salePrice',
    images: 'images',
    scent: 'scent',
    waxType: 'waxType',
    burnTime: 'burnTime',
    stock: 'stock',
    isFeatured: 'isFeatured',
    categoryId: 'categoryId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const CartScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    updatedAt: 'updatedAt'
};
export const CartItemScalarFieldEnum = {
    id: 'id',
    cartId: 'cartId',
    productId: 'productId',
    quantity: 'quantity'
};
export const OrderScalarFieldEnum = {
    id: 'id',
    code: 'code',
    userId: 'userId',
    status: 'status',
    subtotal: 'subtotal',
    shippingFee: 'shippingFee',
    total: 'total',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    shippingAddress: 'shippingAddress',
    note: 'note',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const OrderItemScalarFieldEnum = {
    id: 'id',
    orderId: 'orderId',
    productId: 'productId',
    name: 'name',
    price: 'price',
    quantity: 'quantity'
};
export const PaymentScalarFieldEnum = {
    id: 'id',
    orderId: 'orderId',
    provider: 'provider',
    status: 'status',
    amount: 'amount',
    transactionId: 'transactionId',
    rawResponse: 'rawResponse',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const ReviewScalarFieldEnum = {
    id: 'id',
    productId: 'productId',
    userId: 'userId',
    rating: 'rating',
    comment: 'comment',
    createdAt: 'createdAt'
};
export const NewsletterSubscriberScalarFieldEnum = {
    id: 'id',
    email: 'email',
    createdAt: 'createdAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
    JsonNull: JsonNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map