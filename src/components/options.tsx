import type { Component, ThunderNode } from '../entities'
import { ArgsContext, isOptionsArgs, useArgs } from '../hooks'
import { render } from '../render'
import type {
  BlockOptions,
  Option,
  OptionGroups as OptionGroupsType,
} from '@slack/bolt'

type OptionsProps = {
  /** options */
  children: ThunderNode
}

export const Options: Component<OptionsProps> = async ({ children }) => {
  const args = useArgs()
  if (!isOptionsArgs(args)) {
    throw new Error('Options must be rendered in response to option event.')
  }
  const options = (await render(
    <ArgsContext.Provider value={args}>
      <>{children}</>
    </ArgsContext.Provider>,
  )) as Option[]
  await args.ack({ options })
}

export const OptionGroups: Component<OptionsProps> = async ({ children }) => {
  const args = useArgs()
  if (!isOptionsArgs(args)) {
    throw new Error(
      'OptionGroups must be rendered in response to option event.',
    )
  }
  const rendered = (await render(
    <ArgsContext.Provider value={args}>
      <>{children}</>
    </ArgsContext.Provider>,
  )) as OptionGroupsType<BlockOptions>['option_groups']
  await args.ack({ option_groups: rendered })
}
