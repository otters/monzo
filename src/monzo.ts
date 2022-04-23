import axios from 'axios';
import urlcat from 'urlcat';
import {Config, Configable} from './configable';
import {Id, Models, AppCredentials, UserCredentials, Pagination, Hex} from './types';
import {stringify as query} from 'qs';

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
			query({
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
			query({dedupe_id, source_account_id, amount: amount.toString()}),
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
			query({dedupe_id, destination_account_id, amount: amount.toString()}),
			{headers: this.headers}
		);

		return data;
	}

	transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand: 'merchant'
	): Promise<Models.ExpandedTransaction<Metadata>>;
	transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>
	): Promise<Models.Transaction<Metadata>>;
	async transaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand?: 'merchant'
	) {
		const url = urlcat(this.config.base, '/transactions/:transaction_id', {
			transaction_id,
			'expand[]': expand,
		});

		const {data} = await axios.get<{
			transaction: Models.Transaction<Metadata> | Models.ExpandedTransaction<Metadata>;
		}>(url, {
			headers: this.headers,
		});

		return data.transaction;
	}

	async transactions<Metadata extends Models.TransactionMetadata>(
		account_id: Id<'acc'>,
		pagination?: Pagination
	) {
		const url = urlcat(this.config.base, '/transactions', {
			account_id,
			...pagination,
		});

		const {data} = await axios.get<{transactions: Array<Models.Transaction<Metadata>>}>(url, {
			headers: this.headers,
		});

		return data.transactions;
	}

	async annotateTransaction<M extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		metadata: M
	) {
		const url = urlcat(this.config.base, '/transactions/:transaction_id', {
			transaction_id,
		});

		// Omit notes because updating the `notes` key applies the value to the transaction's
		// top-level notes property and not to `metadata`!
		const {data} = await axios.patch<{transaction: Models.Transaction<Omit<M, 'notes'>>}>(
			url,
			query(metadata),
			{headers: this.headers}
		);

		return data.transaction;
	}

	async createFeedItem(
		account_id: Id<'acc'>,
		type: 'basic',
		{
			url: feedUrl,
			...params
		}: {
			title: string;
			image_url: string;
			url?: string;
			body?: string;
			background_color?: Hex;
			title_color?: Hex;
			body_color?: Hex;
		}
	) {
		const url = urlcat(this.config.base, '/feed');

		// The response type is literally `{}`, so we should just
		// return void in this method.
		await axios.post<{}>(
			url,
			query({
				params,
				url: feedUrl,
				account_id,
				type,
			}),
			{headers: this.headers}
		);
	}
}
