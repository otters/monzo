`@otters/monzo`

Monzo API Wrapper for TypeScript

Brief documentation is below, please consult Monzo's API documentation for more information. Requires Node.js>=16.0.0

## Getting Started

First, if you do not have OAuth keys already, you can use the `MonzoOAuthAPI` class to generate them.

```ts
import {MonzoOAuthAPI} from '@otters/monzo';

const oauth = new MonzoOAuthAPI({
	client_id: process.env.MONZO_CLIENT_ID,
	client_secret: process.env.MONZO_CLIENT_SECRET,
	redirect_uri: process.env.MONZO_REDIRECT_URI,
});
```

Then you can generate a redirect URL to send your user to.

```ts
// Let @otters/monzo generate state
const {state, url} = oauth.getOAuthURL();

// Or, generate it yourself
const state = generateState();
const url = oauth.getOAuthURL(state);
```

## Exchanging token

Once you have complete the OAuth flow, you can now exchange tokens for a full `MonzoAPI` instance.

Make sure to check that `state` in `req.query` is the same as the one we previously generated!

```ts
// Using our MonzoOAuthAPI class
const oauth = new MonzoOAuthAPI({
	client_id: process.env.MONZO_CLIENT_ID,
	client_secret: process.env.MONZO_CLIENT_SECRET,
	redirect_uri: process.env.MONZO_REDIRECT_URI,
});

const api = await oauth.exchangeAuthorizationCode(code);
```

Now we can consume `api` to make requests to the Monzo API.

```ts
const user = await api.whoami();
```

Happy hacking
