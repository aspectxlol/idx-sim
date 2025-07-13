-- Update the users table to set default virtual balance to 1,000,000 IDR
ALTER TABLE users ALTER COLUMN virtual_balance SET DEFAULT 1000000.00;

-- Update existing users to have 1M IDR if they have less
UPDATE users SET virtual_balance = 1000000.00 WHERE virtual_balance < 1000000.00;
