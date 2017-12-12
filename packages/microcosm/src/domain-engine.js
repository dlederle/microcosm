/**
 * @flow
 */

import { merge, result, createOrClone } from './utils'
import { setup, teardown, getHandlers } from './registry'
import {
  RESET,
  PATCH,
  INITIAL_STATE,
  DESERIALIZE,
  SERIALIZE
} from './lifecycle'

type DomainList = { [key: string]: Domain }

class DomainEngine {
  repo: Microcosm
  domains: DomainList

  constructor(repo: Microcosm) {
    this.repo = repo
    this.domains = {}
  }

  add(key: string, config: *, options?: Object) {
    console.assert(
      !options || options.constructor === Object,
      'addDomain expected a plain object as the third argument.'
    )

    console.assert(key && key.length > 0, 'Can not add domain to root level.')

    let deepOptions = merge(
      this.repo.options,
      config.defaults,
      { key },
      options
    )

    let domain: Domain = createOrClone(config, deepOptions, this.repo)

    this.domains[key] = domain

    this.repo.subscribe({
      start: setup(this.repo, domain, deepOptions),
      complete: teardown(this.repo, domain, deepOptions)
    })

    return domain
  }

  lifecycle(type, payload) {
    let state = {}

    for (var key in this.domains) {
      var domain = this.domains[key]

      switch (type) {
        case INITIAL_STATE:
          state[key] = result(domain, 'getInitialState')
          break
        case DESERIALIZE:
          if ('deserialize' in domain) {
            state[key] = domain.deserialize(payload[key])
          }
          break
        case SERIALIZE:
          if ('serialize' in domain) {
            state[key] = domain.serialize(payload[key])
          }
          break
        case RESET:
          if (this.repo === action.origin) {
            state[key] = payload[key]
          }
          break
        case PATCH:
          if (this.repo === action.origin && key in payload) {
            state[key] = payload[key]
          }
          break
        default:
      }
    }

    return state
  }

  dispatch(action: Action, state: Object) {
    for (var key in this.domains) {
      var domain = this.domains[key]
      var handlers = getHandlers(result(domain, 'register') || {}, action)

      for (var i = 0; i < handlers.length; i++) {
        state[key] = handlers[i].call(
          domain,
          state[key],
          action.payload,
          action.meta
        )
      }
    }

    return state
  }
}

export default DomainEngine
