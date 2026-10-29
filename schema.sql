-- 鍵雨的 D1 資料表。初始化：npm run db:init（遠端）或 npm run db:init:local

-- 認購的贊助詞。status：
--   unpaid   建好 Checkout、還沒付款（付款頁過期就刪掉）
--   review   已付款，等你在 /admin 審核
--   live     審核通過，正在落下，到 ends_at 為止
--   rejected 審核不通過，已退款
CREATE TABLE IF NOT EXISTS sponsors (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  words          TEXT NOT NULL,          -- JSON 陣列
  url            TEXT,
  plan           TEXT NOT NULL,
  days           INTEGER NOT NULL,
  amount         INTEGER NOT NULL,       -- 美分
  status         TEXT NOT NULL DEFAULT 'unpaid',
  session_id     TEXT,
  payment_intent TEXT,
  email          TEXT,
  created_at     TEXT NOT NULL,
  paid_at        TEXT,
  starts_at      TEXT,
  ends_at        TEXT
);
CREATE INDEX IF NOT EXISTS sponsors_status ON sponsors (status, ends_at);
CREATE INDEX IF NOT EXISTS sponsors_session ON sponsors (session_id);

-- 已付款的打賞，只記金額與時間。
CREATE TABLE IF NOT EXISTS tips (
  session_id TEXT PRIMARY KEY,
  amount     INTEGER NOT NULL,
  currency   TEXT NOT NULL,
  created_at TEXT NOT NULL
);
