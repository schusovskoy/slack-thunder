export type ReslackElementType =
  | string
  | Component
  | Fragment
  | Provider<unknown>

export type ReslackElement = {
  type: ReslackElementType
  props: object
}

export type ReslackNode =
  | null
  | undefined
  | void
  | string
  | number
  | boolean
  | ReslackElement
  | ReslackNode[]

export type Component<Props extends object = object> = (
  props: Props,
) => ReslackNode | Promise<ReslackNode>

export type ActionComponent<Props extends object = object> =
  Component<Props> & { id: string; statefull?: boolean }

type ExoticComponent<
  T extends symbol,
  Props extends object = object,
  Config extends object = object,
> = { bivariant(props: Props): ReslackNode }['bivariant'] & { kind: T } & Config

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
  { value: T; children: ReslackNode },
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
