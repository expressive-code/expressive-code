import { CoreStyleSettings, ResolvedCoreStyles } from './core-styles'
import { UnresolvedCoreStyleSettings } from '../helpers/style-settings'
import { ExpressiveCodeTheme } from './theme'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StyleOverrides extends Partial<UnresolvedCoreStyleSettings<CoreStyleSettings>> {}

export type StyleVariant = {
	theme: ExpressiveCodeTheme
	styleOverrides: StyleOverrides
	coreStyles: ResolvedCoreStyles
}
