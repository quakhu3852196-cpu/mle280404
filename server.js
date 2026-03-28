/*
  Ghi chú chức năng file server.js
  - Backend API cho hệ thống quản lý nhà hàng.
  - Quản lý schema/migration SQLite và seed dữ liệu mặc định.
  - Xử lý nghiệp vụ: xác thực, bàn, order, bếp, thanh toán, kho nguyên liệu, thống kê.
*/

const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "restaurant.db");

const DEFAULT_MENU_ITEMS = [
  { code: "m1", name: "Phở bò", price: 65000 },
  { code: "m2", name: "Cơm gà", price: 55000 },
  { code: "m3", name: "Bún chả", price: 60000 },
  { code: "m4", name: "Trà đào", price: 30000 },
  { code: "m5", name: "Mì xào bò", price: 62000 },
  { code: "m6", name: "Cơm tấm sườn", price: 68000 },
  { code: "m7", name: "Lẩu thái", price: 220000 },
  { code: "m8", name: "Gỏi cuốn", price: 45000 },
  { code: "m9", name: "Súp hải sản", price: 52000 },
  { code: "m10", name: "Cánh gà chiên mắm", price: 89000 },
  { code: "m11", name: "Cá hồi áp chảo", price: 145000 },
  { code: "m12", name: "Nước cam", price: 28000 },
  { code: "m13", name: "Cà phê sữa", price: 32000 },
  { code: "m14", name: "Bánh flan", price: 35000 }
];

const DEFAULT_INGREDIENTS = [
  { code: "nl1", name: "Thịt bò", qty: 10000, unit: "gram" },
  { code: "nl2", name: "Thịt gà", qty: 8000, unit: "gram" },
  { code: "nl3", name: "Bún tươi", qty: 12000, unit: "gram" },
  { code: "nl4", name: "Rau sống", qty: 5000, unit: "gram" },
  { code: "nl5", name: "Gia vị", qty: 2000, unit: "gram" },
  { code: "nl6", name: "Bánh phở", qty: 10000, unit: "gram" },
  { code: "nl7", name: "Nước dùng", qty: 50000, unit: "ml" },
  { code: "nl8", name: "Gạo", qty: 40000, unit: "gram" },
  { code: "nl9", name: "Mì trứng", qty: 12000, unit: "gram" },
  { code: "nl10", name: "Sườn heo", qty: 9000, unit: "gram" },
  { code: "nl11", name: "Hải sản", qty: 7000, unit: "gram" },
  { code: "nl12", name: "Cánh gà", qty: 6000, unit: "gram" },
  { code: "nl13", name: "Cá hồi", qty: 5000, unit: "gram" },
  { code: "nl14", name: "Cam tươi", qty: 120, unit: "quả" },
  { code: "nl15", name: "Cà phê", qty: 3000, unit: "gram" },
  { code: "nl16", name: "Sữa đặc", qty: 300, unit: "hộp" },
  { code: "nl17", name: "Bột flan", qty: 2000, unit: "gram" },
  { code: "nl18", name: "Trứng gà", qty: 500, unit: "quả" },
  { code: "nl19", name: "Đào ngâm", qty: 80, unit: "hũ" }
];

const DEFAULT_RECIPE_MAP = {
  m1: [
    { ingredientCode: "nl1", usageQty: 140 },
    { ingredientCode: "nl6", usageQty: 180 },
    { ingredientCode: "nl7", usageQty: 450 },
    { ingredientCode: "nl5", usageQty: 12 }
  ],
  m2: [
    { ingredientCode: "nl2", usageQty: 130 },
    { ingredientCode: "nl8", usageQty: 160 },
    { ingredientCode: "nl4", usageQty: 30 },
    { ingredientCode: "nl5", usageQty: 10 }
  ],
  m3: [
    { ingredientCode: "nl1", usageQty: 120 },
    { ingredientCode: "nl3", usageQty: 180 },
    { ingredientCode: "nl4", usageQty: 35 },
    { ingredientCode: "nl5", usageQty: 12 }
  ],
  m4: [
    { ingredientCode: "nl19", usageQty: 1 },
    { ingredientCode: "nl5", usageQty: 2 }
  ],
  m5: [
    { ingredientCode: "nl1", usageQty: 110 },
    { ingredientCode: "nl9", usageQty: 170 },
    { ingredientCode: "nl4", usageQty: 25 },
    { ingredientCode: "nl5", usageQty: 11 }
  ],
  m6: [
    { ingredientCode: "nl10", usageQty: 140 },
    { ingredientCode: "nl8", usageQty: 170 },
    { ingredientCode: "nl4", usageQty: 25 },
    { ingredientCode: "nl5", usageQty: 10 }
  ],
  m7: [
    { ingredientCode: "nl11", usageQty: 240 },
    { ingredientCode: "nl7", usageQty: 650 },
    { ingredientCode: "nl4", usageQty: 60 },
    { ingredientCode: "nl5", usageQty: 18 }
  ],
  m8: [
    { ingredientCode: "nl3", usageQty: 140 },
    { ingredientCode: "nl2", usageQty: 80 },
    { ingredientCode: "nl4", usageQty: 45 },
    { ingredientCode: "nl5", usageQty: 8 }
  ],
  m9: [
    { ingredientCode: "nl11", usageQty: 150 },
    { ingredientCode: "nl7", usageQty: 300 },
    { ingredientCode: "nl5", usageQty: 9 }
  ],
  m10: [
    { ingredientCode: "nl12", usageQty: 180 },
    { ingredientCode: "nl5", usageQty: 14 }
  ],
  m11: [
    { ingredientCode: "nl13", usageQty: 180 },
    { ingredientCode: "nl4", usageQty: 30 },
    { ingredientCode: "nl5", usageQty: 10 }
  ],
  m12: [
    { ingredientCode: "nl14", usageQty: 2 }
  ],
  m13: [
    { ingredientCode: "nl15", usageQty: 18 },
    { ingredientCode: "nl16", usageQty: 1 }
  ],
  m14: [
    { ingredientCode: "nl17", usageQty: 35 },
    { ingredientCode: "nl18", usageQty: 1 },
    { ingredientCode: "nl16", usageQty: 1 }
  ]
};

const db = new sqlite3.Database(DB_PATH);

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function columnExists(tableName, columnName) {
  const cols = await dbAll(`PRAGMA table_info(${tableName})`);
  return cols.some((c) => c.name === columnName);
}

async function tinhTrangThaiBanTheoDon(maBan) {
  const stats = await dbGet(
    `
    SELECT
      COUNT(*) AS tong,
      SUM(CASE WHEN trang_thai = 'moi' THEN 1 ELSE 0 END) AS so_moi,
      SUM(CASE WHEN trang_thai = 'dang-che-bien' THEN 1 ELSE 0 END) AS so_che_bien,
      SUM(CASE WHEN trang_thai = 'hoan-tat' THEN 1 ELSE 0 END) AS so_hoan_tat
    FROM don_hang
    WHERE ma_ban = ?
    `,
    [maBan]
  );

  if (!stats || Number(stats.tong) === 0) {
    return "trong";
  }

  if (Number(stats.so_hoan_tat) === Number(stats.tong)) {
    return "hoantat";
  }

  if (Number(stats.so_che_bien) > 0) {
    return "chebien";
  }

  return "phucvu";
}

async function dongBoTrangThaiTatCaBan() {
  const bans = await dbAll("SELECT id FROM ban_an ORDER BY id");
  for (const ban of bans) {
    const trangThai = await tinhTrangThaiBanTheoDon(ban.id);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE id = ?", [trangThai, ban.id]);
  }
}

async function tableExists(tableName) {
  const row = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [tableName]);
  return Boolean(row);
}

async function migrateOldSchemaIfNeeded() {
  const hasOldUsers = await tableExists("users");
  const hasOldTables = await tableExists("dining_tables");
  const hasOldMenu = await tableExists("menu_items");
  const hasOldOrders = await tableExists("orders");
  const hasOldRevenue = await tableExists("revenue_log");

  const newUsersCount = await dbGet("SELECT COUNT(*) AS count FROM nhan_vien");
  if (hasOldUsers && newUsersCount.count === 0) {
    await dbRun(`
      INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, vai_tro, so_lan_sai, khoa_den)
      SELECT username, password, role, failed_attempts, lock_until
      FROM users
    `);
  }

  const newTablesCount = await dbGet("SELECT COUNT(*) AS count FROM ban_an");
  if (hasOldTables && newTablesCount.count === 0) {
    await dbRun(`
      INSERT INTO ban_an (ten_ban, trang_thai)
      SELECT name, status
      FROM dining_tables
    `);
  }

  const newMenuCount = await dbGet("SELECT COUNT(*) AS count FROM mon_an");
  if (hasOldMenu && newMenuCount.count === 0) {
    await dbRun(`
      INSERT INTO mon_an (ma_mon, ten_mon, gia)
      SELECT code, name, price
      FROM menu_items
    `);
  }

  const newOrdersCount = await dbGet("SELECT COUNT(*) AS count FROM don_hang");
  if (hasOldOrders && newOrdersCount.count === 0) {
    await dbRun(`
      INSERT INTO don_hang (ma_ban, ma_mon, ten_mon, so_luong, don_gia, trang_thai, thoi_gian_tao)
      SELECT table_id, menu_id, menu_name, qty, price, status, created_at
      FROM orders
    `);
  }

  const newBillsCount = await dbGet("SELECT COUNT(*) AS count FROM hoa_don");
  if (hasOldRevenue && newBillsCount.count === 0) {
    await dbRun(`
      INSERT INTO hoa_don (ma_ban, tam_tinh, giam_gia, thanh_tien, thoi_gian_tao)
      SELECT 0, amount, 0, amount, created_at
      FROM revenue_log
    `);
  }
}

async function migrateLoginLogoutTimestampFormat() {
  await dbRun(`
    UPDATE nhan_vien
    SET thoi_gian_dang_nhap = datetime(thoi_gian_dang_nhap / 1000, 'unixepoch', 'localtime')
    WHERE thoi_gian_dang_nhap IS NOT NULL
      AND typeof(thoi_gian_dang_nhap) IN ('integer', 'real')
  `);

  await dbRun(`
    UPDATE nhan_vien
    SET thoi_gian_dang_xuat = datetime(thoi_gian_dang_xuat / 1000, 'unixepoch', 'localtime')
    WHERE thoi_gian_dang_xuat IS NOT NULL
      AND typeof(thoi_gian_dang_xuat) IN ('integer', 'real')
  `);
}

async function migrateOtherTimestampFormat() {
  await dbRun(`
    UPDATE don_hang
    SET thoi_gian_tao = datetime(thoi_gian_tao / 1000, 'unixepoch', 'localtime')
    WHERE thoi_gian_tao IS NOT NULL
      AND typeof(thoi_gian_tao) IN ('integer', 'real')
  `);

  await dbRun(`
    UPDATE hoa_don
    SET thoi_gian_tao = datetime(thoi_gian_tao / 1000, 'unixepoch', 'localtime')
    WHERE thoi_gian_tao IS NOT NULL
      AND typeof(thoi_gian_tao) IN ('integer', 'real')
  `);

  const hasThongKe = await tableExists("thong_ke_he_thong");
  if (hasThongKe) {
    if (await columnExists("thong_ke_he_thong", "cap_nhat_luc")) {
      await dbRun(`
        UPDATE thong_ke_he_thong
        SET cap_nhat_luc = datetime(cap_nhat_luc / 1000, 'unixepoch', 'localtime')
        WHERE cap_nhat_luc IS NOT NULL
          AND typeof(cap_nhat_luc) IN ('integer', 'real')
      `);
    }

    if (await columnExists("thong_ke_he_thong", "thoi_gian_cap_nhat")) {
      await dbRun(`
        UPDATE thong_ke_he_thong
        SET thoi_gian_cap_nhat = datetime(thoi_gian_cap_nhat / 1000, 'unixepoch', 'localtime')
        WHERE thoi_gian_cap_nhat IS NOT NULL
          AND typeof(thoi_gian_cap_nhat) IN ('integer', 'real')
      `);
    }
  }
}

async function renameThongKeTimestampColumnIfNeeded() {
  const hasThongKe = await tableExists("thong_ke_he_thong");
  if (!hasThongKe) {
    return;
  }

  const hasOld = await columnExists("thong_ke_he_thong", "cap_nhat_luc");
  const hasNew = await columnExists("thong_ke_he_thong", "thoi_gian_cap_nhat");
  if (hasOld && !hasNew) {
    await dbRun("ALTER TABLE thong_ke_he_thong RENAME COLUMN cap_nhat_luc TO thoi_gian_cap_nhat");
  }
}

async function seedDefaultRecipes() {
  for (const [dishCode, recipeItems] of Object.entries(DEFAULT_RECIPE_MAP)) {
    const mon = await dbGet("SELECT id FROM mon_an WHERE ma_mon = ?", [dishCode]);
    if (!mon) {
      continue;
    }

    for (const item of recipeItems) {
      const nguyenLieu = await dbGet("SELECT id FROM nguyen_lieu WHERE ma_nguyen_lieu = ?", [item.ingredientCode]);
      if (!nguyenLieu) {
        continue;
      }

      await dbRun(
        `
        INSERT INTO mon_an_nguyen_lieu (ma_mon, ma_nguyen_lieu, so_luong_su_dung)
        VALUES (?, ?, ?)
        ON CONFLICT(ma_mon, ma_nguyen_lieu)
        DO UPDATE SET so_luong_su_dung = excluded.so_luong_su_dung
        `,
        [mon.id, nguyenLieu.id, Number(item.usageQty)]
      );
    }
  }
}

async function initDb() {
  // Khởi tạo toàn bộ bảng nghiệp vụ, cột bổ sung và dữ liệu mặc định.
  await dbRun(`
    CREATE TABLE IF NOT EXISTS nhan_vien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_dang_nhap TEXT NOT NULL UNIQUE,
      mat_khau TEXT NOT NULL,
      vai_tro TEXT NOT NULL,
      so_lan_sai INTEGER NOT NULL DEFAULT 0,
      khoa_den INTEGER,
      thoi_gian_dang_nhap TEXT,
      thoi_gian_dang_xuat TEXT
    )
  `);

  if (!(await columnExists("nhan_vien", "thoi_gian_dang_nhap"))) {
    await dbRun("ALTER TABLE nhan_vien ADD COLUMN thoi_gian_dang_nhap TEXT");
  }
  if (!(await columnExists("nhan_vien", "thoi_gian_dang_xuat"))) {
    await dbRun("ALTER TABLE nhan_vien ADD COLUMN thoi_gian_dang_xuat TEXT");
  }

  await migrateLoginLogoutTimestampFormat();

  await dbRun(`
    CREATE TABLE IF NOT EXISTS ban_an (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_ban TEXT NOT NULL UNIQUE,
      trang_thai TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS mon_an (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_mon TEXT NOT NULL UNIQUE,
      ten_mon TEXT NOT NULL,
      gia INTEGER NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS don_hang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_ban INTEGER NOT NULL,
      ma_mon INTEGER NOT NULL,
      ma_nhan_vien INTEGER,
      ten_mon TEXT NOT NULL,
      so_luong INTEGER NOT NULL,
      don_gia INTEGER NOT NULL,
      trang_thai TEXT NOT NULL,
      thoi_gian_tao TEXT NOT NULL,
      FOREIGN KEY(ma_ban) REFERENCES ban_an(id),
      FOREIGN KEY(ma_mon) REFERENCES mon_an(id),
      FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(id)
    )
  `);

  if (!(await columnExists("don_hang", "ma_nhan_vien"))) {
    await dbRun("ALTER TABLE don_hang ADD COLUMN ma_nhan_vien INTEGER");
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS hoa_don (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_ban INTEGER NOT NULL,
      ma_nhan_vien INTEGER,
      tam_tinh INTEGER NOT NULL,
      giam_gia INTEGER NOT NULL,
      thanh_tien INTEGER NOT NULL,
      thoi_gian_tao TEXT NOT NULL,
      FOREIGN KEY(ma_ban) REFERENCES ban_an(id),
      FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(id)
    )
  `);

  if (!(await columnExists("hoa_don", "ma_nhan_vien"))) {
    await dbRun("ALTER TABLE hoa_don ADD COLUMN ma_nhan_vien INTEGER");
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS nguyen_lieu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_nguyen_lieu TEXT NOT NULL UNIQUE,
      ten_nguyen_lieu TEXT NOT NULL,
      so_luong_ton INTEGER NOT NULL,
      don_vi TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS mon_an_nguyen_lieu (
      ma_mon INTEGER NOT NULL,
      ma_nguyen_lieu INTEGER NOT NULL,
      so_luong_su_dung INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ma_mon, ma_nguyen_lieu),
      FOREIGN KEY(ma_mon) REFERENCES mon_an(id),
      FOREIGN KEY(ma_nguyen_lieu) REFERENCES nguyen_lieu(id)
    )
  `);

  await migrateOldSchemaIfNeeded();
  await migrateOtherTimestampFormat();
  await renameThongKeTimestampColumnIfNeeded();

  const userCount = await dbGet("SELECT COUNT(*) AS count FROM nhan_vien");
  if (userCount.count === 0) {
    await dbRun(
      "INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, vai_tro) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
      ["manager", "123456", "manager", "waiter", "123456", "waiter", "cashier", "123456", "cashier"]
    );
  }

  const tableCount = await dbGet("SELECT COUNT(*) AS count FROM ban_an");
  if (tableCount.count === 0) {
    for (let i = 1; i <= 8; i += 1) {
      await dbRun("INSERT INTO ban_an (ten_ban, trang_thai) VALUES (?, ?)", [`Bàn ${i}`, "trong"]);
    }
  }

  for (const item of DEFAULT_MENU_ITEMS) {
    await dbRun(
      "INSERT OR IGNORE INTO mon_an (ma_mon, ten_mon, gia) VALUES (?, ?, ?)",
      [item.code, item.name, item.price]
    );
  }

  for (const item of DEFAULT_INGREDIENTS) {
    await dbRun(
      "INSERT OR IGNORE INTO nguyen_lieu (ma_nguyen_lieu, ten_nguyen_lieu, so_luong_ton, don_vi) VALUES (?, ?, ?, ?)",
      [item.code, item.name, item.qty, item.unit]
    );
  }

  await seedDefaultRecipes();
}

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/trang-thai", async (req, res) => {
  // Nạp trạng thái tổng hợp cho frontend: bàn, món, đơn, kho, doanh thu.
  try {
    await dongBoTrangThaiTatCaBan();
    const tables = await dbAll("SELECT id, ten_ban AS name, trang_thai AS status FROM ban_an ORDER BY id");
    const menu = await dbAll("SELECT id, ma_mon AS code, ten_mon AS name, gia AS price FROM mon_an ORDER BY id");
    const orders = await dbAll("SELECT id, ma_ban AS tableId, ma_mon AS menuId, ten_mon AS menuName, so_luong AS qty, don_gia AS price, trang_thai AS status FROM don_hang ORDER BY id");
    const ingredients = await dbAll("SELECT id, ma_nguyen_lieu AS code, ten_nguyen_lieu AS name, so_luong_ton AS qty, don_vi AS unit FROM nguyen_lieu ORDER BY ten_nguyen_lieu");
    const rev = await dbGet("SELECT COALESCE(SUM(thanh_tien), 0) AS total FROM hoa_don");
    res.json({ tables, menu, orders, ingredients, revenue: rev.total });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc du lieu he thong." });
  }
});

app.get("/api/nguyen-lieu", async (req, res) => {
  try {
    const ingredients = await dbAll(
      "SELECT id, ma_nguyen_lieu AS code, ten_nguyen_lieu AS name, so_luong_ton AS qty, don_vi AS unit FROM nguyen_lieu ORDER BY ten_nguyen_lieu"
    );
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc danh sach nguyen lieu." });
  }
});

app.post("/api/nguyen-lieu", async (req, res) => {
  const { code, name, qty, unit } = req.body;
  if (!code || !name || qty === undefined || !unit) {
    res.status(400).json({ message: "Thong tin nguyen lieu khong hop le." });
    return;
  }

  try {
    await dbRun(
      "INSERT INTO nguyen_lieu (ma_nguyen_lieu, ten_nguyen_lieu, so_luong_ton, don_vi) VALUES (?, ?, ?, ?)",
      [String(code).trim(), String(name).trim(), Number(qty), String(unit).trim()]
    );
    res.json({ message: "Da them nguyen lieu vao kho." });
  } catch (error) {
    res.status(500).json({ message: "Khong the them nguyen lieu. Co the bi trung ma." });
  }
});

app.post("/api/mon-an-nguyen-lieu", async (req, res) => {
  const { menuId, ingredientId, usageQty } = req.body;
  if (!menuId || !ingredientId || !usageQty || Number(usageQty) <= 0) {
    res.status(400).json({ message: "Thong tin dinh muc khong hop le." });
    return;
  }

  try {
    await dbRun(
      `
      INSERT INTO mon_an_nguyen_lieu (ma_mon, ma_nguyen_lieu, so_luong_su_dung)
      VALUES (?, ?, ?)
      ON CONFLICT(ma_mon, ma_nguyen_lieu)
      DO UPDATE SET so_luong_su_dung = excluded.so_luong_su_dung
      `,
      [Number(menuId), Number(ingredientId), Number(usageQty)]
    );
    res.json({ message: "Da luu dinh muc nguyen lieu cho mon." });
  } catch (error) {
    res.status(500).json({ message: "Khong the luu dinh muc nguyen lieu." });
  }
});

app.get("/api/mon-an/:menuId/nguyen-lieu", async (req, res) => {
  const menuId = Number(req.params.menuId);
  if (!menuId) {
    res.status(400).json({ message: "Mon an khong hop le." });
    return;
  }

  try {
    const recipeItems = await dbAll(
      `
      SELECT
        nl.id,
        nl.ma_nguyen_lieu AS code,
        nl.ten_nguyen_lieu AS name,
        nl.don_vi AS unit,
        manl.so_luong_su_dung AS usageQty,
        nl.so_luong_ton AS stockQty
      FROM mon_an_nguyen_lieu manl
      JOIN nguyen_lieu nl ON nl.id = manl.ma_nguyen_lieu
      WHERE manl.ma_mon = ?
      ORDER BY nl.ten_nguyen_lieu
      `,
      [menuId]
    );
    res.json({ recipeItems });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc dinh muc cua mon." });
  }
});

app.post("/api/xac-thuc/dang-ky", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    res.status(400).json({ message: "Thong tin dang ky khong hop le." });
    return;
  }

  const allowedRoles = ["waiter", "cashier"];
  if (!allowedRoles.includes(role)) {
    res.status(403).json({ message: "Dang ky chi ap dung cho nhan vien phuc vu va thu ngan." });
    return;
  }

  try {
    const exists = await dbGet("SELECT id FROM nhan_vien WHERE ten_dang_nhap = ?", [username]);
    if (exists) {
      res.status(409).json({ message: "Ten dang nhap da ton tai." });
      return;
    }

    await dbRun("INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, vai_tro) VALUES (?, ?, ?)", [username, password, role]);
    res.json({ message: "Dang ky thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the dang ky luc nay." });
  }
});

app.post("/api/xac-thuc/quen-mat-khau", async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    res.status(400).json({ message: "Thong tin khoi phuc khong hop le." });
    return;
  }

  try {
    const user = await dbGet("SELECT id FROM nhan_vien WHERE ten_dang_nhap = ?", [username]);
    if (!user) {
      res.status(404).json({ message: "Khong tim thay tai khoan." });
      return;
    }

    await dbRun(
      "UPDATE nhan_vien SET mat_khau = ?, so_lan_sai = 0, khoa_den = NULL WHERE ten_dang_nhap = ?",
      [newPassword, username]
    );
    res.json({ message: "Cap nhat mat khau thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat mat khau." });
  }
});

app.post("/api/xac-thuc/dang-nhap", async (req, res) => {
  // Đăng nhập và ghi nhận thời gian đăng nhập của nhân viên.
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Vui long nhap day du thong tin." });
    return;
  }

  try {
    const user = await dbGet(
      "SELECT id, ten_dang_nhap AS username, mat_khau AS password, vai_tro AS role, so_lan_sai AS failedAttempts, khoa_den AS lockUntil FROM nhan_vien WHERE ten_dang_nhap = ?",
      [username]
    );

    if (!user) {
      res.status(404).json({ message: "Khong tim thay tai khoan." });
      return;
    }

    const now = Date.now();
    if (user.lockUntil && user.lockUntil > now) {
      const remainingSeconds = Math.ceil((user.lockUntil - now) / 1000);
      res.status(423).json({ message: "Tai khoan dang bi khoa tam thoi.", remainingSeconds });
      return;
    }

    if (user.password !== password) {
      const nextFail = user.failedAttempts + 1;
      if (nextFail >= 5) {
        const lockUntil = now + 5 * 60 * 1000;
        await dbRun("UPDATE nhan_vien SET so_lan_sai = ?, khoa_den = ? WHERE id = ?", [nextFail, lockUntil, user.id]);
        res.status(423).json({ message: "Sai 5 lan, tai khoan bi khoa 5 phut.", remainingSeconds: 300 });
        return;
      }

      await dbRun("UPDATE nhan_vien SET so_lan_sai = ?, khoa_den = NULL WHERE id = ?", [nextFail, user.id]);
      res.status(401).json({ message: `Sai mat khau (${nextFail}/5).` });
      return;
    }

    await dbRun(
      "UPDATE nhan_vien SET so_lan_sai = 0, khoa_den = NULL, thoi_gian_dang_nhap = datetime('now', 'localtime'), thoi_gian_dang_xuat = NULL WHERE id = ?",
      [user.id]
    );
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Khong the dang nhap luc nay." });
  }
});

app.post("/api/xac-thuc/dang-xuat", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ message: "Thieu thong tin nguoi dung dang xuat." });
    return;
  }

  try {
    await dbRun("UPDATE nhan_vien SET thoi_gian_dang_xuat = datetime('now', 'localtime') WHERE id = ?", [Number(userId)]);
    res.json({ message: "Dang xuat thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat thoi gian dang xuat." });
  }
});

app.post("/api/ban-an/:id/chuyen-trang-thai", async (req, res) => {
  const tableId = Number(req.params.id);
  try {
    const table = await dbGet("SELECT id, trang_thai AS status FROM ban_an WHERE id = ?", [tableId]);
    if (!table) {
      res.status(404).json({ message: "Khong tim thay ban." });
      return;
    }

    let nextStatus = "trong";
    if (table.status === "trong") nextStatus = "phucvu";
    else if (table.status === "phucvu") nextStatus = "chebien";
    else if (table.status === "chebien") nextStatus = "hoantat";

    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE id = ?", [nextStatus, tableId]);
    res.json({ message: "Cap nhat trang thai ban thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat trang thai ban." });
  }
});

app.post("/api/don-hang", async (req, res) => {
  // Tạo đơn món cho từng bàn và ghi nhận nhân viên thao tác.
  const { tableId, menuId, qty, userId } = req.body;
  if (!tableId || !menuId || !qty || Number(qty) <= 0 || !userId) {
    res.status(400).json({ message: "Du lieu order khong hop le." });
    return;
  }

  try {
    const menu = await dbGet("SELECT id, ten_mon AS name, gia AS price FROM mon_an WHERE id = ?", [menuId]);
    if (!menu) {
      res.status(404).json({ message: "Khong tim thay mon an." });
      return;
    }

    await dbRun(
      "INSERT INTO don_hang (ma_ban, ma_mon, ma_nhan_vien, ten_mon, so_luong, don_gia, trang_thai, thoi_gian_tao) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))",
      [tableId, menuId, Number(userId), menu.name, qty, menu.price, "moi"]
    );

    await dbRun("UPDATE ban_an SET trang_thai = 'phucvu' WHERE id = ?", [tableId]);

    res.json({ message: "Da them mon vao order." });
  } catch (error) {
    res.status(500).json({ message: "Khong the tao order." });
  }
});

app.post("/api/don-hang/gui-bep", async (req, res) => {
  const { tableId } = req.body;
  if (!tableId) {
    res.status(400).json({ message: "Thieu thong tin ban." });
    return;
  }

  try {
    const updated = await dbRun("UPDATE don_hang SET trang_thai = 'dang-che-bien' WHERE ma_ban = ? AND trang_thai = 'moi'", [tableId]);
    if (!updated.changes) {
      res.status(400).json({ message: "Bàn này chưa có món mới để gửi bếp." });
      return;
    }

    const trangThaiBan = await tinhTrangThaiBanTheoDon(tableId);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE id = ?", [trangThaiBan, tableId]);
    res.json({ message: `Đã gửi ${updated.changes} món xuống bếp.` });
  } catch (error) {
    res.status(500).json({ message: "Khong the gui order xuong bep." });
  }
});

app.post("/api/bep/:orderId/hoan-tat", async (req, res) => {
  const orderId = Number(req.params.orderId);
  try {
    const order = await dbGet("SELECT id, ma_ban AS tableId, ma_mon AS menuId, so_luong AS qty FROM don_hang WHERE id = ?", [orderId]);
    if (!order) {
      res.status(404).json({ message: "Khong tim thay order." });
      return;
    }

    const recipes = await dbAll(
      "SELECT ma_nguyen_lieu AS ingredientId, so_luong_su_dung AS usageQty FROM mon_an_nguyen_lieu WHERE ma_mon = ?",
      [order.menuId]
    );

    for (const recipe of recipes) {
      const consumeQty = Number(recipe.usageQty) * Number(order.qty);
      await dbRun(
        "UPDATE nguyen_lieu SET so_luong_ton = CASE WHEN so_luong_ton - ? < 0 THEN 0 ELSE so_luong_ton - ? END WHERE id = ?",
        [consumeQty, consumeQty, recipe.ingredientId]
      );
    }

    await dbRun("UPDATE don_hang SET trang_thai = 'hoan-tat' WHERE id = ?", [orderId]);

    const trangThaiBan = await tinhTrangThaiBanTheoDon(order.tableId);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE id = ?", [trangThaiBan, order.tableId]);

    res.json({ message: "Bep da xac nhan mon hoan tat." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat mon tai bep." });
  }
});

app.post("/api/hoa-don/thanh-toan", async (req, res) => {
  // Thanh toán hóa đơn, ghi doanh thu và reset trạng thái bàn.
  const { tableId, promoCode, userId } = req.body;
  if (!tableId || !userId) {
    res.status(400).json({ message: "Thieu thong tin ban thanh toan." });
    return;
  }

  try {
    const orders = await dbAll(
      "SELECT id, ma_ban AS tableId, ten_mon AS menuName, so_luong AS qty, don_gia AS price, trang_thai AS status FROM don_hang WHERE ma_ban = ? ORDER BY id",
      [tableId]
    );

    if (!orders.length) {
      res.status(404).json({ message: "Ban nay chua co order." });
      return;
    }

    const subtotal = orders.reduce((sum, item) => sum + item.qty * item.price, 0);
    const code = String(promoCode || "").toUpperCase().trim();
    const discountRate = code === "GIAM20" ? 0.2 : code === "GIAM10" ? 0.1 : 0;
    const discount = Math.round(subtotal * discountRate);
    const total = subtotal - discount;

    await dbRun(
      "INSERT INTO hoa_don (ma_ban, ma_nhan_vien, tam_tinh, giam_gia, thanh_tien, thoi_gian_tao) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))",
      [tableId, Number(userId), subtotal, discount, total]
    );
    await dbRun("DELETE FROM don_hang WHERE ma_ban = ?", [tableId]);
    const trangThaiBan = await tinhTrangThaiBanTheoDon(tableId);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE id = ?", [trangThaiBan, tableId]);

    res.json({
      invoice: {
        tableId,
        subtotal,
        discount,
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Khong the thanh toan hoa don." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server dang chay tai http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Khoi tao CSDL that bai:", error);
    process.exit(1);
  });
