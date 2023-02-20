CREATE TABLE IF NOT EXISTS channels (
	id SERIAL PRIMARY KEY,
	username VARCHAR(25) NOT NULL,
	display_name VARCHAR(25) NULL,
	user_id VARCHAR(25) NULL,
	join_date TIMESTAMPTZ DEFAULT NOW(),
	last_use_date TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS auth (
	accessToken VARCHAR NOT NULL,
	refreshToken VARCHAR NOT NULL,
	expiresIn BIGINT NOT NULL,
	obtainmentTimestamp BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS command_preferences (
	user_id VARCHAR,
	default_command_name VARCHAR NOT NULL,
	custom_command_name VARCHAR(25),
	command_active BOOLEAN DEFAULT TRUE,
	PRIMARY KEY (user_id, default_command_name)
);