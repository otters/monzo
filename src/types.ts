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

export const ID_PREFIXES = ['acc', 'pot', 'user', 'oauth2client'] as const;
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Models {
	export interface Account {
		id: string;
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
		business_id?: string;
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
