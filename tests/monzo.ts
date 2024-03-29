import {test} from 'uvu';
import * as assert from 'uvu/assert';
import {MonzoOAuthAPI} from '../src';

const monzo = new MonzoOAuthAPI({
	client_id: 'oauth2client_test',
	client_secret: 'secret',
	redirect_uri: 'https://example.com/oauth',
});

test('It creates a valid authorization url', async () => {
	const url = monzo.getOAuthURL('state');

	assert.equal(
		url,
		'https://auth.monzo.com?client_id=oauth2client_test&redirect_uri=https%3A%2F%2Fexample.com%2Foauth&response_type=code&state=state',
	);
});

test('It creates a valid authorization url with random state', async () => {
	const {url, state} = monzo.getOAuthURL();

	assert.type(url, 'string', 'URL was not a valid string');
	assert.type(state, 'string', 'State was not a valid string');
});

test.run();
