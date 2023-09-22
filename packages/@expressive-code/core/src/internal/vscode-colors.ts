import { multiplyAlpha, lighten, darken, getLuminance } from '../helpers/color-transforms'

export type VSCodeDefaultColorTransform =
	| ['transparent', VSCodeDefaultColorKey, number]
	| ['lighten', VSCodeDefaultColorKey, number]
	| ['darken', VSCodeDefaultColorKey, number]
	| ['lessProminent', VSCodeDefaultColorKey, VSCodeDefaultColorKey, number, number]

export type VSCodeDefaultColorDefinition = string | VSCodeDefaultColorTransform | null

/**
 * Either two colors based on the theme type in the order `[dark, light]`,
 * or a single color that is used for both dark and light themes.
 */
export type VSCodeDefaultColorsByType = [VSCodeDefaultColorDefinition, VSCodeDefaultColorDefinition] | VSCodeDefaultColorDefinition

/**
 * A union of VS Code colors that we know the default values for. The default values are required
 * because VS Code themes do not need to define all colors, only the ones they want to change.
 *
 * This is not an exhaustive list of all VS Code colors and does not need to be. If a color is
 * missing here, it can still be set by themes and used by plugins - it will just have no defaults.
 */
export type VSCodeDefaultColorKey =
	// Base colors
	| 'focusBorder'
	| 'foreground'
	| 'disabledForeground'
	| 'descriptionForeground'
	| 'errorForeground'
	| 'icon.foreground'
	// Contrast colors
	| 'contrastActiveBorder'
	| 'contrastBorder'
	// Colors inside a text document, such as the welcome page
	| 'textBlockQuote.background'
	| 'textBlockQuote.border'
	| 'textCodeBlock.background'
	| 'textLink.activeForeground'
	| 'textLink.foreground'
	| 'textPreformat.foreground'
	| 'textSeparator.foreground'
	// Editor colors
	| 'editor.background'
	| 'editor.foreground'
	| 'editorLineNumber.foreground'
	| 'editorLineNumber.activeForeground'
	| 'editorActiveLineNumber.foreground'
	| 'editor.selectionBackground'
	| 'editor.inactiveSelectionBackground'
	| 'editor.selectionHighlightBackground'
	// Editor status colors & icons
	| 'editorError.foreground'
	| 'editorWarning.foreground'
	| 'editorInfo.foreground'
	| 'editorHint.foreground'
	| 'problemsErrorIcon.foreground'
	| 'problemsWarningIcon.foreground'
	| 'problemsInfoIcon.foreground'
	// Editor find matches
	| 'editor.findMatchBackground'
	| 'editor.findMatchHighlightBackground'
	| 'editor.findRangeHighlightBackground'
	// Editor links
	| 'editorLink.activeForeground'
	// Editor lightbulb icons
	| 'editorLightBulb.foreground'
	| 'editorLightBulbAutoFix.foreground'
	// Editor diffs
	| 'diffEditor.insertedTextBackground'
	| 'diffEditor.insertedTextBorder'
	| 'diffEditor.removedTextBackground'
	| 'diffEditor.removedTextBorder'
	| 'diffEditor.insertedLineBackground'
	| 'diffEditor.removedLineBackground'
	// Editor sticky scroll
	| 'editorStickyScroll.background'
	| 'editorStickyScrollHover.background'
	// Editor inlays (hints displayed inside an editor line)
	| 'editorInlayHint.background'
	| 'editorInlayHint.foreground'
	| 'editorInlayHint.typeForeground'
	| 'editorInlayHint.typeBackground'
	| 'editorInlayHint.parameterForeground'
	| 'editorInlayHint.parameterBackground'
	// Editor groups & panes
	| 'editorPane.background'
	| 'editorGroup.emptyBackground'
	| 'editorGroup.focusedEmptyBorder'
	| 'editorGroupHeader.tabsBackground'
	| 'editorGroupHeader.tabsBorder'
	| 'editorGroupHeader.noTabsBackground'
	| 'editorGroupHeader.border'
	| 'editorGroup.border'
	| 'editorGroup.dropBackground'
	| 'editorGroup.dropIntoPromptForeground'
	| 'editorGroup.dropIntoPromptBackground'
	| 'editorGroup.dropIntoPromptBorder'
	| 'sideBySideEditor.horizontalBorder'
	| 'sideBySideEditor.verticalBorder'
	// Scrollbars
	| 'scrollbar.shadow'
	| 'scrollbarSlider.background'
	| 'scrollbarSlider.hoverBackground'
	| 'scrollbarSlider.activeBackground'
	// Panels
	| 'panel.background'
	| 'panel.border'
	| 'panelTitle.activeBorder'
	| 'panelTitle.activeForeground'
	| 'panelTitle.inactiveForeground'
	| 'panelSectionHeader.background'
	| 'terminal.background'
	// Widgets
	| 'widget.shadow'
	| 'editorWidget.background'
	| 'editorWidget.foreground'
	| 'editorWidget.border'
	| 'quickInput.background'
	| 'quickInput.foreground'
	| 'quickInputTitle.background'
	| 'pickerGroup.foreground'
	| 'pickerGroup.border'
	| 'editor.hoverHighlightBackground'
	| 'editorHoverWidget.background'
	| 'editorHoverWidget.foreground'
	| 'editorHoverWidget.border'
	| 'editorHoverWidget.statusBarBackground'
	// Title bar
	| 'titleBar.activeBackground'
	| 'titleBar.activeForeground'
	| 'titleBar.inactiveBackground'
	| 'titleBar.inactiveForeground'
	| 'titleBar.border'
	// Toolbars
	| 'toolbar.hoverBackground'
	| 'toolbar.activeBackground'
	// Tab background
	| 'tab.activeBackground'
	| 'tab.unfocusedActiveBackground'
	| 'tab.inactiveBackground'
	| 'tab.unfocusedInactiveBackground'
	// Tab foreground
	| 'tab.activeForeground'
	| 'tab.inactiveForeground'
	| 'tab.unfocusedActiveForeground'
	| 'tab.unfocusedInactiveForeground'
	// Tab hover foreground/background
	| 'tab.hoverBackground'
	| 'tab.unfocusedHoverBackground'
	| 'tab.hoverForeground'
	| 'tab.unfocusedHoverForeground'
	// Tab border
	| 'tab.border'
	| 'tab.lastPinnedBorder'
	| 'tab.activeBorder'
	| 'tab.unfocusedActiveBorder'
	| 'tab.activeBorderTop'
	| 'tab.unfocusedActiveBorderTop'
	| 'tab.hoverBorder'
	| 'tab.unfocusedHoverBorder'
	// Tab modified border
	| 'tab.activeModifiedBorder'
	| 'tab.inactiveModifiedBorder'
	| 'tab.unfocusedActiveModifiedBorder'
	| 'tab.unfocusedInactiveModifiedBorder'
	// Badges (small information labels, for example, search results count)
	| 'badge.background'
	| 'badge.foreground'
	// Buttons
	| 'button.background'
	| 'button.foreground'
	| 'button.border'
	| 'button.separator'
	| 'button.hoverBackground'
	| 'button.secondaryBackground'
	| 'button.secondaryForeground'
	| 'button.secondaryHoverBackground'
	// Dropdowns (selects)
	| 'dropdown.background'
	| 'dropdown.foreground'
	| 'dropdown.border'
	// Lists
	| 'list.activeSelectionBackground'
	| 'list.activeSelectionForeground'
	// Trees
	| 'tree.indentGuidesStroke'
	// Input fields
	| 'input.background'
	| 'input.foreground'
	| 'input.placeholderForeground'
	| 'inputOption.activeBorder'
	| 'inputOption.hoverBackground'
	| 'inputOption.activeBackground'
	| 'inputOption.activeForeground'
	| 'inputValidation.infoBackground'
	| 'inputValidation.infoBorder'
	| 'inputValidation.warningBackground'
	| 'inputValidation.warningBorder'
	| 'inputValidation.errorBackground'
	| 'inputValidation.errorBorder'
	// Keybinding labels
	| 'keybindingLabel.background'
	| 'keybindingLabel.foreground'
	| 'keybindingLabel.border'
	| 'keybindingLabel.bottomBorder'
	// Menu colors
	| 'menu.foreground'
	| 'menu.background'
	| 'menu.selectionForeground'
	| 'menu.selectionBackground'
	| 'menu.separatorBackground'
	// Snippet placeholder colors
	| 'editor.snippetTabstopHighlightBackground'
	| 'editor.snippetFinalTabstopHighlightBorder'

export const groupedDefaultWorkbenchColorKeys = {
	backgrounds: [
		'editor.background',
		'editorGroupHeader.tabsBackground',
		'editorGroupHeader.tabsBorder',
		'titleBar.activeBackground',
		'titleBar.border',
		'panel.background',
		'tab.activeBackground',
		'tab.activeBorderTop',
		'tab.activeBorder',
		'terminal.background',
		'widget.shadow',
	],
	accents: [
		'focusBorder',
		'editor.selectionBackground',
		'textBlockQuote.border',
		'textLink.activeForeground',
		'textLink.foreground',
		'editorLink.activeForeground',
		'tab.activeForeground',
		'tab.inactiveForeground',
		'tab.unfocusedActiveForeground',
		'tab.unfocusedInactiveForeground',
	],
} satisfies { [key in string]: readonly VSCodeDefaultColorKey[] }

const defaultEditorBackgroundColors: [string, string] = ['#1e1e1e', '#ffffff']
const defaultEditorForegroundColors: [string, string] = ['#bbbbbb', '#333333']

const defaultWorkbenchColors: { [key in VSCodeDefaultColorKey]: VSCodeDefaultColorsByType } = {
	// Base colors
	focusBorder: ['#007fd4', '#0090f1'],
	foreground: ['#cccccc', '#616161'],
	disabledForeground: ['#cccccc80', '#61616180'],
	descriptionForeground: [['transparent', 'foreground', 0.7], '#717171'],
	errorForeground: ['#f48771', '#a1260d'],
	'icon.foreground': ['#c5c5c5', '#424242'],

	// Contrast colors
	contrastActiveBorder: null,
	contrastBorder: null,

	// Colors inside a text document, such as the welcome page
	'textBlockQuote.background': ['#7f7f7f1a', '#7f7f7f1a'],
	'textBlockQuote.border': ['#007acc80', '#007acc80'],
	'textCodeBlock.background': ['#0a0a0a66', '#dcdcdc66'],
	'textLink.activeForeground': ['#3794ff', '#006ab1'],
	'textLink.foreground': ['#3794ff', '#006ab1'],
	'textPreformat.foreground': ['#d7ba7d', '#a31515'],
	'textSeparator.foreground': ['#ffffff2e', '#0000002e'],

	// Editor colors
	'editor.background': defaultEditorBackgroundColors,
	'editor.foreground': defaultEditorForegroundColors,
	'editorLineNumber.foreground': ['#858585', '#237893'],
	'editorLineNumber.activeForeground': 'editorActiveLineNumber.foreground',
	'editorActiveLineNumber.foreground': ['#c6c6c6', '#0b216f'],
	'editor.selectionBackground': ['#264f78', '#add6ff'],
	'editor.inactiveSelectionBackground': ['transparent', 'editor.selectionBackground', 0.5],
	'editor.selectionHighlightBackground': ['lessProminent', 'editor.selectionBackground', 'editor.background', 0.3, 0.6],

	// Editor status colors & icons
	'editorError.foreground': ['#f14c4c', '#e51400'],
	'editorWarning.foreground': ['#cca700', '#bf8803'],
	'editorInfo.foreground': ['#3794ff', '#1a85ff'],
	'editorHint.foreground': ['#eeeeeeb2', '#6c6c6c'],
	'problemsErrorIcon.foreground': 'editorError.foreground',
	'problemsWarningIcon.foreground': 'editorWarning.foreground',
	'problemsInfoIcon.foreground': 'editorInfo.foreground',

	// Editor find matches
	'editor.findMatchBackground': ['#515c6a', '#a8ac94'],
	'editor.findMatchHighlightBackground': ['#ea5c0055', '#ea5c0055'],
	'editor.findRangeHighlightBackground': ['#3a3d4166', '#b4b4b44d'],

	// Editor links
	'editorLink.activeForeground': ['#4e94ce', '#0000ff'],

	// Editor lightbulb icons
	'editorLightBulb.foreground': ['#ffcc00', '#ddb100'],
	'editorLightBulbAutoFix.foreground': ['#75beff', '#007acc'],

	// Editor diffs
	'diffEditor.insertedTextBackground': ['#9ccc2c33', '#9ccc2c40'],
	'diffEditor.insertedTextBorder': null,
	'diffEditor.removedTextBackground': ['#ff000033', '#ff000033'],
	'diffEditor.removedTextBorder': null,
	'diffEditor.insertedLineBackground': ['#9bb95533', '#9bb95533'],
	'diffEditor.removedLineBackground': ['#ff000033', '#ff000033'],

	// Editor sticky scroll
	'editorStickyScroll.background': 'editor.background',
	'editorStickyScrollHover.background': ['#2a2d2e', '#f0f0f0'],

	// Editor inlays (hints displayed inside an editor line)
	'editorInlayHint.background': [
		['transparent', 'badge.background', 0.8],
		['transparent', 'badge.background', 0.6],
	],
	'editorInlayHint.foreground': 'badge.foreground',
	'editorInlayHint.typeBackground': 'editorInlayHint.background',
	'editorInlayHint.typeForeground': 'editorInlayHint.foreground',
	'editorInlayHint.parameterBackground': 'editorInlayHint.background',
	'editorInlayHint.parameterForeground': 'editorInlayHint.foreground',

	// Editor groups & panes
	'editorPane.background': ['editor.background', 'editor.background'],
	'editorGroup.emptyBackground': null,
	'editorGroup.focusedEmptyBorder': null,
	'editorGroupHeader.tabsBackground': ['#252526', '#f3f3f3'],
	'editorGroupHeader.tabsBorder': null,
	'editorGroupHeader.noTabsBackground': ['editor.background', 'editor.background'],
	'editorGroupHeader.border': null,
	'editorGroup.border': ['#444444', '#e7e7e7'],
	'editorGroup.dropBackground': ['#53595d80', '#2677cb2d'],
	'editorGroup.dropIntoPromptForeground': ['editorWidget.foreground', 'editorWidget.foreground'],
	'editorGroup.dropIntoPromptBackground': ['editorWidget.background', 'editorWidget.background'],
	'editorGroup.dropIntoPromptBorder': null,
	'sideBySideEditor.horizontalBorder': ['editorGroup.border', 'editorGroup.border'],
	'sideBySideEditor.verticalBorder': ['editorGroup.border', 'editorGroup.border'],

	// Scrollbars
	'scrollbar.shadow': ['#000000', '#dddddd'],
	'scrollbarSlider.background': ['#79797966', '#64646466'],
	'scrollbarSlider.hoverBackground': ['#646464b2', '#646464b2'],
	'scrollbarSlider.activeBackground': ['#bfbfbf66', '#00000099'],

	// Panels
	'panel.background': 'editor.background',
	'panel.border': '#80808059',
	'panelTitle.activeBorder': 'panelTitle.activeForeground',
	'panelTitle.activeForeground': ['#e7e7e7', '#424242'],
	'panelTitle.inactiveForeground': [
		['transparent', 'panelTitle.activeForeground', 0.6],
		['transparent', 'panelTitle.activeForeground', 0.75],
	],
	'panelSectionHeader.background': '#80808051',
	'terminal.background': 'panel.background',

	// Widgets
	'widget.shadow': ['#0000005b', '#00000028'],
	'editorWidget.background': ['#252526', '#f3f3f3'],
	'editorWidget.foreground': 'foreground',
	'editorWidget.border': ['#454545', '#c8c8c8'],
	'quickInput.background': 'editorWidget.background',
	'quickInput.foreground': 'editorWidget.foreground',
	'quickInputTitle.background': ['#ffffff1a', '#0000000f'],
	'pickerGroup.foreground': ['#3794ff', '#0066bf'],
	'pickerGroup.border': ['#3f3f46', '#cccedb'],
	'editor.hoverHighlightBackground': ['#264f7840', '#add6ff26'],
	'editorHoverWidget.background': 'editorWidget.background',
	'editorHoverWidget.foreground': 'editorWidget.foreground',
	'editorHoverWidget.border': 'editorWidget.border',
	'editorHoverWidget.statusBarBackground': [
		['lighten', 'editorHoverWidget.background', 0.2],
		['darken', 'editorHoverWidget.background', 0.05],
	],

	// Title bar
	'titleBar.activeBackground': ['#3c3c3c', '#dddddd'],
	'titleBar.activeForeground': ['#cccccc', '#333333'],
	'titleBar.inactiveBackground': ['transparent', 'titleBar.activeBackground', 0.6],
	'titleBar.inactiveForeground': ['transparent', 'titleBar.activeForeground', 0.6],
	'titleBar.border': null,

	// Toolbars
	'toolbar.hoverBackground': ['#5a5d5e50', '#b8b8b850'],
	'toolbar.activeBackground': [
		['lighten', 'toolbar.hoverBackground', 0.1],
		['darken', 'toolbar.hoverBackground', 0.1],
	],

	// Tab background
	'tab.activeBackground': ['editor.background', 'editor.background'],
	'tab.unfocusedActiveBackground': ['tab.activeBackground', 'tab.activeBackground'],
	'tab.inactiveBackground': ['#2d2d2d', '#ececec'],
	'tab.unfocusedInactiveBackground': ['tab.inactiveBackground', 'tab.inactiveBackground'],

	// Tab foreground
	'tab.activeForeground': ['#ffffff', '#333333'],
	'tab.inactiveForeground': [
		['transparent', 'tab.activeForeground', 0.5],
		['transparent', 'tab.activeForeground', 0.7],
	],
	'tab.unfocusedActiveForeground': [
		['transparent', 'tab.activeForeground', 0.5],
		['transparent', 'tab.activeForeground', 0.7],
	],
	'tab.unfocusedInactiveForeground': [
		['transparent', 'tab.inactiveForeground', 0.5],
		['transparent', 'tab.inactiveForeground', 0.5],
	],

	// Tab hover foreground/background
	'tab.hoverBackground': null,
	'tab.unfocusedHoverBackground': [
		['transparent', 'tab.hoverBackground', 0.5],
		['transparent', 'tab.hoverBackground', 0.7],
	],
	'tab.hoverForeground': null,
	'tab.unfocusedHoverForeground': [
		['transparent', 'tab.hoverForeground', 0.5],
		['transparent', 'tab.hoverForeground', 0.5],
	],

	// Tab borders
	'tab.border': ['#252526', '#f3f3f3'],
	'tab.lastPinnedBorder': ['tree.indentGuidesStroke', 'tree.indentGuidesStroke'],
	'tab.activeBorder': null,
	'tab.unfocusedActiveBorder': [
		['transparent', 'tab.activeBorder', 0.5],
		['transparent', 'tab.activeBorder', 0.7],
	],
	'tab.activeBorderTop': null,
	'tab.unfocusedActiveBorderTop': [
		['transparent', 'tab.activeBorderTop', 0.5],
		['transparent', 'tab.activeBorderTop', 0.7],
	],
	'tab.hoverBorder': null,
	'tab.unfocusedHoverBorder': [
		['transparent', 'tab.hoverBorder', 0.5],
		['transparent', 'tab.hoverBorder', 0.7],
	],

	// Tab modified border
	'tab.activeModifiedBorder': ['#3399cc', '#33aaee'],
	'tab.inactiveModifiedBorder': [
		['transparent', 'tab.activeModifiedBorder', 0.5],
		['transparent', 'tab.activeModifiedBorder', 0.5],
	],
	'tab.unfocusedActiveModifiedBorder': [
		['transparent', 'tab.activeModifiedBorder', 0.5],
		['transparent', 'tab.activeModifiedBorder', 0.7],
	],
	'tab.unfocusedInactiveModifiedBorder': [
		['transparent', 'tab.inactiveModifiedBorder', 0.5],
		['transparent', 'tab.inactiveModifiedBorder', 0.5],
	],

	// Badges (small information labels, for example, search results count)
	'badge.background': ['#4d4d4d', '#c4c4c4'],
	'badge.foreground': ['#ffffff', '#333333'],

	// Buttons
	'button.background': ['#0e639c', '#007acc'],
	'button.foreground': ['#ffffff', '#ffffff'],
	'button.border': 'contrastBorder',
	'button.separator': ['transparent', 'button.foreground', 0.4],
	'button.hoverBackground': [
		['lighten', 'button.background', 0.2],
		['darken', 'button.background', 0.2],
	],
	'button.secondaryBackground': ['#3a3d41', '#5f6a79'],
	'button.secondaryForeground': ['#ffffff', '#ffffff'],
	'button.secondaryHoverBackground': [
		['lighten', 'button.secondaryBackground', 0.2],
		['darken', 'button.secondaryBackground', 0.2],
	],

	// Dropdowns (selects)
	'dropdown.background': ['#3c3c3c', '#ffffff'],
	'dropdown.foreground': ['#f0f0f0', 'foreground'],
	'dropdown.border': ['dropdown.background', '#cecece'],

	// Lists
	'list.activeSelectionBackground': ['#04395e', '#0060c0'],
	'list.activeSelectionForeground': '#ffffff',

	// Trees
	'tree.indentGuidesStroke': ['#585858', '#a9a9a9'],

	// Input fields
	'input.background': ['#3c3c3c', '#ffffff'],
	'input.foreground': 'foreground',
	'input.placeholderForeground': ['transparent', 'foreground', 0.5],
	'inputOption.activeBorder': ['#007acc', '#007acc'],
	'inputOption.hoverBackground': ['#5a5d5e80', '#b8b8b850'],
	'inputOption.activeBackground': [
		['transparent', 'focusBorder', 0.4],
		['transparent', 'focusBorder', 0.2],
	],
	'inputOption.activeForeground': ['#ffffff', '#000000'],
	'inputValidation.infoBackground': ['#063b49', '#d6ecf2'],
	'inputValidation.infoBorder': ['#007acc', '#007acc'],
	'inputValidation.warningBackground': ['#352a05', '#f6f5d2'],
	'inputValidation.warningBorder': ['#b89500', '#b89500'],
	'inputValidation.errorBackground': ['#5a1d1d', '#f2dede'],
	'inputValidation.errorBorder': ['#be1100', '#be1100'],

	// Keybinding labels
	'keybindingLabel.background': ['#8080802b', '#dddddd66'],
	'keybindingLabel.foreground': ['#cccccc', '#555555'],
	'keybindingLabel.border': ['#33333399', '#cccccc66'],
	'keybindingLabel.bottomBorder': ['#44444499', '#bbbbbb66'],

	// Menu colors
	'menu.foreground': 'dropdown.foreground',
	'menu.background': 'dropdown.background',
	'menu.selectionForeground': 'list.activeSelectionForeground',
	'menu.selectionBackground': 'list.activeSelectionBackground',
	'menu.separatorBackground': ['#606060', '#d4d4d4'],

	// Snippet placeholder colors
	'editor.snippetTabstopHighlightBackground': ['#7c7c74c', '#0a326433'],
	'editor.snippetFinalTabstopHighlightBorder': ['#525252', '#0a326480'],
}

export type VSCodeThemeType = 'dark' | 'light'

export type VSCodeWorkbenchColors = { [key in VSCodeDefaultColorKey]: string } & { [key: string]: string }

export function resolveVSCodeWorkbenchColors(colors: { [key: string]: string } | undefined, themeType: VSCodeThemeType): VSCodeWorkbenchColors {
	const typeIndex = themeType === 'dark' ? 0 : 1

	// Start with all default workbench colors and selectively override them with the given colors
	const workbenchColors: { [key: string]: VSCodeDefaultColorsByType | string } = {
		...defaultWorkbenchColors,
		...colors,
	}

	const colorsStartedResolving = new Set<VSCodeDefaultColorsByType | string>()
	const colorsResolved = new Map<VSCodeDefaultColorsByType | string, string | null>()

	function applyColorTransform(unresolvedColor: VSCodeDefaultColorTransform): string | null | undefined {
		if (unresolvedColor.length === 3) {
			const [type, colorKey, amount] = unresolvedColor
			const hexColor = resolveColor(colorKey)
			/* c8 ignore next */
			if (hexColor === null) return null

			if (type === 'transparent') {
				return multiplyAlpha(hexColor, amount)
			} else if (type === 'lighten') {
				return lighten(hexColor, amount)
			} else if (type === 'darken') {
				return darken(hexColor, amount)
			}
		}

		if (unresolvedColor.length === 5 && unresolvedColor[0] === 'lessProminent') {
			const [, colorKey, backgroundKey, factor, transparency] = unresolvedColor

			const hexFrom = resolveColor(colorKey)
			/* c8 ignore next */
			if (hexFrom === null) return null

			const hexBackground = resolveColor(backgroundKey)
			/* c8 ignore next */
			if (hexBackground === null) return multiplyAlpha(hexFrom, factor * transparency)

			const fromLum = getLuminance(hexFrom)
			const bgLum = getLuminance(hexBackground)
			/* c8 ignore next */
			let combinedFactor = factor ? factor : 0.5
			if (fromLum < bgLum) {
				combinedFactor *= (bgLum - fromLum) / bgLum
				const lightened = lighten(hexFrom, combinedFactor)
				return multiplyAlpha(lightened, transparency)
			} else {
				combinedFactor *= (fromLum - bgLum) / fromLum
				const darkened = darken(hexFrom, combinedFactor)
				return multiplyAlpha(darkened, transparency)
			}
		}
	}

	function resolveColor(unresolvedColor: VSCodeDefaultColorsByType | string): string | null {
		if (unresolvedColor === null) return null

		const alreadyResolvedColor = colorsResolved.get(unresolvedColor)
		if (alreadyResolvedColor !== undefined) return alreadyResolvedColor

		/* c8 ignore next */
		if (colorsStartedResolving.has(unresolvedColor)) throw new Error('Circular reference in default colors.')
		colorsStartedResolving.add(unresolvedColor)

		let resolved: string | null | undefined
		if (typeof unresolvedColor === 'string') {
			if (unresolvedColor.startsWith('#')) {
				resolved = unresolvedColor.toLowerCase()
			} else {
				const referencedColor = workbenchColors[unresolvedColor]
				if (referencedColor !== undefined) resolved = resolveColor(referencedColor)
			}
		} else if (Array.isArray(unresolvedColor)) {
			if (unresolvedColor.length === 2) {
				resolved = resolveColor(unresolvedColor[typeIndex])
			} else {
				resolved = applyColorTransform(unresolvedColor)
			}
		}

		if (resolved === undefined) throw new Error(`Invalid color value ${JSON.stringify(unresolvedColor)}, expected a hex color.`)
		colorsResolved.set(unresolvedColor, resolved)

		return resolved
	}

	// Go through all workbench colors and resolve their values to a plain color
	const keys = Object.keys(workbenchColors)
	keys.forEach((key) => {
		try {
			workbenchColors[key] = resolveColor(workbenchColors[key])
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Failed to resolve theme color for key ${key}: ${msg}`)
		}
	})

	return workbenchColors as ReturnType<typeof resolveVSCodeWorkbenchColors>
}

/**
 * Shiki themes often do not contain a `type` property which is used in proper VS Code themes
 * to indicate a dark or light theme. In such cases, we need to guess the theme type from
 * the theme colors.
 *
 * The guessing logic is: If `editor.background` is darker than `editor.foreground`,
 * we assume the theme is a dark theme.
 */
export function guessThemeTypeFromEditorColors(colors: { [key: string]: string } | undefined) {
	const bgLuminance = getLuminance(colors?.['editor.background'] || defaultEditorBackgroundColors[0])
	const fgLuminance = getLuminance(colors?.['editor.foreground'] || defaultEditorForegroundColors[0])
	return bgLuminance < fgLuminance ? 'dark' : 'light'
}
