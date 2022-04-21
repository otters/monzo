import axios from 'axios';
import Pika from 'pika-id';
import urlcat from 'urlcat';
import {Config, Configable} from './configable';
import {AppCredentials, UserCredentials} from './credentials';
import {MonzoAPI} from './monzo';

export class MonzoOAuthAPI extends Configable {
	public readonly credentials;

	private readonly pika = new Pika([
		{
			prefix: 'state',
			secure: true,
		},
	]);

	constructor(credentials: AppCredentials, config?: Partial<Config>) {
		super(config);
		this.credentials = credentials;
	}

	getOAuthURL(): {state: string; url: string};
	getOAuthURL(state: string): string;
	getOAuthURL(state?: string) {
		const s = state ?? this.pika.gen('state');

		const url = urlcat('https://auth.monzo.com', {
			client_id: this.credentials.client_id,
			redirect_uri: this.credentials.redirect_uri,
			response_type: 'code',
			state: s,
		});

		if (state) {
			return url;
		}

		return {
			state: s,
			url,
		};
	}

	async exchangeAuthorizationCode(code: string) {
		const url = urlcat(this.config.base, '/oauth2/token');

		console.log('bruh');

		const {data} = await axios.post<UserCredentials>(
			url,
			new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: this.credentials.client_id,
				client_secret: this.credentials.client_secret,
				redirect_uri: this.credentials.redirect_uri,
				code,
			})
		);

		return new MonzoAPI(data, this.credentials, this.config);
	}
}