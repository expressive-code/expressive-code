type KnownTextsByKey<T extends { [K: string]: string | (() => string) }> = {
	[K in keyof T]: T[K]
}

export class PluginTexts<Texts extends KnownTextsByKey<Texts>> {
	public readonly defaultTexts: Texts
	private readonly localizedTexts = new Map<string, Texts>()
	private readonly overridesByLocale = new Map<string | undefined, Partial<Texts>>()

	constructor(defaultTexts: Texts) {
		this.defaultTexts = defaultTexts
	}

	/**
	 * Adds localized texts for a specific locale. You must provide a full set of localized texts
	 * for the given locale.
	 *
	 * It is recommended to use two-letter language codes (e.g. `de`, `fr`, `es`) without region
	 * codes to make your localized texts available to all users speaking the same language.
	 * Region codes should only be added if regional differences must be taken into account.
	 *
	 * Plugin authors can use this to provide localized versions of their texts.
	 * Users can also call this function to provide their own localizations.
	 *
	 * If you only want to customize a few texts of an existing localization,
	 * have a look at `overrideTexts` instead.
	 */
	public addLocale(locale: string, localizedTexts: Texts) {
		// Normalize the given locale
		locale = this.parseLocale(locale).locale
		// Set (or override) the localized texts for this locale
		this.localizedTexts.set(locale, localizedTexts)
	}

	/**
	 * Allows you to override any defined texts. This is useful if you want to customize a few
	 * selected texts without having to provide a full set of localized texts.
	 *
	 * You can either override texts for a specific `locale`, or override the default texts
	 * by setting `locale` to `undefined`.
	 *
	 * It is recommended to use two-letter language codes (e.g. `de`, `fr`, `es`) without region
	 * codes to apply your overrides to all users speaking the same language.
	 * Region codes should only be added if regional differences must be taken into account.
	 */
	public overrideTexts(locale: string | undefined, localeTextOverrides: Partial<Texts>) {
		// Normalize the given locale
		locale = locale && this.parseLocale(locale).locale
		// Add the overrides to the map, creating the map if necessary
		const localeOverrides = this.overridesByLocale.get(locale) || this.overridesByLocale.set(locale, {}).get(locale)!
		Object.assign(localeOverrides, localeTextOverrides)
	}

	/**
	 * Returns the best matching texts for the requested locale,
	 * taking any available localized texts and overrides into account.
	 *
	 * Example for locale `de-DE`:
	 * - If localized texts for `de-DE` are available, these will be returned.
	 * - If `de-DE` is not available, but `de` is, these will be returned.
	 * - As the final fallback, the default texts will be returned.
	 */
	public get(locale: string): Texts {
		const { acceptedLocales } = this.parseLocale(locale)
		const localizedTexts = this.getLocalizedTexts(acceptedLocales)
		return this.applyOverrides(localizedTexts, acceptedLocales)
	}

	private parseLocale(locale: string) {
		const parts = locale.trim().toLowerCase().split(/[-_]/)
		const language = parts[0]
		const region = parts[1]
		const normalizedLocale = region ? `${language}-${region}` : language

		const acceptedLocales: string[] = []
		acceptedLocales.push(language)
		if (region) acceptedLocales.push(normalizedLocale)

		return {
			language,
			region,
			locale: normalizedLocale,
			acceptedLocales,
		}
	}

	private getLocalizedTexts(acceptedLocales: string[]) {
		for (const acceptedLocale of acceptedLocales) {
			const localizedTexts = this.localizedTexts.get(acceptedLocale)
			if (localizedTexts) {
				return localizedTexts
			}
		}
		return this.defaultTexts
	}

	private applyOverrides(texts: Texts, acceptedLocales: string[]) {
		const result = { ...texts }

		// Find all overrides matching the accepted locales,
		// as well as any global overrides as the last resort
		const overrides = [...acceptedLocales, undefined].map((locale) => this.overridesByLocale.get(locale)).filter((x) => x)

		// Apply the overrides (if any) to the resulting texts
		if (overrides.length) {
			const keys = Object.keys(texts) as (keyof Texts)[]
			keys.forEach((key) => {
				// Find the first override that has a value for this key
				// and use it as the new value for the key
				for (const override of overrides) {
					const overrideValue = override?.[key]
					if (overrideValue) {
						result[key] = overrideValue
						return
					}
				}
			})
		}

		return result
	}
}
