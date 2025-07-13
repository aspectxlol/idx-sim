-- Insert popular Indonesian stocks with initial prices
INSERT INTO stocks (symbol, company_name, current_price, previous_close, change_percent, volume, market_cap, sector) VALUES
-- Banking Sector
('BBRI', 'Bank Rakyat Indonesia (Persero) Tbk', 4580, 4560, 0.44, 45234000, 550000000000000, 'Banking'),
('BBCA', 'Bank Central Asia Tbk', 8775, 8750, 0.29, 12456000, 850000000000000, 'Banking'),
('BMRI', 'Bank Mandiri (Persero) Tbk', 6225, 6200, 0.40, 23567000, 480000000000000, 'Banking'),
('BBNI', 'Bank Negara Indonesia (Persero) Tbk', 5450, 5425, 0.46, 18934000, 320000000000000, 'Banking'),

-- Technology & Telecommunications
('GOTO', 'GoTo Gojek Tokopedia Tbk', 70, 68, 2.94, 156789000, 45000000000000, 'Technology'),
('TLKM', 'Telkom Indonesia (Persero) Tbk', 3640, 3620, 0.55, 34567000, 360000000000000, 'Telecommunications'),
('EMTK', 'Elang Mahkota Teknologi Tbk', 1385, 1375, 0.73, 8934000, 28000000000000, 'Media & Technology'),
('EXCL', 'XL Axiata Tbk', 2450, 2430, 0.82, 15678000, 58000000000000, 'Telecommunications'),

-- Consumer Goods
('UNVR', 'Unilever Indonesia Tbk', 2630, 2620, 0.38, 6789000, 195000000000000, 'Consumer Goods'),
('ICBP', 'Indofood CBP Sukses Makmur Tbk', 10900, 10850, 0.46, 3456000, 95000000000000, 'Food & Beverages'),
('INDF', 'Indofood Sukses Makmur Tbk', 6800, 6775, 0.37, 8234000, 59000000000000, 'Food & Beverages'),
('GGRM', 'Gudang Garam Tbk', 18500, 18400, 0.54, 2345000, 85000000000000, 'Consumer Goods'),
('HMSP', 'HM Sampoerna Tbk', 1385, 1375, 0.73, 12456000, 65000000000000, 'Consumer Goods'),

-- Industrial & Automotive
('ASII', 'Astra International Tbk', 5575, 5550, 0.45, 23456000, 385000000000000, 'Automotive'),
('AUTO', 'Astra Otoparts Tbk', 1750, 1740, 0.57, 4567000, 28000000000000, 'Automotive'),
('INTP', 'Indocement Tunggal Prakarsa Tbk', 10200, 10150, 0.49, 3789000, 75000000000000, 'Building Materials'),
('SMGR', 'Semen Indonesia (Persero) Tbk', 5225, 5200, 0.48, 8945000, 62000000000000, 'Building Materials'),

-- Energy & Mining
('ADRO', 'Adaro Energy Tbk', 3020, 3000, 0.67, 45678000, 185000000000000, 'Mining'),
('PTBA', 'Bukit Asam Tbk', 4150, 4125, 0.61, 12345000, 95000000000000, 'Mining'),
('ITMG', 'Indo Tambangraya Megah Tbk', 23500, 23300, 0.86, 1234000, 142000000000000, 'Mining'),
('PGAS', 'Perusahaan Gas Negara Tbk', 1545, 1535, 0.65, 18567000, 68000000000000, 'Energy'),

-- Healthcare & Pharmaceuticals
('KLBF', 'Kalbe Farma Tbk', 1500, 1490, 0.67, 15678000, 48000000000000, 'Healthcare'),
('KAEF', 'Kimia Farma Tbk', 1385, 1375, 0.73, 8934000, 18000000000000, 'Healthcare'),

-- Infrastructure & Construction
('JSMR', 'Jasa Marga (Persero) Tbk', 4200, 4175, 0.60, 6789000, 58000000000000, 'Infrastructure'),
('WIKA', 'Wijaya Karya (Persero) Tbk', 1385, 1375, 0.73, 12456000, 16500000000000, 'Construction'),
('WSKT', 'Waskita Karya (Persero) Tbk', 1050, 1040, 0.96, 18934000, 12800000000000, 'Construction'),

-- Agriculture & Livestock
('JPFA', 'Japfa Comfeed Indonesia Tbk', 1385, 1375, 0.73, 8934000, 28000000000000, 'Agriculture'),
('CPIN', 'Charoen Pokphand Indonesia Tbk', 4200, 4175, 0.60, 15678000, 85000000000000, 'Agriculture'),

-- Property & Real Estate
('BSDE', 'Bumi Serpong Damai Tbk', 1385, 1375, 0.73, 23456000, 48000000000000, 'Property'),
('LPKR', 'Lippo Karawaci Tbk', 196, 194, 1.03, 45678000, 13500000000000, 'Property')

ON CONFLICT (symbol) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    current_price = EXCLUDED.current_price,
    previous_close = EXCLUDED.previous_close,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    sector = EXCLUDED.sector,
    updated_at = NOW();
