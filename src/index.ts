import Pika from 'pika-id';
import urlcat from 'urlcat';

interface MonzoCredentials {
	client_id: string;
	redirect_uri: string;
}

class MonzoAPI {
	private readonly credentials;

	private readonly pika = new Pika([
		{
			prefix: 'state',
			secure: true,
		},
	]);

	constructor(credentials: MonzoCredentials) {
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

		return {state: s, url};
	}
}

export = MonzoAPI;
