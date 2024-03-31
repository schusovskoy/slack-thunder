import type { View } from '@slack/bolt'
import type { Component, ReslackNode } from '../entities'
import { ArgsContext, useArgs } from '../hooks'
import { render } from '../render'
import { WebClient } from '@slack/web-api'

type HomeProps = {
  userId?: string
  token?: string
  children?: ReslackNode
  externalId?: string
  privateMetadata?: object
}

export const Home: Component<HomeProps> = async ({
  userId,
  token,
  children = [],
  externalId,
  privateMetadata,
}) => {
  const { client, args } = (() => {
    if (token) return { client: new WebClient(token), args: undefined }
    const args = useArgs()
    return { client: args.client, args }
  })()

  if (!userId && !args?.context.userId) {
    throw new Error(
      'userId prop is required when rendering Home outside of a handler context.',
    )
  }
  const finalUserId = (userId || args?.context.userId) as string
  const metadata = JSON.stringify(privateMetadata)
  const view = (await render(
    <ArgsContext.Provider value={args}>
      <home external_id={externalId} private_metadata={metadata}>
        {children}
      </home>
    </ArgsContext.Provider>,
  )) as View

  await client.views.publish({ user_id: finalUserId, view })
}
