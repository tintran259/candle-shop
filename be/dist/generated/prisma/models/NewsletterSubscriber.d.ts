import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type NewsletterSubscriberModel = runtime.Types.Result.DefaultSelection<Prisma.$NewsletterSubscriberPayload>;
export type AggregateNewsletterSubscriber = {
    _count: NewsletterSubscriberCountAggregateOutputType | null;
    _min: NewsletterSubscriberMinAggregateOutputType | null;
    _max: NewsletterSubscriberMaxAggregateOutputType | null;
};
export type NewsletterSubscriberMinAggregateOutputType = {
    id: string | null;
    email: string | null;
    createdAt: Date | null;
};
export type NewsletterSubscriberMaxAggregateOutputType = {
    id: string | null;
    email: string | null;
    createdAt: Date | null;
};
export type NewsletterSubscriberCountAggregateOutputType = {
    id: number;
    email: number;
    createdAt: number;
    _all: number;
};
export type NewsletterSubscriberMinAggregateInputType = {
    id?: true;
    email?: true;
    createdAt?: true;
};
export type NewsletterSubscriberMaxAggregateInputType = {
    id?: true;
    email?: true;
    createdAt?: true;
};
export type NewsletterSubscriberCountAggregateInputType = {
    id?: true;
    email?: true;
    createdAt?: true;
    _all?: true;
};
export type NewsletterSubscriberAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NewsletterSubscriberWhereInput;
    orderBy?: Prisma.NewsletterSubscriberOrderByWithRelationInput | Prisma.NewsletterSubscriberOrderByWithRelationInput[];
    cursor?: Prisma.NewsletterSubscriberWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | NewsletterSubscriberCountAggregateInputType;
    _min?: NewsletterSubscriberMinAggregateInputType;
    _max?: NewsletterSubscriberMaxAggregateInputType;
};
export type GetNewsletterSubscriberAggregateType<T extends NewsletterSubscriberAggregateArgs> = {
    [P in keyof T & keyof AggregateNewsletterSubscriber]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateNewsletterSubscriber[P]> : Prisma.GetScalarType<T[P], AggregateNewsletterSubscriber[P]>;
};
export type NewsletterSubscriberGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NewsletterSubscriberWhereInput;
    orderBy?: Prisma.NewsletterSubscriberOrderByWithAggregationInput | Prisma.NewsletterSubscriberOrderByWithAggregationInput[];
    by: Prisma.NewsletterSubscriberScalarFieldEnum[] | Prisma.NewsletterSubscriberScalarFieldEnum;
    having?: Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: NewsletterSubscriberCountAggregateInputType | true;
    _min?: NewsletterSubscriberMinAggregateInputType;
    _max?: NewsletterSubscriberMaxAggregateInputType;
};
export type NewsletterSubscriberGroupByOutputType = {
    id: string;
    email: string;
    createdAt: Date;
    _count: NewsletterSubscriberCountAggregateOutputType | null;
    _min: NewsletterSubscriberMinAggregateOutputType | null;
    _max: NewsletterSubscriberMaxAggregateOutputType | null;
};
export type GetNewsletterSubscriberGroupByPayload<T extends NewsletterSubscriberGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<NewsletterSubscriberGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof NewsletterSubscriberGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], NewsletterSubscriberGroupByOutputType[P]> : Prisma.GetScalarType<T[P], NewsletterSubscriberGroupByOutputType[P]>;
}>>;
export type NewsletterSubscriberWhereInput = {
    AND?: Prisma.NewsletterSubscriberWhereInput | Prisma.NewsletterSubscriberWhereInput[];
    OR?: Prisma.NewsletterSubscriberWhereInput[];
    NOT?: Prisma.NewsletterSubscriberWhereInput | Prisma.NewsletterSubscriberWhereInput[];
    id?: Prisma.StringFilter<"NewsletterSubscriber"> | string;
    email?: Prisma.StringFilter<"NewsletterSubscriber"> | string;
    createdAt?: Prisma.DateTimeFilter<"NewsletterSubscriber"> | Date | string;
};
export type NewsletterSubscriberOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NewsletterSubscriberWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    email?: string;
    AND?: Prisma.NewsletterSubscriberWhereInput | Prisma.NewsletterSubscriberWhereInput[];
    OR?: Prisma.NewsletterSubscriberWhereInput[];
    NOT?: Prisma.NewsletterSubscriberWhereInput | Prisma.NewsletterSubscriberWhereInput[];
    createdAt?: Prisma.DateTimeFilter<"NewsletterSubscriber"> | Date | string;
}, "id" | "email">;
export type NewsletterSubscriberOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.NewsletterSubscriberCountOrderByAggregateInput;
    _max?: Prisma.NewsletterSubscriberMaxOrderByAggregateInput;
    _min?: Prisma.NewsletterSubscriberMinOrderByAggregateInput;
};
export type NewsletterSubscriberScalarWhereWithAggregatesInput = {
    AND?: Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput | Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput[];
    OR?: Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput[];
    NOT?: Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput | Prisma.NewsletterSubscriberScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"NewsletterSubscriber"> | string;
    email?: Prisma.StringWithAggregatesFilter<"NewsletterSubscriber"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"NewsletterSubscriber"> | Date | string;
};
export type NewsletterSubscriberCreateInput = {
    id?: string;
    email: string;
    createdAt?: Date | string;
};
export type NewsletterSubscriberUncheckedCreateInput = {
    id?: string;
    email: string;
    createdAt?: Date | string;
};
export type NewsletterSubscriberUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NewsletterSubscriberUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NewsletterSubscriberCreateManyInput = {
    id?: string;
    email: string;
    createdAt?: Date | string;
};
export type NewsletterSubscriberUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NewsletterSubscriberUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NewsletterSubscriberCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NewsletterSubscriberMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NewsletterSubscriberMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NewsletterSubscriberSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["newsletterSubscriber"]>;
export type NewsletterSubscriberSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["newsletterSubscriber"]>;
export type NewsletterSubscriberSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["newsletterSubscriber"]>;
export type NewsletterSubscriberSelectScalar = {
    id?: boolean;
    email?: boolean;
    createdAt?: boolean;
};
export type NewsletterSubscriberOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "email" | "createdAt", ExtArgs["result"]["newsletterSubscriber"]>;
export type $NewsletterSubscriberPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "NewsletterSubscriber";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        email: string;
        createdAt: Date;
    }, ExtArgs["result"]["newsletterSubscriber"]>;
    composites: {};
};
export type NewsletterSubscriberGetPayload<S extends boolean | null | undefined | NewsletterSubscriberDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload, S>;
export type NewsletterSubscriberCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<NewsletterSubscriberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: NewsletterSubscriberCountAggregateInputType | true;
};
export interface NewsletterSubscriberDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['NewsletterSubscriber'];
        meta: {
            name: 'NewsletterSubscriber';
        };
    };
    findUnique<T extends NewsletterSubscriberFindUniqueArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberFindUniqueArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends NewsletterSubscriberFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends NewsletterSubscriberFindFirstArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberFindFirstArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends NewsletterSubscriberFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends NewsletterSubscriberFindManyArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends NewsletterSubscriberCreateArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberCreateArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends NewsletterSubscriberCreateManyArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends NewsletterSubscriberCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends NewsletterSubscriberDeleteArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberDeleteArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends NewsletterSubscriberUpdateArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberUpdateArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends NewsletterSubscriberDeleteManyArgs>(args?: Prisma.SelectSubset<T, NewsletterSubscriberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends NewsletterSubscriberUpdateManyArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends NewsletterSubscriberUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends NewsletterSubscriberUpsertArgs>(args: Prisma.SelectSubset<T, NewsletterSubscriberUpsertArgs<ExtArgs>>): Prisma.Prisma__NewsletterSubscriberClient<runtime.Types.Result.GetResult<Prisma.$NewsletterSubscriberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends NewsletterSubscriberCountArgs>(args?: Prisma.Subset<T, NewsletterSubscriberCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], NewsletterSubscriberCountAggregateOutputType> : number>;
    aggregate<T extends NewsletterSubscriberAggregateArgs>(args: Prisma.Subset<T, NewsletterSubscriberAggregateArgs>): Prisma.PrismaPromise<GetNewsletterSubscriberAggregateType<T>>;
    groupBy<T extends NewsletterSubscriberGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: NewsletterSubscriberGroupByArgs['orderBy'];
    } : {
        orderBy?: NewsletterSubscriberGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, NewsletterSubscriberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNewsletterSubscriberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: NewsletterSubscriberFieldRefs;
}
export interface Prisma__NewsletterSubscriberClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface NewsletterSubscriberFieldRefs {
    readonly id: Prisma.FieldRef<"NewsletterSubscriber", 'String'>;
    readonly email: Prisma.FieldRef<"NewsletterSubscriber", 'String'>;
    readonly createdAt: Prisma.FieldRef<"NewsletterSubscriber", 'DateTime'>;
}
export type NewsletterSubscriberFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where: Prisma.NewsletterSubscriberWhereUniqueInput;
};
export type NewsletterSubscriberFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where: Prisma.NewsletterSubscriberWhereUniqueInput;
};
export type NewsletterSubscriberFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where?: Prisma.NewsletterSubscriberWhereInput;
    orderBy?: Prisma.NewsletterSubscriberOrderByWithRelationInput | Prisma.NewsletterSubscriberOrderByWithRelationInput[];
    cursor?: Prisma.NewsletterSubscriberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NewsletterSubscriberScalarFieldEnum | Prisma.NewsletterSubscriberScalarFieldEnum[];
};
export type NewsletterSubscriberFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where?: Prisma.NewsletterSubscriberWhereInput;
    orderBy?: Prisma.NewsletterSubscriberOrderByWithRelationInput | Prisma.NewsletterSubscriberOrderByWithRelationInput[];
    cursor?: Prisma.NewsletterSubscriberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NewsletterSubscriberScalarFieldEnum | Prisma.NewsletterSubscriberScalarFieldEnum[];
};
export type NewsletterSubscriberFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where?: Prisma.NewsletterSubscriberWhereInput;
    orderBy?: Prisma.NewsletterSubscriberOrderByWithRelationInput | Prisma.NewsletterSubscriberOrderByWithRelationInput[];
    cursor?: Prisma.NewsletterSubscriberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NewsletterSubscriberScalarFieldEnum | Prisma.NewsletterSubscriberScalarFieldEnum[];
};
export type NewsletterSubscriberCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NewsletterSubscriberCreateInput, Prisma.NewsletterSubscriberUncheckedCreateInput>;
};
export type NewsletterSubscriberCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.NewsletterSubscriberCreateManyInput | Prisma.NewsletterSubscriberCreateManyInput[];
    skipDuplicates?: boolean;
};
export type NewsletterSubscriberCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    data: Prisma.NewsletterSubscriberCreateManyInput | Prisma.NewsletterSubscriberCreateManyInput[];
    skipDuplicates?: boolean;
};
export type NewsletterSubscriberUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NewsletterSubscriberUpdateInput, Prisma.NewsletterSubscriberUncheckedUpdateInput>;
    where: Prisma.NewsletterSubscriberWhereUniqueInput;
};
export type NewsletterSubscriberUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.NewsletterSubscriberUpdateManyMutationInput, Prisma.NewsletterSubscriberUncheckedUpdateManyInput>;
    where?: Prisma.NewsletterSubscriberWhereInput;
    limit?: number;
};
export type NewsletterSubscriberUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NewsletterSubscriberUpdateManyMutationInput, Prisma.NewsletterSubscriberUncheckedUpdateManyInput>;
    where?: Prisma.NewsletterSubscriberWhereInput;
    limit?: number;
};
export type NewsletterSubscriberUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where: Prisma.NewsletterSubscriberWhereUniqueInput;
    create: Prisma.XOR<Prisma.NewsletterSubscriberCreateInput, Prisma.NewsletterSubscriberUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.NewsletterSubscriberUpdateInput, Prisma.NewsletterSubscriberUncheckedUpdateInput>;
};
export type NewsletterSubscriberDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
    where: Prisma.NewsletterSubscriberWhereUniqueInput;
};
export type NewsletterSubscriberDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NewsletterSubscriberWhereInput;
    limit?: number;
};
export type NewsletterSubscriberDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NewsletterSubscriberSelect<ExtArgs> | null;
    omit?: Prisma.NewsletterSubscriberOmit<ExtArgs> | null;
};
