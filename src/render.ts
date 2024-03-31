import {
  type Context,
  type ReslackNode,
  Fragment,
  isActionComponent,
  FragmentKind,
  ProviderKind,
} from './entities'

export const render = (node: ReslackNode): Promise<unknown> => renderImpl(node)

const renderImpl = async (
  node: ReslackNode,
  renderRef: symbol = Symbol(),
): Promise<unknown> => {
  // See Components section for the details about context snapshot
  const contextSnapshot =
    snapshotRegistry.get(renderRef) ?? new Map<Context<unknown>, unknown>()
  snapshotRegistry.set(renderRef, contextSnapshot)

  // Array of nodes
  if (Array.isArray(node)) {
    return renderImpl({ type: Fragment, props: { children: node } }, renderRef)
  }

  // Primitive nodes
  if (node === null || typeof node !== 'object') return node

  // Slack blocks
  if (typeof node.type === 'string') {
    if (node.type === 'raw') {
      return (node.props as Record<string, unknown>).value
    }
    /**
     * Some props must be rendered before passing to the block. For example,
     * `elements` prop of `actions` block.
     * We use `childProps` and `childrenProps` to determine which props must be rendered.
     * Also, we use `children` as a conventional name for some renderable props (`typeChildrenMap`).
     */
    const props = await Object.keys(node.props).reduce<
      Promise<Record<string, unknown>>
    >(async (acc, key) => {
      const awaited = await acc
      const nodeType = node.type as string
      const value = (node.props as Record<string, unknown>)[key]

      // Handle component passed as an action_id or callback_id prop
      if (
        ['action_id', 'callback_id'].includes(key) &&
        isActionComponent(value)
      ) {
        awaited[key] = value.id
        return awaited
      }

      // Non-renderable props
      if (
        value === undefined ||
        value === null ||
        (!childProps.includes(key) && !childrenProps.includes(key))
      ) {
        awaited[key] = value
        return awaited
      }

      // Key name is `children` or contained in `childrenProps` or `childProps`
      const name = key === 'children' ? typeChildrenMap[nodeType] : key
      if (!name) throw new Error(`${nodeType} cannot have children.`)

      // Special handling for `plain_text` and `mrkdwn` elements
      if (['plain_text', 'mrkdwn'].includes(nodeType)) {
        awaited[name] = [value].flat().join('')
        return awaited
      }

      const children = (() => {
        type Node = NonNullable<ReslackNode>
        if (!Array.isArray(value)) return value as Node
        // Filter out nulls, undefineds and booleans to support conditional rendering
        return (value as ReslackNode[]).filter(
          a => a !== null && !['undefined', 'boolean'].includes(typeof a),
        )
      })()

      const childNode = (() => {
        // Children is shortened plain_text
        if (['string', 'number'].includes(typeof children)) {
          return { type: 'plain_text', props: { text: children } }
        }
        // Children is shortened plain_text with interpolations
        if (
          Array.isArray(children) &&
          children.some(a => ['string', 'number'].includes(typeof a))
        ) {
          return { type: 'plain_text', props: { text: children } }
        }
        // Children is array of nodes
        if (childrenProps.includes(name)) {
          return { type: Fragment, props: { children } }
        }
        return children
      })()

      const rendered = await renderImpl(childNode, renderRef)
      // Here we flatten children to support fragments inside fragments
      awaited[name] = Array.isArray(rendered) ? rendered.flat() : rendered
      return awaited
    }, Promise.resolve({}))

    if (elementsWithoutType.includes(node.type)) return props
    return { type: node.type, ...props }
  }

  // Components
  if (typeof node.type === 'function' && !('kind' in node.type)) {
    /**
     * Concurrently rendered components (e.g. from different requests) can use
     * the same context Providers. This can lead for example to the situation when one
     * component changes current context value and another component (from different request)
     * will use that value. To prevent that we save current context value to the snapshot
     * bound to the current render ref and restore it directly before rendering a new component.
     */
    contextSnapshot.forEach((value, context) => {
      context.current = value
    })
    const childNode = await node.type(node.props)
    return renderImpl(childNode, renderRef)
  }

  // Fragments
  if (node.type.kind === FragmentKind) {
    const props = node.props as { children?: ReslackNode }
    const children = props.children || []
    const normalized = Array.isArray(children) ? children : [children]
    /**
     * We must render children sequentially because they can be same Providers
     * with different values, but Context API relies on the shared state which
     * holds current value.
     */
    return normalized
      .filter(a => a !== null && !['undefined', 'boolean'].includes(typeof a))
      .reduce<Promise<unknown[]>>(async (acc, child) => {
        const awaited = await acc
        awaited.push(await renderImpl(child, renderRef))
        return awaited
      }, Promise.resolve([]))
  }

  // Context providers
  if (node.type.kind === ProviderKind) {
    const outerContextValue =
      contextSnapshot.get(node.type.context) ?? node.type.context.defaultValue

    const props = node.props as { value: unknown; children: ReslackNode }
    contextSnapshot.set(node.type.context, props.value)
    const rendered = await renderImpl(props.children, renderRef)
    contextSnapshot.set(node.type.context, outerContextValue)
    return rendered
  }
}

// TODO: document that if you want to add new element you shuld check if it is in childProps or childrenProps
const childProps = [
  'title',
  'text',
  'confirm',
  'deny',
  'description',
  'label',
  'placeholder',
  'initial_option',
  'close',
  'submit',
  'element',
  'hint',
  'accessory',
]
const childrenProps = [
  'children',
  'options',
  'initial_options',
  'option_groups',
  'elements',
  'fields',
  'blocks',
]
const typeChildrenMap: Record<string, string> = {
  confirm: 'text',
  option: 'text',
  option_group: 'options',
  button: 'text',
  checkboxes: 'options',
  overflow: 'options',
  radio_buttons: 'options',
  workflow_button: 'text',
  header: 'text',
  modal: 'blocks',
  home: 'blocks',
  actions: 'elements',
  context: 'elements',
  input: 'element',
  section: 'text',
  video: 'title',
  mrkdwn: 'text',
  plain_text: 'text',
}
const elementsWithoutType = ['confirm', 'option', 'option_group']

const snapshotRegistry = new WeakMap<symbol, Map<Context<unknown>, unknown>>()
