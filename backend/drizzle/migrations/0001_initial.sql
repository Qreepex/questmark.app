CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE ("username")
);

CREATE TABLE IF NOT EXISTS "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"description" text,
	"image_urls" text[],
	"social_urls" text[],
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "places_user_id_idx" ON "places" ("user_id");