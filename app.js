/*
  Ghi chú chức năng file app.js
  - Điều khiển giao diện frontend và phân quyền theo vai trò.
  - Gọi API backend cho các luồng: xác thực, bàn, order, bếp, thanh toán, kho nguyên liệu.
  - Đồng bộ trạng thái màn hình theo dữ liệu realtime từ SQLite.
*/

const STORAGE_KEYS = {
  currentUser: "rms_current_user"
};

const roleMap = {
  manager: "Quản lý",
  waiter: "Nhân viên phục vụ",
  cashier: "Thu ngân"
};

const roleConfigs = {
  manager: {
    description: "Quản lý: có toàn quyền gọi món, bếp, thu ngân, doanh thu và quản lý bàn.",
    cards: {
      table: true,
      order: true,
      kitchen: true,
      orderPreview: true,
      billing: true,
      report: true,
      ingredient: true
    },
    canChangeTable: true,
    canCreateOrder: true,
    canSendKitchen: true,
    canCompleteKitchen: true,
    canCheckout: true
  },
  waiter: {
    description: "Nhân viên phục vụ: gọi món, gửi bếp, xác nhận hoàn tất món và theo dõi bàn.",
    cards: {
      table: true,
      order: true,
      kitchen: true,
      orderPreview: true,
      billing: false,
      report: false,
      ingredient: false
    },
    canChangeTable: true,
    canCreateOrder: true,
    canSendKitchen: true,
    canCompleteKitchen: true,
    canCheckout: false
  },
  cashier: {
    description: "Thu ngân: thanh toán hóa đơn và theo dõi doanh thu.",
    cards: {
      table: true,
      order: false,
      kitchen: false,
      orderPreview: true,
      billing: true,
      report: true,
      ingredient: false
    },
    canChangeTable: false,
    canCreateOrder: false,
    canSendKitchen: false,
    canCompleteKitchen: false,
    canCheckout: true
  }
};

let lockTimer = null;
let currentUser = null;
let appState = {
  tables: [],
  menu: [],
  orders: [],
  ingredients: [],
  revenue: 0
};

function getRoleConfig(role = currentUser?.role) {
  return roleConfigs[role] || roleConfigs.waiter;
}

async function api(path, options = {}) {
  // Hàm gọi API chung: chuẩn hóa request, parse JSON và xử lý lỗi.
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const err = new Error(payload.message || "Co loi xay ra.");
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

async function refreshState() {
  const state = await api("/api/trang-thai");
  appState = state;
}

function money(n) {
  return `${n.toLocaleString("vi-VN")} VND`;
}

function setMessage(el, text, type) {
  el.textContent = text;
  el.classList.remove("ok", "warn", "error");
  if (type) {
    el.classList.add(type);
  }
}

function bindAuthTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".auth-card");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.querySelector(`[data-panel='${btn.dataset.tab}']`);
      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

function lockCountdown(remainingSeconds, msgEl, submitBtn) {
  if (lockTimer) {
    clearInterval(lockTimer);
  }

  let remain = remainingSeconds;
  submitBtn.disabled = true;

  lockTimer = setInterval(() => {
    remain -= 1;
    if (remain <= 0) {
      clearInterval(lockTimer);
      submitBtn.disabled = false;
      setMessage(msgEl, "Tài khoản đã mở khóa, vui lòng thử lại.", "ok");
      return;
    }

    const sec = Math.ceil(remain);
    const minPart = Math.floor(sec / 60);
    const secPart = sec % 60;
    setMessage(msgEl, `Tài khoản bị khóa tạm thời: ${minPart}p ${secPart}s`, "warn");
  }, 1000);
}

function bindAuthForms() {
  // Luồng xác thực: đăng nhập, đăng ký, quên mật khẩu.
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const loginBtn = loginForm.querySelector("button[type='submit']");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
      setMessage(loginMessage, "Vui lòng nhập đầy đủ thông tin.", "error");
      return;
    }

    try {
      const result = await api("/api/xac-thuc/dang-nhap", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(result.user));
      await showAppLayer(result.user);
      setMessage(loginMessage, "Đăng nhập thành công.", "ok");
      loginForm.reset();
      loginBtn.disabled = false;
    } catch (error) {
      if (error.status === 423) {
        const seconds = Number(error.payload.remainingSeconds || 300);
        lockCountdown(seconds, loginMessage, loginBtn);
        return;
      }
      setMessage(loginMessage, error.message, "error");
    }
  });

  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    if (!username || !password) {
      setMessage(registerMessage, "Thông tin không hợp lệ.", "error");
      return;
    }

    try {
      await api("/api/xac-thuc/dang-ky", {
        method: "POST",
        body: JSON.stringify({ username, password, role })
      });
      setMessage(registerMessage, "Tạo tài khoản thành công. Bạn có thể vào hệ thống ngay.", "ok");
      registerForm.reset();
    } catch (error) {
      setMessage(registerMessage, error.message, "error");
    }
  });

  const forgotForm = document.getElementById("forgotForm");
  const forgotMessage = document.getElementById("forgotMessage");
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("forgotUsername").value.trim();
    const newPassword = document.getElementById("forgotNewPassword").value;

    try {
      await api("/api/xac-thuc/quen-mat-khau", {
        method: "POST",
        body: JSON.stringify({ username, newPassword })
      });
      setMessage(forgotMessage, "Cập nhật mật khẩu thành công.", "ok");
      forgotForm.reset();
    } catch (error) {
      setMessage(forgotMessage, error.message, "error");
    }
  });
}

function applyRolePermission(role) {
  const tableCard = document.getElementById("tableCard");
  const orderCard = document.getElementById("orderCard");
  const kitchenCard = document.getElementById("kitchenCard");
  const orderPreviewCard = document.getElementById("orderPreviewCard");
  const billingCard = document.getElementById("billingCard");
  const reportCard = document.getElementById("reportCard");
  const ingredientCard = document.getElementById("ingredientCard");
  const cfg = getRoleConfig(role);

  tableCard.style.display = cfg.cards.table ? "block" : "none";
  orderCard.style.display = cfg.cards.order ? "block" : "none";
  kitchenCard.style.display = cfg.cards.kitchen ? "block" : "none";
  orderPreviewCard.style.display = cfg.cards.orderPreview ? "block" : "none";
  billingCard.style.display = cfg.cards.billing ? "block" : "none";
  reportCard.style.display = cfg.cards.report ? "block" : "none";
  ingredientCard.style.display = cfg.cards.ingredient ? "block" : "none";
}

function orderStatusLabel(status) {
  if (status === "moi") return "Mới tạo";
  if (status === "dang-che-bien") return "Đang chế biến";
  if (status === "hoan-tat") return "Hoàn tất";
  return status;
}

function renderOrderPreview() {
  const previewBox = document.getElementById("orderPreviewList");
  if (!previewBox) {
    return;
  }

  if (!appState.orders.length) {
    previewBox.innerHTML = "<p>Chưa có đơn hàng nào trong hệ thống.</p>";
    return;
  }

  const tableNameMap = appState.tables.reduce((acc, table) => {
    acc[String(table.id)] = table.name;
    return acc;
  }, {});

  const grouped = appState.orders.reduce((acc, order) => {
    const key = String(order.tableId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {});

  const tableIds = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));

  previewBox.innerHTML = tableIds
    .map((tableId) => {
      const orders = grouped[tableId];
      const tableName = tableNameMap[tableId] || tableId;
      const tongSoLuong = orders.reduce((sum, item) => sum + Number(item.qty || 0), 0);
      const tamTinh = orders.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);

      const orderRows = orders
        .map((order) => {
          const lineTotal = Number(order.qty || 0) * Number(order.price || 0);
          const created = order.createdAt ? `<small>Tạo lúc: ${order.createdAt}</small>` : "";
          return `
            <div class='order-preview-row'>
              <div>
                <strong>${order.menuName}</strong> x ${order.qty} - ${money(lineTotal)}<br />
                ${created}
              </div>
              <span class='order-status order-status-${order.status}'>${orderStatusLabel(order.status)}</span>
            </div>
          `;
        })
        .join("");

      return `
        <div class='list-item order-preview-group'>
          <div class='order-preview-header'>
            <strong>${tableName}</strong>
            <span class='order-preview-meta'>${orders.length} dòng món | SL ${tongSoLuong} | Tạm tính ${money(tamTinh)}</span>
          </div>
          <div class='order-preview-body'>${orderRows}</div>
        </div>
      `;
    })
    .join("");
}

function renderTables() {
  const list = document.getElementById("tableList");
  const orderTable = document.getElementById("orderTable");
  const billTable = document.getElementById("billTable");
  const tables = appState.tables;
  const cfg = getRoleConfig();
  const orderCountByTable = appState.orders.reduce((acc, order) => {
    const key = String(order.tableId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  list.innerHTML = "";
  orderTable.innerHTML = "";
  billTable.innerHTML = "";

  tables.forEach((t) => {
    const item = document.createElement("div");
    item.className = "table-item";
    const soMon = orderCountByTable[String(t.id)] || 0;
    item.innerHTML = `
      <div>
        <strong>${t.name}</strong><br />
        <small>Trạng thái: ${t.status}</small>
        <br />
        <small>Số món đang xử lý: ${soMon}</small>
      </div>
      <div>
        <span class="table-state state-${t.status}">${t.status.toUpperCase()}</span>
        ${cfg.canChangeTable ? `<button data-id="${t.id}" class="ghost" style="margin-top:6px">Đổi trạng thái</button>` : ""}
      </div>
    `;
    list.appendChild(item);

    const o = document.createElement("option");
    o.value = String(t.id);
    o.textContent = `${t.name} - ${t.status}`;
    orderTable.appendChild(o);

    const b = document.createElement("option");
    b.value = String(t.id);
    b.textContent = `${t.name} - ${t.status}`;
    billTable.appendChild(b);
  });

  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!cfg.canChangeTable) {
        return;
      }
      const id = String(btn.dataset.id || "");
      try {
        await api(`/api/ban-an/${encodeURIComponent(id)}/chuyen-trang-thai`, { method: "POST" });
        await renderAll();
      } catch (error) {
        // eslint-disable-next-line no-alert
        alert(error.message);
      }
    });
  });
}

function renderMenuSelect() {
  const orderMenu = document.getElementById("orderMenu");
  const recipeDish = document.getElementById("recipeDish");
  orderMenu.innerHTML = "";
  recipeDish.innerHTML = "";

  appState.menu.forEach((m) => {
    const option = document.createElement("option");
    option.value = String(m.id);
    option.textContent = `${m.name} - ${money(m.price)}`;
    orderMenu.appendChild(option);

    const recipeOpt = document.createElement("option");
    recipeOpt.value = String(m.id);
    recipeOpt.textContent = m.name;
    recipeDish.appendChild(recipeOpt);
  });
}

function renderIngredientSelect() {
  const ingredientSelect = document.getElementById("recipeIngredient");
  const ingredientList = document.getElementById("ingredientList");
  ingredientSelect.innerHTML = "";

  appState.ingredients.forEach((ing) => {
    const option = document.createElement("option");
    option.value = String(ing.id);
    option.textContent = `${ing.name} (${ing.qty} ${ing.unit})`;
    ingredientSelect.appendChild(option);
  });

  ingredientList.innerHTML = appState.ingredients.length
    ? appState.ingredients.map((ing) => `<div class='list-item'>${ing.code} - ${ing.name}: <strong>${ing.qty} ${ing.unit}</strong></div>`).join("")
    : "<p>Chưa có nguyên liệu nào trong kho.</p>";
}

async function renderAllRecipeList() {
  const recipeAllList = document.getElementById("recipeAllList");
  if (!recipeAllList) {
    return;
  }

  try {
    const result = await api("/api/mon-an-nguyen-lieu/tat-ca");
    const items = result.recipeItems || [];

    if (!items.length) {
      recipeAllList.innerHTML = "<p>Chưa có định mức nguyên liệu nào.</p>";
      return;
    }

    const grouped = items.reduce((acc, item) => {
      const key = String(item.menuId);
      if (!acc[key]) {
        acc[key] = {
          menuName: item.menuName,
          rows: []
        };
      }
      acc[key].rows.push(item);
      return acc;
    }, {});

    recipeAllList.innerHTML = Object.values(grouped)
      .map((group) => {
        const lines = group.rows
          .map((row) => `- ${row.ingredientName}: <strong>${row.usageQty} ${row.unit}</strong> (tồn ${row.stockQty} ${row.unit})`)
          .join("<br />");
        return `<div class='list-item'><strong>${group.menuName}</strong><br />${lines}</div>`;
      })
      .join("");
  } catch (error) {
    recipeAllList.innerHTML = `<p>${error.message}</p>`;
  }
}

function bindIngredientFlow() {
  // Luồng kho: thêm nguyên liệu và gán định mức món-nguyên liệu.
  const ingredientForm = document.getElementById("ingredientForm");
  const ingredientMessage = document.getElementById("ingredientMessage");
  const recipeForm = document.getElementById("recipeForm");
  const recipeMessage = document.getElementById("recipeMessage");
  const recipeDish = document.getElementById("recipeDish");

  ingredientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const code = document.getElementById("ingCode").value.trim();
    const name = document.getElementById("ingName").value.trim();
    const qty = Number(document.getElementById("ingQty").value);
    const unit = document.getElementById("ingUnit").value.trim();

    if (!code || !name || qty < 0 || !unit) {
      setMessage(ingredientMessage, "Thông tin nguyên liệu không hợp lệ.", "error");
      return;
    }

    try {
      await api("/api/nguyen-lieu", {
        method: "POST",
        body: JSON.stringify({ code, name, qty, unit })
      });
      setMessage(ingredientMessage, "Đã lưu nguyên liệu vào kho.", "ok");
      ingredientForm.reset();
      await renderAll();
    } catch (error) {
      setMessage(ingredientMessage, error.message, "error");
    }
  });

  recipeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const menuId = document.getElementById("recipeDish").value;
    const ingredientId = document.getElementById("recipeIngredient").value;
    const usageQty = Number(document.getElementById("recipeQty").value);

    if (!menuId || !ingredientId || usageQty <= 0) {
      setMessage(recipeMessage, "Thông tin định mức không hợp lệ.", "error");
      return;
    }

    try {
      await api("/api/mon-an-nguyen-lieu", {
        method: "POST",
        body: JSON.stringify({ menuId, ingredientId, usageQty })
      });
      setMessage(recipeMessage, "Đã lưu định mức nguyên liệu cho món.", "ok");
      await renderAllRecipeList();
    } catch (error) {
      setMessage(recipeMessage, error.message, "error");
    }
  });
}

function bindOrderAction() {
  // Luồng order theo bàn: thêm món, gửi bếp, theo dõi đơn hiện tại.
  const form = document.getElementById("orderForm");
  const orderMessage = document.getElementById("orderMessage");
  const currentOrder = document.getElementById("currentOrder");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cfg = getRoleConfig();
    if (!cfg.canCreateOrder) {
      setMessage(orderMessage, "Vai trò hiện tại không có quyền tạo order.", "warn");
      return;
    }

    const tableId = document.getElementById("orderTable").value;
    const menuId = document.getElementById("orderMenu").value;
    const qty = Number(document.getElementById("orderQty").value);

    if (!tableId || !menuId || qty <= 0) {
      setMessage(orderMessage, "Dữ liệu order không hợp lệ.", "error");
      return;
    }

    try {
      await api("/api/don-hang", {
        method: "POST",
        body: JSON.stringify({ tableId, menuId, qty, userId: currentUser?.id })
      });

      setMessage(orderMessage, "Đã thêm món vào order.", "ok");
      await renderAll();
    } catch (error) {
      setMessage(orderMessage, error.message, "error");
    }
  });

  document.getElementById("sendKitchenBtn").addEventListener("click", async () => {
    const cfg = getRoleConfig();
    if (!cfg.canSendKitchen) {
      setMessage(orderMessage, "Vai trò hiện tại không có quyền gửi bếp.", "warn");
      return;
    }

    const selectedTableId = document.getElementById("orderTable").value;
    try {
      await api("/api/don-hang/gui-bep", {
        method: "POST",
        body: JSON.stringify({ tableId: selectedTableId })
      });
      setMessage(orderMessage, "Đã gửi món xuống bếp thành công.", "ok");
      await renderAll();
    } catch (error) {
      setMessage(orderMessage, error.message, "warn");
    }
  });

  const drawCurrentOrder = () => {
    const tableId = document.getElementById("orderTable").value;
    const orders = appState.orders.filter((o) => o.tableId === tableId);
    currentOrder.innerHTML = orders.length
      ? orders.map((o) => `<div class='list-item'>${o.menuName} x ${o.qty} - ${o.status}</div>`).join("")
      : "<p>Chưa có món nào cho bàn này.</p>";
  };

  document.getElementById("orderTable").addEventListener("change", drawCurrentOrder);
  drawCurrentOrder();
}

function renderKitchen() {
  const box = document.getElementById("kitchenQueue");
  const orders = appState.orders.filter((o) => o.status === "dang-che-bien");
  const tableNameMap = appState.tables.reduce((acc, table) => {
    acc[String(table.id)] = table.name;
    return acc;
  }, {});
  const cfg = getRoleConfig();
  box.innerHTML = "";

  if (!orders.length) {
    box.innerHTML = "<p>Không có món đang chế biến.</p>";
    return;
  }

  orders.forEach((o) => {
    const row = document.createElement("div");
    row.className = "list-item";
    const tableName = tableNameMap[String(o.tableId)] || o.tableId;
    row.innerHTML = `
      <div>
        <strong>${tableName}</strong> - ${o.menuName} x ${o.qty}
      </div>
      ${cfg.canCompleteKitchen ? `<button data-id="${o.id}" class="secondary" style="margin-top:0">Xác nhận xong</button>` : ""}
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!cfg.canCompleteKitchen) {
        return;
      }
      const id = String(btn.dataset.id || "");
      try {
        await api(`/api/bep/${encodeURIComponent(id)}/hoan-tat`, { method: "POST" });
        await renderAll();
      } catch (error) {
        // eslint-disable-next-line no-alert
        alert(error.message);
      }
    });
  });
}

function bindBilling() {
  // Luồng thu ngân: thanh toán hóa đơn, tính giảm giá và in bill.
  const form = document.getElementById("billingForm");
  const invoiceBox = document.getElementById("invoicePreview");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cfg = getRoleConfig();
    if (!cfg.canCheckout) {
      invoiceBox.innerHTML = "<p>Vai trò hiện tại không có quyền thanh toán.</p>";
      return;
    }

    const tableId = document.getElementById("billTable").value;
    const promo = document.getElementById("promoCode").value.trim().toUpperCase();

    try {
      const result = await api("/api/hoa-don/thanh-toan", {
        method: "POST",
        body: JSON.stringify({ tableId, promoCode: promo, userId: currentUser?.id })
      });

      const { invoiceCode, subtotal, discount, total, createdAt } = result.invoice;
      const tableName = appState.tables.find((t) => String(t.id) === String(tableId))?.name || tableId;

      invoiceBox.innerHTML = `
        <div class="invoice-paper">
          <div class="invoice-title">Hóa đơn thanh toán</div>
          <div class="invoice-meta">
            <span><strong>Mã hóa đơn:</strong> ${invoiceCode || "N/A"}</span>
            <span><strong>Bàn:</strong> ${tableName}</span>
            <span><strong>Thời gian tạo:</strong> ${createdAt || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span>Tạm tính</span>
            <strong>${money(Number(subtotal || 0))}</strong>
          </div>
          <div class="invoice-row">
            <span>Giảm giá</span>
            <strong>- ${money(Number(discount || 0))}</strong>
          </div>
          <div class="invoice-row invoice-total">
            <span>Thành tiền</span>
            <strong>${money(Number(total || 0))}</strong>
          </div>
        </div>
      `;

      await renderAll();

      setTimeout(() => {
        window.print();
      }, 150);
    } catch (error) {
      invoiceBox.innerHTML = `<p>${error.message}</p>`;
    }
  });
}

function renderRevenue() {
  document.getElementById("revenueInfo").textContent = `Doanh thu hôm nay: ${money(Number(appState.revenue || 0))}`;
}

function renderRoleBadge() {
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || "null");
  if (!user) return;
  currentUser = user;
  document.getElementById("welcomeText").textContent = `Xin chào ${user.username} | Vai trò: ${roleMap[user.role]}`;
  applyRolePermission(user.role);
}

async function showAppLayer(user) {
  currentUser = user;
  document.getElementById("authLayer").classList.add("hidden");
  document.getElementById("appLayer").classList.remove("hidden");
  document.getElementById("welcomeText").textContent = `Xin chào ${user.username} | Vai trò: ${roleMap[user.role]}`;
  applyRolePermission(user.role);
  await renderAll();
}

async function renderAll() {
  await refreshState();
  renderTables();
  renderMenuSelect();
  renderIngredientSelect();
  renderKitchen();
  renderOrderPreview();
  renderRevenue();

  const tableId = document.getElementById("orderTable").value || "";
  const currentOrder = document.getElementById("currentOrder");
  const orders = tableId ? appState.orders.filter((o) => o.tableId === tableId) : [];
  currentOrder.innerHTML = orders.length
    ? orders.map((o) => `<div class='list-item'>${o.menuName} x ${o.qty} - ${o.status}</div>`).join("")
    : "<p>Chưa có món nào cho bàn này.</p>";

  await renderAllRecipeList();
}

function bindLogout() {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
      if (currentUser?.id) {
        await api("/api/xac-thuc/dang-xuat", {
          method: "POST",
          body: JSON.stringify({ userId: currentUser.id })
        });
      }
    } catch (error) {
      // If logout audit fails, still allow UI logout.
    } finally {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      currentUser = null;
      document.getElementById("appLayer").classList.add("hidden");
      document.getElementById("authLayer").classList.remove("hidden");
    }
  });
}

async function boot() {
  // Điểm khởi động frontend: gắn sự kiện và nạp dữ liệu ban đầu.
  bindAuthTabs();
  bindAuthForms();
  bindOrderAction();
  bindBilling();
  bindIngredientFlow();
  bindLogout();

  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || "null");
  if (user) {
    await showAppLayer(user);
  } else {
    await refreshState();
    renderTables();
    renderMenuSelect();
    renderKitchen();
    renderRevenue();
  }
  renderRoleBadge();
}

boot();
