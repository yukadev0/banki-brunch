CREATE TABLE `question_validations` (
	`id` integer PRIMARY KEY NOT NULL,
	`question_id` integer NOT NULL,
	`validated_by_user_id` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`validated_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
