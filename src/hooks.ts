import type {
  AllMiddlewareArgs,
  AnyMiddlewareArgs,
  BlockAction,
  SlackActionMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackOptionsMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewStateSelectedOption,
  ViewStateValue,
} from '@slack/bolt'
import { createContext, isActionComponent } from './entities'
import type { Context, ActionComponent } from './entities'
import type { HandlerComponent } from './handlers'

export const useContext = <T>(context: Context<T>): T => context.current

export type ArgsContextType = AllMiddlewareArgs &
  (AnyMiddlewareArgs | SlackEventMiddlewareArgs<'message'>)

export const ArgsContext = createContext<ArgsContextType | undefined>(undefined)

export const useArgs = (): ArgsContextType => {
  const args = useContext(ArgsContext)
  if (!args) throw new Error('useArgs must be used inside ArgsContext.')
  return args
}

type ControlTypes = {
  timepicker: string | undefined
  button: string | undefined
  static_select: ViewStateSelectedOption | undefined
  multi_static_select: ViewStateSelectedOption[] | undefined
  users_select: string | undefined
  multi_users_select: string[] | undefined
  conversations_select: string | undefined
  multi_conversations_select: string[] | undefined
  channels_select: string | undefined
  multi_channels_select: string[] | undefined
  external_select: ViewStateSelectedOption | undefined
  multi_external_select: ViewStateSelectedOption[] | undefined
  overflow: ViewStateSelectedOption | undefined
  datepicker: string | undefined
  radio_buttons: ViewStateSelectedOption | undefined
  checkboxes: ViewStateSelectedOption[] | undefined
  plain_text_input: string | undefined
}

type Control =
  | keyof ControlTypes
  | { type: keyof ControlTypes; options?: HandlerComponent }

type StateDescriptor = [
  hostComponent: HandlerComponent,
  descriptor: Record<string, Control>,
]

type InferStateFromDescriptor<T extends StateDescriptor> = {
  [K in keyof T[1]]: T[1][K] extends keyof ControlTypes
    ? ControlTypes[T[1][K]]
    : T[1][K] extends { type: keyof ControlTypes }
      ? ControlTypes[T[1][K]['type']]
      : never
}
type State<T extends StateDescriptor> = [
  InferStateFromDescriptor<T>,
  Record<string, string>,
]

export const useState = <T extends StateDescriptor>([
  hostComponent,
  descriptor,
]: T): State<T> => {
  if (!isActionComponent(hostComponent)) {
    throw new Error(
      `id is missing in the host component of the descriptor: ${JSON.stringify(
        descriptor,
      )}.`,
    )
  }

  const componentId = hostComponent.id
  const args = useArgs()
  const values = (() => {
    if (isBlockActionArgs(args)) {
      return args.body.view?.state?.values || args.body.state?.values
    }
    if (isOptionsArgs(args)) return args.body.view?.state?.values
    if (isViewArgs(args)) return args.view.state?.values
  })()

  const normalized = Object.values(values || {}).reduce<
    Record<string, ViewStateValue>
  >((acc, value) => ({ ...acc, ...value }), {})

  const state = Object.entries(descriptor).reduce<
    Record<string, ControlTypes[keyof ControlTypes]>
  >((acc, [key, control]) => {
    const actionId = getControlActionId(componentId, key, control)
    const fieldName = getStateField(control)
    acc[key] = normalized[actionId]?.[fieldName] || undefined
    return acc
  }, {}) as InferStateFromDescriptor<T>

  const actionIds = Object.entries(descriptor).reduce<Record<string, string>>(
    (acc, [key, control]) => {
      acc[key] = getControlActionId(componentId, key, control)
      return acc
    },
    {},
  )

  return [state, actionIds] as const
}

export const createState = <T extends StateDescriptor>(...descriptor: T): T => {
  const hostComponent = descriptor[0] as ActionComponent
  hostComponent.statefull = true
  return descriptor
}

const getStateField = (control: Control) => {
  const type = typeof control === 'string' ? control : control.type
  return typeValueMap[type]
}

const getControlActionId = (
  actionPrefix: string,
  key: string,
  control: Control,
) =>
  typeof control === 'string'
    ? `state:${actionPrefix}.${key}`
    : `state:${actionPrefix}.${key}_${(control.options as ActionComponent).id}`

const typeValueMap = {
  timepicker: 'selected_time',
  button: 'value',
  static_select: 'selected_option',
  multi_static_select: 'selected_options',
  users_select: 'selected_user',
  multi_users_select: 'selected_users',
  conversations_select: 'selected_conversation',
  multi_conversations_select: 'selected_conversations',
  channels_select: 'selected_channel',
  multi_channels_select: 'selected_channels',
  external_select: 'selected_option',
  multi_external_select: 'selected_options',
  overflow: 'selected_option',
  datepicker: 'selected_date',
  radio_buttons: 'selected_option',
  checkboxes: 'selected_options',
  plain_text_input: 'value',
} as const

export const usePrivateMetadata = <T extends object>(): T => {
  const args = useArgs()
  if (isAppHomeOpenedArgs(args)) {
    const metadata = args.body.event.view?.private_metadata || '{}'
    return JSON.parse(metadata) as T
  }
  if (!isBlockActionArgs(args) && !isViewArgs(args) && !isOptionsArgs(args)) {
    throw new Error('usePrivateMetadata must be used in a view context.')
  }
  const metadata = args.body.view?.private_metadata || '{}'
  return JSON.parse(metadata) as T
}

export const isOptionsArgs = (
  value: ArgsContextType,
): value is SlackOptionsMiddlewareArgs<'block_suggestion'> &
  AllMiddlewareArgs =>
  'options' in value && value.body.type === 'block_suggestion'

export const isBlockActionArgs = (
  value: ArgsContextType,
): value is SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs =>
  'action' in value && value.body.type === 'block_actions'

export const isViewArgs = (
  value: ArgsContextType,
): value is SlackViewMiddlewareArgs & AllMiddlewareArgs =>
  'view' in value &&
  (value.body.type === 'view_submission' || value.body.type === 'view_closed')

export const isAppHomeOpenedArgs = (
  value: ArgsContextType,
): value is SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs =>
  'event' in value && value.event.type === 'app_home_opened'
