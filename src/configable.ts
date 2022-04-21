export interface Config {
	base: string;
}

export abstract class Configable {
	public readonly config;

	protected constructor(config?: Partial<Config>) {
		this.config = {
			base: 'https://api.monzo.com',
			...config,
		};
	}
}
