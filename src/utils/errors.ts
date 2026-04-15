/**
 * Base error class for all Easy Mode operational failures.
 */
export class EasyModeError extends Error {
    constructor(public message: string, public suggestion?: string) {
        super(message);
        this.name = 'EasyModeError';
    }
}

export class GitContextError extends EasyModeError {
    constructor(message: string) {
        super(message, 'Ensure you are in a git repository and have committed changes.');
        this.name = 'GitContextError';
    }
}

export class APIProviderError extends EasyModeError {
    constructor(message: string) {
        super(message, 'Check your .env file for valid API keys or check your internet connection.');
        this.name = 'APIProviderError';
    }
}