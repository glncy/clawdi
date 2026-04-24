CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`priority_id` text,
	`goal` text,
	`started_at` text NOT NULL,
	`ended_at` text,
	`planned_sec` integer NOT NULL,
	`actual_sec` integer DEFAULT 0 NOT NULL,
	`completed_naturally` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reflections` (
	`date` text PRIMARY KEY NOT NULL,
	`wins` text DEFAULT '[]' NOT NULL,
	`improve` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
