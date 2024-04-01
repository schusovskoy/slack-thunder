import {
  type ThunderElementType,
  type ThunderElement,
  Fragment as ThunderFragment,
} from './entities'

export const jsx = (
  type: ThunderElementType,
  props: Record<string, unknown>,
): ThunderElement => {
  const propsCopy = { ...props }
  const children = propsCopy.children
  if (children && Array.isArray(children)) {
    propsCopy.children = children.flat()
  }
  return { type, props: propsCopy }
}

export const jsxs = jsx

export const Fragment = ThunderFragment
