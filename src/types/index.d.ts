declare module '*.mp4';

type Index = string | number | symbol;
declare type NestedRecord<T extends Index, U extends Index, V> = Record<
  T,
  Record<U, V>
>;
