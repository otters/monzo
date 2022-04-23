import {Id} from './types';

export interface AppCredentials {
	client_id: Id<'oauth2client'>;
	client_secret: string;
	redirect_uri: string;
}

export interface UserCredentials {
	access_token: string;
	client_id: Id<'oauth2client'>;
	expires_in: 21600;
	refresh_token: string;
	token_type: 'Bearer';
	user_id: Id<'user'>;
}
