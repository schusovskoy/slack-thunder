import type { App } from '@slack/bolt'
import type { Component } from '../entities'
import path from 'path'
import { parseHandlers, type HandlerComponent } from '../handlers'
import {
  ArgsContext,
  isOptionsArgs,
  isViewArgs,
  type ArgsContextType,
} from '../hooks'
import { render } from '../render'

type AppProps = {
  slackApp: App
  handlersPath?: string
}

export const AppComponent: Component<AppProps> = async ({
  slackApp,
  handlersPath = 'src/app',
}) => {
  const appPath = path.join(process.cwd(), handlersPath)
  const handlers = await parseHandlers(appPath)

  const getHandler =
    (Component: HandlerComponent) => async (args: ArgsContextType) => {
      if (!isOptionsArgs(args)) await args.ack?.()
      const eventType = isViewArgs(args) ? args.body.type : undefined
      const query = isOptionsArgs(args) ? args.options.value : undefined

      const rerender = (props: object) =>
        render(
          <ArgsContext.Provider value={args}>
            <Component
              eventType={eventType!}
              query={query!}
              rerender={rerender}
              {...props}
            />
          </ArgsContext.Provider>,
        )

      await rerender({})
    }

  handlers.events.forEach(({ pattern, component }) => {
    slackApp.event(pattern, getHandler(component))
  })
  handlers.messages.forEach(({ pattern, component }) => {
    slackApp.message(pattern, getHandler(component))
  })
  handlers.shortcuts.forEach(({ pattern, component }) => {
    slackApp.shortcut(pattern, getHandler(component))
  })
  handlers.commands.forEach(({ pattern, component }) => {
    slackApp.command(pattern, getHandler(component))
  })
  handlers.actions.forEach(({ pattern, component }) => {
    slackApp.action(pattern, getHandler(component))
  })
  handlers.submissions.forEach(({ pattern, component, handleClose }) => {
    slackApp.view(pattern, getHandler(component))
    if (!handleClose) return
    const closePattern = { callback_id: pattern, type: 'view_closed' } as const
    slackApp.view(closePattern, getHandler(component))
  })
  handlers.options.forEach(({ pattern, component }) => {
    const optionsRe = new RegExp(`(^|_)${pattern}($|_)`)
    slackApp.options(optionsRe, getHandler(component))
  })
}
