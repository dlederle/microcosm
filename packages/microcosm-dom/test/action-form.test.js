import React from 'react'
import { Microcosm, scheduler } from 'microcosm'
import { ActionForm, Presenter } from 'microcosm-dom/react'
import { mount, unmount, submit } from './helpers'

describe('ActionForm', function() {
  describe('callbacks', function() {
    it('executes onComplete when that action completes', async function() {
      let repo = new Microcosm()
      let reply = action => repo.push(action, true)
      let onComplete = jest.fn()

      let form = mount(
        <ActionForm action="test" onComplete={onComplete} send={reply} />
      )

      submit(form)

      await repo.history

      expect(onComplete).toHaveBeenCalledWith(repo.history.head)
    })

    it('executes onError when that action fails', async function() {
      let repo = new Microcosm()
      let reply = () => repo.push(() => action => action.error('bad'))
      let onError = jest.fn()
      let form = mount(<ActionForm onError={onError} send={reply} />)

      submit(form)

      try {
        await repo.history
      } catch (error) {
        expect(error).toEqual('bad')
      }

      expect(onError).toHaveBeenCalledWith(repo.history.head)
    })

    it('executes onSend when that action opens', function() {
      let repo = new Microcosm()
      let reply = () => repo.push(() => action => action.next('open'))
      let onSend = jest.fn()

      let form = mount(
        <ActionForm action="test" onSend={onSend} send={reply} />
      )

      submit(form)

      expect(onSend).toHaveBeenCalledWith(repo.history.head)
    })

    it('executes onNext when that action sends an update', function() {
      let repo = new Microcosm()
      let action = repo.push(() => action => {})
      let reply = () => action
      let onNext = jest.fn()

      let form = mount(
        <ActionForm action="test" onNext={onNext} send={reply} />
      )

      submit(form)

      action.next('loading')

      expect(onNext).toHaveBeenCalledWith(repo.history.head)
    })

    it('gracefully executes callbacks if not given an action', async function() {
      let onComplete = jest.fn()

      let form = mount(<ActionForm onComplete={onComplete} send={() => null} />)

      submit(form)

      await scheduler()

      expect(onComplete).toHaveBeenCalled()
    })

    it('removes action callbacks when the component unmounts', function() {
      let repo = new Microcosm()
      let action = repo.push(() => action => {})
      let send = jest.fn(() => action)
      let onComplete = jest.fn()

      let form = mount(<ActionForm onComplete={onComplete} send={send} />)

      submit(form)

      expect(send).toHaveBeenCalled()

      unmount(form)

      action.complete()

      expect(action.meta.status).toBe('complete')
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('context', function() {
    it('inherits send from context', async function() {
      let repo = new Microcosm()
      let onComplete = jest.fn()

      submit(
        mount(
          <Presenter repo={repo}>
            <ActionForm action="test" onComplete={onComplete} />
          </Presenter>
        )
      )

      await repo.history

      expect(onComplete).toHaveBeenCalled()
    })

    it('send as a prop overrides context', async function() {
      let repo = new Microcosm()
      let reply = action => repo.push(action, 'from-prop')
      let onComplete = jest.fn()

      submit(
        mount(
          <Presenter>
            <ActionForm action="test" onComplete={onComplete} send={reply} />
          </Presenter>
        )
      )

      await repo.history

      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('manual operation', function() {
    it('can pass in send manually', function() {
      let send = jest.fn()
      let form = mount(<ActionForm action="test" send={send} />)

      submit(form)

      expect(send).toHaveBeenCalled()
    })

    it('can call click directly', function() {
      let send = jest.fn()

      class Test extends React.Component {
        componentDidMount() {
          this.el.submit()
        }
        render() {
          return (
            <ActionForm action={test} send={send} ref={el => (this.el = el)} />
          )
        }
      }

      mount(<Test />)

      expect(send).toHaveBeenCalled()
    })
  })

  describe('value prop', function() {
    it('sends a value prop when provided', function() {
      let send = jest.fn()
      let form = mount(<ActionForm action="test" send={send} value={true} />)

      submit(form)

      expect(send).toHaveBeenCalledWith('test', true)
    })

    it('sends null when the value prop is null', function() {
      let send = jest.fn()
      let form = mount(<ActionForm action="test" send={send} value={null} />)

      submit(form)

      expect(send).toHaveBeenCalledWith('test', null)
    })

    it('calls prepare on the value', function() {
      let send = jest.fn()
      let prepare = jest.fn(value => value.toUpperCase())
      let form = mount(
        <ActionForm
          action="action"
          send={send}
          prepare={prepare}
          value="test"
        />
      )

      submit(form)

      expect(prepare).toHaveBeenCalledWith('test')
      expect(send).toHaveBeenCalledWith('action', 'TEST')
    })
  })
})
