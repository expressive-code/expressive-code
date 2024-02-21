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

/**
 * Outputs the given error to the logger, including its stack trace.
 * Also outputs all nested errors if specified in the `cause` property.
 */
export function logErrorDetails(input: { logger: ExpressiveCodeLogger; prefix: string; error: unknown }) {
	const pad = (lines: string[]) => lines.map((line) => `    ${line}`)
	const getErrorDetails = (error: Error): string[] => {
		const lines: string[] = []
		const errMsgLines = error.message.split(/\r?\n/)
		lines.push(`${error.name}: ${errMsgLines[0]}`, ...errMsgLines.slice(1))
		if (error.stack) {
			lines.push(...error.stack.split(/\r?\n/).slice(errMsgLines.length))
		}
		if (error.cause instanceof Error) {
			lines.push('Caused by:')
			lines.push(...pad(getErrorDetails(error.cause)))
		}
		return lines
	}
	const error = input.error instanceof Error ? input.error : new Error(String(input.error))
	const details = pad(getErrorDetails(error)).join('\n')
	input.logger.error(`${input.prefix} Error details:\n${details}\n`)
}
