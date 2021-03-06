/**
 * @flow
 */

import assert from 'assert'

let uid = 0
const FALLBACK = '_action'

/**
 * Uniquely tag a function. This is used to identify actions.
 */
export function tag(fn: string | Command, name?: string): * {
  assert(fn != undefined, `Can not tag action. Value is ${String(fn)}.`)

  if (typeof fn !== 'function') {
    return fn.toString()
  }

  if (fn.hasOwnProperty('toString')) {
    return fn
  }

  let symbol = name || (fn.name || FALLBACK) + '-' + uid++

  // Cast to an object to make flow happy
  let tagged: Object = fn
  tagged.toString = () => symbol

  return tagged
}
