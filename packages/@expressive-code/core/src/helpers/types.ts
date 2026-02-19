export type Awaitable<T> = T | Promise<T>

export type MaybeArray<T> = T | T[]

export type MaybeGetter<T, C = void> = T | ((context: C) => Awaitable<T>)
