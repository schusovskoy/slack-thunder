import {
  type ReslackElementType,
  type ReslackElement,
  Fragment as ReslackFragment,
} from './entities'

export const jsxDEV = (
  type: ReslackElementType,
  props: Record<string, unknown>,
): ReslackElement => {
  const propsCopy = { ...props }
  const children = propsCopy.children
  if (children && Array.isArray(children)) {
    propsCopy.children = children.flat()
  }
  return { type, props: propsCopy }
}

export const jsxs = jsxDEV

export const Fragment = ReslackFragment