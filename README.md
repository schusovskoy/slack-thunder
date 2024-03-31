# reslack

Developing complex applications with @slack/bolt can be challenging using the standard approach (Block Kit). You may encounter the following issues:

- Difficulty in composing interfaces from reusable parts
- Inconvenient form management
- Backend-centric design

Many agree that a composable component architecture is convenient for building UIs. This is where Reslack comes in. Reslack is a library that helps you build Block Kit interfaces using JSX. It employs familiar concepts like reusable components and hooks so you already kinda know how to use it.
Reslack can be incrementally integrated into existing projects. While it's not yet feature-full in terms of API, the library design is straightforward and the project welcomes contributions.

## Getting Started

Install using your preferred package manager:

```bash
yarn add reslack @slack/bolt
```

In addition, you need to configure your transpiler to use the jsx-runtime from reslack. If you're using tsc, add the following lines to your tsconfig.json file:

```json
"jsx": "react-jsx",
"jsxImportSource": "reslack"

```

For babel, set the `importSource` option of @babel/plugin-transform-react-jsx to `reslack`. Refer to the [importSource Documentation](https://babeljs.io/docs/babel-plugin-transform-react-jsx#importsource) for more details.

## Initialization

```javascript
import { App } from '@slack/bolt'
import { AppComponent, render } from 'reslack'

// Create @slack/bolt App
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
})

;(async () => {
  // Render AppComponent
  await render(<AppComponent slackApp={app} />)

  // Start @slack/bolt App
  await app.start(process.env.PORT || 3000)
  console.log('⚡️ Bolt app is running!')
})()
```

## Handler Components

The fundamental building block of Reslack is a component. A component is a function (which can be async) that takes a props object and maps it to JSX UI.

```typescript
const HelloMessage: Component<{ name: string }> = async ({ name }) => {
  await doSomeAsyncStuff()
  return (
    <Message token="your_slack_token" channel="C123ABC456">
	    Hello, {name}
	  </Message>
  )
}
```

A crucial special case of a component is a handler component. This entity handles user actions in Slack and produces a result. For instance, you might want to display a modal in response to a user's button click. That's when a handler component is useful.

```typescript
const FancyModal: Component = () => {
  return (
    <Modal title="Fancy Modal">
	    <section>
        <mrkdwn>*Some md text*</mrkdwn>
      </section>
      <divider />
      <button action_id="some_action_id">Fancy Button</button>
    </Modal>
  )
}
```

Reslack uses HandlerConfig objects to connect handler components and Slack events. This object describes which events a component should react to.

```typescript
export const config: HandlersConfig = {
  actions: [{ pattern: 'SomeBlockKitAction', component: FancyModal }],
}
```

To allow Reslack to find your HandlerConfig objects, place them inside one of the modules in the `src/app` folder (you can specify a different path using the `handlersPath` prop of `AppComponent`).

```
.
└── src
    └── app
        ├── FancyModal.tsx
        └── components
            └── index.ts
```

> [!IMPORTANT]
> Please note, all entries (direct children - files and folders) in `src/app` must export a config. If you use folder entries (to group related functionality), each entry must have an `index` file with a config export.

HandlerConfig is structured as follows:

```tsx
type HandlersConfig = {
  actions?: (HandlerComponent | ConfigEntry)[]
  messages?: (HandlerComponent | ConfigEntry)[]
  shortcuts?: (HandlerComponent | ConfigEntry)[]
  commands?: (HandlerComponent | ConfigEntry)[]
  options?: (HandlerComponent | ConfigEntry)[]
  submissions?: (HandlerComponent | ConfigSubmissionEntry)[]
  events?: ConfigEventEntry[]
}

type ConfigEntry = { pattern?: string | RegExp; component: HandlerComponent }
type ConfigSubmissionEntry = ConfigEntry & { handleClose?: boolean }
type ConfigEventEntry = { pattern: string; component: HandlerComponent }
```

As you may notice, all entries (except `events`) can simply be `HandlerComponent`. This is because handler ids (patterns) for `HandlerComponent`-s are automatically generated. The example below illustrates this:

```tsx
// path: src/app/hello.tsx

const HelloMessage: Component = () => (
  <Message channel="C123ABC456">
    Hello world!
  </Message>
)

const HelloModal: Component = () => {
  return (
    <Modal title="Hello Modal">
      <button action_id={HelloMessage}>Hello Button</button>
    </Modal>
  )

export config: HandlersConfig = {
	actions: [HelloMessage, HelloModal]
}

```

In this example, `HelloMessage` and `HelloModal` components will automatically receive `hello/HelloMessage` and `hello/HelloModal` action ids, respectively. This allows us to use the `HelloMessage` component itself as a value for the `HelloModal`'s `action_id` prop.

Handler components can have specific properties. For instance:

- The `options` handler component has a `query: string` prop, which represents the current search query.
- The `submissions` handler component has an `eventType: 'view_submission' | 'view_closed'` prop, which helps distinguish between submission and closed events.
- All handler components have a `rerender` prop, useful for rerendering a component after an asynchronous operation. This can be utilized to display a loading state while data is being loaded, and then rerender the component once the data is available.

You can use the `WithHandlerProps` type to utilize these properties.

```tsx
import type { WithHandlerProps } from 'reslack'

type FormSubmissionProps = WithHandlerProps<
  { data?: Data },
  'eventType' | 'rerender'
>

const FormSubmission: Component<FormSubmissionProps> = ({
  data,
  eventType,
  rerender,
}) => {
  if (eventType === 'view_closed') {
    // Do something special on close
  }
  if (!data) {
    loadData().then(data => rerender({ data }))
    return // some layout in case when data is not available
  }
  // here data is available and you can return full layout
  return // some layout
}
```

## Components

### Message

The Message component is used to send, edit, or delete messages (either text or Block Kit) in channels.

<!-- prettier-ignore -->
| Prop | Description |
| --- | --- |
| **token**?: string | Slack Web API Token. If you use the Message component outside of the handler (for example, in a background job), you must provide your token. |
| **channel**?: string | Channel to send message to. However, if you use Message in response to an event that has a `response_url` ([Message Responses Doc](https://api.slack.com/interactivity/handling#message_responses)), you can omit this property. |
| **messageTs**?: string | You can use the message timestamp to edit an existing message. |
| **responseType**?: 'in_channel' \| 'ephemeral' \| 'replace' \| 'delete' | Response type ([Message Responses Doc](https://api.slack.com/interactivity/handling#message_responses)). |
| **onSuccess**?: (data: ChatUpdateResponse \| ChatPostMessageResponse) => void | Callback to run on success. |
| **onFail**?: (error: Error) => void | Callback to run on fail. |
| **children**?: ReslackNode | String or any acceptable Block Kit blocks. |

### Modal

The Modal component is utilized to display a modal.

<!-- prettier-ignore -->
| Prop | Description |
| --- | --- |
| **title**: ReslackElement | string | Modal title. Can be a `string` or `plain_text` element. |
| **close**?: ReslackElement | string | An optional `string` or `plain_text` element that defines the text displayed in the close button. |
| **submit**?: ReslackElement | string | Defines the text displayed in the submit button. |
| **callbackId**?: Component | string | An identifier to recognize interactions and submissions of this particular view. Can be a `HandlerComponent`. |
| **notifyOnClose**?: boolean | Indicates whether Slack will send your request URL a `view_closed` event when a user clicks the close button. Defaults to `false`. |
| **clearOnClose**?: boolean | When set to `true`, clicking on the close button will clear all views in a modal and close it. Defaults to `false`. |
| **externalId**?: string | A custom identifier that must be unique for all views on a per-team basis. |
| **privateMetadata**?: object | An optional object that will be sent to your app in `view_submission` and `block_actions` events. |
| **children**?: ReslackNode | Any acceptable Block Kit blocks. |

### Home

The Home component is utilized to establish the layout of the user's Home Tab. For more information, refer to the [Home Doc](https://api.slack.com/surfaces/app-home).

<!-- prettier-ignore -->
| Props | Description |
| --- | --- |
| **token**?: string | Slack Web API Token. If you use the Home component outside of the handler (for example, in a background job), you must provide your token. |
| **userId**: string | ID of the user for whom you are setting the home tab. |
| **externalId**?: string | A custom identifier that must be unique for all views on a per-team basis. |
| **privateMetadata**?: object | An optional object that will be sent to your app in `view_submission` and `block_actions` events. |
| **children**?: ReslackNode | Any acceptable Block Kit blocks. |

### Options and OptionGroups

These special components are used to display a dynamic list of options from an external data source. They can only be used in `options` field within the `HandlersConfig`.

```tsx
const ProjectOptions: Component<WithHandlerProps<object, 'query'>> = async ({
  query,
}) => {
  const projects = await loadProjects(query)
  return (
    <Options>
      <option value="empty">No project</option>
      <option value="create_new">Create new</option>
      {projects.map(({ id, name }) => (
        <option value={id}>{name}</option>
      ))}
    </Options>
  )
}

export const config: HandlersConfig = {
  options: [ProjectOptions],
}
```

<!-- prettier-ignore -->
| Props | Descriptions |
| --- | --- |
| **children**: ReslackNode | `option` elements for Options component or `option_group` for OptionGroups. |

## Hooks

### useContext

At times, it's convenient to pass a value to a deeply nested component without resorting to "props drilling". For instance, you might have an i18n function that you want to use in nearly all components.

> [!IMPORTANT]
> Due to the way it's implemented internally, you must use the `useContext` hook before any asynchronous action in your component.

```tsx
// Create context
const MyContext = createContext<{ myValue: unknown } | undefined>(undefined)

// Provide a value
<MyContext.Provider value={{ myValue: someValue }}>
  ...
</MyContext.Provider>

// Using context value
const myContext = useContext(MyContext)

```

### useArgs

In `HandlerComponent` or its child components, you can use the `useArgs` hook to retrieve the current handler’s arguments object ([Listener function arguments](https://slack.dev/bolt-js/reference)).

### usePrivateMetadata

Use this hook to access the current view's private_metadata. You can use private_metadata to transfer information between views. For more information, see [Carry data between views](https://api.slack.com/surfaces/modals#private_metadata).

```tsx
const metadata = usePrivateMetadata<MetadataType>()
```

### useState

This is a particularly interesting hook that allows you to work with forms in a convenient and type-safe way. It's best illustrated by an example:

```tsx
const Form: Component = () => {
  const [current, stateRef] = useState(state)
  console.log(current) // Log current state

  return (
    <Modal title="Form" callbackId={FormSubmission}>
      <input block_id="projects" label="Choose project" dispatch_action>
        <external_select action_id={stateRef.projects} />
      </input>

      <input block_id="name" label="Name" dispatch_action>
        <plain_text_input action_id={stateRef.name} />
      </input>

      <input block_id="someSelect" label="Some select" dispatch_action>
        <static_select
          action_id={stateRef.someSelect}
          options={
            <>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </>
          }
        />
      </input>
    </Modal>
  )
}

const FormSubmission: Component = () => {
  const [current] = useState(state)
  // Do something with the state
}

const state = createState(Form, {
  projects: { type: 'external_select', options: ProjectOptions },
  name: 'plain_text_input',
  someSelect: 'static_select',
})

export const config: HandlersConfig = {
  actions: [Form],
  submissions: [FormSubmission],
  options: [ProjectOptions],
}
```

## Intrinsic Elements

Refer to [jsx-types.ts](src/jsx-types.ts#L25) to view the available elements, their props, and possible values. This file also contains comments that clarify the context in which a particular element can be used.

```tsx
/**
 * Blocks: Section, Actions
 * Surfaces: Message
 */
workflow_button: {
  /** text: plain_text */
  children: ReslackNode
```

In this example, the `workflow_button` element can be used in `Messages` and can contain `Section` and `Actions` blocks. Its `children` prop is an alias for the `text` field and can only be a `plain_text` element.
