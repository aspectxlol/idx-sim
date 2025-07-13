-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    virtual_balance DECIMAL(15,2) DEFAULT 1000000.00,
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    previous_close DECIMAL(15,2) NOT NULL DEFAULT 0,
    change_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
    volume BIGINT DEFAULT 0,
    market_cap BIGINT DEFAULT 0,
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    average_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stock_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);

-- Create stored procedures for trading operations
CREATE OR REPLACE FUNCTION execute_buy_trade(
    p_user_id UUID,
    p_stock_id UUID,
    p_quantity INTEGER,
    p_price DECIMAL(15,2),
    p_total_value DECIMAL(15,2)
) RETURNS VOID AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Deduct balance from user
        UPDATE users 
        SET virtual_balance = virtual_balance - p_total_value,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Insert transaction record
        INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_value)
        VALUES (p_user_id, p_stock_id, 'BUY', p_quantity, p_price, p_total_value);
        
        -- Update or insert portfolio holding
        INSERT INTO portfolio (user_id, stock_id, quantity, average_price, created_at, updated_at)
        VALUES (p_user_id, p_stock_id, p_quantity, p_price, NOW(), NOW())
        ON CONFLICT (user_id, stock_id)
        DO UPDATE SET
            quantity = portfolio.quantity + p_quantity,
            average_price = ((portfolio.quantity * portfolio.average_price) + p_total_value) / (portfolio.quantity + p_quantity),
            updated_at = NOW();
            
    EXCEPTION WHEN OTHERS THEN
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_sell_trade(
    p_user_id UUID,
    p_stock_id UUID,
    p_quantity INTEGER,
    p_price DECIMAL(15,2),
    p_total_value DECIMAL(15,2)
) RETURNS VOID AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Add balance to user
        UPDATE users 
        SET virtual_balance = virtual_balance + p_total_value,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Insert transaction record
        INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_value)
        VALUES (p_user_id, p_stock_id, 'SELL', p_quantity, p_price, p_total_value);
        
        -- Update portfolio holding
        UPDATE portfolio 
        SET quantity = quantity - p_quantity,
            updated_at = NOW()
        WHERE user_id = p_user_id AND stock_id = p_stock_id;
        
        -- Remove holding if quantity becomes 0
        DELETE FROM portfolio 
        WHERE user_id = p_user_id AND stock_id = p_stock_id AND quantity <= 0;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Update existing users to have 1M balance if they have less
UPDATE users SET virtual_balance = 1000000.00 WHERE virtual_balance < 1000000.00;
