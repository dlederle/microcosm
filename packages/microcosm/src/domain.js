/**
 * @flow
 */
import { type Microcosm } from './microcosm'
import { Subject } from './subject'
import { Registry } from './registry'
import { EMPTY_OBJECT } from './empty'
import { RESET, PATCH } from './lifecycle'
import { Ledger } from './ledger'

type DomainHandler<State> = (state: State, payload?: *, meta?: *) => State

export class Domain<State: mixed = null> extends Subject {
  repo: Microcosm
  options: Object
  _registry: Registry
  _ledger: Ledger<State>

  static defaults: ?Object

  static from(config: *): Class<Domain<*>> {
    if (typeof config === 'function') {
      return config
    }

    function NewEntity(repo: Microcosm, options?: Object) {
      // $FlowFixMe
      Domain.prototype.constructor.call(this, repo, options)
    }

    NewEntity.prototype = Object.create(Domain.prototype)

    for (var key in config) {
      NewEntity.prototype[key] = config[key]
    }

    // $FlowFixMe
    return NewEntity
  }

  constructor(repo: Microcosm, options: Object) {
    super(null, { tag: options.key })

    this.repo = repo
    this.options = options

    this.setup(repo, options)

    let start = this.getInitialState()

    this._registry = new Registry(this)
    this._ledger = new Ledger(start, repo.history, options.debug)

    this.next(start)

    let tracker = repo.history.subscribe(action => {
      let next = this._rollforward(action)

      if (next !== this.payload) {
        this.next(next)
      }

      // TODO: This could probably be a generic storage solution
      // that cleaned up keys as actions completed
      this._ledger.clean(action)
    })

    repo.subscribe({
      complete: () => {
        tracker.unsubscribe()
        this.teardown(repo, options)
      }
    })
  }

  /**
   * Generate the starting value for the domain.
   */
  getInitialState(): ?State {
    return null
  }

  /**
   * Setup runs right after a domain is added to a Microcosm, but
   * before it runs getInitialState. This is useful for one-time setup
   * instructions.
   */
  setup(repo?: Microcosm, options?: Object): void {}

  /**
   * Runs whenever a Microcosm is torn down. This usually happens when
   * a Presenter component unmounts. Useful for cleaning up work done
   * in `setup()`.
   */
  teardown(repo?: Microcosm, options?: Object): void {}

  /**
   * Allows a domain to transform state into a JavaScript primitive
   * suitable for serialization into JSON. Usually during server-side
   * rendering.
   *
   * To prevent accidental data transfer, this method is "opt-in",
   * returning `undefined` by default.
   */
  serialize(state: State): ?mixed {}

  /**
   * Allows data to be transformed into a valid shape before it enters a
   * Microcosm. This is the reverse operation to `serialize`.
   */
  deserialize(data: *): State {
    return data
  }

  /**
   * Returns an object mapping actions to methods on the domain. This is the
   * communication point between a domain and the rest of the system.
   */
  register(): { [string]: (last?: State, next?: *) => State } {
    return EMPTY_OBJECT
  }

  // Private -------------------------------------------------- //

  toJSON() {
    return this.serialize(this.valueOf())
  }

  _resolve(action: Subject): DomainHandler<State>[] {
    switch (action.toString()) {
      case String(RESET):
      case String(PATCH):
        return [this._patch]
      default:
        return this._registry.resolve(action)
    }
  }

  _dispatch(state: State, action: Subject): State {
    let handlers = this._resolve(action)

    for (var i = 0, len = handlers.length; i < len; i++) {
      state = handlers[i].call(this, state, action.payload, action.meta)
    }

    return state
  }

  _rollforward(action: Subject): State {
    let state = this._ledger.rebase(action)
    let focus = action

    while (focus) {
      if (!focus.disabled) {
        state = this._dispatch(state, focus)
      }

      this._ledger.set(focus, state)

      focus = this.repo.history.after(focus)
    }

    return state
  }

  _patch(state: State, payload: *, meta: *): State {
    if (this.repo !== meta.origin) {
      return state
    }

    let { deserialize, data } = payload
    let { key } = this.options

    let value = key in data ? data[key] : this.getInitialState()

    return deserialize ? this.deserialize(value) : value
  }
}