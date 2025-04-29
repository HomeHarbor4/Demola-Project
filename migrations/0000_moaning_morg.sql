CREATE TABLE "crime_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" varchar(10) NOT NULL,
	"municipality_code" varchar(10) NOT NULL,
	"municipality_name" varchar(100) NOT NULL,
	"crime_group_code" varchar(20) NOT NULL,
	"crime_group_name" varchar(200) NOT NULL,
	"crime_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "footer_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"link" text,
	"icon" text,
	"position" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'Finland' NOT NULL,
	"image" text NOT NULL,
	"description" text,
	"latitude" double precision,
	"longitude" double precision,
	"property_count" integer DEFAULT 0,
	"municipality_code" text,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"property_id" integer,
	"user_id" integer,
	"sender_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"description" text,
	"image" varchar(512),
	"average_price" numeric(12, 2),
	"population_density" integer,
	"walk_score" integer,
	"transit_score" integer,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_type" text NOT NULL,
	"section" text NOT NULL,
	"title" text,
	"subtitle" text,
	"content" text,
	"image" text,
	"link" text,
	"link_text" text,
	"button_text" text,
	"position" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"author_id" integer,
	"author_name" varchar(100),
	"category" varchar(50),
	"tags" text,
	"image_url" varchar(512),
	"read_time_minutes" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" double precision NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"area" double precision NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"postal_code" text,
	"property_type" text NOT NULL,
	"listing_type" text NOT NULL,
	"features" text[],
	"images" text[],
	"user_id" integer NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"featured" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"transaction_type" text DEFAULT 'new',
	"property_ownership" text DEFAULT 'freehold',
	"flooring_details" text,
	"furnishing_details" text,
	"heating_available" boolean DEFAULT false,
	"water_details" text,
	"gas_details" text,
	"owner_details" jsonb,
	"average_nearby_prices" double precision,
	"registration_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"slug" varchar(100) PRIMARY KEY NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"hashed_password" text,
	"phone" text,
	"role" text DEFAULT 'user' NOT NULL,
	"photo_url" text,
	"firebase_uid" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "neighborhood_name_city_idx" ON "neighborhoods" USING btree ("name","city");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");