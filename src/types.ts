/* eslint-disable @typescript-eslint/no-namespace */

// Note, these are only guesses as to what is available in the API
// as Monzo does not document it
export type Currency =
	| 'GBP'
	| 'EUR'
	| 'USD'
	| 'AUD'
	| 'CAD'
	| 'CHF'
	| 'CNY'
	| 'DKK'
	| 'HKD'
	| 'JPY'
	| 'NZD'
	| 'PLN'
	| 'RUB'
	| 'SEK'
	| 'SGD'
	| 'THB'
	| 'TRY'
	| 'ZAR';

export interface Pagination {
	limit?: number;
	since?: string;
	before?: string;
}

export interface AppCredentials {
	client_id: Id<'oauth2client'>;
	client_secret: string;
	redirect_uri: string;
}

export interface UserCredentials {
	access_token: string;
	client_id: Id<'oauth2client'>;
	expires_in: number;
	refresh_token: string;
	token_type: 'Bearer';
	user_id: Id<'user'>;
}

export const ID_PREFIXES = [
	'acc',
	'pot',
	'user',
	'oauth2client',
	'tx',
	'grp',
	'merch',
	'business',
	'entryset',
	'obextpayment',
	'potdep',
	'anonuser',
	'mcauthmsg',
	'mclifecycle',
	'mccard',
] as const;

export type IdPrefixes = typeof ID_PREFIXES[number];
export type Id<T extends IdPrefixes> = `${T}_${string}`;
export type AnyId = Id<IdPrefixes>;

export function validateId<T extends IdPrefixes>(maybeId: string, prefix: T): maybeId is Id<T>;
export function validateId(maybeId: string): maybeId is AnyId;
export function validateId<T extends IdPrefixes>(maybeId: string, prefix?: T) {
	if (prefix) {
		return maybeId.startsWith(`${prefix}_`);
	}

	return ID_PREFIXES.some(prefix => maybeId.startsWith(`${prefix}_`));
}

export type Hex = `#${string}`;

export namespace Models {
	export type TransactionMetadata = Record<string, string>;

	export interface Transaction<Metadata extends TransactionMetadata = TransactionMetadata> {
		account_id: Id<'acc'>;
		amount: number;
		amount_is_pending: boolean;
		atm_fees_detailed: AtmFeesDetailed | null;
		attachments: Attachment[] | null;
		can_add_to_tab: boolean;
		can_be_excluded_from_breakdown: boolean;
		can_be_made_subscription: boolean;
		can_match_transactions_in_categorization: boolean;
		can_split_the_bill: boolean;
		categories: Categories | null;
		category: string;
		counterparty: Counterparty;
		created: string;
		currency: string;
		dedupe_id: string;
		description: string;
		// TODO: I've never seen this field from the API so cannot type it!
		fees: Fees;
		id: Id<'tx'>;
		include_in_spending: boolean;
		international: unknown;
		is_load: boolean;
		labels: string[] | null;
		local_amount: number;
		local_currency: string;
		merchant: string | null;
		metadata: Metadata;
		notes: string;
		originator: boolean;
		parent_account_id: string;
		// TODO: Identify other values for .scheme
		scheme: 'uk_retail_pot' | 'payport_faster_payments' | 'mastercard';
		settled: string;
		updated: string;
		user_id: Id<'user'> | '';
		decline_reason: string | null;
		tab: Tab | null;
	}

	export interface AtmFeesDetailed {
		allowance_id: string;
		allowance_usage_explainer_text: string;
		fee_amount: number;
		fee_currency: string;
		fee_summary: unknown;
		withdrawal_amount: number;
		withdrawal_currency: string;
	}

	export interface Attachment {
		created: string;
		external_id: string;
		file_type: string;
		file_url: string;
		id: string;
		type: string;
		url: string;
		user_id: string;
	}

	export interface Categories {
		[key: string]: number | undefined;

		savings?: number;
		entertainment?: number;
		transfers?: number;
		transport?: number;
		eating_out?: number;
		expenses?: number;
		shopping?: number;
		groceries?: number;
		bills?: number;
		general?: number;
		income?: number;
		holidays?: number;
		cash?: number;
		gifts?: number;
		personal_care?: number;
	}

	export interface Counterparty {
		account_number?: string;
		name?: string;
		sort_code?: string;
		user_id?: Id<'user' | 'anonuser'>;
		beneficiary_account_type?: string;
		account_id?: Id<'acc'>;
		preferred_name?: string;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface Fees {
		//
	}

	export interface Tab {
		created_by: string;
		currency: string;
		id: string;
		item_count: number;
		left_participants: unknown[];
		modified_at: string;
		name: string;
		opened_at: string;
		participants: Participant[];
		status: string;
		total: number;
	}

	export interface Participant {
		first_name: string;
		id: string;
		invited_at?: string;
		invited_by?: string;
		name: string;
		payment_status: string;
		settle_amount: number;
		settle_currency: string;
		status: string;
		tab_id: string;
		total_amount: number;
		total_currency: string;
		user_id: string;
	}

	export interface ExpandedTransaction<Metadata extends TransactionMetadata = {}>
		extends Omit<Transaction<Metadata>, 'merchant'> {
		merchant: Merchant;
	}

	export interface Merchant {
		address: Address;
		created: string;
		group_id: Id<'grp'>;
		id: Id<'merch'>;
		logo: string;
		emoji: string;
		name: string;
		category: string;
	}

	export interface Address {
		address: string;
		city: string;
		country: string;
		latitude: number;
		longitude: number;
		postcode: string;
		region: string;
	}

	export interface Account {
		id: Id<'acc'>;
		closed: boolean;
		created: string;
		description: string;
		type: 'uk_retail' | 'uk_retail_joint' | 'uk_retail_plus' | 'uk_personal' | 'uk_business';
		currency: Currency;
		country_code: string;
		owners: Array<{
			user_id: Id<'user'>;
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
		business_id?: Id<'business'>;
	}

	export interface Balance {
		balance: number;
		total_balance: number;
		balance_including_flexible_savings: number;
		currency: Currency;
		spend_today: number;
		local_currency: '' | Currency;
		local_exchange_rate: number;
		local_spend: unknown[];
	}

	export interface Pot {
		id: Id<'pot'>;
		name: string;
		style: string;
		balance: number;
		currency: Currency;
		goal_amount: number;
		type: string;
		// TODO: look into typing this as Id<'product'>
		product_id: string;
		current_account_id: Id<'acc'>;
		cover_image_url: string;
		isa_wrapper: string;
		round_up: boolean;
		round_up_multiplier: number;
		is_tax_pot: boolean;
		created: string;
		updated: string;
		deleted: boolean;
		locked: boolean;
		// TODO: look into typing this as Id<'charity'>
		charity_id: string;
		available_for_bills: boolean;
		has_virtual_cards: boolean;
	}
}
