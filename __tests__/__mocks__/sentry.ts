// Mock de @sentry/react-native para tests
export const init = jest.fn()
export const captureException = jest.fn()
export const captureMessage = jest.fn()
export const setUser = jest.fn()
export const withScope = jest.fn((cb: (scope: any) => void) => cb({ setExtra: jest.fn() }))
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => children
export const ReactNavigationInstrumentation = jest.fn()
export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'log'
