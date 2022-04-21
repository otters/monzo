export interface AppCredentials {
	client_id: string;
	client_secret: string;
	redirect_uri: string;
}

export interface UserCredentials extends AppCredentials {
	access_token: string;
	client_id: string;
	expires_in: 21600;
	refresh_token: string;
	token_type: 'Bearer';
	user_id: string;
}
