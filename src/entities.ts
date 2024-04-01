export type ThunderElementType =
  | string
  | Component
  | Fragment
  | Provider<unknown>

export type ThunderElement = {
  type: ThunderElementType
  props: object
}

export type ThunderNode =
  | null
  | undefined
  | void
  | string
  | number
  | boolean
  | ThunderElement
  | ThunderNode[]

export type Component<Props extends object = object> = (
  props: Props,
) => ThunderNode | Promise<ThunderNode>

export type ActionComponent<Props extends object = object> =
  Component<Props> & { id: string; statefull?: boolean }

type ExoticComponent<
  T extends symbol,
  Props extends object = object,
  Config extends object = object,
> = { bivariant(props: Props): ThunderNode }['bivariant'] & { kind: T } & Config

export const FragmentKind = Symbol('Fragment')
export type Fragment = ExoticComponent<typeof FragmentKind>
export const Fragment = { kind: FragmentKind } as Fragment

export type Context<T> = {
  current: T
  defaultValue: T
  Provider: Provider<T>
}

export const ProviderKind = Symbol('Provider')
export type Provider<T> = ExoticComponent<
  typeof ProviderKind,
  { value: T; children: ThunderNode },
  { context: Context<T> }
>

export const createContext = <T>(defaultValue: T): Context<T> => {
  const context = {
    current: defaultValue,
    defaultValue: defaultValue,
  } as Context<T>
  context.Provider = { kind: ProviderKind, context: context } as Provider<T>
  return context
}

export const isActionComponent = (value: unknown): value is ActionComponent =>
  typeof value === 'function' && 'id' in value && typeof value.id === 'string'
