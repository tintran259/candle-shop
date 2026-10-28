import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type ProductModel = runtime.Types.Result.DefaultSelection<Prisma.$ProductPayload>;
export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null;
    _avg: ProductAvgAggregateOutputType | null;
    _sum: ProductSumAggregateOutputType | null;
    _min: ProductMinAggregateOutputType | null;
    _max: ProductMaxAggregateOutputType | null;
};
export type ProductAvgAggregateOutputType = {
    price: number | null;
    salePrice: number | null;
    burnTime: number | null;
    stock: number | null;
};
export type ProductSumAggregateOutputType = {
    price: number | null;
    salePrice: number | null;
    burnTime: number | null;
    stock: number | null;
};
export type ProductMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    slug: string | null;
    description: string | null;
    price: number | null;
    salePrice: number | null;
    scent: string | null;
    waxType: string | null;
    burnTime: number | null;
    stock: number | null;
    isFeatured: boolean | null;
    categoryId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ProductMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    slug: string | null;
    description: string | null;
    price: number | null;
    salePrice: number | null;
    scent: string | null;
    waxType: string | null;
    burnTime: number | null;
    stock: number | null;
    isFeatured: boolean | null;
    categoryId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ProductCountAggregateOutputType = {
    id: number;
    name: number;
    slug: number;
    description: number;
    price: number;
    salePrice: number;
    images: number;
    scent: number;
    waxType: number;
    burnTime: number;
    stock: number;
    isFeatured: number;
    categoryId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type ProductAvgAggregateInputType = {
    price?: true;
    salePrice?: true;
    burnTime?: true;
    stock?: true;
};
export type ProductSumAggregateInputType = {
    price?: true;
    salePrice?: true;
    burnTime?: true;
    stock?: true;
};
export type ProductMinAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    description?: true;
    price?: true;
    salePrice?: true;
    scent?: true;
    waxType?: true;
    burnTime?: true;
    stock?: true;
    isFeatured?: true;
    categoryId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ProductMaxAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    description?: true;
    price?: true;
    salePrice?: true;
    scent?: true;
    waxType?: true;
    burnTime?: true;
    stock?: true;
    isFeatured?: true;
    categoryId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ProductCountAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    description?: true;
    price?: true;
    salePrice?: true;
    images?: true;
    scent?: true;
    waxType?: true;
    burnTime?: true;
    stock?: true;
    isFeatured?: true;
    categoryId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type ProductAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    cursor?: Prisma.ProductWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ProductCountAggregateInputType;
    _avg?: ProductAvgAggregateInputType;
    _sum?: ProductSumAggregateInputType;
    _min?: ProductMinAggregateInputType;
    _max?: ProductMaxAggregateInputType;
};
export type GetProductAggregateType<T extends ProductAggregateArgs> = {
    [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateProduct[P]> : Prisma.GetScalarType<T[P], AggregateProduct[P]>;
};
export type ProductGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithAggregationInput | Prisma.ProductOrderByWithAggregationInput[];
    by: Prisma.ProductScalarFieldEnum[] | Prisma.ProductScalarFieldEnum;
    having?: Prisma.ProductScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ProductCountAggregateInputType | true;
    _avg?: ProductAvgAggregateInputType;
    _sum?: ProductSumAggregateInputType;
    _min?: ProductMinAggregateInputType;
    _max?: ProductMaxAggregateInputType;
};
export type ProductGroupByOutputType = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    salePrice: number | null;
    images: string[];
    scent: string | null;
    waxType: string | null;
    burnTime: number | null;
    stock: number;
    isFeatured: boolean;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: ProductCountAggregateOutputType | null;
    _avg: ProductAvgAggregateOutputType | null;
    _sum: ProductSumAggregateOutputType | null;
    _min: ProductMinAggregateOutputType | null;
    _max: ProductMaxAggregateOutputType | null;
};
export type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ProductGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ProductGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ProductGroupByOutputType[P]>;
}>>;
export type ProductWhereInput = {
    AND?: Prisma.ProductWhereInput | Prisma.ProductWhereInput[];
    OR?: Prisma.ProductWhereInput[];
    NOT?: Prisma.ProductWhereInput | Prisma.ProductWhereInput[];
    id?: Prisma.StringFilter<"Product"> | string;
    name?: Prisma.StringFilter<"Product"> | string;
    slug?: Prisma.StringFilter<"Product"> | string;
    description?: Prisma.StringNullableFilter<"Product"> | string | null;
    price?: Prisma.IntFilter<"Product"> | number;
    salePrice?: Prisma.IntNullableFilter<"Product"> | number | null;
    images?: Prisma.StringNullableListFilter<"Product">;
    scent?: Prisma.StringNullableFilter<"Product"> | string | null;
    waxType?: Prisma.StringNullableFilter<"Product"> | string | null;
    burnTime?: Prisma.IntNullableFilter<"Product"> | number | null;
    stock?: Prisma.IntFilter<"Product"> | number;
    isFeatured?: Prisma.BoolFilter<"Product"> | boolean;
    categoryId?: Prisma.StringNullableFilter<"Product"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
    category?: Prisma.XOR<Prisma.CategoryNullableScalarRelationFilter, Prisma.CategoryWhereInput> | null;
    cartItems?: Prisma.CartItemListRelationFilter;
    orderItems?: Prisma.OrderItemListRelationFilter;
    reviews?: Prisma.ReviewListRelationFilter;
};
export type ProductOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    images?: Prisma.SortOrder;
    scent?: Prisma.SortOrderInput | Prisma.SortOrder;
    waxType?: Prisma.SortOrderInput | Prisma.SortOrder;
    burnTime?: Prisma.SortOrderInput | Prisma.SortOrder;
    stock?: Prisma.SortOrder;
    isFeatured?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    category?: Prisma.CategoryOrderByWithRelationInput;
    cartItems?: Prisma.CartItemOrderByRelationAggregateInput;
    orderItems?: Prisma.OrderItemOrderByRelationAggregateInput;
    reviews?: Prisma.ReviewOrderByRelationAggregateInput;
};
export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    slug?: string;
    AND?: Prisma.ProductWhereInput | Prisma.ProductWhereInput[];
    OR?: Prisma.ProductWhereInput[];
    NOT?: Prisma.ProductWhereInput | Prisma.ProductWhereInput[];
    name?: Prisma.StringFilter<"Product"> | string;
    description?: Prisma.StringNullableFilter<"Product"> | string | null;
    price?: Prisma.IntFilter<"Product"> | number;
    salePrice?: Prisma.IntNullableFilter<"Product"> | number | null;
    images?: Prisma.StringNullableListFilter<"Product">;
    scent?: Prisma.StringNullableFilter<"Product"> | string | null;
    waxType?: Prisma.StringNullableFilter<"Product"> | string | null;
    burnTime?: Prisma.IntNullableFilter<"Product"> | number | null;
    stock?: Prisma.IntFilter<"Product"> | number;
    isFeatured?: Prisma.BoolFilter<"Product"> | boolean;
    categoryId?: Prisma.StringNullableFilter<"Product"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
    category?: Prisma.XOR<Prisma.CategoryNullableScalarRelationFilter, Prisma.CategoryWhereInput> | null;
    cartItems?: Prisma.CartItemListRelationFilter;
    orderItems?: Prisma.OrderItemListRelationFilter;
    reviews?: Prisma.ReviewListRelationFilter;
}, "id" | "slug">;
export type ProductOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    images?: Prisma.SortOrder;
    scent?: Prisma.SortOrderInput | Prisma.SortOrder;
    waxType?: Prisma.SortOrderInput | Prisma.SortOrder;
    burnTime?: Prisma.SortOrderInput | Prisma.SortOrder;
    stock?: Prisma.SortOrder;
    isFeatured?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.ProductCountOrderByAggregateInput;
    _avg?: Prisma.ProductAvgOrderByAggregateInput;
    _max?: Prisma.ProductMaxOrderByAggregateInput;
    _min?: Prisma.ProductMinOrderByAggregateInput;
    _sum?: Prisma.ProductSumOrderByAggregateInput;
};
export type ProductScalarWhereWithAggregatesInput = {
    AND?: Prisma.ProductScalarWhereWithAggregatesInput | Prisma.ProductScalarWhereWithAggregatesInput[];
    OR?: Prisma.ProductScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ProductScalarWhereWithAggregatesInput | Prisma.ProductScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Product"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Product"> | string;
    slug?: Prisma.StringWithAggregatesFilter<"Product"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Product"> | string | null;
    price?: Prisma.IntWithAggregatesFilter<"Product"> | number;
    salePrice?: Prisma.IntNullableWithAggregatesFilter<"Product"> | number | null;
    images?: Prisma.StringNullableListFilter<"Product">;
    scent?: Prisma.StringNullableWithAggregatesFilter<"Product"> | string | null;
    waxType?: Prisma.StringNullableWithAggregatesFilter<"Product"> | string | null;
    burnTime?: Prisma.IntNullableWithAggregatesFilter<"Product"> | number | null;
    stock?: Prisma.IntWithAggregatesFilter<"Product"> | number;
    isFeatured?: Prisma.BoolWithAggregatesFilter<"Product"> | boolean;
    categoryId?: Prisma.StringNullableWithAggregatesFilter<"Product"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Product"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Product"> | Date | string;
};
export type ProductCreateInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    category?: Prisma.CategoryCreateNestedOneWithoutProductsInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutProductInput;
};
export type ProductUncheckedCreateInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    categoryId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutProductInput;
};
export type ProductUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    category?: Prisma.CategoryUpdateOneWithoutProductsNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutProductNestedInput;
};
export type ProductCreateManyInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    categoryId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ProductUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ProductUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ProductListRelationFilter = {
    every?: Prisma.ProductWhereInput;
    some?: Prisma.ProductWhereInput;
    none?: Prisma.ProductWhereInput;
};
export type ProductOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    has?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    hasEvery?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    hasSome?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    isEmpty?: boolean;
};
export type ProductCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    images?: Prisma.SortOrder;
    scent?: Prisma.SortOrder;
    waxType?: Prisma.SortOrder;
    burnTime?: Prisma.SortOrder;
    stock?: Prisma.SortOrder;
    isFeatured?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ProductAvgOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    burnTime?: Prisma.SortOrder;
    stock?: Prisma.SortOrder;
};
export type ProductMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    scent?: Prisma.SortOrder;
    waxType?: Prisma.SortOrder;
    burnTime?: Prisma.SortOrder;
    stock?: Prisma.SortOrder;
    isFeatured?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ProductMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    scent?: Prisma.SortOrder;
    waxType?: Prisma.SortOrder;
    burnTime?: Prisma.SortOrder;
    stock?: Prisma.SortOrder;
    isFeatured?: Prisma.SortOrder;
    categoryId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ProductSumOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    burnTime?: Prisma.SortOrder;
    stock?: Prisma.SortOrder;
};
export type ProductScalarRelationFilter = {
    is?: Prisma.ProductWhereInput;
    isNot?: Prisma.ProductWhereInput;
};
export type ProductCreateNestedManyWithoutCategoryInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput> | Prisma.ProductCreateWithoutCategoryInput[] | Prisma.ProductUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCategoryInput | Prisma.ProductCreateOrConnectWithoutCategoryInput[];
    createMany?: Prisma.ProductCreateManyCategoryInputEnvelope;
    connect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
};
export type ProductUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput> | Prisma.ProductCreateWithoutCategoryInput[] | Prisma.ProductUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCategoryInput | Prisma.ProductCreateOrConnectWithoutCategoryInput[];
    createMany?: Prisma.ProductCreateManyCategoryInputEnvelope;
    connect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
};
export type ProductUpdateManyWithoutCategoryNestedInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput> | Prisma.ProductCreateWithoutCategoryInput[] | Prisma.ProductUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCategoryInput | Prisma.ProductCreateOrConnectWithoutCategoryInput[];
    upsert?: Prisma.ProductUpsertWithWhereUniqueWithoutCategoryInput | Prisma.ProductUpsertWithWhereUniqueWithoutCategoryInput[];
    createMany?: Prisma.ProductCreateManyCategoryInputEnvelope;
    set?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    disconnect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    delete?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    connect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    update?: Prisma.ProductUpdateWithWhereUniqueWithoutCategoryInput | Prisma.ProductUpdateWithWhereUniqueWithoutCategoryInput[];
    updateMany?: Prisma.ProductUpdateManyWithWhereWithoutCategoryInput | Prisma.ProductUpdateManyWithWhereWithoutCategoryInput[];
    deleteMany?: Prisma.ProductScalarWhereInput | Prisma.ProductScalarWhereInput[];
};
export type ProductUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput> | Prisma.ProductCreateWithoutCategoryInput[] | Prisma.ProductUncheckedCreateWithoutCategoryInput[];
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCategoryInput | Prisma.ProductCreateOrConnectWithoutCategoryInput[];
    upsert?: Prisma.ProductUpsertWithWhereUniqueWithoutCategoryInput | Prisma.ProductUpsertWithWhereUniqueWithoutCategoryInput[];
    createMany?: Prisma.ProductCreateManyCategoryInputEnvelope;
    set?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    disconnect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    delete?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    connect?: Prisma.ProductWhereUniqueInput | Prisma.ProductWhereUniqueInput[];
    update?: Prisma.ProductUpdateWithWhereUniqueWithoutCategoryInput | Prisma.ProductUpdateWithWhereUniqueWithoutCategoryInput[];
    updateMany?: Prisma.ProductUpdateManyWithWhereWithoutCategoryInput | Prisma.ProductUpdateManyWithWhereWithoutCategoryInput[];
    deleteMany?: Prisma.ProductScalarWhereInput | Prisma.ProductScalarWhereInput[];
};
export type ProductCreateimagesInput = {
    set: string[];
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type ProductUpdateimagesInput = {
    set?: string[];
    push?: string | string[];
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type ProductCreateNestedOneWithoutCartItemsInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCartItemsInput, Prisma.ProductUncheckedCreateWithoutCartItemsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCartItemsInput;
    connect?: Prisma.ProductWhereUniqueInput;
};
export type ProductUpdateOneRequiredWithoutCartItemsNestedInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutCartItemsInput, Prisma.ProductUncheckedCreateWithoutCartItemsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutCartItemsInput;
    upsert?: Prisma.ProductUpsertWithoutCartItemsInput;
    connect?: Prisma.ProductWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ProductUpdateToOneWithWhereWithoutCartItemsInput, Prisma.ProductUpdateWithoutCartItemsInput>, Prisma.ProductUncheckedUpdateWithoutCartItemsInput>;
};
export type ProductCreateNestedOneWithoutOrderItemsInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutOrderItemsInput, Prisma.ProductUncheckedCreateWithoutOrderItemsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutOrderItemsInput;
    connect?: Prisma.ProductWhereUniqueInput;
};
export type ProductUpdateOneRequiredWithoutOrderItemsNestedInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutOrderItemsInput, Prisma.ProductUncheckedCreateWithoutOrderItemsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutOrderItemsInput;
    upsert?: Prisma.ProductUpsertWithoutOrderItemsInput;
    connect?: Prisma.ProductWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ProductUpdateToOneWithWhereWithoutOrderItemsInput, Prisma.ProductUpdateWithoutOrderItemsInput>, Prisma.ProductUncheckedUpdateWithoutOrderItemsInput>;
};
export type ProductCreateNestedOneWithoutReviewsInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutReviewsInput, Prisma.ProductUncheckedCreateWithoutReviewsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutReviewsInput;
    connect?: Prisma.ProductWhereUniqueInput;
};
export type ProductUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: Prisma.XOR<Prisma.ProductCreateWithoutReviewsInput, Prisma.ProductUncheckedCreateWithoutReviewsInput>;
    connectOrCreate?: Prisma.ProductCreateOrConnectWithoutReviewsInput;
    upsert?: Prisma.ProductUpsertWithoutReviewsInput;
    connect?: Prisma.ProductWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ProductUpdateToOneWithWhereWithoutReviewsInput, Prisma.ProductUpdateWithoutReviewsInput>, Prisma.ProductUncheckedUpdateWithoutReviewsInput>;
};
export type ProductCreateWithoutCategoryInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutProductInput;
};
export type ProductUncheckedCreateWithoutCategoryInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutProductInput;
};
export type ProductCreateOrConnectWithoutCategoryInput = {
    where: Prisma.ProductWhereUniqueInput;
    create: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput>;
};
export type ProductCreateManyCategoryInputEnvelope = {
    data: Prisma.ProductCreateManyCategoryInput | Prisma.ProductCreateManyCategoryInput[];
    skipDuplicates?: boolean;
};
export type ProductUpsertWithWhereUniqueWithoutCategoryInput = {
    where: Prisma.ProductWhereUniqueInput;
    update: Prisma.XOR<Prisma.ProductUpdateWithoutCategoryInput, Prisma.ProductUncheckedUpdateWithoutCategoryInput>;
    create: Prisma.XOR<Prisma.ProductCreateWithoutCategoryInput, Prisma.ProductUncheckedCreateWithoutCategoryInput>;
};
export type ProductUpdateWithWhereUniqueWithoutCategoryInput = {
    where: Prisma.ProductWhereUniqueInput;
    data: Prisma.XOR<Prisma.ProductUpdateWithoutCategoryInput, Prisma.ProductUncheckedUpdateWithoutCategoryInput>;
};
export type ProductUpdateManyWithWhereWithoutCategoryInput = {
    where: Prisma.ProductScalarWhereInput;
    data: Prisma.XOR<Prisma.ProductUpdateManyMutationInput, Prisma.ProductUncheckedUpdateManyWithoutCategoryInput>;
};
export type ProductScalarWhereInput = {
    AND?: Prisma.ProductScalarWhereInput | Prisma.ProductScalarWhereInput[];
    OR?: Prisma.ProductScalarWhereInput[];
    NOT?: Prisma.ProductScalarWhereInput | Prisma.ProductScalarWhereInput[];
    id?: Prisma.StringFilter<"Product"> | string;
    name?: Prisma.StringFilter<"Product"> | string;
    slug?: Prisma.StringFilter<"Product"> | string;
    description?: Prisma.StringNullableFilter<"Product"> | string | null;
    price?: Prisma.IntFilter<"Product"> | number;
    salePrice?: Prisma.IntNullableFilter<"Product"> | number | null;
    images?: Prisma.StringNullableListFilter<"Product">;
    scent?: Prisma.StringNullableFilter<"Product"> | string | null;
    waxType?: Prisma.StringNullableFilter<"Product"> | string | null;
    burnTime?: Prisma.IntNullableFilter<"Product"> | number | null;
    stock?: Prisma.IntFilter<"Product"> | number;
    isFeatured?: Prisma.BoolFilter<"Product"> | boolean;
    categoryId?: Prisma.StringNullableFilter<"Product"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Product"> | Date | string;
};
export type ProductCreateWithoutCartItemsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    category?: Prisma.CategoryCreateNestedOneWithoutProductsInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutProductInput;
};
export type ProductUncheckedCreateWithoutCartItemsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    categoryId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutProductInput;
};
export type ProductCreateOrConnectWithoutCartItemsInput = {
    where: Prisma.ProductWhereUniqueInput;
    create: Prisma.XOR<Prisma.ProductCreateWithoutCartItemsInput, Prisma.ProductUncheckedCreateWithoutCartItemsInput>;
};
export type ProductUpsertWithoutCartItemsInput = {
    update: Prisma.XOR<Prisma.ProductUpdateWithoutCartItemsInput, Prisma.ProductUncheckedUpdateWithoutCartItemsInput>;
    create: Prisma.XOR<Prisma.ProductCreateWithoutCartItemsInput, Prisma.ProductUncheckedCreateWithoutCartItemsInput>;
    where?: Prisma.ProductWhereInput;
};
export type ProductUpdateToOneWithWhereWithoutCartItemsInput = {
    where?: Prisma.ProductWhereInput;
    data: Prisma.XOR<Prisma.ProductUpdateWithoutCartItemsInput, Prisma.ProductUncheckedUpdateWithoutCartItemsInput>;
};
export type ProductUpdateWithoutCartItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    category?: Prisma.CategoryUpdateOneWithoutProductsNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateWithoutCartItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutProductNestedInput;
};
export type ProductCreateWithoutOrderItemsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    category?: Prisma.CategoryCreateNestedOneWithoutProductsInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewCreateNestedManyWithoutProductInput;
};
export type ProductUncheckedCreateWithoutOrderItemsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    categoryId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutProductInput;
    reviews?: Prisma.ReviewUncheckedCreateNestedManyWithoutProductInput;
};
export type ProductCreateOrConnectWithoutOrderItemsInput = {
    where: Prisma.ProductWhereUniqueInput;
    create: Prisma.XOR<Prisma.ProductCreateWithoutOrderItemsInput, Prisma.ProductUncheckedCreateWithoutOrderItemsInput>;
};
export type ProductUpsertWithoutOrderItemsInput = {
    update: Prisma.XOR<Prisma.ProductUpdateWithoutOrderItemsInput, Prisma.ProductUncheckedUpdateWithoutOrderItemsInput>;
    create: Prisma.XOR<Prisma.ProductCreateWithoutOrderItemsInput, Prisma.ProductUncheckedCreateWithoutOrderItemsInput>;
    where?: Prisma.ProductWhereInput;
};
export type ProductUpdateToOneWithWhereWithoutOrderItemsInput = {
    where?: Prisma.ProductWhereInput;
    data: Prisma.XOR<Prisma.ProductUpdateWithoutOrderItemsInput, Prisma.ProductUncheckedUpdateWithoutOrderItemsInput>;
};
export type ProductUpdateWithoutOrderItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    category?: Prisma.CategoryUpdateOneWithoutProductsNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateWithoutOrderItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutProductNestedInput;
};
export type ProductCreateWithoutReviewsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    category?: Prisma.CategoryCreateNestedOneWithoutProductsInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutProductInput;
};
export type ProductUncheckedCreateWithoutReviewsInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    categoryId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutProductInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutProductInput;
};
export type ProductCreateOrConnectWithoutReviewsInput = {
    where: Prisma.ProductWhereUniqueInput;
    create: Prisma.XOR<Prisma.ProductCreateWithoutReviewsInput, Prisma.ProductUncheckedCreateWithoutReviewsInput>;
};
export type ProductUpsertWithoutReviewsInput = {
    update: Prisma.XOR<Prisma.ProductUpdateWithoutReviewsInput, Prisma.ProductUncheckedUpdateWithoutReviewsInput>;
    create: Prisma.XOR<Prisma.ProductCreateWithoutReviewsInput, Prisma.ProductUncheckedCreateWithoutReviewsInput>;
    where?: Prisma.ProductWhereInput;
};
export type ProductUpdateToOneWithWhereWithoutReviewsInput = {
    where?: Prisma.ProductWhereInput;
    data: Prisma.XOR<Prisma.ProductUpdateWithoutReviewsInput, Prisma.ProductUncheckedUpdateWithoutReviewsInput>;
};
export type ProductUpdateWithoutReviewsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    category?: Prisma.CategoryUpdateOneWithoutProductsNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateWithoutReviewsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    categoryId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutProductNestedInput;
};
export type ProductCreateManyCategoryInput = {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    images?: Prisma.ProductCreateimagesInput | string[];
    scent?: string | null;
    waxType?: string | null;
    burnTime?: number | null;
    stock?: number;
    isFeatured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ProductUpdateWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    cartItems?: Prisma.CartItemUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutProductNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutProductNestedInput;
    reviews?: Prisma.ReviewUncheckedUpdateManyWithoutProductNestedInput;
};
export type ProductUncheckedUpdateManyWithoutCategoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    salePrice?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    images?: Prisma.ProductUpdateimagesInput | string[];
    scent?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    waxType?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    burnTime?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    stock?: Prisma.IntFieldUpdateOperationsInput | number;
    isFeatured?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ProductCountOutputType = {
    cartItems: number;
    orderItems: number;
    reviews: number;
};
export type ProductCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    cartItems?: boolean | ProductCountOutputTypeCountCartItemsArgs;
    orderItems?: boolean | ProductCountOutputTypeCountOrderItemsArgs;
    reviews?: boolean | ProductCountOutputTypeCountReviewsArgs;
};
export type ProductCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductCountOutputTypeSelect<ExtArgs> | null;
};
export type ProductCountOutputTypeCountCartItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CartItemWhereInput;
};
export type ProductCountOutputTypeCountOrderItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.OrderItemWhereInput;
};
export type ProductCountOutputTypeCountReviewsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ReviewWhereInput;
};
export type ProductSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    description?: boolean;
    price?: boolean;
    salePrice?: boolean;
    images?: boolean;
    scent?: boolean;
    waxType?: boolean;
    burnTime?: boolean;
    stock?: boolean;
    isFeatured?: boolean;
    categoryId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
    cartItems?: boolean | Prisma.Product$cartItemsArgs<ExtArgs>;
    orderItems?: boolean | Prisma.Product$orderItemsArgs<ExtArgs>;
    reviews?: boolean | Prisma.Product$reviewsArgs<ExtArgs>;
    _count?: boolean | Prisma.ProductCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["product"]>;
export type ProductSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    description?: boolean;
    price?: boolean;
    salePrice?: boolean;
    images?: boolean;
    scent?: boolean;
    waxType?: boolean;
    burnTime?: boolean;
    stock?: boolean;
    isFeatured?: boolean;
    categoryId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
}, ExtArgs["result"]["product"]>;
export type ProductSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    description?: boolean;
    price?: boolean;
    salePrice?: boolean;
    images?: boolean;
    scent?: boolean;
    waxType?: boolean;
    burnTime?: boolean;
    stock?: boolean;
    isFeatured?: boolean;
    categoryId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
}, ExtArgs["result"]["product"]>;
export type ProductSelectScalar = {
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    description?: boolean;
    price?: boolean;
    salePrice?: boolean;
    images?: boolean;
    scent?: boolean;
    waxType?: boolean;
    burnTime?: boolean;
    stock?: boolean;
    isFeatured?: boolean;
    categoryId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type ProductOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "slug" | "description" | "price" | "salePrice" | "images" | "scent" | "waxType" | "burnTime" | "stock" | "isFeatured" | "categoryId" | "createdAt" | "updatedAt", ExtArgs["result"]["product"]>;
export type ProductInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
    cartItems?: boolean | Prisma.Product$cartItemsArgs<ExtArgs>;
    orderItems?: boolean | Prisma.Product$orderItemsArgs<ExtArgs>;
    reviews?: boolean | Prisma.Product$reviewsArgs<ExtArgs>;
    _count?: boolean | Prisma.ProductCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ProductIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
};
export type ProductIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    category?: boolean | Prisma.Product$categoryArgs<ExtArgs>;
};
export type $ProductPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Product";
    objects: {
        category: Prisma.$CategoryPayload<ExtArgs> | null;
        cartItems: Prisma.$CartItemPayload<ExtArgs>[];
        orderItems: Prisma.$OrderItemPayload<ExtArgs>[];
        reviews: Prisma.$ReviewPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        salePrice: number | null;
        images: string[];
        scent: string | null;
        waxType: string | null;
        burnTime: number | null;
        stock: number;
        isFeatured: boolean;
        categoryId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["product"]>;
    composites: {};
};
export type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ProductPayload, S>;
export type ProductCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ProductCountAggregateInputType | true;
};
export interface ProductDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Product'];
        meta: {
            name: 'Product';
        };
    };
    findUnique<T extends ProductFindUniqueArgs>(args: Prisma.SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ProductFindFirstArgs>(args?: Prisma.SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ProductFindManyArgs>(args?: Prisma.SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ProductCreateArgs>(args: Prisma.SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ProductCreateManyArgs>(args?: Prisma.SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ProductDeleteArgs>(args: Prisma.SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ProductUpdateArgs>(args: Prisma.SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ProductDeleteManyArgs>(args?: Prisma.SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ProductUpdateManyArgs>(args: Prisma.SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ProductUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ProductUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ProductUpsertArgs>(args: Prisma.SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ProductCountArgs>(args?: Prisma.Subset<T, ProductCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ProductCountAggregateOutputType> : number>;
    aggregate<T extends ProductAggregateArgs>(args: Prisma.Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>;
    groupBy<T extends ProductGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ProductGroupByArgs['orderBy'];
    } : {
        orderBy?: ProductGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ProductFieldRefs;
}
export interface Prisma__ProductClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    category<T extends Prisma.Product$categoryArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Product$categoryArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    cartItems<T extends Prisma.Product$cartItemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Product$cartItemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CartItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    orderItems<T extends Prisma.Product$orderItemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Product$orderItemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    reviews<T extends Prisma.Product$reviewsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Product$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ProductFieldRefs {
    readonly id: Prisma.FieldRef<"Product", 'String'>;
    readonly name: Prisma.FieldRef<"Product", 'String'>;
    readonly slug: Prisma.FieldRef<"Product", 'String'>;
    readonly description: Prisma.FieldRef<"Product", 'String'>;
    readonly price: Prisma.FieldRef<"Product", 'Int'>;
    readonly salePrice: Prisma.FieldRef<"Product", 'Int'>;
    readonly images: Prisma.FieldRef<"Product", 'String[]'>;
    readonly scent: Prisma.FieldRef<"Product", 'String'>;
    readonly waxType: Prisma.FieldRef<"Product", 'String'>;
    readonly burnTime: Prisma.FieldRef<"Product", 'Int'>;
    readonly stock: Prisma.FieldRef<"Product", 'Int'>;
    readonly isFeatured: Prisma.FieldRef<"Product", 'Boolean'>;
    readonly categoryId: Prisma.FieldRef<"Product", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Product", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Product", 'DateTime'>;
}
export type ProductFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where: Prisma.ProductWhereUniqueInput;
};
export type ProductFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where: Prisma.ProductWhereUniqueInput;
};
export type ProductFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    cursor?: Prisma.ProductWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ProductScalarFieldEnum | Prisma.ProductScalarFieldEnum[];
};
export type ProductFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    cursor?: Prisma.ProductWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ProductScalarFieldEnum | Prisma.ProductScalarFieldEnum[];
};
export type ProductFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    cursor?: Prisma.ProductWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ProductScalarFieldEnum | Prisma.ProductScalarFieldEnum[];
};
export type ProductCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ProductCreateInput, Prisma.ProductUncheckedCreateInput>;
};
export type ProductCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ProductCreateManyInput | Prisma.ProductCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ProductCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    data: Prisma.ProductCreateManyInput | Prisma.ProductCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.ProductIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type ProductUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ProductUpdateInput, Prisma.ProductUncheckedUpdateInput>;
    where: Prisma.ProductWhereUniqueInput;
};
export type ProductUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ProductUpdateManyMutationInput, Prisma.ProductUncheckedUpdateManyInput>;
    where?: Prisma.ProductWhereInput;
    limit?: number;
};
export type ProductUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ProductUpdateManyMutationInput, Prisma.ProductUncheckedUpdateManyInput>;
    where?: Prisma.ProductWhereInput;
    limit?: number;
    include?: Prisma.ProductIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type ProductUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where: Prisma.ProductWhereUniqueInput;
    create: Prisma.XOR<Prisma.ProductCreateInput, Prisma.ProductUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ProductUpdateInput, Prisma.ProductUncheckedUpdateInput>;
};
export type ProductDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where: Prisma.ProductWhereUniqueInput;
};
export type ProductDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ProductWhereInput;
    limit?: number;
};
export type Product$categoryArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
};
export type Product$cartItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CartItemSelect<ExtArgs> | null;
    omit?: Prisma.CartItemOmit<ExtArgs> | null;
    include?: Prisma.CartItemInclude<ExtArgs> | null;
    where?: Prisma.CartItemWhereInput;
    orderBy?: Prisma.CartItemOrderByWithRelationInput | Prisma.CartItemOrderByWithRelationInput[];
    cursor?: Prisma.CartItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CartItemScalarFieldEnum | Prisma.CartItemScalarFieldEnum[];
};
export type Product$orderItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrderItemSelect<ExtArgs> | null;
    omit?: Prisma.OrderItemOmit<ExtArgs> | null;
    include?: Prisma.OrderItemInclude<ExtArgs> | null;
    where?: Prisma.OrderItemWhereInput;
    orderBy?: Prisma.OrderItemOrderByWithRelationInput | Prisma.OrderItemOrderByWithRelationInput[];
    cursor?: Prisma.OrderItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.OrderItemScalarFieldEnum | Prisma.OrderItemScalarFieldEnum[];
};
export type Product$reviewsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ReviewSelect<ExtArgs> | null;
    omit?: Prisma.ReviewOmit<ExtArgs> | null;
    include?: Prisma.ReviewInclude<ExtArgs> | null;
    where?: Prisma.ReviewWhereInput;
    orderBy?: Prisma.ReviewOrderByWithRelationInput | Prisma.ReviewOrderByWithRelationInput[];
    cursor?: Prisma.ReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ReviewScalarFieldEnum | Prisma.ReviewScalarFieldEnum[];
};
export type ProductDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
};
