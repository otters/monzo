import {createHTTPClient} from 'alistair/http';
import {pathcat} from 'pathcat';
import {stringify as query} from 'qs';
import type {
	AppCredentials,
	Config,
	Currency,
	Hex,
	Id,
	Models,
	Pagination,
	UserCredentials,
} from './types.ts';

/**
 * The Monzo API client. This class is used to make requests to the Monzo API.
 */
export class MonzoAPI {
	public readonly credentials;

	private readonly app;
	private readonly api;
	private readonly config: Config;

	/**
	 * Construct a new instance of the Monzo API. If you want to refresh a token, you must
	 * pass the `refresh_token` as well as the application's credentials to the .refresh() method directly.
	 *
	 * @param bearer The access token to use for requests.
	 *
	 * @example
	 * ```ts
	 * const api = new MonzoAPI('eyJhbGciOiJFUzI1NiIsI...');
	 * ```
	 */
	constructor(bearer: string);

	/**
	 * Construct a new instance of the Monzo API with full credentials. This overload
	 * exists so you can call the .refresh() method without having to pass the app credentials or refresh_token.
	 *
	 * @param credentials Full credentials to use for requests.
	 * @param app The app credentials to use for refreshing tokens
	 * @param config Optional configuration for the API (to specify base url, etc.)
	 *
	 * @example
	 * ```ts
	 * const credentials = {
	 * 	access_token: 'eyJhbGciOiJFUzI1NiIsI...',
	 * 	refresh_token: '...',
	 * 	// ...
	 * };
	 * const api = new MonzoAPI();
	 * ```
	 */
	constructor(
		credentials: Pick<UserCredentials, 'access_token' | 'refresh_token'> &
			Partial<Pick<UserCredentials, 'token_type'>>,
		app?: AppCredentials,
		config?: Partial<Config>,
	);

	constructor(
		credentialsOrBearer:
			| (Pick<UserCredentials, 'access_token' | 'refresh_token'> &
					Partial<Pick<UserCredentials, 'token_type'>>)
			| string,
		app?: AppCredentials,
		config?: Partial<Config>,
	) {
		this.credentials =
			typeof credentialsOrBearer === 'object'
				? {token_type: 'Bearer', ...credentialsOrBearer}
				: {token_type: 'Bearer', access_token: credentialsOrBearer};

		this.app = app;

		this.config = {
			base: 'https://api.monzo.com',
			...config,
		};

		this.api = createHTTPClient({
			base: this.config.base,
			lifecycle: {
				before: async request => {
					request.headers.set(
						'Authorization',
						`${this.credentials.token_type} ${this.credentials.access_token}`,
					);

					return request;
				},
			},
		});
	}

	/**
	 * Calls the logout endpoint. This will immediately invalidate the access token.
	 * Once invalidated, the user must go through the authentication process again. You will not be able to refresh the access token.
	 */
	async logout() {
		await this.api.post('/ping/logout');
	}

	/**
	 * Refreshes the access token. This will invalidate the current access token and return a new one.
	 * You'll have to reinstantiate the API client with the new token.
	 *
	 * You must pass the full user credentials and app credentials to the constructor, otherwise this method will throw.
	 *
	 * @returns The new credentials to use for requests.
	 *
	 * @example
	 * ```ts
	 * const app: AppCredentials = {
	 * 	client_id: 'oauth2client_00001abc...',
	 * 	client_secret: '...',
	 * 	redirect_uri: '...',
	 * }
	 *
	 * const current = new MonzoAPI(
	 * 	{
	 * 		access_token: '...',
	 * 		refresh_token: '...',
	 * 	},
	 * 	app,
	 * );
	 * const creds = await current.refresh();
	 * const refreshed = new MonzoAPI(creds, app);
	 * ```
	 */
	async refresh() {
		if (
			typeof this.credentials === 'string' ||
			!('refresh_token' in this.credentials) ||
			!this.app
		) {
			throw new Error(
				'No app or user credentials provided. You must provide the full constructor arguments to use .refresh()',
			);
		}

		return this.api.post<UserCredentials>('/oauth2/token', {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: query({
				grant_type: 'refresh_token',
				client_id: this.app.client_id,
				client_secret: this.app.client_secret,
				refresh_token: this.credentials.refresh_token,
			}),
		});
	}

	/**
	 * Gets information about the authenticated user.
	 * @returns Information about the authenticated user.
	 */
	async whoami() {
		return this.api.get<{
			authenticated: boolean;
			client_id: Id<'oauth2client'>;
			user_id: Id<'user'>;
		}>('/ping/whoami');
	}

	async getAccounts(account_type?: Models.Account['type']) {
		const url = pathcat('/accounts', {
			account_type,
		});

		const {accounts} = await this.api.get<{accounts: Models.Account[]}>(url);

		return accounts;
	}

	async getBalance(account_id: Id<'acc'>) {
		return this.api.get<Models.Balance>(pathcat('/balance', {account_id}));
	}

	async getPots(current_account_id: Id<'acc'>) {
		const url = pathcat('/pots', {
			current_account_id,
		});

		const {pots} = await this.api.get<{pots: Models.Pot[]}>(url);

		return pots;
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
		},
	) {
		const url = pathcat('/pots/:pot_id/deposit', {
			pot_id: pot,
		});

		return this.api.put<Models.Pot>(url, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: query({
				dedupe_id,
				source_account_id,
				amount: amount.toString(),
			}),
		});
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
		},
	) {
		const url = pathcat('/pots/:pot_id/withdraw', {
			pot_id: pot,
		});

		return this.api.put<Models.Pot>(url, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: query({dedupe_id, destination_account_id, amount: amount.toString()}),
		});
	}

	getTransaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand: 'merchant',
	): Promise<Models.ExpandedTransaction<Metadata>>;
	getTransaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
	): Promise<Models.Transaction<Metadata>>;
	async getTransaction<Metadata extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		expand?: 'merchant',
	) {
		const url = pathcat('/transactions/:transaction_id', {
			transaction_id,
			'expand[]': expand,
		});

		const {transaction} = await this.api.get<{
			transaction: Models.Transaction<Metadata> | Models.ExpandedTransaction<Metadata>;
		}>(url);

		return transaction;
	}

	async getTransactions(account_id: Id<'acc'>, pagination?: Pagination) {
		const url = pathcat('/transactions', {
			account_id,
			...pagination,
		});

		const {transactions} = await this.api.get<{transactions: Models.Transaction[]}>(url);

		return transactions;
	}

	async annotateTransaction<M extends Models.TransactionMetadata>(
		transaction_id: Id<'tx'>,
		metadata: M,
	) {
		const url = pathcat('/transactions/:transaction_id', {
			transaction_id,
		});

		// Omit notes because updating the `notes` key applies the value to the transaction's
		// top-level notes property and not to `metadata`!
		const {transaction} = await this.api.patch<{transaction: Models.Transaction<Omit<M, 'notes'>>}>(
			url,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: query(metadata),
			},
		);

		return transaction;
	}

	async createFeedItem(
		account_id: Id<'acc'>,
		type: 'basic',
		params: {
			title: string;
			image_url: string;
			url?: string;
			body?: string;
			background_color?: Hex;
			title_color?: Hex;
			body_color?: Hex;
		},
	) {
		const {url, ...rest} = params;

		// The response type is literally `{}`, so we should just
		// return void in this method.
		await this.api.post<{}>('/feed', {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: query({
				params: rest,
				url,
				account_id,
				type,
			}),
		});
	}

	async uploadAttachment(file_name: string, file_type: string, content_length: number) {
		return this.api.post<{
			file_url: string;
			upload_url: string;
		}>('/attachment/upload', {
			body: query({file_name, file_type, content_length}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
	}

	async registerAttachment(external_id: Id<'tx'>, file_url: string, file_type: string) {
		const {attachment} = await this.api.post<{
			attachment: {
				id: Id<'attach'>;
				user_id: Id<'user'>;
				external_id: Id<'tx'>;
				file_url: string;
				file_type: string;
				created: string;
			};
		}>('/attachment/register', {
			body: query({
				external_id,
				file_url,
				file_type,
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		return attachment;
	}

	async deregisterAttachment(attachment_id: Id<'attach'>) {
		await this.api.post<{}>('/attachment/deregister', {
			body: query({id: attachment_id}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
	}

	async createReceipt(
		transaction_id: Id<'tx'>,
		receipt: {
			items: Models.ReceiptItem[];
			external_id: string;
			total: number;
			currency: Currency;
		},
	) {
		await this.api.put<{}>('/transaction-receipts', {
			body: {
				transaction_id,
				...receipt,
			},
		});
	}

	async retrieveReceipt<E extends string = string>(external_id: E) {
		const url = pathcat('/transaction-receipts', {
			external_id,
		});

		const {receipt} = await this.api.get<{
			receipt: {
				id: Id<'receipt'>;
				external_id: E;
				total: number;
				currency: Currency;
				items: Models.ReceiptItem[];
			};
		}>(url);

		return receipt;
	}

	async deleteReceipt(external_id: string) {
		const url = pathcat('/transaction-receipts', {
			external_id,
		});

		await this.api.delete(url);
	}

	async registerWebhook<Account extends Id<'acc'>, Url extends string>(
		account_id: Account,
		webhookUrl: Url,
	) {
		const {webhook} = await this.api.post<{
			webhook: {
				account_id: Account;
				id: Id<'webhook'>;
				url: Url;
			};
		}>('/webhooks', {
			body: query({
				account_id,
				url: webhookUrl,
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		return webhook;
	}

	async listWebhooks<Account extends Id<'acc'>>(account_id: Account) {
		const url = pathcat('/webhooks', {
			account_id,
		});

		const {webhooks} = await this.api.get<{
			webhooks: Array<{
				id: Id<'webhook'>;
				account_id: Account;
				url: string;
			}>;
		}>(url);

		return webhooks;
	}

	async deleteWebhook(id: Id<'webhook'>) {
		const url = pathcat('/webhooks/:id', {
			id,
		});

		await this.api.delete<{}>(url);
	}
}
