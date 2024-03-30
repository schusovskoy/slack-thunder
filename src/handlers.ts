import type { ActionComponent, Component } from './entities'
import fs from 'fs/promises'
import path from 'path'
import { includes, isRecord, type MakeRequired } from './utils'

type HandlerProps<T extends object = object> = {
  query?: string
  eventType?: 'view_submission' | 'view_closed'
  rerender?: (props: Partial<T>) => Promise<unknown>
}

export type HandlerComponent = Component<Required<HandlerProps>>

export type WithHandlerProps<
  T extends object,
  U extends keyof HandlerProps = never,
> = T & MakeRequired<HandlerProps<T>, U>

type ConfigEntry = { pattern?: string | RegExp; component: HandlerComponent }
type ConfigSubmissionEntry = ConfigEntry & { handleClose?: boolean }
type ConfigEventEntry = { pattern: string; component: HandlerComponent }

export type HandlersConfig = {
  actions?: (HandlerComponent | ConfigEntry)[]
  messages?: (HandlerComponent | ConfigEntry)[]
  shortcuts?: (HandlerComponent | ConfigEntry)[]
  commands?: (HandlerComponent | ConfigEntry)[]
  options?: (HandlerComponent | ConfigEntry)[]
  submissions?: (HandlerComponent | ConfigSubmissionEntry)[]
  events?: ConfigEventEntry[]
}

type NoramatlizedHandlersConfig = {
  actions: Required<ConfigEntry>[]
  messages: Required<ConfigEntry>[]
  shortcuts: Required<ConfigEntry>[]
  commands: Required<ConfigEntry>[]
  options: Required<ConfigEntry>[]
  submissions: Required<ConfigSubmissionEntry>[]
  events: ConfigEventEntry[]
}

export const parseHandlers = async (
  appPath: string,
): Promise<NoramatlizedHandlersConfig> => {
  const stateHandlersCache = new Set<string>()
  const configEntries = await getFolderEntries(appPath)
  const handlersConfig = handlerTypes.reduce((acc, type) => {
    acc[type] = []
    return acc
  }, {} as NoramatlizedHandlersConfig)
  return configEntries.reduce((acc, configEntry) => {
    const namespace = path.parse(configEntry).name
    const modulePath = path.join(appPath, configEntry)
    const config = requireModule(modulePath).config
    if (!isHandlersConfig(config)) {
      throw new Error(`Module ${modulePath} must export a config object.`)
    }

    const handleEntry =
      (type: keyof HandlersConfig) =>
      (entry: HandlerComponent | ConfigSubmissionEntry) => {
        const normalized = normalizeEntry(entry, namespace)
        const { pattern, component, handleClose, stateRe } = normalized
        // Bind component to a pattern
        acc[type].push({ pattern: pattern as string, component, handleClose })
        // Bind component to its id so it can be used as action_id / callback_id
        const bindable = ['options', 'submissions', 'actions']
        if (pattern !== component.id && bindable.includes(type)) {
          acc[type].push({ pattern: component.id, component, handleClose })
        }
        // Bind component to a state regexp if it is statefull
        if (component.statefull && !stateHandlersCache.has(stateRe.source)) {
          stateHandlersCache.add(stateRe.source)
          acc.actions.push({ pattern: stateRe, component })
        }
      }

    handlerTypes.forEach(type => {
      config[type]?.forEach(handleEntry(type))
    })
    return acc
  }, handlersConfig)
}

const normalizeEntry = (
  entry: HandlerComponent | ConfigSubmissionEntry,
  namespace: string,
) => {
  const normalized = typeof entry === 'function' ? { component: entry } : entry
  const component = normalized.component as ActionComponent
  component.id = `${namespace}/${component.name}`
  const pattern = normalized.pattern || component.id
  const handleClose = normalized.handleClose || false
  const stateRe = new RegExp(`^state:${component.id}\\.`)
  return { pattern, stateRe, component, handleClose }
}

const getFolderEntries = async (folder: string) => {
  const isExist = await fs
    .access(folder)
    .then(() => true)
    .catch(() => false)
  if (!isExist) return []
  return fs.readdir(folder)
}

const requireModule = (modulePath: string): Record<string, unknown> => {
  const parsed = path.parse(modulePath)
  const absoluteModuleId = path.join(parsed.dir, parsed.name)
  const relativeModuleId = path.relative(__dirname, absoluteModuleId)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(relativeModuleId) as Record<string, unknown>
  } catch (error) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Cannot import module with path ${modulePath}.\nCause: ${error}.`,
    )
  }
}

const isHandlersConfig = (value: unknown): value is HandlersConfig =>
  isRecord(value) &&
  Object.entries(value).every(([key, entries]) => {
    if (!includes(key, handlerTypes)) return false
    if (!Array.isArray(entries)) return false
    return entries.every(entry => {
      if (key === 'events') return isConfigEventEntry(entry)
      return isConfigEntry(entry)
    })
  })

const handlerTypes = [
  'actions',
  'messages',
  'shortcuts',
  'commands',
  'options',
  'events',
  'submissions',
] as const

const isConfigEventEntry = (value: unknown): value is ConfigEventEntry =>
  isRecord(value) &&
  typeof value.pattern === 'string' &&
  typeof value.component === 'function'

const isConfigEntry = (value: unknown): value is Component | ConfigEntry =>
  typeof value === 'function' ||
  (isRecord(value) && typeof value.component === 'function')
