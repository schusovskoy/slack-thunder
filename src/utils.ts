export type MakeRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>

export const includes = (value: unknown, array: readonly unknown[]): boolean =>
  array.includes(value)

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
