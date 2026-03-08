/* Frontend for Mule POST /api/createAccount
 * Query params: customerName, bank, type, branchName
 * Body: accountNum, atmPin, depositAmount, ifscCode, contact, mailId
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // Local storage keys
  const K = {
    BASE: "bank_create_base_url",
    AUTH_TYPE: "bank_create_auth_type",
    BASIC_USER: "bank_create_basic_user",
    BASIC_PASS: "bank_create_basic_pass",
    BEARER: "bank_create_bearer",
    APIKEY_HEADER: "bank_create_apikey_header",
    APIKEY_VALUE: "bank_create_apikey_value",
  };

  // Elements
  const baseUrlInput = $("baseUrl");
  const authTypeSel = $("authType");
  const basicUser = $("basicUser");
  const basicPass = $("basicPass");
  const bearerToken = $("bearerToken");
  const apiKeyHeader = $("apiKeyHeader");
  const apiKeyValue = $("apiKeyValue");

  const customerNameEl = $("customerName");
  const bankEl = $("bank");
  const typeEl = $("type");
  const branchNameEl = $("branchName");

  const accountNumEl = $("accountNum");
  const atmPinEl = $("atmPin");
  const depositAmountEl = $("depositAmount");
  const ifscCodeEl = $("ifscCode");
  const contactEl = $("contact");
  const mailIdEl = $("mailId");

  const statusEl = $("status");
  const rawEl = $("raw");

  // Buttons
  $("saveBaseUrl").addEventListener("click", saveBaseUrl);
  $("submitBtn").addEventListener("click", onSubmit);
  $("resetBtn").addEventListener("click", reset);
  $("copyCurlBtn").addEventListener("click", copyCurl);

  // Show/hide auth controls by selection
  authTypeSel.addEventListener("change", updateAuthVisibility);

  // Initialize persisted state
  (function init() {
    baseUrlInput.value = localStorage.getItem(K.BASE) || "http://localhost:8081";

    const at = localStorage.getItem(K.AUTH_TYPE) || "none";
    authTypeSel.value = at;
    basicUser.value = localStorage.getItem(K.BASIC_USER) || "";
    basicPass.value = localStorage.getItem(K.BASIC_PASS) || "";
    bearerToken.value = localStorage.getItem(K.BEARER) || "";
    apiKeyHeader.value = localStorage.getItem(K.APIKEY_HEADER) || "x-api-key";
    apiKeyValue.value = localStorage.getItem(K.APIKEY_VALUE) || "";

    updateAuthVisibility();
  })();

  function saveBaseUrl() {
    localStorage.setItem(K.BASE, baseUrlInput.value.trim());
    toast("Saved API base URL.", true);
  }

  function updateAuthVisibility() {
    const type = authTypeSel.value;
    localStorage.setItem(K.AUTH_TYPE, type);

    for (const cls of ["auth-basic", "auth-bearer", "auth-apikey"]) {
      document.querySelectorAll("." + cls).forEach((el) => (el.style.display = "none"));
    }
    if (type === "basic") {
      document.querySelectorAll(".auth-basic").forEach((el) => (el.style.display = "flex"));
    } else if (type === "bearer") {
      document.querySelectorAll(".auth-bearer").forEach((el) => (el.style.display = "flex"));
    } else if (type === "apikey") {
      document.querySelectorAll(".auth-apikey").forEach((el) => (el.style.display = "flex"));
    }
  }

  function toast(msg, ok = false) {
    statusEl.classList.remove("ok", "err");
    statusEl.classList.add(ok ? "ok" : "err");
    statusEl.textContent = msg;
  }

  function reset() {
    customerNameEl.value = "";
    bankEl.value = "";
    typeEl.value = "";
    branchNameEl.value = "";

    accountNumEl.value = "";
    atmPinEl.value = "";
    depositAmountEl.value = "";
    ifscCodeEl.value = "";
    contactEl.value = "";
    mailIdEl.value = "";

    statusEl.classList.remove("ok", "err");
    statusEl.textContent = "";
    rawEl.textContent = "";
  }

  function buildUrl() {
    const base = (baseUrlInput.value || "").replace(/\/+$/, "");
    const qp = new URLSearchParams({
      customerName: customerNameEl.value.trim(),
      bank: bankEl.value,
      type: typeEl.value,
      branchName: branchNameEl.value.trim(),
    });
    // APIkit main listener mounts under /api/*
    return `${base}/api/createAccount?${qp.toString()}`;
  }

  function buildBody() {
    const body = {
      accountNum: accountNumEl.value.trim(),
      atmPin: atmPinEl.value.trim(),
      depositAmount: Number(depositAmountEl.value || 0),
      ifscCode: ifscCodeEl.value.trim(),
      contact: contactEl.value.trim(),
      mailId: mailIdEl.value.trim(),
    };
    return body;
  }

  function buildHeaders() {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    const type = authTypeSel.value;
    if (type === "basic") {
      const u = basicUser.value || "";
      const p = basicPass.value || "";
      localStorage.setItem(K.BASIC_USER, u);
      localStorage.setItem(K.BASIC_PASS, p);
      headers["Authorization"] = "Basic " + btoa(`${u}:${p}`);
    } else if (type === "bearer") {
      const t = bearerToken.value || "";
      localStorage.setItem(K.BEARER, t);
      if (t) headers["Authorization"] = `Bearer ${t}`;
    } else if (type === "apikey") {
      const h = apiKeyHeader.value.trim() || "x-api-key";
      const v = apiKeyValue.value || "";
      localStorage.setItem(K.APIKEY_HEADER, h);
      localStorage.setItem(K.APIKEY_VALUE, v);
      headers[h] = v;
    }
    return headers;
  }

  function validate() {
    const errs = [];

    // Query params constraints from RAML
    const name = customerNameEl.value.trim();
    if (name.length < 4 || name.length > 45) errs.push("Customer Name must be 4–45 characters.");
    if (!bankEl.value) errs.push("Bank is required.");
    if (!typeEl.value) errs.push("Account Type is required.");
    const branch = branchNameEl.value.trim();
    if (branch.length < 4 || branch.length > 10) errs.push("Branch Name must be 4–10 characters.");

    // Body essentials
    if (!accountNumEl.value.trim()) errs.push("Account Number is required.");
    const pin = atmPinEl.value.trim();
    if (!/^\d{4,6}$/.test(pin)) errs.push("ATM PIN must be 4–6 digits.");
    if (!ifscCodeEl.value.trim()) errs.push("IFSC Code is required.");

    const contact = contactEl.value.trim();
    if (!/^\d{7,15}$/.test(contact)) errs.push("Contact must be 7–15 digits.");
    const email = mailIdEl.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.push("Email is invalid.");

    return errs;
  }

  async function onSubmit() {
    const errors = validate();
    if (errors.length) {
      toast("Please fix:\n• " + errors.join("\n• "), false);
      return;
    }

    const url = buildUrl();
    const body = buildBody();
    const headers = buildHeaders();

    statusEl.classList.remove("ok", "err");
    statusEl.textContent = "⏳ Creating account...";
    rawEl.textContent = "";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

      // RAML says 201 on success; still treat any 2xx as ok
      const ok = res.status >= 200 && res.status < 300;
      const message = data && typeof data === "object"
        ? (data.Message || data.message || JSON.stringify(data))
        : (data || text || `HTTP ${res.status}`);

      statusEl.classList.remove("ok", "err");
      statusEl.classList.add(ok ? "ok" : "err");
      statusEl.textContent = `${ok ? "✅" : "❌"} ${message} (HTTP ${res.status})`;
      rawEl.textContent = pretty(text);
    } catch (err) {
      statusEl.classList.remove("ok");
      statusEl.classList.add("err");
      statusEl.textContent = `Network error: ${err.message}`;
    }
  }

  function pretty(txt) {
    if (!txt) return "";
    try { return JSON.stringify(JSON.parse(txt), null, 2); }
    catch { return txt; }
  }

  function copyCurl() {
    const url = buildUrl();
    const body = JSON.stringify(buildBody());
    const headers = buildHeaders();

    const headerLines = Object.entries(headers)
      .map(([k, v]) => `-H ${shellQuote(`${k}: ${v}`)}`)
      .join(" \\\n  ");

    const cmd =
`curl -sS -X POST ${shellQuote(url)} \\
  ${headerLines} \\
  --data-raw ${shellQuote(body)}`;

    navigator.clipboard?.writeText(cmd)
      .then(() => toast("cURL command copied to clipboard.", true))
      .catch(() => toast("Unable to copy cURL.", false));
  }

  // Simple shell quoting for curl
  function shellQuote(s) {
    // Wrap in single quotes, escape existing single quotes
    return `'${String(s).replace(/'/g, `'\\''`)}'`;
  }
})();
