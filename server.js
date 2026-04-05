/*
  Ghi chú chức năng file server.js
  - Backend API cho hệ thống quản lý nhà hàng.
  - Quản lý schema/migration SQLite và seed dữ liệu mặc định.
  - Xử lý nghiệp vụ: xác thực, bàn, order, bếp, thanh toán, kho nguyên liệu, thống kê.
*/

const express = require("express");
const os = require("os");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DB_PATH = path.join(__dirname, "restaurant.db");

// Danh mục món mặc định để seed dữ liệu ban đầu (chỉ áp dụng khi DB chưa có dữ liệu).
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

// Định mức chuẩn: mỗi món tương ứng danh sách nguyên liệu + lượng dùng cho 1 phần.
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
  m12: [{ ingredientCode: "nl14", usageQty: 2 }],
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

// =========================
// Utility: DB + mã nghiệp vụ
// =========================
// Bộ helper Promise để dùng async/await thay cho callback sqlite3.
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

async function tableExists(tableName) {
  const row = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [tableName]);
  return Boolean(row);
}

async function columnExists(tableName, columnName) {
  if (!(await tableExists(tableName))) {
    return false;
  }
  const cols = await dbAll(`PRAGMA table_info(${tableName})`);
  return cols.some((c) => c.name === columnName);
}

function getLanUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((ifaceList) => {
    (ifaceList || []).forEach((iface) => {
      if (iface && iface.family === "IPv4" && !iface.internal) {
        urls.push(`http://${iface.address}:${port}`);
      }
    });
  });

  return [...new Set(urls)];
}

async function getNextCode(tableName, columnName, prefix, padding) {
  // Sinh mã tăng dần theo prefix, ví dụ NV001 / DH00001 / HD00001.
  // Cách này giúp mã dễ đọc với người dùng thay vì id số tự tăng.
  const row = await dbGet(
    `SELECT ${columnName} AS code FROM ${tableName} WHERE ${columnName} LIKE ? ORDER BY ${columnName} DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (!row || !row.code) {
    return `${prefix}${String(1).padStart(padding, "0")}`;
  }

  const raw = String(row.code).slice(prefix.length);
  const current = Number.parseInt(raw, 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  return `${prefix}${String(next).padStart(padding, "0")}`;
}

async function resolveEmployeeCode(inputValue) {
  // Chuẩn hóa mã nhân viên đầu vào (hỗ trợ cả dữ liệu cũ dạng số: 1 -> NV001).
  // Ưu tiên nhận đúng mã NVxxx; chỉ fallback map số khi cần tương thích dữ liệu cũ.
  const raw = String(inputValue || "").trim();
  if (!raw) {
    return null;
  }

  const exact = await dbGet("SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien = ?", [raw]);
  if (exact) {
    return exact.ma_nhan_vien;
  }

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const numeric = Number.parseInt(raw, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const candidates = [`NV${String(numeric).padStart(3, "0")}`, `NV${String(numeric).padStart(4, "0")}`];
  for (const candidate of candidates) {
    const row = await dbGet("SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien = ?", [candidate]);
    if (row) {
      return row.ma_nhan_vien;
    }
  }

  return null;
}

async function normalizeLegacyEmployeeReferences() {
  // Dọn dữ liệu lịch sử: đổi mọi tham chiếu nhân viên không theo chuẩn NVxxx.
  // Hàm này chạy sau seed để hệ thống vừa mở đã sạch dữ liệu tham chiếu nhân viên.
  const donHangs = await dbAll(
    `
    SELECT ma_don_hang, ma_nhan_vien
    FROM don_hang
    WHERE ma_nhan_vien IS NOT NULL
      AND TRIM(ma_nhan_vien) <> ''
      AND ma_nhan_vien NOT LIKE 'NV%'
    `
  );

  for (const row of donHangs) {
    const normalized = await resolveEmployeeCode(row.ma_nhan_vien);
    if (normalized) {
      await dbRun("UPDATE don_hang SET ma_nhan_vien = ? WHERE ma_don_hang = ?", [normalized, row.ma_don_hang]);
    }
  }

  const hoaDons = await dbAll(
    `
    SELECT ma_hoa_don, ma_nhan_vien
    FROM hoa_don
    WHERE ma_nhan_vien IS NOT NULL
      AND TRIM(ma_nhan_vien) <> ''
      AND ma_nhan_vien NOT LIKE 'NV%'
    `
  );

  for (const row of hoaDons) {
    const normalized = await resolveEmployeeCode(row.ma_nhan_vien);
    if (normalized) {
      await dbRun("UPDATE hoa_don SET ma_nhan_vien = ? WHERE ma_hoa_don = ?", [normalized, row.ma_hoa_don]);
    }
  }
}

async function migrateIdPrimaryKeysToCodeIfNeeded() {
  // Migration một lần: chuyển schema cũ dùng id sang schema mới dùng mã nghiệp vụ làm khóa chính.
  // Chiến lược migrate:
  // 1) Tạo bảng _new theo schema mã.
  // 2) Chuyển dữ liệu + map id -> mã nghiệp vụ.
  // 3) Drop bảng cũ, rename bảng mới.
  // 4) Commit trong transaction để tránh trạng thái nửa chừng.
  const needsMigration = await columnExists("ban_an", "id");
  if (!needsMigration) {
    return;
  }

  // Tắt FK tạm thời để đổi tên/drop bảng an toàn trong quá trình migrate.
  await dbRun("PRAGMA foreign_keys = OFF");
  await dbRun("BEGIN TRANSACTION");

  try {
    // 1) Migrate bảng nhân viên: id -> ma_nhan_vien (NVxxx)
    await dbRun(`
      CREATE TABLE nhan_vien_new (
        ma_nhan_vien TEXT PRIMARY KEY,
        ten_dang_nhap TEXT NOT NULL UNIQUE,
        mat_khau TEXT NOT NULL,
        vai_tro TEXT NOT NULL,
        so_lan_sai INTEGER NOT NULL DEFAULT 0,
        khoa_den INTEGER,
        thoi_gian_dang_nhap TEXT,
        thoi_gian_dang_xuat TEXT
      )
    `);

    await dbRun(`
      INSERT INTO nhan_vien_new (
        ma_nhan_vien,
        ten_dang_nhap,
        mat_khau,
        vai_tro,
        so_lan_sai,
        khoa_den,
        thoi_gian_dang_nhap,
        thoi_gian_dang_xuat
      )
      SELECT
        printf('NV%03d', id),
        ten_dang_nhap,
        mat_khau,
        vai_tro,
        COALESCE(so_lan_sai, 0),
        khoa_den,
        CASE
          WHEN thoi_gian_dang_nhap IS NULL THEN NULL
          WHEN typeof(thoi_gian_dang_nhap) IN ('integer', 'real') THEN datetime(thoi_gian_dang_nhap / 1000, 'unixepoch', 'localtime')
          ELSE thoi_gian_dang_nhap
        END,
        CASE
          WHEN thoi_gian_dang_xuat IS NULL THEN NULL
          WHEN typeof(thoi_gian_dang_xuat) IN ('integer', 'real') THEN datetime(thoi_gian_dang_xuat / 1000, 'unixepoch', 'localtime')
          ELSE thoi_gian_dang_xuat
        END
      FROM nhan_vien
    `);

    // 2) Migrate bảng bàn ăn: id -> ma_ban (BAxx)
    await dbRun(`
      CREATE TABLE ban_an_new (
        ma_ban TEXT PRIMARY KEY,
        ten_ban TEXT NOT NULL UNIQUE,
        trang_thai TEXT NOT NULL
      )
    `);

    await dbRun(`
      INSERT INTO ban_an_new (ma_ban, ten_ban, trang_thai)
      SELECT
        printf('BA%02d', id),
        CASE
          WHEN ten_ban LIKE 'Ban %' THEN REPLACE(ten_ban, 'Ban ', 'Bàn ')
          ELSE ten_ban
        END,
        trang_thai
      FROM ban_an
      ORDER BY id
    `);

    // 3) Migrate bảng món ăn: ưu tiên giữ ma_mon cũ nếu đã có.
    await dbRun(`
      CREATE TABLE mon_an_new (
        ma_mon TEXT PRIMARY KEY,
        ten_mon TEXT NOT NULL,
        gia INTEGER NOT NULL
      )
    `);

    await dbRun(`
      INSERT INTO mon_an_new (ma_mon, ten_mon, gia)
      SELECT
        CASE
          WHEN ma_mon IS NOT NULL AND TRIM(ma_mon) <> '' THEN ma_mon
          ELSE printf('MA%03d', id)
        END,
        ten_mon,
        gia
      FROM mon_an
      ORDER BY id
    `);

    // 4) Migrate bảng nguyên liệu: ưu tiên giữ ma_nguyen_lieu cũ nếu đã có.
    await dbRun(`
      CREATE TABLE nguyen_lieu_new (
        ma_nguyen_lieu TEXT PRIMARY KEY,
        ten_nguyen_lieu TEXT NOT NULL,
        so_luong_ton INTEGER NOT NULL,
        don_vi TEXT NOT NULL
      )
    `);

    await dbRun(`
      INSERT INTO nguyen_lieu_new (ma_nguyen_lieu, ten_nguyen_lieu, so_luong_ton, don_vi)
      SELECT
        CASE
          WHEN ma_nguyen_lieu IS NOT NULL AND TRIM(ma_nguyen_lieu) <> '' THEN ma_nguyen_lieu
          ELSE printf('NL%03d', id)
        END,
        ten_nguyen_lieu,
        so_luong_ton,
        don_vi
      FROM nguyen_lieu
      ORDER BY id
    `);

    // 5) Migrate bảng đơn hàng: map mã bàn/món/nhân viên và chuẩn hóa thời gian tạo.
    await dbRun(`
      CREATE TABLE don_hang_new (
        ma_don_hang TEXT PRIMARY KEY,
        ma_ban TEXT NOT NULL,
        ma_mon TEXT NOT NULL,
        ma_nhan_vien TEXT,
        ten_mon TEXT NOT NULL,
        so_luong INTEGER NOT NULL,
        don_gia INTEGER NOT NULL,
        trang_thai TEXT NOT NULL,
        thoi_gian_tao TEXT NOT NULL,
        FOREIGN KEY(ma_ban) REFERENCES ban_an(ma_ban),
        FOREIGN KEY(ma_mon) REFERENCES mon_an(ma_mon),
        FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien)
      )
    `);

    await dbRun(`
      INSERT INTO don_hang_new (
        ma_don_hang,
        ma_ban,
        ma_mon,
        ma_nhan_vien,
        ten_mon,
        so_luong,
        don_gia,
        trang_thai,
        thoi_gian_tao
      )
      SELECT
        printf('DH%05d', d.id),
        printf('BA%02d', d.ma_ban),
        COALESCE(m.ma_mon, printf('MA%03d', d.ma_mon)),
        CASE
          WHEN d.ma_nhan_vien IS NULL THEN NULL
          ELSE printf('NV%03d', d.ma_nhan_vien)
        END,
        d.ten_mon,
        d.so_luong,
        d.don_gia,
        d.trang_thai,
        CASE
          WHEN d.thoi_gian_tao IS NULL THEN datetime('now', 'localtime')
          WHEN typeof(d.thoi_gian_tao) IN ('integer', 'real') THEN datetime(d.thoi_gian_tao / 1000, 'unixepoch', 'localtime')
          ELSE d.thoi_gian_tao
        END
      FROM don_hang d
      LEFT JOIN mon_an m ON m.id = d.ma_mon
      ORDER BY d.id
    `);

    // 6) Migrate bảng hóa đơn: giữ đủ giá trị tiền và map mã nhân viên.
    await dbRun(`
      CREATE TABLE hoa_don_new (
        ma_hoa_don TEXT PRIMARY KEY,
        ma_ban TEXT NOT NULL,
        ma_nhan_vien TEXT,
        tam_tinh INTEGER NOT NULL,
        giam_gia INTEGER NOT NULL,
        thanh_tien INTEGER NOT NULL,
        thoi_gian_tao TEXT NOT NULL,
        FOREIGN KEY(ma_ban) REFERENCES ban_an(ma_ban),
        FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien)
      )
    `);

    await dbRun(`
      INSERT INTO hoa_don_new (
        ma_hoa_don,
        ma_ban,
        ma_nhan_vien,
        tam_tinh,
        giam_gia,
        thanh_tien,
        thoi_gian_tao
      )
      SELECT
        printf('HD%05d', h.id),
        printf('BA%02d', h.ma_ban),
        CASE
          WHEN h.ma_nhan_vien IS NULL THEN NULL
          ELSE printf('NV%03d', h.ma_nhan_vien)
        END,
        h.tam_tinh,
        h.giam_gia,
        h.thanh_tien,
        CASE
          WHEN h.thoi_gian_tao IS NULL THEN datetime('now', 'localtime')
          WHEN typeof(h.thoi_gian_tao) IN ('integer', 'real') THEN datetime(h.thoi_gian_tao / 1000, 'unixepoch', 'localtime')
          ELSE h.thoi_gian_tao
        END
      FROM hoa_don h
      ORDER BY h.id
    `);

    // 7) Migrate bảng trung gian món-nguyên liệu theo khóa ghép mã.
    await dbRun(`
      CREATE TABLE mon_an_nguyen_lieu_new (
        ma_mon TEXT NOT NULL,
        ma_nguyen_lieu TEXT NOT NULL,
        so_luong_su_dung INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ma_mon, ma_nguyen_lieu),
        FOREIGN KEY(ma_mon) REFERENCES mon_an(ma_mon),
        FOREIGN KEY(ma_nguyen_lieu) REFERENCES nguyen_lieu(ma_nguyen_lieu)
      )
    `);

    await dbRun(`
      INSERT OR IGNORE INTO mon_an_nguyen_lieu_new (ma_mon, ma_nguyen_lieu, so_luong_su_dung)
      SELECT
        COALESCE(m.ma_mon, printf('MA%03d', manl.ma_mon)),
        COALESCE(nl.ma_nguyen_lieu, printf('NL%03d', manl.ma_nguyen_lieu)),
        manl.so_luong_su_dung
      FROM mon_an_nguyen_lieu manl
      LEFT JOIN mon_an m ON m.id = manl.ma_mon
      LEFT JOIN nguyen_lieu nl ON nl.id = manl.ma_nguyen_lieu
    `);

    // 8) Migrate bảng thống kê tổng hợp.
    await dbRun(`
      CREATE TABLE thong_ke_he_thong_new (
        ma_thong_ke TEXT PRIMARY KEY,
        so_nhan_vien INTEGER NOT NULL DEFAULT 0,
        so_mon_an INTEGER NOT NULL DEFAULT 0,
        so_ban_an INTEGER NOT NULL DEFAULT 0,
        so_nguyen_lieu INTEGER NOT NULL DEFAULT 0,
        so_hoa_don INTEGER NOT NULL DEFAULT 0,
        so_don_hang INTEGER NOT NULL DEFAULT 0,
        thoi_gian_cap_nhat TEXT NOT NULL
      )
    `);

    if (await tableExists("thong_ke_he_thong")) {
      await dbRun(`
        INSERT INTO thong_ke_he_thong_new (
          ma_thong_ke,
          so_nhan_vien,
          so_mon_an,
          so_ban_an,
          so_nguyen_lieu,
          so_hoa_don,
          so_don_hang,
          thoi_gian_cap_nhat
        )
        SELECT
          'TK001',
          so_nhan_vien,
          so_mon_an,
          so_ban_an,
          so_nguyen_lieu,
          so_hoa_don,
          so_don_hang,
          CASE
            WHEN thoi_gian_cap_nhat IS NULL THEN datetime('now', 'localtime')
            WHEN typeof(thoi_gian_cap_nhat) IN ('integer', 'real') THEN datetime(thoi_gian_cap_nhat / 1000, 'unixepoch', 'localtime')
            ELSE thoi_gian_cap_nhat
          END
        FROM thong_ke_he_thong
        LIMIT 1
      `);
    }

    const thongKeCount = await dbGet("SELECT COUNT(*) AS count FROM thong_ke_he_thong_new");
    if (!thongKeCount || Number(thongKeCount.count) === 0) {
      await dbRun(
        `
        INSERT INTO thong_ke_he_thong_new (
          ma_thong_ke,
          so_nhan_vien,
          so_mon_an,
          so_ban_an,
          so_nguyen_lieu,
          so_hoa_don,
          so_don_hang,
          thoi_gian_cap_nhat
        )
        VALUES ('TK001', 0, 0, 0, 0, 0, 0, datetime('now', 'localtime'))
        `
      );
    }

    // 9) Dọn bảng cũ và đổi tên bảng mới về tên chuẩn đang dùng trong code.
    const dropTables = [
      "mon_an_nguyen_lieu",
      "don_hang",
      "hoa_don",
      "ban_an",
      "mon_an",
      "nguyen_lieu",
      "nhan_vien",
      "thong_ke_he_thong"
    ];

    for (const tableName of dropTables) {
      if (await tableExists(tableName)) {
        await dbRun(`DROP TABLE ${tableName}`);
      }
    }

    await dbRun("ALTER TABLE nhan_vien_new RENAME TO nhan_vien");
    await dbRun("ALTER TABLE ban_an_new RENAME TO ban_an");
    await dbRun("ALTER TABLE mon_an_new RENAME TO mon_an");
    await dbRun("ALTER TABLE nguyen_lieu_new RENAME TO nguyen_lieu");
    await dbRun("ALTER TABLE don_hang_new RENAME TO don_hang");
    await dbRun("ALTER TABLE hoa_don_new RENAME TO hoa_don");
    await dbRun("ALTER TABLE mon_an_nguyen_lieu_new RENAME TO mon_an_nguyen_lieu");
    await dbRun("ALTER TABLE thong_ke_he_thong_new RENAME TO thong_ke_he_thong");

    await dbRun("COMMIT");
  } catch (error) {
    await dbRun("ROLLBACK");
    throw error;
  } finally {
    await dbRun("PRAGMA foreign_keys = ON");
  }
}

async function ensureCodeSchema() {
  // Đảm bảo toàn bộ bảng theo schema mã hiện tại đã tồn tại trước khi chạy API.
  // Hàm này giúp dự án chạy được cả trên DB trắng (chưa có bảng nào).
  await dbRun(`
    CREATE TABLE IF NOT EXISTS nhan_vien (
      ma_nhan_vien TEXT PRIMARY KEY,
      ten_dang_nhap TEXT NOT NULL UNIQUE,
      mat_khau TEXT NOT NULL,
      vai_tro TEXT NOT NULL,
      so_lan_sai INTEGER NOT NULL DEFAULT 0,
      khoa_den INTEGER,
      thoi_gian_dang_nhap TEXT,
      thoi_gian_dang_xuat TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS ban_an (
      ma_ban TEXT PRIMARY KEY,
      ten_ban TEXT NOT NULL UNIQUE,
      trang_thai TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS mon_an (
      ma_mon TEXT PRIMARY KEY,
      ten_mon TEXT NOT NULL,
      gia INTEGER NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS nguyen_lieu (
      ma_nguyen_lieu TEXT PRIMARY KEY,
      ten_nguyen_lieu TEXT NOT NULL,
      so_luong_ton INTEGER NOT NULL,
      don_vi TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS mon_an_nguyen_lieu (
      ma_mon TEXT NOT NULL,
      ma_nguyen_lieu TEXT NOT NULL,
      so_luong_su_dung INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ma_mon, ma_nguyen_lieu),
      FOREIGN KEY(ma_mon) REFERENCES mon_an(ma_mon),
      FOREIGN KEY(ma_nguyen_lieu) REFERENCES nguyen_lieu(ma_nguyen_lieu)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS don_hang (
      ma_don_hang TEXT PRIMARY KEY,
      ma_ban TEXT NOT NULL,
      ma_mon TEXT NOT NULL,
      ma_nhan_vien TEXT,
      ten_mon TEXT NOT NULL,
      so_luong INTEGER NOT NULL,
      don_gia INTEGER NOT NULL,
      trang_thai TEXT NOT NULL,
      thoi_gian_tao TEXT NOT NULL,
      FOREIGN KEY(ma_ban) REFERENCES ban_an(ma_ban),
      FOREIGN KEY(ma_mon) REFERENCES mon_an(ma_mon),
      FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS hoa_don (
      ma_hoa_don TEXT PRIMARY KEY,
      ma_ban TEXT NOT NULL,
      ma_nhan_vien TEXT,
      tam_tinh INTEGER NOT NULL,
      giam_gia INTEGER NOT NULL,
      thanh_tien INTEGER NOT NULL,
      thoi_gian_tao TEXT NOT NULL,
      FOREIGN KEY(ma_ban) REFERENCES ban_an(ma_ban),
      FOREIGN KEY(ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS thong_ke_he_thong (
      ma_thong_ke TEXT PRIMARY KEY,
      so_nhan_vien INTEGER NOT NULL DEFAULT 0,
      so_mon_an INTEGER NOT NULL DEFAULT 0,
      so_ban_an INTEGER NOT NULL DEFAULT 0,
      so_nguyen_lieu INTEGER NOT NULL DEFAULT 0,
      so_hoa_don INTEGER NOT NULL DEFAULT 0,
      so_don_hang INTEGER NOT NULL DEFAULT 0,
      thoi_gian_cap_nhat TEXT NOT NULL
    )
  `);
}

async function seedDefaultRecipes() {
  // Seed định mức chỉ theo mã món/mã nguyên liệu, không phụ thuộc id.
  for (const [dishCode, recipeItems] of Object.entries(DEFAULT_RECIPE_MAP)) {
    const mon = await dbGet("SELECT ma_mon FROM mon_an WHERE ma_mon = ?", [dishCode]);
    if (!mon) {
      continue;
    }

    for (const item of recipeItems) {
      const nguyenLieu = await dbGet("SELECT ma_nguyen_lieu FROM nguyen_lieu WHERE ma_nguyen_lieu = ?", [item.ingredientCode]);
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
        [dishCode, item.ingredientCode, Number(item.usageQty)]
      );
    }
  }
}

async function seedDefaults() {
  // Seed dữ liệu hệ thống: tài khoản mẫu, bàn, menu, kho, định mức và số liệu tổng hợp.
  // Luôn dùng COUNT(*) trước khi seed để tránh nhân bản dữ liệu khi restart server.
  const userCount = await dbGet("SELECT COUNT(*) AS count FROM nhan_vien");
  if (Number(userCount.count) === 0) {
    await dbRun(
      `
      INSERT INTO nhan_vien (ma_nhan_vien, ten_dang_nhap, mat_khau, vai_tro)
      VALUES
        ('NV001', 'manager', '123456', 'manager'),
        ('NV002', 'waiter', '123456', 'waiter'),
        ('NV003', 'cashier', '123456', 'cashier')
      `
    );
  }

  const tableCount = await dbGet("SELECT COUNT(*) AS count FROM ban_an");
  if (Number(tableCount.count) === 0) {
    for (let i = 1; i <= 8; i += 1) {
      const maBan = `BA${String(i).padStart(2, "0")}`;
      await dbRun("INSERT INTO ban_an (ma_ban, ten_ban, trang_thai) VALUES (?, ?, ?)", [maBan, `Bàn ${i}`, "trong"]);
    }
  }

  await dbRun("UPDATE ban_an SET ten_ban = REPLACE(ten_ban, 'Ban ', 'Bàn ') WHERE ten_ban LIKE 'Ban %'");

  // Menu/kho dùng UPSERT để vừa có thể seed mới vừa cập nhật tên/đơn vị khi thay đổi.
  for (const item of DEFAULT_MENU_ITEMS) {
    await dbRun(
      `
      INSERT INTO mon_an (ma_mon, ten_mon, gia)
      VALUES (?, ?, ?)
      ON CONFLICT(ma_mon)
      DO UPDATE SET ten_mon = excluded.ten_mon, gia = excluded.gia
      `,
      [item.code, item.name, item.price]
    );
  }

  for (const item of DEFAULT_INGREDIENTS) {
    await dbRun(
      `
      INSERT INTO nguyen_lieu (ma_nguyen_lieu, ten_nguyen_lieu, so_luong_ton, don_vi)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(ma_nguyen_lieu)
      DO UPDATE SET ten_nguyen_lieu = excluded.ten_nguyen_lieu, don_vi = excluded.don_vi
      `,
      [item.code, item.name, item.qty, item.unit]
    );
  }

  await seedDefaultRecipes();

  // Đồng bộ tên món trong don_hang theo danh mục mon_an để tránh tên cũ lệch chuẩn.
  await dbRun(`
    UPDATE don_hang
    SET ten_mon = COALESCE((SELECT ten_mon FROM mon_an WHERE mon_an.ma_mon = don_hang.ma_mon), ten_mon)
  `);

  await normalizeLegacyEmployeeReferences();

  const thongKeCount = await dbGet("SELECT COUNT(*) AS count FROM thong_ke_he_thong WHERE ma_thong_ke = 'TK001'");
  if (!thongKeCount || Number(thongKeCount.count) === 0) {
    await dbRun(
      `
      INSERT INTO thong_ke_he_thong (
        ma_thong_ke,
        so_nhan_vien,
        so_mon_an,
        so_ban_an,
        so_nguyen_lieu,
        so_hoa_don,
        so_don_hang,
        thoi_gian_cap_nhat
      )
      VALUES ('TK001', 0, 0, 0, 0, 0, 0, datetime('now', 'localtime'))
      `
    );
  }

  await dbRun(`
    UPDATE thong_ke_he_thong
    SET
      so_nhan_vien = (SELECT COUNT(*) FROM nhan_vien),
      so_mon_an = (SELECT COUNT(*) FROM mon_an),
      so_ban_an = (SELECT COUNT(*) FROM ban_an),
      so_nguyen_lieu = (SELECT COUNT(*) FROM nguyen_lieu),
      so_hoa_don = (SELECT COUNT(*) FROM hoa_don),
      so_don_hang = (SELECT COUNT(*) FROM don_hang),
      thoi_gian_cap_nhat = datetime('now', 'localtime')
    WHERE ma_thong_ke = 'TK001'
  `);
}

async function initDb() {
  // Chuỗi khởi tạo DB theo thứ tự: migrate -> tạo schema chuẩn -> seed dữ liệu.
  // Bất kỳ lỗi nào ở đây sẽ chặn app.listen để tránh chạy server trên DB lỗi.
  await migrateIdPrimaryKeysToCodeIfNeeded();
  await ensureCodeSchema();
  await seedDefaults();
}

async function tinhTrangThaiBanTheoDon(maBan) {
  // Quy tắc tổng hợp trạng thái bàn dựa trên trạng thái các dòng đơn của chính bàn đó.
  // Ưu tiên: nếu mọi món hoàn tất => hoantat; nếu có món đang chế biến => chebien; còn lại phucvu.
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
  // Đồng bộ trạng thái cho mọi bàn trước khi trả dữ liệu tổng quan.
  const bans = await dbAll("SELECT ma_ban FROM ban_an ORDER BY ma_ban");
  for (const ban of bans) {
    const trangThai = await tinhTrangThaiBanTheoDon(ban.ma_ban);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE ma_ban = ?", [trangThai, ban.ma_ban]);
  }
}

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/trang-thai", async (req, res) => {
  // API snapshot cho frontend: trả đủ bàn, món, đơn, kho, doanh thu trong một lần gọi.
  // Frontend gọi endpoint này nhiều lần nên cần payload gọn và ổn định key.
  try {
    await dongBoTrangThaiTatCaBan();

    const tables = await dbAll(
      "SELECT ma_ban AS id, ma_ban AS code, ten_ban AS name, trang_thai AS status FROM ban_an ORDER BY ma_ban"
    );
    const menu = await dbAll(
      "SELECT ma_mon AS id, ma_mon AS code, ten_mon AS name, gia AS price FROM mon_an ORDER BY ma_mon"
    );
    const orders = await dbAll(
      `
      SELECT
        ma_don_hang AS id,
        ma_ban AS tableId,
        ma_mon AS menuId,
        ten_mon AS menuName,
        so_luong AS qty,
        don_gia AS price,
        trang_thai AS status,
        thoi_gian_tao AS createdAt
      FROM don_hang
      ORDER BY ma_don_hang
      `
    );
    const ingredients = await dbAll(
      "SELECT ma_nguyen_lieu AS id, ma_nguyen_lieu AS code, ten_nguyen_lieu AS name, so_luong_ton AS qty, don_vi AS unit FROM nguyen_lieu ORDER BY ten_nguyen_lieu"
    );
    const rev = await dbGet("SELECT COALESCE(SUM(thanh_tien), 0) AS total FROM hoa_don");

    res.json({ tables, menu, orders, ingredients, revenue: rev.total });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc du lieu he thong." });
  }
});

app.get("/api/nguyen-lieu", async (req, res) => {
  try {
    const ingredients = await dbAll(
      "SELECT ma_nguyen_lieu AS id, ma_nguyen_lieu AS code, ten_nguyen_lieu AS name, so_luong_ton AS qty, don_vi AS unit FROM nguyen_lieu ORDER BY ten_nguyen_lieu"
    );
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc danh sach nguyen lieu." });
  }
});

app.post("/api/nguyen-lieu", async (req, res) => {
  // Thêm nguyên liệu mới vào kho theo mã duy nhất do người dùng nhập.
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
  // Lưu định mức món-nguyên liệu theo UPSERT để chỉnh lại số lượng không tạo bản ghi trùng.
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
      [String(menuId), String(ingredientId), Number(usageQty)]
    );
    res.json({ message: "Da luu dinh muc nguyen lieu cho mon." });
  } catch (error) {
    res.status(500).json({ message: "Khong the luu dinh muc nguyen lieu." });
  }
});

app.get("/api/mon-an-nguyen-lieu/tat-ca", async (req, res) => {
  try {
    const recipeItems = await dbAll(
      `
      SELECT
        ma.ma_mon AS menuId,
        ma.ten_mon AS menuName,
        nl.ma_nguyen_lieu AS ingredientId,
        nl.ma_nguyen_lieu AS ingredientCode,
        nl.ten_nguyen_lieu AS ingredientName,
        nl.don_vi AS unit,
        manl.so_luong_su_dung AS usageQty,
        nl.so_luong_ton AS stockQty
      FROM mon_an_nguyen_lieu manl
      JOIN mon_an ma ON ma.ma_mon = manl.ma_mon
      JOIN nguyen_lieu nl ON nl.ma_nguyen_lieu = manl.ma_nguyen_lieu
      ORDER BY ma.ten_mon, nl.ten_nguyen_lieu
      `
    );

    res.json({ recipeItems });
  } catch (error) {
    res.status(500).json({ message: "Khong tai duoc danh sach dinh muc tong hop." });
  }
});

app.get("/api/mon-an/:menuId/nguyen-lieu", async (req, res) => {
  const menuId = String(req.params.menuId || "").trim();
  if (!menuId) {
    res.status(400).json({ message: "Mon an khong hop le." });
    return;
  }

  try {
    const recipeItems = await dbAll(
      `
      SELECT
        nl.ma_nguyen_lieu AS id,
        nl.ma_nguyen_lieu AS code,
        nl.ten_nguyen_lieu AS name,
        nl.don_vi AS unit,
        manl.so_luong_su_dung AS usageQty,
        nl.so_luong_ton AS stockQty
      FROM mon_an_nguyen_lieu manl
      JOIN nguyen_lieu nl ON nl.ma_nguyen_lieu = manl.ma_nguyen_lieu
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
    const exists = await dbGet("SELECT ma_nhan_vien FROM nhan_vien WHERE ten_dang_nhap = ?", [username]);
    if (exists) {
      res.status(409).json({ message: "Ten dang nhap da ton tai." });
      return;
    }

    const maNhanVien = await getNextCode("nhan_vien", "ma_nhan_vien", "NV", 3);
    await dbRun(
      "INSERT INTO nhan_vien (ma_nhan_vien, ten_dang_nhap, mat_khau, vai_tro) VALUES (?, ?, ?, ?)",
      [maNhanVien, username, password, role]
    );

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
    const user = await dbGet("SELECT ma_nhan_vien FROM nhan_vien WHERE ten_dang_nhap = ?", [username]);
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
  // Luồng đăng nhập có chống brute-force: sai 5 lần khóa tạm 5 phút.
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Vui long nhap day du thong tin." });
    return;
  }

  try {
    const user = await dbGet(
      `
      SELECT
        ma_nhan_vien AS id,
        ten_dang_nhap AS username,
        mat_khau AS password,
        vai_tro AS role,
        so_lan_sai AS failedAttempts,
        khoa_den AS lockUntil
      FROM nhan_vien
      WHERE ten_dang_nhap = ?
      `,
      [username]
    );

    if (!user) {
      res.status(404).json({ message: "Khong tim thay tai khoan." });
      return;
    }

    const now = Date.now();
    const lockUntil = user.lockUntil ? Number(user.lockUntil) : null;
    if (lockUntil && lockUntil > now) {
      const remainingSeconds = Math.ceil((lockUntil - now) / 1000);
      res.status(423).json({ message: "Tai khoan dang bi khoa tam thoi.", remainingSeconds });
      return;
    }

    if (user.password !== password) {
      const nextFail = Number(user.failedAttempts || 0) + 1;
      if (nextFail >= 5) {
        const nextLock = now + 5 * 60 * 1000;
        await dbRun("UPDATE nhan_vien SET so_lan_sai = ?, khoa_den = ? WHERE ma_nhan_vien = ?", [nextFail, nextLock, user.id]);
        res.status(423).json({ message: "Sai 5 lan, tai khoan bi khoa 5 phut.", remainingSeconds: 300 });
        return;
      }

      await dbRun("UPDATE nhan_vien SET so_lan_sai = ?, khoa_den = NULL WHERE ma_nhan_vien = ?", [nextFail, user.id]);
      res.status(401).json({ message: `Sai mat khau (${nextFail}/5).` });
      return;
    }

    await dbRun(
      "UPDATE nhan_vien SET so_lan_sai = 0, khoa_den = NULL, thoi_gian_dang_nhap = datetime('now', 'localtime'), thoi_gian_dang_xuat = NULL WHERE ma_nhan_vien = ?",
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
    const maNhanVien = await resolveEmployeeCode(userId);
    if (!maNhanVien) {
      res.status(400).json({ message: "Ma nhan vien dang xuat khong hop le." });
      return;
    }

    await dbRun("UPDATE nhan_vien SET thoi_gian_dang_xuat = datetime('now', 'localtime') WHERE ma_nhan_vien = ?", [maNhanVien]);
    res.json({ message: "Dang xuat thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat thoi gian dang xuat." });
  }
});

app.post("/api/ban-an/:id/chuyen-trang-thai", async (req, res) => {
  const tableCode = String(req.params.id || "").trim();
  if (!tableCode) {
    res.status(400).json({ message: "Ma ban khong hop le." });
    return;
  }

  try {
    const table = await dbGet("SELECT ma_ban, trang_thai AS status FROM ban_an WHERE ma_ban = ?", [tableCode]);
    if (!table) {
      res.status(404).json({ message: "Khong tim thay ban." });
      return;
    }

    let nextStatus = "trong";
    if (table.status === "trong") nextStatus = "phucvu";
    else if (table.status === "phucvu") nextStatus = "chebien";
    else if (table.status === "chebien") nextStatus = "hoantat";

    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE ma_ban = ?", [nextStatus, tableCode]);
    res.json({ message: "Cap nhat trang thai ban thanh cong." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat trang thai ban." });
  }
});

app.post("/api/don-hang", async (req, res) => {
  // Tạo dòng order mới cho bàn và ghi nhận nhân viên thao tác.
  // Luồng kiểm tra bắt buộc: mã nhân viên hợp lệ -> bàn tồn tại -> món tồn tại -> mới ghi đơn.
  const { tableId, menuId, qty, userId } = req.body;
  if (!tableId || !menuId || !qty || Number(qty) <= 0 || !userId) {
    res.status(400).json({ message: "Du lieu order khong hop le." });
    return;
  }

  try {
    const maNhanVien = await resolveEmployeeCode(userId);
    if (!maNhanVien) {
      res.status(400).json({ message: "Ma nhan vien tao order khong hop le." });
      return;
    }

    const table = await dbGet("SELECT ma_ban FROM ban_an WHERE ma_ban = ?", [String(tableId)]);
    if (!table) {
      res.status(404).json({ message: "Khong tim thay ban." });
      return;
    }

    const menu = await dbGet("SELECT ma_mon, ten_mon AS name, gia AS price FROM mon_an WHERE ma_mon = ?", [String(menuId)]);
    if (!menu) {
      res.status(404).json({ message: "Khong tim thay mon an." });
      return;
    }

    const maDonHang = await getNextCode("don_hang", "ma_don_hang", "DH", 5);

    await dbRun(
      `
      INSERT INTO don_hang (
        ma_don_hang,
        ma_ban,
        ma_mon,
        ma_nhan_vien,
        ten_mon,
        so_luong,
        don_gia,
        trang_thai,
        thoi_gian_tao
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `,
      [maDonHang, String(tableId), String(menuId), maNhanVien, menu.name, Number(qty), menu.price, "moi"]
    );

    await dbRun("UPDATE ban_an SET trang_thai = 'phucvu' WHERE ma_ban = ?", [String(tableId)]);

    res.json({ message: "Da them mon vao order." });
  } catch (error) {
    res.status(500).json({ message: "Khong the tao order." });
  }
});

app.post("/api/don-hang/gui-bep", async (req, res) => {
  // Chỉ chuyển các dòng trạng thái "moi" sang "dang-che-bien" cho đúng quy trình bếp.
  const { tableId } = req.body;
  if (!tableId) {
    res.status(400).json({ message: "Thieu thong tin ban." });
    return;
  }

  try {
    const updated = await dbRun(
      "UPDATE don_hang SET trang_thai = 'dang-che-bien' WHERE ma_ban = ? AND trang_thai = 'moi'",
      [String(tableId)]
    );

    if (!updated.changes) {
      res.status(400).json({ message: "Bàn này chưa có món mới để gửi bếp." });
      return;
    }

    const trangThaiBan = await tinhTrangThaiBanTheoDon(String(tableId));
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE ma_ban = ?", [trangThaiBan, String(tableId)]);
    res.json({ message: `Đã gửi ${updated.changes} món xuống bếp.` });
  } catch (error) {
    res.status(500).json({ message: "Khong the gui order xuong bep." });
  }
});

app.post("/api/bep/:orderId/hoan-tat", async (req, res) => {
  // Xác nhận hoàn tất món tại bếp và trừ tồn kho theo định mức đã cấu hình.
  // Lượng trừ kho = định mức * số lượng order; không cho tồn kho âm.
  const orderId = String(req.params.orderId || "").trim();
  if (!orderId) {
    res.status(400).json({ message: "Ma don hang khong hop le." });
    return;
  }

  try {
    const order = await dbGet(
      "SELECT ma_don_hang, ma_ban AS tableId, ma_mon AS menuId, so_luong AS qty FROM don_hang WHERE ma_don_hang = ?",
      [orderId]
    );
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
        "UPDATE nguyen_lieu SET so_luong_ton = CASE WHEN so_luong_ton - ? < 0 THEN 0 ELSE so_luong_ton - ? END WHERE ma_nguyen_lieu = ?",
        [consumeQty, consumeQty, recipe.ingredientId]
      );
    }

    await dbRun("UPDATE don_hang SET trang_thai = 'hoan-tat' WHERE ma_don_hang = ?", [orderId]);

    const trangThaiBan = await tinhTrangThaiBanTheoDon(order.tableId);
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE ma_ban = ?", [trangThaiBan, order.tableId]);

    res.json({ message: "Bep da xac nhan mon hoan tat." });
  } catch (error) {
    res.status(500).json({ message: "Khong the cap nhat mon tai bep." });
  }
});

app.post("/api/hoa-don/thanh-toan", async (req, res) => {
  // Chốt hóa đơn: tính tiền, áp mã giảm giá, ghi doanh thu và giải phóng bàn.
  // Quy tắc mã giảm giá hiện tại:
  // - GIAM10: giảm 10%
  // - GIAM20: giảm 20%
  // - mã khác: không giảm
  const { tableId, promoCode, userId } = req.body;
  if (!tableId || !userId) {
    res.status(400).json({ message: "Thieu thong tin ban thanh toan." });
    return;
  }

  try {
    const maNhanVien = await resolveEmployeeCode(userId);
    if (!maNhanVien) {
      res.status(400).json({ message: "Ma nhan vien thanh toan khong hop le." });
      return;
    }

    const orders = await dbAll(
      `
      SELECT
        ma_don_hang AS id,
        ma_ban AS tableId,
        ten_mon AS menuName,
        so_luong AS qty,
        don_gia AS price,
        trang_thai AS status
      FROM don_hang
      WHERE ma_ban = ?
      ORDER BY ma_don_hang
      `,
      [String(tableId)]
    );

    if (!orders.length) {
      res.status(404).json({ message: "Ban nay chua co order." });
      return;
    }

    const subtotal = orders.reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);
    const code = String(promoCode || "").toUpperCase().trim();
    const discountRate = code === "GIAM20" ? 0.2 : code === "GIAM10" ? 0.1 : 0;
    const discount = Math.round(subtotal * discountRate);
    const total = subtotal - discount;

    const maHoaDon = await getNextCode("hoa_don", "ma_hoa_don", "HD", 5);

    await dbRun(
      `
      INSERT INTO hoa_don (
        ma_hoa_don,
        ma_ban,
        ma_nhan_vien,
        tam_tinh,
        giam_gia,
        thanh_tien,
        thoi_gian_tao
      )
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `,
      [maHoaDon, String(tableId), maNhanVien, subtotal, discount, total]
    );

    await dbRun("DELETE FROM don_hang WHERE ma_ban = ?", [String(tableId)]);

    const trangThaiBan = await tinhTrangThaiBanTheoDon(String(tableId));
    await dbRun("UPDATE ban_an SET trang_thai = ? WHERE ma_ban = ?", [trangThaiBan, String(tableId)]);

    const invoice = await dbGet(
      `
      SELECT
        ma_hoa_don AS invoiceCode,
        ma_ban AS tableId,
        ma_nhan_vien AS staffCode,
        tam_tinh AS subtotal,
        giam_gia AS discount,
        thanh_tien AS total,
        thoi_gian_tao AS createdAt
      FROM hoa_don
      WHERE ma_hoa_don = ?
      `,
      [maHoaDon]
    );

    res.json({
      // Trả ngược hóa đơn vừa ghi để frontend hiển thị/in theo dữ liệu thực tế từ DB.
      invoice: invoice || {
        invoiceCode: maHoaDon,
        tableId: String(tableId),
        staffCode: maNhanVien,
        subtotal,
        discount,
        total,
        createdAt: null
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
    // Chỉ mở cổng sau khi DB đã sẵn sàng để tránh request vào khi schema chưa khởi tạo xong.
    app.listen(PORT, HOST, () => {
      console.log(`Server dang chay tai http://localhost:${PORT}`);
      const lanUrls = getLanUrls(PORT);
      if (lanUrls.length) {
        console.log("Truy cap tren dien thoai cung mang Wi-Fi bang:");
        lanUrls.forEach((url) => {
          console.log(`- ${url}`);
        });
      }
    });
  })
  .catch((error) => {
    console.error("Khoi tao CSDL that bai:", error);
    process.exit(1);
  });
