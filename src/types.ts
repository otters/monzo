/* eslint-disable no-warning-comments */
/* eslint-disable @typescript-eslint/no-namespace */

export type Config = {
	base: string;
};

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

export type Pagination = {
	limit?: number;
	since?: string;
	before?: string;
};

export type AppCredentials = {
	client_id: Id<'oauth2client'>;
	client_secret: string;
	redirect_uri: string;
};

export type UserCredentials = {
	access_token: string;
	client_id: Id<'oauth2client'>;
	expires_in: number;
	refresh_token: string;
	token_type: 'Bearer';
	user_id: Id<'user'>;
};

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
	'tab',
	'participant',
	'attach',
	'sub',
	'potwdr',
	'copdecision',
	'series',
	'p2p',
	'billsplit',
	'payreq',
	'inbndp2p',
	'trip',
	'receipt',
	'webhook',
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

export function assertId<T extends IdPrefixes>(
	maybeId: string,
	prefix: T
): asserts maybeId is Id<T>;
export function assertId(maybeId: string): asserts maybeId is AnyId;
export function assertId<T extends IdPrefixes>(maybeId: string, prefix?: T) {
	const result = prefix ? validateId(maybeId, prefix) : validateId(maybeId);

	if (!result) {
		throw new Error(`Invalid id: ${maybeId}`);
	}
}

export function castId<T extends IdPrefixes>(maybeId: string, prefix: T) {
	if (!validateId(maybeId, prefix)) {
		throw new Error('Cannot cast a non-id string to an id.');
	}

	return maybeId;
}

export type Hex = `#${string}`;

export namespace Models {
	export type TransactionMetadata = Record<string, string>;

	export type Transaction<Metadata extends TransactionMetadata = TransactionMetadata> = {
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
		/**
		 * The categories this transaction belongs to.
		 * Key = name of the category
		 * Value = amount spent in this category from overall amount spent in this tx
		 */
		categories: Record<string, number> | null;
		category: string;
		counterparty: Counterparty;
		created: string;
		currency: Currency;
		dedupe_id: string;
		description: string;
		fees: Fees;
		id: Id<'tx'>;
		include_in_spending: boolean;
		international: unknown;
		is_load: boolean;
		labels: string[] | null;
		local_amount: number;
		local_currency: Currency;
		merchant: Id<'merch'> | null;
		metadata: Metadata;
		notes: string;
		originator: boolean;
		// TODO: Unable to find usage of this field in the API
		parent_account_id: '';
		scheme:
			| 'uk_retail_pot'
			| 'payport_faster_payments'
			| 'mastercard'
			| 'p2p_payment'
			| 'topup'
			| '3dsecure';
		settled: string;
		updated: string;
		user_id: Id<'user'> | '';
		decline_reason:
			| 'INSUFFICIENT_FUNDS'
			| 'CARD_INACTIVE'
			| 'CARD_BLOCKED'
			| 'INVALID_CVC'
			| 'OTHER'
			| null;
		tab: Tab | null;
	};

	export type AtmFeesDetailed = {
		allowance_id: string;
		allowance_usage_explainer_text: string;
		fee_amount: number;
		fee_currency: Currency;
		fee_summary: null;
		withdrawal_amount: number;
		withdrawal_currency: Currency;
	};

	export type Attachment = {
		created: string;
		external_id: Id<'tx'>;
		file_type: string;
		file_url: string;
		id: Id<'attach'>;
		type: string;
		url: string;
		user_id: Id<'user'>;
	};

	export type Counterparty = {
		account_number?: string;
		name?: string;
		sort_code?: string;
		user_id?: Id<'user' | 'anonuser'>;
		beneficiary_account_type?: string;
		account_id?: Id<'acc'>;
		preferred_name?: string;
	};

	// TODO: I've never seen this field from the API so cannot type it!

	export type Fees = {
		//
	};

	export type Tab = {
		created_by: Id<'user'>;
		currency: Currency;
		id: Id<'tab'>;
		item_count: number;
		left_participants: unknown[];
		modified_at: string;
		name: string;
		opened_at: string;
		participants: Participant[];
		status: string;
		total: number;
	};

	export type Participant = {
		first_name: string;
		id: Id<'participant'>;
		invited_at?: string;
		invited_by?: Id<'user'>;
		name: string;
		payment_status: string;
		settle_amount: number;
		settle_currency: Currency;
		status: string;
		tab_id: Id<'tab'>;
		total_amount: number;
		total_currency: Currency;
		user_id: Id<'user'>;
	};

	export type ExpandedTransaction<Metadata extends TransactionMetadata = TransactionMetadata> = {
		merchant: Merchant | null;
	} & Omit<Transaction<Metadata>, 'merchant'>;

	export type Merchant = {
		address: Address;
		created: string;
		group_id: Id<'grp'>;
		id: Id<'merch'>;
		logo: string;
		emoji: string;
		name: string;
		category: string;
	};

	export type Address = {
		address: string;
		city: string;
		country: string;
		latitude: number;
		longitude: number;
		postcode: string;
		region: string;
	};

	export type Account = {
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
	};

	export type ReceiptItem = {
		description: string;
		quantity: number;
		unit: string;
		amount: number;
		currency: Currency;
		tax: number;
		sub_items?: Array<Exclude<ReceiptItem, 'sub_items'>>;
	};

	export type ReceiptPayment =
		| {
				type: 'card';
				bin: string;
				last_four: string;
				auth_code: string;
				aid: string;
				mid: string;
				tid: string;
				amount: number;
				currency: Currency;
		  }
		| {
				type: 'cash';
				amount: number;
				currency: Currency;
		  }
		| {
				type: 'gift_card';
				gift_card_type: string;
				currency: Currency;
		  };

	export type ReceiptMerchant = {
		name: string;
		/**
		 * Indicates if this merchant is an "online" merchant or brick and mortar.
		 * true for Ecommerce merchants like Amazon, false for offline merchants like Pret or Starbucks
		 */
		online: boolean;
		phone: string;
		email: string;
		store_name: string;
		store_address: string;
		store_postcode: string;
	};

	export type ReceiptTax = {
		description: 'VAT';
		amount: number;
		currency: Currency;
		tax_number?: string;
	};

	export type Balance = {
		balance: number;
		total_balance: number;
		balance_including_flexible_savings: number;
		currency: Currency;
		spend_today: number;
		local_currency: '' | Currency;
		local_exchange_rate: number;
		local_spend: Array<{
			spend_today: number;
			currency: Currency;
		}>;
	};

	export type Pot = {
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
	};
}

export namespace Webhooks {
	export namespace Payloads {
		type Payload<T extends string, D> = {
			type: T;
			data: D;
		};

		export type TransactionCreated = Payload<'transaction.created', Models.ExpandedTransaction>;
		// TODO: Guessing the type of this to be `Models.ExpandedTransaction` — need to confirm
		export type TransactionUpdated = Payload<'transaction.updated', Models.ExpandedTransaction>;
	}

	export type Payload = Payloads.TransactionCreated | Payloads.TransactionUpdated;
}
