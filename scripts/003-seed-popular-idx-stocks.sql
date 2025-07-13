-- Insert popular IDX stocks (real companies, prices will be fetched from API)
INSERT INTO stocks (symbol, name, sector, current_price, previous_close, volume, market_cap) VALUES
-- Banking & Financial Services
('BBRI', 'Bank Rakyat Indonesia Tbk', 'Financial Services', 4580.00, 4560.00, 28350000, 554000000000),
('BBCA', 'Bank Central Asia Tbk', 'Financial Services', 8750.00, 8700.00, 15420000, 1068000000000),
('BMRI', 'Bank Mandiri Tbk', 'Financial Services', 5425.00, 5400.00, 18920000, 432000000000),
('BBNI', 'Bank Negara Indonesia Tbk', 'Financial Services', 6200.00, 6150.00, 12450000, 298000000000),

-- Technology & Telecommunications
('GOTO', 'GoTo Gojek Tokopedia Tbk', 'Technology', 118.00, 115.00, 89420000, 45000000000),
('TLKM', 'Telkom Indonesia Tbk', 'Telecommunications', 3640.00, 3620.00, 12580000, 359000000000),
('EMTK', 'Elang Mahkota Teknologi Tbk', 'Media & Entertainment', 1285.00, 1275.00, 8920000, 15000000000),
('EXCL', 'XL Axiata Tbk', 'Telecommunications', 2450.00, 2420.00, 18650000, 58000000000),

-- Consumer & Retail
('UNVR', 'Unilever Indonesia Tbk', 'Consumer Non-Cyclicals', 2650.00, 2680.00, 4320000, 195000000000),
('ICBP', 'Indofood CBP Sukses Makmur Tbk', 'Consumer Non-Cyclicals', 9025.00, 9000.00, 2180000, 89000000000),
('INDF', 'Indofood Sukses Makmur Tbk', 'Consumer Non-Cyclicals', 6425.00, 6400.00, 3580000, 56000000000),
('GGRM', 'Gudang Garam Tbk', 'Consumer Non-Cyclicals', 24500.00, 24200.00, 1250000, 146000000000),
('HMSP', 'HM Sampoerna Tbk', 'Consumer Non-Cyclicals', 1385.00, 1375.00, 8940000, 163000000000),
('MYOR', 'Mayora Indah Tbk', 'Consumer Non-Cyclicals', 2380.00, 2350.00, 5420000, 28000000000),

-- Automotive & Industrial
('ASII', 'Astra International Tbk', 'Consumer Cyclicals', 5200.00, 5150.00, 8940000, 389000000000),
('AUTO', 'Astra Otoparts Tbk', 'Consumer Cyclicals', 1850.00, 1820.00, 3580000, 18000000000),
('INTP', 'Indocement Tunggal Prakarsa Tbk', 'Basic Materials', 8900.00, 8850.00, 1850000, 98000000000),
('SMGR', 'Semen Indonesia Tbk', 'Basic Materials', 4320.00, 4300.00, 8920000, 51000000000),

-- Energy & Mining
('ADRO', 'Adaro Energy Tbk', 'Energy', 2890.00, 2870.00, 45680000, 58000000000),
('PTBA', 'Bukit Asam Tbk', 'Energy', 3280.00, 3250.00, 5420000, 39000000000),
('ITMG', 'Indo Tambangraya Megah Tbk', 'Energy', 15200.00, 15100.00, 890000, 36000000000),
('PGAS', 'Perusahaan Gas Negara Tbk', 'Energy', 1420.00, 1400.00, 12450000, 31000000000),

-- Healthcare & Pharmaceuticals
('KLBF', 'Kalbe Farma Tbk', 'Healthcare', 1545.00, 1535.00, 18650000, 98000000000),
('KAEF', 'Kimia Farma Tbk', 'Healthcare', 3850.00, 3800.00, 2180000, 23000000000),

-- Infrastructure & Construction
('JSMR', 'Jasa Marga Tbk', 'Industrials', 4180.00, 4150.00, 6820000, 25000000000),
('WIKA', 'Wijaya Karya Tbk', 'Industrials', 1285.00, 1275.00, 15680000, 15000000000),
('WSKT', 'Waskita Karya Tbk', 'Industrials', 142.00, 140.00, 89420000, 3000000000),

-- Agriculture & Food
('JPFA', 'Japfa Comfeed Indonesia Tbk', 'Consumer Non-Cyclicals', 1120.00, 1110.00, 12450000, 23000000000),
('CPIN', 'Charoen Pokphand Indonesia Tbk', 'Consumer Non-Cyclicals', 4250.00, 4200.00, 8920000, 89000000000),

-- Property & Real Estate
('BSDE', 'Bumi Serpong Damai Tbk', 'Real Estate', 1285.00, 1270.00, 15680000, 28000000000),
('LPKR', 'Lippo Karawaci Tbk', 'Real Estate', 142.00, 140.00, 89420000, 8000000000)

ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  sector = EXCLUDED.sector,
  current_price = EXCLUDED.current_price,
  previous_close = EXCLUDED.previous_close,
  volume = EXCLUDED.volume,
  market_cap = EXCLUDED.market_cap,
  updated_at = NOW();
