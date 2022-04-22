import axios from 'axios';
import Pika from 'pika-id';
import urlcat from 'urlcat';
import {Config, Configable} from './configable';
import {AppCredentials, UserCredentials} from './credentials';
import {Currency, Pagination} from './types';

export class MonzoAPI extends Configable {
	public readonly credentials;

	private readonly app;
	private readonly pika = new Pika(['dedupe_id']);

	constructor(credentials: UserCredentials, app: AppCredentials, config?: Partial<Config>) {
		super(config);

		this.credentials = credentials;
		this.app = app;
	}

	private get headers() {
		return {
			Authorization: `${this.credentials.token_type} ${this.credentials.access_token}`,
		};
	}

	async logout() {
		const url = urlcat(this.config.base, '/ping/logout');
		await axios.post(url, undefined, {headers: this.headers});
	}

	async refresh() {
		const url = urlcat(this.config.base, '/oauth2/token');

		const {data} = await axios.post<UserCredentials>(
			url,
			new URLSearchParams({
				grant_type: 'refresh_token',
				client_id: this.app.client_id,
				client_secret: this.app.client_secret,
				refresh_token: this.credentials.refresh_token,
			})
		);

		return data;
	}

	async whoami() {
		const url = urlcat(this.config.base, '/ping/whoami');

		const {data} = await axios.get<{
			authenticated: true;
			client_id: string;
			user_id: string;
		}>(url, {
			headers: this.headers,
		});

		return data;
	}

	async accounts(
		params: Pagination & {
			account_type?: 'uk_retail' | 'uk_retail_joint';
		} = {}
	) {
		const url = urlcat(this.config.base, '/accounts', params);

		const {data} = await axios.get<{
			accounts: Array<{
				id: string;
				created: string;
				description: string;
			}>;
		}>(url, {headers: this.headers});

		return data.accounts;
	}

	async balance(account_id: string) {
		const url = urlcat(this.config.base, '/balance', {
			account_id,
		});

		const {data} = await axios.get<{
			balance: number;
			total_balance: number;
			currency: Currency;
			spend_today: number;
		}>(url, {headers: this.headers});

		return data;
	}

	async pots(current_account_id: string) {
		const url = urlcat(this.config.base, '/pots', {
			current_account_id,
		});

		const {data} = await axios.get<{
			pots: Array<{
				id: string;
				name: string;
				style: string;
				balance: string;
				currency: Currency;
				created: string;
				updated: string;
				deleted: boolean;
			}>;
		}>(url, {headers: this.headers});

		return data.pots;
	}

	async depositIntoPot({
		pot: id,
		dedupe_id = this.pika.gen('dedupe_id'),
		...rest
	}: {
		pot: string;
		source_account_id: string;
		amount: number;
		dedupe_id?: string;
	}) {
		const url = urlcat(this.config.base, '/pots/:id/deposit', {
			id,
		});

		const {data} = await axios.post<{
			id: string;
			name: string;
			style: string;
			balance: number;
			currency: string;
			created: string;
			updated: string;
			deleted: boolean;
		}>(
			url,
			{
				dedupe_id,
				...rest,
			},
			{
				headers: this.headers,
			}
		);

		return data;
	}
}
