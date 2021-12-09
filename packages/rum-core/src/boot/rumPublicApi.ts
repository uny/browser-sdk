import {
  BoundedBuffer,
  buildCookieOptions,
  Context,
  createContextManager,
  deepClone,
  makePublicApi,
  monitor,
  InitConfiguration,
  clocksNow,
  timeStampNow,
  display,
  InternalMonitoring,
  callMonitored,
  createHandlingStack,
  TimeStamp,
  RelativeTime,
  canUseEventBridge,
  areCookiesAuthorized,
  startInternalMonitoring,
} from '@datadog/browser-core'
import { LifeCycle } from '../domain/lifeCycle'
import { ParentContexts } from '../domain/parentContexts'
import { RumSessionManager } from '../domain/rumSessionManager'
import { CommonContext, User, ActionType, ReplayStats } from '../rawRumEvent.types'
import { willSyntheticsInjectRum } from '../domain/syntheticsContext'
import { RumConfiguration, RumInitConfiguration, validateAndBuildRumConfiguration } from '../domain/configuration'
import { startRum } from './startRum'

export type RumPublicApi = ReturnType<typeof makeRumPublicApi>

export type StartRum<C extends RumInitConfiguration = RumInitConfiguration> = (
  initConfiguration: C,
  configuration: RumConfiguration,
  internalMonitoring: InternalMonitoring,
  getCommonContext: () => CommonContext,
  recorderApi: RecorderApi,
  initialViewName?: string
) => StartRumResult

type StartRumResult = ReturnType<typeof startRum>

export interface RecorderApi {
  start: () => void
  stop: () => void
  onRumStart: (
    lifeCycle: LifeCycle,
    initConfiguration: RumInitConfiguration,
    configuration: RumConfiguration,
    sessionManager: RumSessionManager,
    parentContexts: ParentContexts
  ) => void
  isRecording: () => boolean
  getReplayStats: (viewId: string) => ReplayStats | undefined
}
interface RumPublicApiOptions {
  ignoreInitIfSyntheticsWillInjectRum?: boolean
}

export function makeRumPublicApi<C extends RumInitConfiguration>(
  startRumImpl: StartRum<C>,
  recorderApi: RecorderApi,
  { ignoreInitIfSyntheticsWillInjectRum = true }: RumPublicApiOptions = {}
) {
  let isAlreadyInitialized = false

  const globalContextManager = createContextManager()
  let user: User = {}

  let getInternalContextStrategy: StartRumResult['getInternalContext'] = () => undefined
  let getInitConfigurationStrategy = (): InitConfiguration | undefined => undefined

  let bufferApiCalls = new BoundedBuffer()
  let addTimingStrategy: StartRumResult['addTiming'] = (name, time = timeStampNow()) => {
    bufferApiCalls.add(() => addTimingStrategy(name, time))
  }
  let startViewStrategy: StartRumResult['startView'] = (name, startClocks = clocksNow()) => {
    bufferApiCalls.add(() => startViewStrategy(name, startClocks))
  }
  let addActionStrategy: StartRumResult['addAction'] = (action, commonContext = clonedCommonContext()) => {
    bufferApiCalls.add(() => addActionStrategy(action, commonContext))
  }
  let addErrorStrategy: StartRumResult['addError'] = (providedError, commonContext = clonedCommonContext()) => {
    bufferApiCalls.add(() => addErrorStrategy(providedError, commonContext))
  }

  function clonedCommonContext(): CommonContext {
    return deepClone({
      context: globalContextManager.get(),
      user: user as Context,
    })
  }

  function initRum(initConfiguration: C) {
    // If we are in a Synthetics test configured to automatically inject a RUM instance, we want to
    // completely discard the customer application RUM instance by ignoring their init() call.  But,
    // we should not ignore the init() call from the Synthetics-injected RUM instance, so the
    // internal `ignoreInitIfSyntheticsWillInjectRum` option is here to bypass this condition.
    if (ignoreInitIfSyntheticsWillInjectRum && willSyntheticsInjectRum()) {
      return
    }

    if (canUseEventBridge()) {
      initConfiguration = overrideInitConfigurationForBridge(initConfiguration)
    } else if (!canHandleSession(initConfiguration)) {
      return
    }

    if (!canInitRum(initConfiguration)) {
      return
    }

    const configuration = validateAndBuildRumConfiguration(initConfiguration)
    if (!configuration) {
      return
    }

    const internalMonitoring = startInternalMonitoring(configuration)

    if (!configuration.trackViewsManually) {
      doStartRum(initConfiguration, configuration, internalMonitoring)
    } else {
      // drain beforeInitCalls by buffering them until we start RUM
      // if we get a startView, drain re-buffered calls before continuing to drain beforeInitCalls
      // in order to ensure that calls are processed in order
      const beforeInitCalls = bufferApiCalls
      bufferApiCalls = new BoundedBuffer()

      startViewStrategy = (name) => {
        doStartRum(initConfiguration, configuration, internalMonitoring, name)
      }
      beforeInitCalls.drain()
    }
    getInitConfigurationStrategy = () => deepClone<InitConfiguration>(initConfiguration)

    isAlreadyInitialized = true
  }

  function doStartRum(
    initConfiguration: C,
    configuration: RumConfiguration,
    internalMonitoring: InternalMonitoring,
    initialViewName?: string
  ) {
    const startRumResults = startRumImpl(
      initConfiguration,
      configuration,
      internalMonitoring,
      () => ({
        user,
        context: globalContextManager.get(),
        hasReplay: recorderApi.isRecording() ? true : undefined,
      }),
      recorderApi,
      initialViewName
    )

    ;({
      startView: startViewStrategy,
      addAction: addActionStrategy,
      addError: addErrorStrategy,
      addTiming: addTimingStrategy,
      getInternalContext: getInternalContextStrategy,
    } = startRumResults)
    bufferApiCalls.drain()

    recorderApi.onRumStart(
      startRumResults.lifeCycle,
      initConfiguration,
      configuration,
      startRumResults.session,
      startRumResults.parentContexts
    )
  }

  const rumPublicApi = makePublicApi({
    init: monitor(initRum),

    addRumGlobalContext: monitor(globalContextManager.add),

    removeRumGlobalContext: monitor(globalContextManager.remove),

    getRumGlobalContext: monitor(globalContextManager.get),
    setRumGlobalContext: monitor(globalContextManager.set),

    getInternalContext: monitor((startTime?: number) => getInternalContextStrategy(startTime)),
    getInitConfiguration: monitor(() => getInitConfigurationStrategy()),

    addAction: monitor((name: string, context?: object) => {
      addActionStrategy({
        name,
        context: deepClone(context as Context),
        startClocks: clocksNow(),
        type: ActionType.CUSTOM,
      })
    }),

    addError: (error: unknown, context?: object) => {
      const handlingStack = createHandlingStack()
      callMonitored(() => {
        addErrorStrategy({
          error,
          handlingStack,
          context: deepClone(context as Context),
          startClocks: clocksNow(),
        })
      })
    },

    addTiming: monitor((name: string, time?: number) => {
      addTimingStrategy(name, time as RelativeTime | TimeStamp | undefined)
    }),

    setUser: monitor((newUser: User) => {
      const sanitizedUser = sanitizeUser(newUser)
      if (sanitizedUser) {
        user = sanitizedUser
      } else {
        display.error('Unsupported user:', newUser)
      }
    }),

    removeUser: monitor(() => {
      user = {}
    }),

    startView: monitor((name?: string) => {
      startViewStrategy(name)
    }),

    startSessionReplayRecording: monitor(recorderApi.start),
    stopSessionReplayRecording: monitor(recorderApi.stop),
  })
  return rumPublicApi

  function sanitizeUser(newUser: unknown) {
    if (typeof newUser !== 'object' || !newUser) {
      return
    }
    const result = deepClone(newUser as Context)
    if ('id' in result) {
      result.id = String(result.id)
    }
    if ('name' in result) {
      result.name = String(result.name)
    }
    if ('email' in result) {
      result.email = String(result.email)
    }
    return result
  }

  function canHandleSession(initConfiguration: RumInitConfiguration): boolean {
    if (!areCookiesAuthorized(buildCookieOptions(initConfiguration))) {
      display.warn('Cookies are not authorized, we will not send any data.')
      return false
    }

    if (isLocalFile()) {
      display.error('Execution is not allowed in the current context.')
      return false
    }
    return true
  }

  function canInitRum(initConfiguration: RumInitConfiguration) {
    if (isAlreadyInitialized) {
      if (!initConfiguration.silentMultipleInit) {
        display.error('DD_RUM is already initialized.')
      }
      return false
    }
    return true
  }

  function overrideInitConfigurationForBridge<C extends InitConfiguration>(initConfiguration: C): C {
    return { ...initConfiguration, applicationId: 'empty', clientToken: 'empty', sampleRate: 100 }
  }

  function isLocalFile() {
    return window.location.protocol === 'file:'
  }
}
