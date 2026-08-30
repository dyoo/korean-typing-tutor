/** Unique phantom symbol used to brand primitive types for nominal typing. */
declare const BrandTag: unique symbol;

/**
 * Generic Brand type helper.
 * Attaches a phantom type tag `B` to a base type `T` to prevent accidental value substitution.
 */
export type Brand<T, B extends string> = T & { readonly [BrandTag]: B };
