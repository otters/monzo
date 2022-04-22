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
