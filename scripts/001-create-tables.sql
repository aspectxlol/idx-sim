-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    virtual_balance DECIMAL(15,2) DEFAULT 1000000.00,
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    previous_close DECIMAL(10,2) NOT NULL,
    volume BIGINT DEFAULT 0,
    market_cap BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    average_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stock_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requests_today INTEGER DEFAULT 0,
    trades_today INTEGER DEFAULT 0,
    last_reset DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);

-- Stored procedures for trading operations
CREATE OR REPLACE FUNCTION execute_buy_order(
    p_user_id UUID,
    p_stock_id UUID,
    p_quantity INTEGER,
    p_price DECIMAL(10,2)
) RETURNS VOID AS $$
DECLARE
    v_total_cost DECIMAL(15,2);
    v_user_balance DECIMAL(15,2);
    v_existing_quantity INTEGER DEFAULT 0;
    v_existing_avg_price DECIMAL(10,2) DEFAULT 0;
    v_new_quantity INTEGER;
    v_new_avg_price DECIMAL(10,2);
BEGIN
    v_total_cost := p_quantity * p_price;
    
    -- Check user balance
    SELECT virtual_balance INTO v_user_balance FROM users WHERE id = p_user_id;
    
    IF v_user_balance < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Update user balance
    UPDATE users SET virtual_balance = virtual_balance - v_total_cost WHERE id = p_user_id;
    
    -- Check if user already owns this stock
    SELECT quantity, average_price INTO v_existing_quantity, v_existing_avg_price
    FROM portfolio WHERE user_id = p_user_id AND stock_id = p_stock_id;
    
    IF FOUND THEN
        -- Update existing position
        v_new_quantity := v_existing_quantity + p_quantity;
        v_new_avg_price := ((v_existing_quantity * v_existing_avg_price) + (p_quantity * p_price)) / v_new_quantity;
        
        UPDATE portfolio 
        SET quantity = v_new_quantity, 
            average_price = v_new_avg_price,
            updated_at = NOW()
        WHERE user_id = p_user_id AND stock_id = p_stock_id;
    ELSE
        -- Create new position
        INSERT INTO portfolio (user_id, stock_id, quantity, average_price)
        VALUES (p_user_id, p_stock_id, p_quantity, p_price);
    END IF;
    
    -- Record transaction
    INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_value)
    VALUES (p_user_id, p_stock_id, 'BUY', p_quantity, p_price, v_total_cost);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION execute_sell_order(
    p_user_id UUID,
    p_stock_id UUID,
    p_quantity INTEGER,
    p_price DECIMAL(10,2)
) RETURNS VOID AS $$
DECLARE
    v_total_value DECIMAL(15,2);
    v_existing_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    v_total_value := p_quantity * p_price;
    
    -- Check if user owns enough shares
    SELECT quantity INTO v_existing_quantity FROM portfolio 
    WHERE user_id = p_user_id AND stock_id = p_stock_id;
    
    IF NOT FOUND OR v_existing_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient shares';
    END IF;
    
    -- Update user balance
    UPDATE users SET virtual_balance = virtual_balance + v_total_value WHERE id = p_user_id;
    
    -- Update portfolio
    v_new_quantity := v_existing_quantity - p_quantity;
    
    IF v_new_quantity = 0 THEN
        DELETE FROM portfolio WHERE user_id = p_user_id AND stock_id = p_stock_id;
    ELSE
        UPDATE portfolio 
        SET quantity = v_new_quantity, updated_at = NOW()
        WHERE user_id = p_user_id AND stock_id = p_stock_id;
    END IF;
    
    -- Record transaction
    INSERT INTO transactions (user_id, stock_id, type, quantity, price, total_value)
    VALUES (p_user_id, p_stock_id, 'SELL', p_quantity, p_price, v_total_value);
END;
$$ LANGUAGE plpgsql;
