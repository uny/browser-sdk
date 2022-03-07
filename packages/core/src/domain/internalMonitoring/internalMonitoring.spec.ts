import type { Context } from '../../tools/context'
import type { Configuration } from '../configuration'
import { updateExperimentalFeatures, resetExperimentalFeatures } from '../configuration'
import type { InternalMonitoring, MonitoringMessage } from './internalMonitoring'
import {
  monitor,
  monitored,
  resetInternalMonitoring,
  startInternalMonitoring,
  callMonitored,
} from './internalMonitoring'
import type { TelemetryEvent } from './telemetryEvent.types'

const configuration: Partial<Configuration> = {
  maxInternalMonitoringMessagesPerPage: 7,
}

describe('internal monitoring', () => {
  describe('function', () => {
    const notThrowing = () => 1
    const throwing = () => {
      throw new Error('error')
    }
    let notifySpy: jasmine.Spy<(message: MonitoringMessage) => void>

    beforeEach(() => {
      const { monitoringMessageObservable } = startInternalMonitoring(configuration as Configuration)
      notifySpy = jasmine.createSpy('notified')
      monitoringMessageObservable.subscribe(notifySpy)
    })

    afterEach(() => {
      resetInternalMonitoring()
    })

    describe('direct call', () => {
      it('should preserve original behavior', () => {
        expect(callMonitored(notThrowing)).toEqual(1)
      })

      it('should catch error', () => {
        expect(() => callMonitored(throwing)).not.toThrowError()
      })

      it('should report error', () => {
        callMonitored(throwing)

        expect(notifySpy.calls.mostRecent().args[0].message).toEqual('error')
      })
    })

    describe('wrapper', () => {
      it('should preserve original behavior', () => {
        const decorated = monitor(notThrowing)
        expect(decorated()).toEqual(1)
      })

      it('should catch error', () => {
        const decorated = monitor(throwing)
        expect(() => decorated()).not.toThrowError()
      })

      it('should report error', () => {
        monitor(throwing)()

        expect(notifySpy.calls.mostRecent().args[0].message).toEqual('error')
      })
    })
  })

  describe('external context', () => {
    let internalMonitoring: InternalMonitoring
    let notifySpy: jasmine.Spy<(message: MonitoringMessage) => void>

    beforeEach(() => {
      internalMonitoring = startInternalMonitoring(configuration as Configuration)
      notifySpy = jasmine.createSpy('notified')
      internalMonitoring.monitoringMessageObservable.subscribe(notifySpy)
    })

    afterEach(() => {
      resetInternalMonitoring()
    })

    it('should be added to error messages', () => {
      internalMonitoring.setExternalContextProvider(() => ({
        foo: 'bar',
      }))
      callMonitored(() => {
        throw new Error('message')
      })
      expect(notifySpy.calls.mostRecent().args[0].foo).toEqual('bar')

      internalMonitoring.setExternalContextProvider(() => ({}))
      callMonitored(() => {
        throw new Error('message')
      })
      expect(notifySpy.calls.mostRecent().args[0].foo).not.toBeDefined()
    })
  })

  describe('new telemetry', () => {
    let internalMonitoring: InternalMonitoring
    let notifySpy: jasmine.Spy<(event: TelemetryEvent & Context) => void>

    describe('when enabled', () => {
      beforeEach(() => {
        updateExperimentalFeatures(['telemetry'])
        internalMonitoring = startInternalMonitoring(configuration as Configuration)
        notifySpy = jasmine.createSpy('notified')
        internalMonitoring.telemetryEventObservable.subscribe(notifySpy)
      })

      afterEach(() => {
        resetExperimentalFeatures()
        resetInternalMonitoring()
      })

      it('should notify observable', () => {
        callMonitored(() => {
          throw new Error('message')
        })

        expect(notifySpy).toHaveBeenCalled()
        const telemetryEvent = notifySpy.calls.mostRecent().args[0]
        expect(telemetryEvent.message).toEqual('message')
        expect(telemetryEvent._dd.event_type).toEqual('internal_telemetry')
      })

      it('should add telemetry context', () => {
        internalMonitoring.setTelemetryContextProvider(() => ({ foo: 'bar' }))

        callMonitored(() => {
          throw new Error('message')
        })

        expect(notifySpy).toHaveBeenCalled()
        const telemetryEvent = notifySpy.calls.mostRecent().args[0]
        expect(telemetryEvent.foo).toEqual('bar')
      })

      it('should still use existing system', () => {
        internalMonitoring.setExternalContextProvider(() => ({
          foo: 'bar',
        }))
        const oldNotifySpy = jasmine.createSpy<(message: MonitoringMessage) => void>('old')
        internalMonitoring.monitoringMessageObservable.subscribe(oldNotifySpy)

        callMonitored(() => {
          throw new Error('message')
        })

        expect(oldNotifySpy.calls.mostRecent().args[0].foo).toEqual('bar')
      })
    })

    describe('when disabled', () => {
      beforeEach(() => {
        internalMonitoring = startInternalMonitoring(configuration as Configuration)
        notifySpy = jasmine.createSpy('notified')
        internalMonitoring.telemetryEventObservable.subscribe(notifySpy)
      })

      afterEach(() => {
        resetInternalMonitoring()
      })

      it('should not notify observable', () => {
        callMonitored(() => {
          throw new Error('message')
        })

        expect(notifySpy).not.toHaveBeenCalled()
      })
    })
  })
})
