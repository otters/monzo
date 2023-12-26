import {createHTTPClient} from 'alistair/http';
import {id} from 'alistair/id';
import {pathcat} from 'pathcat';
import {MonzoAPI} from './monzo.ts';
import {type AppCredentials, type Config, type UserCredentials} from './types.ts';

export class MonzoOAuthAPI {
	public readonly credentials;

	private readonly api;
	private readonly config: Config;

	constructor(credentials: AppCredentials, config?: Partial<Config>) {
		this.credentials = credentials;

		this.config = {
			base: 'https://api.monzo.com',
			...config,
		};

		this.api = createHTTPClient({
			base: this.config.base,
		});
	}

	getOAuthURL(): {state: string; url: string};
	getOAuthURL(state: string): string;
	getOAuthURL(state?: string) {
		const s = state ?? id(16, 'abcdef0123456789');

		const url = pathcat('https://auth.monzo.com', {
			client_id: this.credentials.client_id,
			redirect_uri: this.credentials.redirect_uri,
			response_type: 'code',
			state: s,
		});

		return state ? url : {state: s, url};
	}

	async exchangeAuthorizationCode(code: string) {
		const creds = await this.api.post<UserCredentials>('/oauth2/token', {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: this.credentials.client_id,
				client_secret: this.credentials.client_secret,
				redirect_uri: this.credentials.redirect_uri,
				code,
			}),
		});

		return new MonzoAPI(creds, this.credentials, this.config);
	}
}
