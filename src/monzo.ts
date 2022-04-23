import axios from 'axios';
import urlcat from 'urlcat';
import {Config, Configable} from './configable';
import {AppCredentials, UserCredentials} from './credentials';
import {Id, Models} from './types';

export class MonzoAPI extends Configable {
	public readonly credentials;

	private readonly app;

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
			authenticated: boolean;
			client_id: Id<'oauth2client'>;
			user_id: Id<'user'>;
		}>(url, {headers: this.headers});

		return data;
	}

	async accounts(account_type?: Models.Account['type']) {
		const url = urlcat(this.config.base, '/accounts', {
			account_type,
		});

		const {data} = await axios.get<{accounts: Models.Account[]}>(url, {
			headers: this.headers,
		});

		return data.accounts;
	}

	async balance(account_id: Id<'acc'>) {
		const url = urlcat(this.config.base, '/balance', {
			account_id,
		});

		const {data} = await axios.get<Models.Balance>(url, {headers: this.headers});

		return data;
	}

	async pots(current_account_id: Id<'acc'>) {
		const url = urlcat(this.config.base, '/pots', {
			current_account_id,
		});

		const {data} = await axios.get<{pots: Models.Pot[]}>(url, {
			headers: this.headers,
		});

		return data.pots;
	}

	async depositIntoPot(
		pot: Id<'pot'>,
		{
			amount,
			dedupe_id,
			source_account_id,
		}: {
			amount: number;
			dedupe_id: string;
			source_account_id: Id<'acc'>;
		}
	) {
		const url = urlcat(this.config.base, '/pots/:pot/deposit', {
			pot,
		});

		const {data} = await axios.put<Models.Pot>(
			url,
			new URLSearchParams({
				dedupe_id,
				source_account_id,
				amount: amount.toString(),
			}),
			{headers: this.headers}
		);

		return data;
	}

	async withdrawFromPot(
		pot: Id<'pot'>,
		{
			destination_account_id,
			amount,
			dedupe_id,
		}: {
			destination_account_id: Id<'acc'>;
			amount: number;
			dedupe_id: string;
		}
	) {
		const url = urlcat(this.config.base, '/pots/:pot/withdraw', {
			pot,
		});

		const {data} = await axios.put<Models.Pot>(
			url,
			new URLSearchParams({
				dedupe_id,
				destination_account_id,
				amount: amount.toString(),
			}),
			{headers: this.headers}
		);

		return data;
	}

	transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand: 'merchant'
	): Promise<Models.Transaction<Metadata>>;
	transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>
	): Promise<Omit<Models.Transaction<Metadata>, 'merchant'>>;
	async transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand?: 'merchant'
	) {
		const url = urlcat(this.config.base, '/transactions/:transaction_id', {
			transaction_id,
			'expand[]': expand,
		});

		const {data} = await axios.get<Models.Transaction<Metadata>>(url, {headers: this.headers});

		return data;
	}
}
