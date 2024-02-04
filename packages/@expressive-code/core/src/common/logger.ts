export interface ExpressiveCodeLoggerOptions {
	label: string
	debug(message: string): void
	info(message: string): void
	warn(message: string): void
	error(message: string): void
}

export class ExpressiveCodeLogger implements ExpressiveCodeLoggerOptions {
	readonly label: string
	readonly logger: Partial<ExpressiveCodeLoggerOptions>

	constructor(logger: Partial<ExpressiveCodeLoggerOptions> = {}) {
		this.label = logger.label ?? 'expressive-code'
		this.logger = logger
	}

	debug(message: string) {
		if (this.logger.debug) {
			this.logger.debug(message)
		} else {
			// eslint-disable-next-line no-console
			console.debug(`[${this.label}] ${message}`)
		}
	}
	info(message: string): void {
		if (this.logger.info) {
			this.logger.info(message)
		} else {
			// eslint-disable-next-line no-console
			console.info(`[${this.label}] ${message}`)
		}
	}
	warn(message: string): void {
		if (this.logger.warn) {
			this.logger.warn(message)
		} else {
			// eslint-disable-next-line no-console
			console.warn(`[${this.label}] ${message}`)
		}
	}
	error(message: string): void {
		if (this.logger.error) {
			this.logger.error(message)
		} else {
			// eslint-disable-next-line no-console
			console.error(`[${this.label}] ${message}`)
		}
	}
}
