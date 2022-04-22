import axios from 'axios';
import urlcat from 'urlcat';
import {Config, Configable} from './configable';
import {AppCredentials, UserCredentials} from './credentials';
import {Currency} from './types';

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
			authenticated: true;
			client_id: string;
			user_id: string;
		}>(url, {headers: this.headers});

		return data;
	}

	async accounts(account_type?: 'uk_retail' | 'uk_retail_joint') {
		const url = urlcat(this.config.base, '/accounts', {
			account_type,
		});

		const {data} = await axios.get<{
			accounts: Array<{
				id: string;
				closed: boolean;
				created: string;
				description: string;
				type: string;
				currency: Currency;
				country_code: string;
				owners: Array<{
					user_id: string;
					preferred_name: string;
					preferred_first_name: string;
				}>;
				account_number: string;
				sort_code: string;
				payment_details: {
					locale_uk: {
						account_number: string;
						sort_code: string;
					};
				};
				business_id?: string;
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
			balance_including_flexible_savings: number;
			currency: Currency;
			spend_today: number;
			local_currency: '' | Currency;
			local_exchange_rate: number;
			local_spend: unknown[];
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
				balance: number;
				currency: string;
				goal_amount: number;
				type: string;
				product_id: string;
				current_account_id: string;
				cover_image_url: string;
				isa_wrapper: string;
				round_up: boolean;
				round_up_multiplier?: number;
				is_tax_pot: boolean;
				created: string;
				updated: string;
				deleted: boolean;
				locked: boolean;
				charity_id: string;
				available_for_bills: boolean;
				has_virtual_cards: boolean;
			}>;
		}>(url, {headers: this.headers});

		return data.pots;
	}

	async depositIntoPot(
		pot: string,
		{
			dedupe_id,
			source_account_id,
			amount,
		}: {
			source_account_id: string;
			amount: number;
			dedupe_id: string;
		}
	) {
		const url = urlcat(this.config.base, '/pots/:pot/deposit', {pot});

		const {data} = await axios.post<{
			id: string;
			name: string;
			style: string;
			balance: number;
			currency: Currency;
			created: string;
			updated: string;
			deleted: boolean;
		}>(
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
		pot: string,
		{
			dedupe_id,
			destination_account_id,
			amount,
		}: {
			destination_account_id: string;
			amount: number;
			dedupe_id: string;
		}
	) {
		const url = urlcat(this.config.base, '/pots/:pot/withdraw', {pot});

		const {data} = await axios.post<{
			id: string;
			name: string;
			style: string;
			balance: number;
			currency: Currency;
			created: string;
			updated: string;
			deleted: boolean;
		}>(
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
}
