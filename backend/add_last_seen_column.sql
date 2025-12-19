-- Add last_seen_at column to users table
-- Run this in phpMyAdmin or MySQL Workbench

ALTER TABLE `users` 
ADD COLUMN `last_seen_at` TIMESTAMP NULL DEFAULT NULL 
AFTER `remember_token`;
