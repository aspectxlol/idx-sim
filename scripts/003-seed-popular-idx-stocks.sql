-- Insert popular Indonesian stocks with realistic data
INSERT INTO stocks (symbol, company_name, sector, current_price, previous_close, volume, market_cap) VALUES
-- Banking Sector
('BBCA', 'Bank Central Asia Tbk', 'Banking', 8150, 8100, 15000000, 980000000000),
('BBRI', 'Bank Rakyat Indonesia Tbk', 'Banking', 4520, 4500, 25000000, 540000000000),
('BMRI', 'Bank Mandiri Tbk', 'Banking', 5475, 5450, 20000000, 520000000000),
('BBNI', 'Bank Negara Indonesia Tbk', 'Banking', 7200, 7150, 12000000, 350000000000),

-- Technology & Telecommunications
('GOTO', 'GoTo Gojek Tokopedia Tbk', 'Technology', 102, 100, 50000000, 85000000000),
('TLKM', 'Telkom Indonesia Tbk', 'Telecommunications', 3500, 3480, 18000000, 315000000000),
('EMTK', 'Elang Mahkota Teknologi Tbk', 'Media & Technology', 2540, 2520, 8000000, 45000000000),
('EXCL', 'XL Axiata Tbk', 'Telecommunications', 2650, 2630, 15000000, 65000000000),

-- Consumer Goods
('UNVR', 'Unilever Indonesia Tbk', 'Consumer Goods', 4200, 4180, 8000000, 310000000000),
('ICBP', 'Indofood CBP Sukses Makmur Tbk', 'Food & Beverages', 10500, 10450, 5000000, 95000000000),
('INDF', 'Indofood Sukses Makmur Tbk', 'Food & Beverages', 6800, 6750, 12000000, 60000000000),
('GGRM', 'Gudang Garam Tbk', 'Tobacco', 52000, 51500, 2000000, 155000000000),
('HMSP', 'HM Sampoerna Tbk', 'Tobacco', 1385, 1380, 25000000, 165000000000),

-- Industrial & Manufacturing
('ASII', 'Astra International Tbk', 'Automotive', 6000, 5950, 20000000, 425000000000),
('AUTO', 'Astra Otoparts Tbk', 'Automotive', 1750, 1740, 8000000, 28000000000),
('INTP', 'Indocement Tunggal Prakarsa Tbk', 'Cement', 10200, 10150, 3000000, 95000000000),
('SMGR', 'Semen Indonesia Tbk', 'Cement', 5200, 5150, 15000000, 62000000000),

-- Energy & Mining
('ADRO', 'Adaro Energy Tbk', 'Coal Mining', 2850, 2830, 35000000, 180000000000),
('PTBA', 'Bukit Asam Tbk', 'Coal Mining', 4200, 4150, 12000000, 85000000000),
('ITMG', 'Indo Tambangraya Megah Tbk', 'Coal Mining', 18500, 18200, 1500000, 55000000000),
('PGAS', 'Perusahaan Gas Negara Tbk', 'Oil & Gas', 1850, 1840, 20000000, 40000000000),

-- Healthcare & Pharmaceuticals
('KLBF', 'Kalbe Farma Tbk', 'Pharmaceuticals', 1520, 1510, 25000000, 75000000000),
('KAEF', 'Kimia Farma Tbk', 'Pharmaceuticals', 3800, 3780, 8000000, 25000000000),

-- Infrastructure & Construction
('JSMR', 'Jasa Marga Tbk', 'Infrastructure', 4150, 4120, 10000000, 50000000000),
('WIKA', 'Wijaya Karya Tbk', 'Construction', 1850, 1840, 15000000, 22000000000),
('WSKT', 'Waskita Karya Tbk', 'Construction', 1650, 1640, 12000000, 18000000000),

-- Agriculture & Livestock
('JPFA', 'Japfa Comfeed Indonesia Tbk', 'Agriculture', 1420, 1410, 18000000, 32000000000),
('CPIN', 'Charoen Pokphand Indonesia Tbk', 'Agriculture', 4850, 4820, 12000000, 95000000000),

-- Property & Real Estate
('BSDE', 'Bumi Serpong Damai Tbk', 'Property', 1250, 1240, 20000000, 35000000000),
('LPKR', 'Lippo Karawaci Tbk', 'Property', 520, 515, 30000000, 15000000000)

ON CONFLICT (symbol) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    sector = EXCLUDED.sector,
    current_price = EXCLUDED.current_price,
    previous_close = EXCLUDED.previous_close,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    updated_at = NOW();
