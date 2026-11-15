/* ==========================================================================
   CalcMaster Core Calculation & Validation Engine
   Shared helpers for numeric parsing, safe expression evaluation,
   currency formatting, date parsing, error alerts, and clipboard actions.
   ========================================================================== */
(function (global) {
  "use strict";

  var CURRENCY_MAP = {
    USD: { locale: "en-US", currency: "USD", symbol: "$" },
    CAD: { locale: "en-CA", currency: "CAD", symbol: "CA$" },
    GBP: { locale: "en-GB", currency: "GBP", symbol: "£" },
    AUD: { locale: "en-AU", currency: "AUD", symbol: "A$" },
    EUR: { locale: "en-IE", currency: "EUR", symbol: "€" }
  };

  function getCurrencyInfo(code) {
    return CURRENCY_MAP[code] || CURRENCY_MAP.USD;
  }

  function formatCurrency(value, code, decimals) {
    if (!Number.isFinite(value)) return "—";
    var info = getCurrencyInfo(code);
    var d = typeof decimals === "number" ? decimals : 2;
    try {
      return new Intl.NumberFormat(info.locale, {
        style: "currency",
        currency: info.currency,
        minimumFractionDigits: d,
        maximumFractionDigits: d
      }).format(value);
    } catch (e) {
      return info.symbol + value.toFixed(d);
    }
  }

  function formatNumber(value, maxDecimals) {
    if (!Number.isFinite(value)) return "—";
    var clean = Math.abs(value) < 1e-12 ? 0 : value;
    var dec = typeof maxDecimals === "number" ? maxDecimals : 6;
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: dec
    }).format(clean);
  }

  function cleanFloat(val) {
    if (!Number.isFinite(val)) return val;
    if (Math.abs(val) < 1e-12) return 0;
    return Number(val.toPrecision(12));
  }

  function readNumber(inputEl, label, opts) {
    opts = opts || {};
    if (!inputEl) {
      return { ok: false, error: label + " input is missing." };
    }
    var raw = String(inputEl.value || "").trim().replace(/,/g, "");
    inputEl.classList.remove("is-invalid");

    if (raw === "") {
      if (opts.optional && opts.defaultValue !== undefined) {
        return { ok: true, value: opts.defaultValue };
      }
      inputEl.classList.add("is-invalid");
      return { ok: false, error: "Please enter a value for " + label + "." };
    }

    var num = Number(raw);
    if (!Number.isFinite(num)) {
      inputEl.classList.add("is-invalid");
      return { ok: false, error: label + " must be a valid number." };
    }
    if (opts.min !== undefined && num < opts.min) {
      inputEl.classList.add("is-invalid");
      return { ok: false, error: label + " must be at least " + opts.min + "." };
    }
    if (opts.gt !== undefined && num <= opts.gt) {
      inputEl.classList.add("is-invalid");
      return { ok: false, error: label + " must be greater than " + opts.gt + "." };
    }
    if (opts.max !== undefined && num > opts.max) {
      inputEl.classList.add("is-invalid");
      return { ok: false, error: label + " cannot exceed " + opts.max + "." };
    }
    if (opts.integer && !Number.isInteger(num)) {
      inputEl.classList.add("is-invalid");
      return { ok: false, error: label + " must be a whole number." };
    }

    return { ok: true, value: num };
  }

  function parseISODate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return null;
    var parts = dateStr.trim().split("-");
    if (parts.length !== 3) return null;
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    var dt = new Date(Date.UTC(year, month - 1, day));
    if (
      dt.getUTCFullYear() !== year ||
      dt.getUTCMonth() !== month - 1 ||
      dt.getUTCDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day, utc: dt };
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function daysInMonth(year, month1To12) {
    var lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return lengths[month1To12 - 1];
  }

  function showError(alertEl, message) {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.classList.add("is-visible");
  }

  function clearError(alertEl, formEl) {
    if (alertEl) {
      alertEl.textContent = "";
      alertEl.classList.remove("is-visible");
    }
    if (formEl) {
      var invalids = formEl.querySelectorAll(".is-invalid");
      for (var i = 0; i < invalids.length; i++) {
        invalids[i].classList.remove("is-invalid");
      }
    }
  }

  function bindCopyButton(btn, getTextFn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      var text = typeof getTextFn === "function" ? getTextFn() : "";
      if (!text) return;
      var original = btn.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = "Copied!";
          window.setTimeout(function () {
            btn.textContent = original;
          }, 1500);
        }).catch(function () {});
      }
    });
  }

  function bindCurrencyPrefix(selectEl, prefixEls) {
    if (!selectEl) return;
    function update() {
      var info = getCurrencyInfo(selectEl.value);
      for (var i = 0; i < prefixEls.length; i++) {
        if (prefixEls[i]) prefixEls[i].textContent = info.symbol;
      }
    }
    selectEl.addEventListener("change", update);
    update();
  }

  /* ========================================================================
     Safe Recursive-Descent Mathematical Expression Evaluator (Zero eval())
     Supports +, -, *, /, ^, !, parentheses, constants (pi, e), and
     scientific functions (sin, cos, tan, asin, acos, atan, log, ln, sqrt, cbrt, abs, exp).
     ======================================================================== */
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error("Factorial requires a non-negative integer.");
    }
    if (n > 170) {
      throw new Error("Factorial result exceeds calculation limit.");
    }
    var res = 1;
    for (var i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  function tokenize(expr) {
    var tokens = [];
    var i = 0;
    var s = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi");

    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        var numStr = "";
        var dotCount = 0;
        while (i < s.length && /[0-9.]/.test(s[i])) {
          if (s[i] === ".") dotCount++;
          if (dotCount > 1) throw new Error("Invalid decimal number.");
          numStr += s[i++];
        }
        if (i < s.length && (s[i] === "e" || s[i] === "E")) {
          var next = s[i + 1];
          if (next && (/[0-9]/.test(next) || ((next === "+" || next === "-") && /[0-9]/.test(s[i + 2] || "")))) {
            numStr += s[i++];
            if (s[i] === "+" || s[i] === "-") numStr += s[i++];
            while (i < s.length && /[0-9]/.test(s[i])) numStr += s[i++];
          }
        }
        var val = Number(numStr);
        if (!Number.isFinite(val)) throw new Error("Invalid number format.");
        tokens.push({ type: "number", value: val });
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        var ident = "";
        while (i < s.length && /[a-zA-Z]/.test(s[i])) {
          ident += s[i++];
        }
        tokens.push({ type: "ident", value: ident.toLowerCase() });
        continue;
      }
      if ("+-*/^!()%".indexOf(ch) !== -1) {
        tokens.push({ type: "op", value: ch });
        i++;
        continue;
      }
      throw new Error('Unexpected character "' + ch + '" in expression.');
    }
    return tokens;
  }

  function evaluateExpression(expr, angleMode) {
    var trimmed = String(expr || "").trim();
    if (!trimmed) throw new Error("Expression is empty.");

    var tokens = tokenize(trimmed);
    var pos = 0;
    var isDeg = angleMode !== "rad";

    function peek() {
      return tokens[pos] || null;
    }

    function consume() {
      return tokens[pos++];
    }

    function parseExpr() {
      var left = parseTerm();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        var op = consume().value;
        var right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      var left = parseUnary();
      while (peek() && peek().type === "op" && (peek().value === "*" || peek().value === "/" || peek().value === "%")) {
        var op = consume().value;
        var right = parseUnary();
        if (op === "*") {
          left = left * right;
        } else if (op === "/") {
          if (right === 0) throw new Error("Cannot divide by zero.");
          left = left / right;
        } else {
          if (right === 0) throw new Error("Cannot divide by zero.");
          left = left % right;
        }
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        var op = consume().value;
        var val = parseUnary();
        return op === "-" ? -val : val;
      }
      return parsePower();
    }

    function parsePower() {
      var base = parsePostfix();
      if (peek() && peek().type === "op" && peek().value === "^") {
        consume();
        var exponent = parseUnary();
        var res = Math.pow(base, exponent);
        if (!Number.isFinite(res)) throw new Error("Exponent result is undefined or too large.");
        return res;
      }
      return base;
    }

    function parsePostfix() {
      var val = parsePrimary();
      while (peek() && peek().type === "op" && peek().value === "!") {
        consume();
        val = factorial(val);
      }
      return val;
    }

    function applyFunction(name, arg) {
      var toRad = function (d) { return (d * Math.PI) / 180; };
      var toDeg = function (r) { return (r * 180) / Math.PI; };

      switch (name) {
        case "sin":
          return cleanFloat(Math.sin(isDeg ? toRad(arg) : arg));
        case "cos":
          return cleanFloat(Math.cos(isDeg ? toRad(arg) : arg));
        case "tan": {
          var rad = isDeg ? toRad(arg) : arg;
          if (Math.abs(Math.cos(rad)) < 1e-12) {
            throw new Error("Tangent is undefined at this angle.");
          }
          return cleanFloat(Math.tan(rad));
        }
        case "asin":
          if (arg < -1 || arg > 1) throw new Error("asin input must be between -1 and 1.");
          return cleanFloat(isDeg ? toDeg(Math.asin(arg)) : Math.asin(arg));
        case "acos":
          if (arg < -1 || arg > 1) throw new Error("acos input must be between -1 and 1.");
          return cleanFloat(isDeg ? toDeg(Math.acos(arg)) : Math.acos(arg));
        case "atan":
          return cleanFloat(isDeg ? toDeg(Math.atan(arg)) : Math.atan(arg));
        case "sqrt":
          if (arg < 0) throw new Error("Cannot take square root of a negative number.");
          return Math.sqrt(arg);
        case "cbrt":
          return Math.cbrt(arg);
        case "abs":
          return Math.abs(arg);
        case "log":
          if (arg <= 0) throw new Error("Logarithm input must be greater than zero.");
          return Math.log10(arg);
        case "ln":
          if (arg <= 0) throw new Error("Natural log input must be greater than zero.");
          return Math.log(arg);
        case "exp":
          return Math.exp(arg);
        default:
          throw new Error('Unknown function "' + name + '".');
      }
    }

    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error("Incomplete expression.");

      if (tok.type === "number") {
        consume();
        return tok.value;
      }

      if (tok.type === "ident") {
        consume();
        if (tok.value === "pi") return Math.PI;
        if (tok.value === "e") return Math.E;
        if (peek() && peek().type === "op" && peek().value === "(") {
          consume();
          var arg = parseExpr();
          if (!peek() || peek().value !== ")") {
            throw new Error("Missing closing parenthesis.");
          }
          consume();
          return applyFunction(tok.value, arg);
        }
        throw new Error('Unknown constant or missing "(" after "' + tok.value + '".');
      }

      if (tok.type === "op" && tok.value === "(") {
        consume();
        var inner = parseExpr();
        if (!peek() || peek().value !== ")") {
          throw new Error("Missing closing parenthesis.");
        }
        consume();
        return inner;
      }

      throw new Error('Unexpected token "' + tok.value + '".');
    }

    var result = parseExpr();
    if (pos < tokens.length) {
      throw new Error("Unexpected syntax near \"" + tokens[pos].value + "\".");
    }
    if (!Number.isFinite(result)) {
      throw new Error("Result is undefined or out of range.");
    }
    return cleanFloat(result);
  }

  global.CalcCore = {
    getCurrencyInfo: getCurrencyInfo,
    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    cleanFloat: cleanFloat,
    readNumber: readNumber,
    parseISODate: parseISODate,
    isLeapYear: isLeapYear,
    daysInMonth: daysInMonth,
    showError: showError,
    clearError: clearError,
    bindCopyButton: bindCopyButton,
    bindCurrencyPrefix: bindCurrencyPrefix,
    evaluateExpression: evaluateExpression
  };
})(window);

/* ==========================================================================
   CalcMaster Basic & Math Calculators (All 8 Tools)
   Standard, Scientific, Percentage, Average, Fraction, Ratio,
   Square Root, Random Number Generator
   ========================================================================== */
(function () {
  "use strict";

  /* 1. Standard Calculator */
  function initStandardCalculator(root) {
    var screenEl = root.querySelector("[data-std-screen]");
    var exprEl = root.querySelector("[data-std-expr]");
    var memEl = root.querySelector("[data-std-mem]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var historyList = root.querySelector("[data-std-history]");

    var current = "0";
    var previous = null;
    var operator = null;
    var resetNext = false;
    var memory = 0;

    function updateDisplay() {
      screenEl.textContent = current;
      exprEl.textContent = previous !== null && operator ? previous + " " + operator : "";
      if (memEl) {
        memEl.textContent = memory !== 0 ? "M = " + CalcCore.formatNumber(memory, 8) : "Memory empty";
      }
    }

    function addHistory(entry) {
      if (!historyList) return;
      var li = document.createElement("li");
      li.textContent = entry;
      historyList.insertBefore(li, historyList.firstChild);
      while (historyList.children.length > 8) {
        historyList.removeChild(historyList.lastChild);
      }
    }

    function clearError() { CalcCore.clearError(alertEl); }
    function showError(msg) { CalcCore.showError(alertEl, msg); }

    function inputDigit(d) {
      clearError();
      if (resetNext) {
        current = d === "." ? "0." : d;
        resetNext = false;
        updateDisplay();
        return;
      }
      if (d === ".") {
        if (current.indexOf(".") === -1) current += ".";
      } else {
        current = current === "0" ? d : current + d;
      }
      if (current.length > 18) current = current.slice(0, 18);
      updateDisplay();
    }

    function computeBinary(a, b, op) {
      var out = b;
      if (op === "+") out = CalcCore.cleanFloat(a + b);
      else if (op === "-") out = CalcCore.cleanFloat(a - b);
      else if (op === "*") out = CalcCore.cleanFloat(a * b);
      else if (op === "/") {
        if (b === 0) throw new Error("Cannot divide by zero.");
        out = CalcCore.cleanFloat(a / b);
      }
      if (!Number.isFinite(out)) throw new Error("Result exceeds calculation range.");
      return out;
    }

    function handleOperator(nextOp) {
      clearError();
      var val = Number(current);
      if (!Number.isFinite(val)) return;

      if (previous !== null && operator && !resetNext) {
        try {
          var res = computeBinary(Number(previous), val, operator);
          addHistory(previous + " " + operator + " " + val + " = " + res);
          previous = String(res);
          current = String(res);
        } catch (err) {
          showError(err.message);
          return;
        }
      } else {
        previous = current;
      }
      operator = nextOp;
      resetNext = true;
      updateDisplay();
    }

    function handleEquals() {
      clearError();
      if (previous === null || !operator) return;
      var a = Number(previous);
      var b = Number(current);
      try {
        var res = computeBinary(a, b, operator);
        var sym = operator === "*" ? "×" : operator === "/" ? "÷" : operator;
        addHistory(a + " " + sym + " " + b + " = " + res);
        current = String(res);
        previous = null;
        operator = null;
        resetNext = true;
        updateDisplay();
      } catch (err) {
        showError(err.message);
      }
    }

    function handleAction(action) {
      clearError();
      var val = Number(current);
      switch (action) {
        case "clear": current = "0"; previous = null; operator = null; resetNext = false; break;
        case "ce": current = "0"; resetNext = false; break;
        case "back":
          if (resetNext) break;
          current = current.length > 1 ? current.slice(0, -1) : "0";
          if (current === "-") current = "0";
          break;
        case "sign": if (val !== 0) current = String(-val); break;
        case "percent":
          current = String(CalcCore.cleanFloat(previous !== null ? (Number(previous) * val) / 100 : val / 100));
          resetNext = true;
          break;
        case "sqrt":
          if (val < 0) { showError("Cannot calculate square root of a negative number."); return; }
          addHistory("√(" + val + ") = " + CalcCore.cleanFloat(Math.sqrt(val)));
          current = String(CalcCore.cleanFloat(Math.sqrt(val)));
          resetNext = true;
          break;
        case "sq": {
          var sqVal = CalcCore.cleanFloat(val * val);
          if (!Number.isFinite(sqVal)) { showError("Result exceeds calculation range."); return; }
          addHistory(val + "² = " + sqVal);
          current = String(sqVal);
          resetNext = true;
          break;
        }
        case "inv":
          if (val === 0) { showError("Cannot divide by zero."); return; }
          addHistory("1/" + val + " = " + CalcCore.cleanFloat(1 / val));
          current = String(CalcCore.cleanFloat(1 / val));
          resetNext = true;
          break;
        case "mc": memory = 0; break;
        case "mr": current = String(memory); resetNext = true; break;
        case "mplus": memory = CalcCore.cleanFloat(memory + val); resetNext = true; break;
        case "mminus": memory = CalcCore.cleanFloat(memory - val); resetNext = true; break;
        case "eq": handleEquals(); return;
      }
      updateDisplay();
    }

    root.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (e.detail > 0 && typeof btn.blur === "function") btn.blur();
      if (btn.hasAttribute("data-digit")) inputDigit(btn.getAttribute("data-digit"));
      else if (btn.hasAttribute("data-op")) handleOperator(btn.getAttribute("data-op"));
      else if (btn.hasAttribute("data-action")) handleAction(btn.getAttribute("data-action"));
    });

    document.addEventListener("keydown", function (e) {
      var active = document.activeElement;
      var tag = active ? active.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "A") return;
      if (tag === "BUTTON" && (!root.contains(active) || e.key === "Enter" || e.key === " ")) return;
      if (/^[0-9.]$/.test(e.key)) inputDigit(e.key);
      else if (["+", "-", "*", "/"].indexOf(e.key) !== -1) { e.preventDefault(); handleOperator(e.key); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); handleEquals(); }
      else if (e.key === "Backspace") handleAction("back");
      else if (e.key === "Escape") handleAction("clear");
    });

    updateDisplay();
  }

  /* 2. Scientific Calculator */
  function initScientificCalculator(root) {
    var exprInput = root.querySelector("[data-sci-input]");
    var screenEl = root.querySelector("[data-sci-screen]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var angleBtns = root.querySelectorAll("[data-angle-mode]");
    var historyList = root.querySelector("[data-sci-history]");
    var angleMode = "deg";
    var lastAns = 0;

    function addHistory(expr, result) {
      if (!historyList) return;
      var li = document.createElement("li");
      li.textContent = expr + " = " + result;
      historyList.insertBefore(li, historyList.firstChild);
      while (historyList.children.length > 8) historyList.removeChild(historyList.lastChild);
    }

    function evaluate() {
      CalcCore.clearError(alertEl);
      var expr = exprInput.value.trim();
      if (!expr) { screenEl.textContent = "0"; return; }
      var expanded = expr.replace(/\bans\b/gi, "(" + lastAns + ")");
      try {
        var result = CalcCore.evaluateExpression(expanded, angleMode);
        lastAns = result;
        screenEl.textContent = String(result);
        addHistory(expr, result);
      } catch (err) {
        CalcCore.showError(alertEl, err.message);
      }
    }

    for (var i = 0; i < angleBtns.length; i++) {
      angleBtns[i].addEventListener("click", function () {
        angleMode = this.getAttribute("data-angle-mode");
        for (var j = 0; j < angleBtns.length; j++) {
          angleBtns[j].classList.toggle("is-active", angleBtns[j] === this);
        }
      });
    }

    root.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.hasAttribute("data-insert")) {
        CalcCore.clearError(alertEl);
        var token = btn.getAttribute("data-insert");
        var start = exprInput.selectionStart || exprInput.value.length;
        var end = exprInput.selectionEnd || exprInput.value.length;
        var val = exprInput.value;
        exprInput.value = val.slice(0, start) + token + val.slice(end);
        exprInput.focus();
        var nextPos = start + token.length;
        exprInput.setSelectionRange(nextPos, nextPos);
      } else if (btn.hasAttribute("data-sci-action")) {
        var act = btn.getAttribute("data-sci-action");
        if (act === "clear") { CalcCore.clearError(alertEl); exprInput.value = ""; screenEl.textContent = "0"; }
        else if (act === "back") exprInput.value = exprInput.value.slice(0, -1);
        else if (act === "eval") evaluate();
      }
    });

    exprInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); evaluate(); }
    });
  }

  /* 3. Percentage Calculator */
  function initPercentageCalculator(root) {
    var modeTabs = root.querySelectorAll("[data-pct-mode]");
    var panels = root.querySelectorAll("[data-pct-panel]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var resValEl = root.querySelector("[data-res-value]");
    var resSubEl = root.querySelector("[data-res-sub]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var copyBtn = root.querySelector("[data-copy-result]");
    var activeMode = "of";

    function switchMode(mode) {
      activeMode = mode;
      CalcCore.clearError(alertEl, root);
      for (var i = 0; i < modeTabs.length; i++) {
        var isSelected = modeTabs[i].getAttribute("data-pct-mode") === mode;
        modeTabs[i].classList.toggle("is-active", isSelected);
        modeTabs[i].setAttribute("aria-selected", String(isSelected));
      }
      for (var j = 0; j < panels.length; j++) {
        panels[j].hidden = panels[j].getAttribute("data-pct-panel") !== mode;
      }
      calculate();
    }

    function calculate() {
      CalcCore.clearError(alertEl, root);
      if (activeMode === "of") {
        var pRes = CalcCore.readNumber(root.querySelector("#pct-x"), "Percentage");
        var yRes = CalcCore.readNumber(root.querySelector("#pct-y"), "Base number");
        if (!pRes.ok) return CalcCore.showError(alertEl, pRes.error);
        if (!yRes.ok) return CalcCore.showError(alertEl, yRes.error);
        var ans = CalcCore.cleanFloat((pRes.value / 100) * yRes.value);
        resValEl.textContent = CalcCore.formatNumber(ans, 6);
        resSubEl.textContent = pRes.value + "% of " + CalcCore.formatNumber(yRes.value, 6) + " is " + CalcCore.formatNumber(ans, 6) + ".";
        formulaEl.textContent = "(" + pRes.value + " / 100) × " + yRes.value + " = " + ans;
      } else if (activeMode === "what") {
        var partRes = CalcCore.readNumber(root.querySelector("#what-x"), "Part value");
        var wholeRes = CalcCore.readNumber(root.querySelector("#what-y"), "Whole value");
        if (!partRes.ok) return CalcCore.showError(alertEl, partRes.error);
        if (!wholeRes.ok) return CalcCore.showError(alertEl, wholeRes.error);
        if (wholeRes.value === 0) {
          root.querySelector("#what-y").classList.add("is-invalid");
          return CalcCore.showError(alertEl, "Whole value cannot be zero (division by zero).");
        }
        var pct = CalcCore.cleanFloat((partRes.value / wholeRes.value) * 100);
        resValEl.textContent = CalcCore.formatNumber(pct, 4) + "%";
        resSubEl.textContent = CalcCore.formatNumber(partRes.value, 6) + " is " + CalcCore.formatNumber(pct, 4) + "% of " + CalcCore.formatNumber(wholeRes.value, 6) + ".";
        formulaEl.textContent = "(" + partRes.value + " / " + wholeRes.value + ") × 100 = " + pct + "%";
      } else if (activeMode === "change") {
        var fromRes = CalcCore.readNumber(root.querySelector("#chg-from"), "Initial value");
        var toRes = CalcCore.readNumber(root.querySelector("#chg-to"), "New value");
        if (!fromRes.ok) return CalcCore.showError(alertEl, fromRes.error);
        if (!toRes.ok) return CalcCore.showError(alertEl, toRes.error);
        if (fromRes.value === 0) {
          root.querySelector("#chg-from").classList.add("is-invalid");
          return CalcCore.showError(alertEl, "Initial value cannot be zero when computing percentage change.");
        }
        var diff = CalcCore.cleanFloat(toRes.value - fromRes.value);
        var pctChange = CalcCore.cleanFloat((diff / Math.abs(fromRes.value)) * 100);
        var direction = pctChange > 0 ? "increase" : pctChange < 0 ? "decrease" : "no change";
        var sign = pctChange > 0 ? "+" : "";
        resValEl.textContent = sign + CalcCore.formatNumber(pctChange, 4) + "%";
        resSubEl.textContent = "Change of " + CalcCore.formatNumber(diff, 6) + " (" + Math.abs(pctChange).toFixed(2) + "% " + direction + ").";
        formulaEl.textContent = "((" + toRes.value + " - " + fromRes.value + ") / |" + fromRes.value + "|) × 100 = " + pctChange + "%";
      }
    }

    for (var i = 0; i < modeTabs.length; i++) {
      modeTabs[i].addEventListener("click", function () { switchMode(this.getAttribute("data-pct-mode")); });
    }
    root.querySelector("[data-calc-form]").addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#pct-x").value = "20";
      root.querySelector("#pct-y").value = "150";
      root.querySelector("#what-x").value = "45";
      root.querySelector("#what-y").value = "180";
      root.querySelector("#chg-from").value = "120";
      root.querySelector("#chg-to").value = "150";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resValEl.textContent; });
    calculate();
  }

  /* 4. Average Calculator */
  function initAverageCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var listInput = root.querySelector("#avg-numbers");

    var meanEl = root.querySelector("[data-res-mean]");
    var medianEl = root.querySelector("[data-res-median]");
    var modeEl = root.querySelector("[data-res-mode]");
    var sumEl = root.querySelector("[data-res-sum]");
    var rangeEl = root.querySelector("[data-res-range]");
    var countEl = root.querySelector("[data-res-count]");
    var stdEl = root.querySelector("[data-res-stddev]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var raw = String(listInput.value || "").trim();
      if (!raw) {
        listInput.classList.add("is-invalid");
        return CalcCore.showError(alertEl, "Please enter at least one number separated by commas, spaces, or new lines.");
      }

      var tokens = raw.split(/[\s,;]+/).filter(Boolean);
      var nums = [];
      for (var i = 0; i < tokens.length; i++) {
        var n = Number(tokens[i]);
        if (!Number.isFinite(n)) {
          listInput.classList.add("is-invalid");
          return CalcCore.showError(alertEl, 'Invalid number "' + tokens[i] + '". Enter numeric values only.');
        }
        nums.push(n);
      }

      if (nums.length === 0) {
        return CalcCore.showError(alertEl, "Please enter at least one valid number.");
      }

      var sorted = nums.slice().sort(function (a, b) { return a - b; });
      var sum = nums.reduce(function (acc, v) { return acc + v; }, 0);
      var mean = sum / nums.length;

      var mid = Math.floor(sorted.length / 2);
      var median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      var counts = {};
      var maxFreq = 0;
      for (var j = 0; j < nums.length; j++) {
        var key = String(nums[j]);
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] > maxFreq) maxFreq = counts[key];
      }
      var modes = [];
      if (maxFreq > 1) {
        Object.keys(counts).forEach(function (k) {
          if (counts[k] === maxFreq) modes.push(k);
        });
      }

      var variance = nums.reduce(function (acc, v) { return acc + Math.pow(v - mean, 2); }, 0) / nums.length;
      var popStdDev = Math.sqrt(variance);
      var range = sorted[sorted.length - 1] - sorted[0];

      meanEl.textContent = CalcCore.formatNumber(mean, 4);
      medianEl.textContent = CalcCore.formatNumber(median, 4);
      modeEl.textContent = modes.length ? modes.join(", ") + " (" + maxFreq + "x)" : "No repeat";
      sumEl.textContent = CalcCore.formatNumber(sum, 4);
      rangeEl.textContent = CalcCore.formatNumber(range, 4) + " (" + sorted[0] + " to " + sorted[sorted.length - 1] + ")";
      countEl.textContent = String(nums.length);
      stdEl.textContent = CalcCore.formatNumber(popStdDev, 4);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      listInput.value = "12, 18, 22, 22, 30, 36";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () {
      return "Mean: " + meanEl.textContent + " | Median: " + medianEl.textContent;
    });
    calculate();
  }

  /* 5. Fraction Calculator */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function initFractionCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var resFracEl = root.querySelector("[data-res-frac]");
    var resMixedEl = root.querySelector("[data-res-mixed]");
    var resDecEl = root.querySelector("[data-res-dec]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var w1 = CalcCore.readNumber(root.querySelector("#frac-w1"), "First whole number", { integer: true, optional: true, defaultValue: 0 });
      var n1 = CalcCore.readNumber(root.querySelector("#frac-n1"), "First numerator", { integer: true });
      var d1 = CalcCore.readNumber(root.querySelector("#frac-d1"), "First denominator", { integer: true });
      var w2 = CalcCore.readNumber(root.querySelector("#frac-w2"), "Second whole number", { integer: true, optional: true, defaultValue: 0 });
      var n2 = CalcCore.readNumber(root.querySelector("#frac-n2"), "Second numerator", { integer: true });
      var d2 = CalcCore.readNumber(root.querySelector("#frac-d2"), "Second denominator", { integer: true });
      var op = root.querySelector("#frac-op").value;

      var checks = [w1, n1, d1, w2, n2, d2];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }
      if (d1.value === 0 || d2.value === 0) {
        return CalcCore.showError(alertEl, "Denominators cannot be zero.");
      }

      var sign1 = w1.value < 0 ? -1 : 1;
      var num1 = sign1 * (Math.abs(w1.value) * Math.abs(d1.value) + (d1.value < 0 ? -n1.value : n1.value));
      var den1 = Math.abs(d1.value);

      var sign2 = w2.value < 0 ? -1 : 1;
      var num2 = sign2 * (Math.abs(w2.value) * Math.abs(d2.value) + (d2.value < 0 ? -n2.value : n2.value));
      var den2 = Math.abs(d2.value);

      var outNum = 0;
      var outDen = 1;
      var opSym = op;

      if (op === "+") {
        outNum = num1 * den2 + num2 * den1;
        outDen = den1 * den2;
      } else if (op === "-") {
        outNum = num1 * den2 - num2 * den1;
        outDen = den1 * den2;
      } else if (op === "*") {
        outNum = num1 * num2;
        outDen = den1 * den2;
        opSym = "×";
      } else if (op === "/") {
        if (num2 === 0) {
          return CalcCore.showError(alertEl, "Cannot divide by a zero fraction.");
        }
        outNum = num1 * den2;
        outDen = den1 * num2;
        opSym = "÷";
      }

      if (outDen < 0) {
        outNum = -outNum;
        outDen = -outDen;
      }
      var divisor = gcd(outNum, outDen);
      var simpNum = outNum / divisor;
      var simpDen = outDen / divisor;

      resFracEl.textContent = simpDen === 1 ? String(simpNum) : simpNum + " / " + simpDen;
      resDecEl.textContent = CalcCore.formatNumber(simpNum / simpDen, 6);

      if (Math.abs(simpNum) >= simpDen && simpDen !== 1) {
        var whole = simpNum < 0 ? Math.ceil(simpNum / simpDen) : Math.floor(simpNum / simpDen);
        var rem = Math.abs(simpNum % simpDen);
        resMixedEl.textContent = rem === 0 ? String(whole) : whole + " " + rem + "/" + simpDen;
      } else {
        resMixedEl.textContent = resFracEl.textContent;
      }

      formulaEl.textContent = "(" + num1 + "/" + den1 + ") " + opSym + " (" + num2 + "/" + den2 + ") = " + resFracEl.textContent;
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#frac-w1").value = "0";
      root.querySelector("#frac-n1").value = "3";
      root.querySelector("#frac-d1").value = "4";
      root.querySelector("#frac-op").value = "+";
      root.querySelector("#frac-w2").value = "0";
      root.querySelector("#frac-n2").value = "2";
      root.querySelector("#frac-d2").value = "5";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resFracEl.textContent + " (" + resDecEl.textContent + ")"; });
    calculate();
  }

  /* 6. Ratio Calculator */
  function initRatioCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var resEl = root.querySelector("[data-res-ratio]");
    var simpEl = root.querySelector("[data-res-simplified]");
    var factorEl = root.querySelector("[data-res-factor]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var a = CalcCore.readNumber(root.querySelector("#rat-a"), "Value A", { gt: 0 });
      var b = CalcCore.readNumber(root.querySelector("#rat-b"), "Value B", { gt: 0 });
      var cEl = root.querySelector("#rat-c");
      var dEl = root.querySelector("#rat-d");

      if (!a.ok) return CalcCore.showError(alertEl, a.error);
      if (!b.ok) return CalcCore.showError(alertEl, b.error);

      var cRaw = String(cEl.value || "").trim();
      var dRaw = String(dEl.value || "").trim();

      var cVal, dVal, solvedLabel;
      if (cRaw !== "" && dRaw === "") {
        var cRes = CalcCore.readNumber(cEl, "Value C", { gt: 0 });
        if (!cRes.ok) return CalcCore.showError(alertEl, cRes.error);
        cVal = cRes.value;
        dVal = CalcCore.cleanFloat((b.value * cVal) / a.value);
        solvedLabel = "D = " + CalcCore.formatNumber(dVal, 6);
      } else if (dRaw !== "" && cRaw === "") {
        var dRes = CalcCore.readNumber(dEl, "Value D", { gt: 0 });
        if (!dRes.ok) return CalcCore.showError(alertEl, dRes.error);
        dVal = dRes.value;
        cVal = CalcCore.cleanFloat((a.value * dVal) / b.value);
        solvedLabel = "C = " + CalcCore.formatNumber(cVal, 6);
      } else if (cRaw !== "" && dRaw !== "") {
        var cBoth = CalcCore.readNumber(cEl, "Value C", { gt: 0 });
        if (!cBoth.ok) return CalcCore.showError(alertEl, cBoth.error);
        cVal = cBoth.value;
        dVal = CalcCore.cleanFloat((b.value * cVal) / a.value);
        solvedLabel = "D = " + CalcCore.formatNumber(dVal, 6);
      } else {
        return CalcCore.showError(alertEl, "Enter Value C or Value D (leave the unknown side blank) to solve the proportion.");
      }

      // Simplify integer ratio A:B
      var scaleInt = 1;
      var aTest = a.value;
      var bTest = b.value;
      while ((Math.abs(aTest - Math.round(aTest)) > 1e-6 || Math.abs(bTest - Math.round(bTest)) > 1e-6) && scaleInt < 10000) {
        scaleInt *= 10;
        aTest = a.value * scaleInt;
        bTest = b.value * scaleInt;
      }
      var g = gcd(Math.round(aTest), Math.round(bTest));
      var simpA = Math.round(aTest) / g;
      var simpB = Math.round(bTest) / g;

      resEl.textContent = solvedLabel;
      simpEl.textContent = simpA + " : " + simpB;
      factorEl.textContent = CalcCore.formatNumber(cVal / a.value, 4) + "x";
      formulaEl.textContent = a.value + " : " + b.value + " = " + CalcCore.formatNumber(cVal, 4) + " : " + CalcCore.formatNumber(dVal, 4);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#rat-a").value = "16";
      root.querySelector("#rat-b").value = "9";
      root.querySelector("#rat-c").value = "1920";
      root.querySelector("#rat-d").value = "";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resEl.textContent + " (" + formulaEl.textContent + ")"; });
    calculate();
  }

  /* 7. Square Root & N-th Root Calculator */
  function initSquareRootCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var numInput = root.querySelector("#sqrt-number");
    var modeSelect = root.querySelector("#sqrt-mode");
    var customGroup = root.querySelector("[data-sqrt-custom-group]");
    var degreeInput = root.querySelector("#sqrt-degree");
    var precSelect = root.querySelector("#sqrt-precision");

    var resRootEl = root.querySelector("[data-res-root]");
    var resSubEl = root.querySelector("[data-res-sub]");
    var resTypeEl = root.querySelector("[data-res-type]");
    var resAltEl = root.querySelector("[data-res-alt]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function syncModeUI() {
      var mode = modeSelect.value;
      if (mode === "2") {
        degreeInput.value = "2";
        if (customGroup) customGroup.hidden = true;
      } else if (mode === "3") {
        degreeInput.value = "3";
        if (customGroup) customGroup.hidden = true;
      } else {
        if (customGroup) customGroup.hidden = false;
      }
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var xRes = CalcCore.readNumber(numInput, "Number (radicand)");
      if (!xRes.ok) return CalcCore.showError(alertEl, xRes.error);

      var mode = modeSelect.value;
      var n = mode === "2" ? 2 : mode === "3" ? 3 : null;
      if (n === null) {
        var nRes = CalcCore.readNumber(degreeInput, "Root degree (n)");
        if (!nRes.ok) return CalcCore.showError(alertEl, nRes.error);
        n = nRes.value;
      }

      if (n === 0) {
        degreeInput.classList.add("is-invalid");
        return CalcCore.showError(alertEl, "Root degree (n) cannot be zero.");
      }

      var x = xRes.value;
      var dec = Number(precSelect ? precSelect.value : 6) || 6;

      if (x < 0) {
        if (!Number.isInteger(n)) {
          numInput.classList.add("is-invalid");
          return CalcCore.showError(alertEl, "Cannot compute a fractional root of a negative number in real numbers.");
        }
        if (n % 2 === 0) {
          numInput.classList.add("is-invalid");
          return CalcCore.showError(alertEl, "Real " + (n === 2 ? "square root" : "even root") + " is undefined for negative numbers.");
        }
      }

      var result;
      if (x === 0) {
        if (n < 0) {
          numInput.classList.add("is-invalid");
          return CalcCore.showError(alertEl, "Cannot compute a negative root of zero (division by zero).");
        }
        result = 0;
      } else if (x < 0) {
        result = -Math.pow(Math.abs(x), 1 / n);
      } else {
        result = n === 2 ? Math.sqrt(x) : n === 3 ? Math.cbrt(x) : Math.pow(x, 1 / n);
      }

      result = CalcCore.cleanFloat(result);
      if (!Number.isFinite(result)) {
        return CalcCore.showError(alertEl, "Result is out of representable numerical range.");
      }

      var formattedRoot = CalcCore.formatNumber(result, dec);
      var nearestInt = Math.round(result);
      var isExact = Math.abs(result - nearestInt) < 1e-11 && Number.isInteger(n) && n > 0 && Math.pow(nearestInt, n) === x;

      var rootLabel = n === 2 ? "Square root" : n === 3 ? "Cube root" : n + "-th root";
      resRootEl.textContent = formattedRoot;
      resSubEl.textContent = rootLabel + " of " + CalcCore.formatNumber(x, 6) + " (rounded up to " + dec + " decimals).";

      if (resTypeEl) {
        resTypeEl.textContent = isExact
          ? (n === 2 ? "Perfect square" : n === 3 ? "Perfect cube" : "Exact integer root")
          : "Decimal / irrational root";
      }

      if (resAltEl) {
        if (Number.isInteger(n) && n % 2 === 0 && x > 0) {
          resAltEl.textContent = "±" + formattedRoot;
        } else {
          resAltEl.textContent = formattedRoot + " (unique real root)";
        }
      }

      var symbolPrefix = n === 2 ? "√" : n === 3 ? "∛" : n + "√";
      formulaEl.textContent = symbolPrefix + "(" + x + ") = (" + x + ")^(1/" + n + ") = " + formattedRoot;
    }

    modeSelect.addEventListener("change", function () {
      syncModeUI();
      calculate();
    });
    precSelect.addEventListener("change", calculate);
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      numInput.value = "144";
      modeSelect.value = "2";
      degreeInput.value = "2";
      precSelect.value = "6";
      syncModeUI();
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resRootEl.textContent; });
    syncModeUI();
    calculate();
  }

  /* 8. Random Number Generator */
  function initRandomNumberGenerator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var minInput = root.querySelector("#rng-min");
    var maxInput = root.querySelector("#rng-max");
    var countInput = root.querySelector("#rng-count");
    var typeSelect = root.querySelector("#rng-type");
    var decGroup = root.querySelector("[data-rng-dec-group]");
    var decSelect = root.querySelector("#rng-decimals");
    var uniqueCheck = root.querySelector("#rng-unique");
    var sortSelect = root.querySelector("#rng-sort");

    var mainEl = root.querySelector("[data-res-rng-main]");
    var subEl = root.querySelector("[data-res-rng-sub]");
    var minOutEl = root.querySelector("[data-res-rng-min]");
    var maxOutEl = root.querySelector("[data-res-rng-max]");
    var avgOutEl = root.querySelector("[data-res-rng-avg]");
    var sumOutEl = root.querySelector("[data-res-rng-sum]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function secureRandomUnit() {
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        var arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] / 4294967296;
      }
      return Math.random();
    }

    function randomIntInclusive(min, max) {
      var span = max - min + 1;
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues && span <= 4294967296) {
        var limit = Math.floor(4294967296 / span) * span;
        var buf = new Uint32Array(1);
        do {
          window.crypto.getRandomValues(buf);
        } while (buf[0] >= limit);
        return min + (buf[0] % span);
      }
      return min + Math.floor(Math.random() * span);
    }

    function syncTypeUI() {
      var isDecimal = typeSelect.value === "decimal";
      if (decGroup) decGroup.hidden = !isDecimal;
    }

    function generate() {
      CalcCore.clearError(alertEl, form);
      var mode = typeSelect.value;
      var isInt = mode === "integer";

      var minRes = CalcCore.readNumber(minInput, "Minimum value", { integer: isInt, min: -1000000000, max: 1000000000 });
      var maxRes = CalcCore.readNumber(maxInput, "Maximum value", { integer: isInt, min: -1000000000, max: 1000000000 });
      var countRes = CalcCore.readNumber(countInput, "Quantity", { integer: true, min: 1, max: 100 });

      if (!minRes.ok) return CalcCore.showError(alertEl, minRes.error);
      if (!maxRes.ok) return CalcCore.showError(alertEl, maxRes.error);
      if (!countRes.ok) return CalcCore.showError(alertEl, countRes.error);

      var minVal = minRes.value;
      var maxVal = maxRes.value;
      var count = countRes.value;

      if (minVal > maxVal) {
        minInput.classList.add("is-invalid");
        return CalcCore.showError(alertEl, "Minimum value cannot be greater than maximum value.");
      }

      var unique = Boolean(uniqueCheck && uniqueCheck.checked);
      var decimals = isInt ? 0 : Number(decSelect ? decSelect.value : 2) || 2;
      var values = [];

      if (isInt) {
        var span = maxVal - minVal + 1;
        if (unique && span < count) {
          countInput.classList.add("is-invalid");
          return CalcCore.showError(
            alertEl,
            "Cannot generate " + count + " unique integers between " + minVal + " and " + maxVal + " (only " + span + " available)."
          );
        }
        if (unique) {
          if (span <= 10000) {
            var pool = [];
            for (var p = minVal; p <= maxVal; p++) pool.push(p);
            for (var i = 0; i < count; i++) {
              var idx = i + randomIntInclusive(0, pool.length - 1 - i);
              var tmp = pool[i];
              pool[i] = pool[idx];
              pool[idx] = tmp;
              values.push(pool[i]);
            }
          } else {
            var seenInts = {};
            while (values.length < count) {
              var candidate = randomIntInclusive(minVal, maxVal);
              var key = String(candidate);
              if (!seenInts[key]) {
                seenInts[key] = true;
                values.push(candidate);
              }
            }
          }
        } else {
          for (var j = 0; j < count; j++) {
            values.push(randomIntInclusive(minVal, maxVal));
          }
        }
      } else {
        if (unique && minVal === maxVal && count > 1) {
          return CalcCore.showError(alertEl, "Cannot generate multiple unique values when Minimum equals Maximum.");
        }
        var factor = Math.pow(10, decimals);
        var possibleDecimals = Math.floor((maxVal - minVal) * factor) + 1;
        if (unique && possibleDecimals < count) {
          return CalcCore.showError(
            alertEl,
            "Not enough distinct decimal values at " + decimals + " decimal places to produce " + count + " unique results."
          );
        }

        var seenDec = {};
        var attempts = 0;
        var maxAttempts = count * 300;
        while (values.length < count && attempts < maxAttempts) {
          attempts++;
          var raw = minVal + secureRandomUnit() * (maxVal - minVal);
          var rounded = Number(raw.toFixed(decimals));
          if (rounded > maxVal) rounded = maxVal;
          if (rounded < minVal) rounded = minVal;
          var dKey = rounded.toFixed(decimals);
          if (!unique || !seenDec[dKey]) {
            seenDec[dKey] = true;
            values.push(rounded);
          }
        }
      }

      var sortMode = sortSelect ? sortSelect.value : "none";
      if (sortMode === "asc") values.sort(function (a, b) { return a - b; });
      else if (sortMode === "desc") values.sort(function (a, b) { return b - a; });

      var formattedList = values.map(function (v) {
        return isInt ? CalcCore.formatNumber(v, 0) : v.toFixed(decimals);
      });

      var sum = values.reduce(function (acc, v) { return acc + v; }, 0);
      var avg = sum / values.length;
      var low = Math.min.apply(null, values);
      var high = Math.max.apply(null, values);

      mainEl.textContent = formattedList.join(", ");
      if (subEl) {
        subEl.textContent =
          "Generated " +
          count +
          (unique ? " unique" : "") +
          " random " +
          (isInt ? (count === 1 ? "integer" : "integers") : (count === 1 ? "decimal" : "decimals")) +
          " between " +
          minVal +
          " and " +
          maxVal +
          ".";
      }
      if (minOutEl) minOutEl.textContent = isInt ? CalcCore.formatNumber(low, 0) : low.toFixed(decimals);
      if (maxOutEl) maxOutEl.textContent = isInt ? CalcCore.formatNumber(high, 0) : high.toFixed(decimals);
      if (avgOutEl) avgOutEl.textContent = CalcCore.formatNumber(avg, isInt ? 2 : decimals);
      if (sumOutEl) sumOutEl.textContent = isInt ? CalcCore.formatNumber(sum, 0) : CalcCore.formatNumber(sum, decimals);
    }

    typeSelect.addEventListener("change", function () {
      syncTypeUI();
      generate();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); generate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      minInput.value = "1";
      maxInput.value = "100";
      countInput.value = "5";
      typeSelect.value = "integer";
      decSelect.value = "2";
      uniqueCheck.checked = false;
      sortSelect.value = "none";
      syncTypeUI();
      generate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return mainEl.textContent; });
    syncTypeUI();
    generate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var std = document.getElementById("calc-standard");
    if (std) initStandardCalculator(std);

    var sci = document.getElementById("calc-scientific");
    if (sci) initScientificCalculator(sci);

    var pct = document.getElementById("calc-percentage");
    if (pct) initPercentageCalculator(pct);

    var avg = document.getElementById("calc-average");
    if (avg) initAverageCalculator(avg);

    var frac = document.getElementById("calc-fraction");
    if (frac) initFractionCalculator(frac);

    var rat = document.getElementById("calc-ratio");
    if (rat) initRatioCalculator(rat);

    var sqrtCalc = document.getElementById("calc-square-root");
    if (sqrtCalc) initSquareRootCalculator(sqrtCalc);

    var rngCalc = document.getElementById("calc-random-number");
    if (rngCalc) initRandomNumberGenerator(rngCalc);
  });
})();

/* ==========================================================================
   CalcMaster Financial Calculators (All 12 Tools)
   Loan, Mortgage, Simple Interest, Compound Interest, Savings, Investment,
   Salary, Hourly Pay, Profit Margin, Discount, Sales Tax, VAT
   ========================================================================== */
(function () {
  "use strict";

  /* 1. Loan Calculator */
  function initLoanCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#loan-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var monthlyEl = root.querySelector("[data-res-monthly]");
    var totalEl = root.querySelector("[data-res-total]");
    var interestEl = root.querySelector("[data-res-interest]");
    var principalEl = root.querySelector("[data-res-principal]");
    var scheduleBody = root.querySelector("[data-amort-body]") || document.querySelector("[data-amort-body]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var amt = CalcCore.readNumber(root.querySelector("#loan-amount"), "Loan amount", { gt: 0, max: 1000000000 });
      var rate = CalcCore.readNumber(root.querySelector("#loan-rate"), "Annual interest rate", { min: 0, max: 100 });
      var term = CalcCore.readNumber(root.querySelector("#loan-term"), "Loan term", { gt: 0, max: 600 });
      var unit = root.querySelector("#loan-term-unit").value;

      if (!amt.ok) return CalcCore.showError(alertEl, amt.error);
      if (!rate.ok) return CalcCore.showError(alertEl, rate.error);
      if (!term.ok) return CalcCore.showError(alertEl, term.error);

      var months = unit === "years" ? Math.round(term.value * 12) : Math.round(term.value);
      if (months < 1) return CalcCore.showError(alertEl, "Loan term must be at least 1 month.");

      var cur = currencyEl.value;
      var P = amt.value;
      var rMonthly = rate.value / 100 / 12;
      var monthlyPayment = rMonthly === 0 ? P / months : (P * rMonthly * Math.pow(1 + rMonthly, months)) / (Math.pow(1 + rMonthly, months) - 1);

      var totalPayment = monthlyPayment * months;
      var totalInterest = totalPayment - P;

      monthlyEl.textContent = CalcCore.formatCurrency(monthlyPayment, cur);
      principalEl.textContent = CalcCore.formatCurrency(P, cur);
      interestEl.textContent = CalcCore.formatCurrency(totalInterest, cur);
      totalEl.textContent = CalcCore.formatCurrency(totalPayment, cur);

      if (scheduleBody) {
        scheduleBody.innerHTML = "";
        var balance = P;
        var limit = Math.min(months, 12);
        for (var m = 1; m <= limit; m++) {
          var intPart = balance * rMonthly;
          var prinPart = monthlyPayment - intPart;
          balance = Math.max(0, balance - prinPart);
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>Month " + m + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(monthlyPayment, cur) + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(prinPart, cur) + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(intPart, cur) + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(balance, cur) + "</td>";
          scheduleBody.appendChild(tr);
        }
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#loan-amount").value = "25000";
      root.querySelector("#loan-rate").value = "6.5";
      root.querySelector("#loan-term").value = "5";
      root.querySelector("#loan-term-unit").value = "years";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Monthly Payment: " + monthlyEl.textContent; });
    calculate();
  }

  /* 2. Mortgage Calculator */
  function initMortgageCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#mtg-currency");
    var freqEl = root.querySelector("#mtg-freq");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var periodLabelEl = root.querySelector("[data-res-period-label]");
    var escrowLabelEl = root.querySelector("[data-res-escrow-label]");
    var subEl = root.querySelector("[data-res-sub]");
    var totalMonthlyEl = root.querySelector("[data-res-monthly]");
    var piEl = root.querySelector("[data-res-pi]");
    var loanEl = root.querySelector("[data-res-loan]");
    var interestEl = root.querySelector("[data-res-interest]");
    var taxesInsEl = root.querySelector("[data-res-taxins]");
    var scheduleBody = root.querySelector("[data-amort-body]") || document.querySelector("[data-amort-body]");
    var copyBtn = root.querySelector("[data-copy-result]");

    var FREQ_META = {
      "12": { name: "Monthly", suffix: "/ mo", periods: 12 },
      "24": { name: "Semi-Monthly", suffix: "/ period", periods: 24 },
      "26": { name: "Bi-Weekly", suffix: "/ 2 wks", periods: 26 },
      "52": { name: "Weekly", suffix: "/ wk", periods: 52 }
    };

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var price = CalcCore.readNumber(root.querySelector("#mtg-price"), "Home price", { gt: 0, max: 1000000000 });
      var dpInput = CalcCore.readNumber(root.querySelector("#mtg-dp"), "Down payment", { min: 0 });
      var dpType = root.querySelector("#mtg-dp-type").value;
      var rate = CalcCore.readNumber(root.querySelector("#mtg-rate"), "Interest rate", { min: 0, max: 50 });
      var years = CalcCore.readNumber(root.querySelector("#mtg-years"), "Loan term", { gt: 0, max: 50 });
      var tax = CalcCore.readNumber(root.querySelector("#mtg-tax"), "Annual property tax", { min: 0, optional: true, defaultValue: 0 });
      var ins = CalcCore.readNumber(root.querySelector("#mtg-ins"), "Annual home insurance", { min: 0, optional: true, defaultValue: 0 });
      var hoa = CalcCore.readNumber(root.querySelector("#mtg-hoa"), "Monthly HOA fee", { min: 0, optional: true, defaultValue: 0 });

      var checks = [price, dpInput, rate, years, tax, ins, hoa];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var downPaymentAmount = dpType === "percent" ? (price.value * dpInput.value) / 100 : dpInput.value;
      if (downPaymentAmount >= price.value) return CalcCore.showError(alertEl, "Down payment must be less than the home price.");

      var freqKey = freqEl ? String(freqEl.value || "12") : "12";
      var meta = FREQ_META[freqKey] || FREQ_META["12"];
      var periodsPerYear = meta.periods;

      var P = price.value - downPaymentAmount;
      var totalPeriods = Math.round(years.value * periodsPerYear);
      var rPeriod = rate.value / 100 / periodsPerYear;
      var periodPI = rPeriod === 0
        ? P / totalPeriods
        : (P * rPeriod * Math.pow(1 + rPeriod, totalPeriods)) / (Math.pow(1 + rPeriod, totalPeriods) - 1);

      var annualEscrow = tax.value + ins.value + hoa.value * 12;
      var periodTaxInsHoa = annualEscrow / periodsPerYear;
      var totalPeriodPayment = periodPI + periodTaxInsHoa;
      var totalInterest = periodPI * totalPeriods - P;
      var cur = currencyEl.value;

      if (periodLabelEl) periodLabelEl.textContent = "Total Estimated " + meta.name + " Payment";
      if (escrowLabelEl) escrowLabelEl.textContent = "Taxes, Ins. & HOA " + meta.suffix;
      if (subEl) subEl.textContent = "Includes " + meta.name.toLowerCase() + " principal, interest, property tax, insurance, and HOA.";

      totalMonthlyEl.textContent = CalcCore.formatCurrency(totalPeriodPayment, cur);
      piEl.textContent = CalcCore.formatCurrency(periodPI, cur);
      loanEl.textContent = CalcCore.formatCurrency(P, cur);
      interestEl.textContent = CalcCore.formatCurrency(totalInterest, cur);
      taxesInsEl.textContent = CalcCore.formatCurrency(periodTaxInsHoa, cur);

      if (scheduleBody) {
        scheduleBody.innerHTML = "";
        var balance = P;
        var totalYears = Math.ceil(totalPeriods / periodsPerYear);
        for (var y = 1; y <= totalYears; y++) {
          var yearPrin = 0, yearInt = 0;
          for (var m = 1; m <= periodsPerYear; m++) {
            if ((y - 1) * periodsPerYear + m > totalPeriods) break;
            var intP = balance * rPeriod;
            var prinP = periodPI - intP;
            yearInt += intP;
            yearPrin += prinP;
            balance = Math.max(0, balance - prinP);
          }
          if (y <= 10 || y === totalYears) {
            var tr = document.createElement("tr");
            tr.innerHTML =
              "<td>Year " + y + "</td>" +
              '<td class="num">' + CalcCore.formatCurrency(yearPrin, cur) + "</td>" +
              '<td class="num">' + CalcCore.formatCurrency(yearInt, cur) + "</td>" +
              '<td class="num">' + CalcCore.formatCurrency(balance, cur) + "</td>";
            scheduleBody.appendChild(tr);
          }
        }
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    if (freqEl) freqEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#mtg-price").value = "400000";
      root.querySelector("#mtg-dp").value = "20";
      root.querySelector("#mtg-dp-type").value = "percent";
      root.querySelector("#mtg-rate").value = "6.25";
      root.querySelector("#mtg-years").value = "30";
      if (freqEl) freqEl.value = "12";
      root.querySelector("#mtg-tax").value = "4200";
      root.querySelector("#mtg-ins").value = "1500";
      root.querySelector("#mtg-hoa").value = "0";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Estimated Mortgage Payment: " + totalMonthlyEl.textContent; });
    calculate();
  }

  /* 3. Simple Interest Calculator */
  function initSimpleInterestCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#si-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var totalEl = root.querySelector("[data-res-total]");
    var intEl = root.querySelector("[data-res-interest]");
    var prinEl = root.querySelector("[data-res-principal]");
    var monthlyIntEl = root.querySelector("[data-res-monthly]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var P = CalcCore.readNumber(root.querySelector("#si-principal"), "Principal", { gt: 0 });
      var r = CalcCore.readNumber(root.querySelector("#si-rate"), "Annual interest rate", { min: 0, max: 100 });
      var t = CalcCore.readNumber(root.querySelector("#si-time"), "Time period", { gt: 0 });
      var unit = root.querySelector("#si-unit").value;

      if (!P.ok) return CalcCore.showError(alertEl, P.error);
      if (!r.ok) return CalcCore.showError(alertEl, r.error);
      if (!t.ok) return CalcCore.showError(alertEl, t.error);

      var years = unit === "months" ? t.value / 12 : unit === "days" ? t.value / 365 : t.value;
      var interest = P.value * (r.value / 100) * years;
      var total = P.value + interest;
      var cur = currencyEl.value;

      totalEl.textContent = CalcCore.formatCurrency(total, cur);
      intEl.textContent = CalcCore.formatCurrency(interest, cur);
      prinEl.textContent = CalcCore.formatCurrency(P.value, cur);
      monthlyIntEl.textContent = CalcCore.formatCurrency(interest / (years * 12), cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#si-principal").value = "5000";
      root.querySelector("#si-rate").value = "4.5";
      root.querySelector("#si-time").value = "3";
      root.querySelector("#si-unit").value = "years";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Total: " + totalEl.textContent + " (Interest: " + intEl.textContent + ")"; });
    calculate();
  }

  /* 4. Compound Interest Calculator */
  function initCompoundInterestCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#ci-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var fvEl = root.querySelector("[data-res-fv]");
    var contribEl = root.querySelector("[data-res-contrib]");
    var interestEl = root.querySelector("[data-res-interest]");
    var apyEl = root.querySelector("[data-res-apy]");
    var growthBody = root.querySelector("[data-growth-body]") || document.querySelector("[data-growth-body]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var principal = CalcCore.readNumber(root.querySelector("#ci-principal"), "Initial deposit", { min: 0 });
      var monthly = CalcCore.readNumber(root.querySelector("#ci-monthly"), "Monthly contribution", { min: 0, optional: true, defaultValue: 0 });
      var rate = CalcCore.readNumber(root.querySelector("#ci-rate"), "Annual interest rate", { min: 0, max: 100 });
      var years = CalcCore.readNumber(root.querySelector("#ci-years"), "Years to grow", { gt: 0, max: 100, integer: true });
      var freq = Number(root.querySelector("#ci-freq").value);

      var checks = [principal, monthly, rate, years];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var P = principal.value;
      var PMT = monthly.value;
      var r = rate.value / 100;
      var Y = years.value;

      var monthlyRate = r === 0 ? 0 : Math.pow(1 + r / freq, freq / 12) - 1;
      var apy = r === 0 ? 0 : (Math.pow(1 + r / freq, freq) - 1) * 100;

      var balance = P;
      var totalContrib = P;
      if (growthBody) growthBody.innerHTML = "";

      for (var y = 1; y <= Y; y++) {
        for (var m = 1; m <= 12; m++) {
          balance = balance * (1 + monthlyRate) + PMT;
          totalContrib += PMT;
        }
        if (growthBody && (y <= 15 || y % 5 === 0 || y === Y)) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>Year " + y + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(totalContrib, cur) + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(balance - totalContrib, cur) + "</td>" +
            '<td class="num">' + CalcCore.formatCurrency(balance, cur) + "</td>";
          growthBody.appendChild(tr);
        }
      }

      fvEl.textContent = CalcCore.formatCurrency(balance, cur);
      contribEl.textContent = CalcCore.formatCurrency(totalContrib, cur);
      interestEl.textContent = CalcCore.formatCurrency(balance - totalContrib, cur);
      apyEl.textContent = apy.toFixed(2) + "%";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#ci-principal").value = "10000";
      root.querySelector("#ci-monthly").value = "300";
      root.querySelector("#ci-rate").value = "7";
      root.querySelector("#ci-years").value = "15";
      root.querySelector("#ci-freq").value = "12";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Future Value: " + fvEl.textContent; });
    calculate();
  }

  /* 5. Savings Calculator */
  function initSavingsCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#sav-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var balanceEl = root.querySelector("[data-res-balance]");
    var depositsEl = root.querySelector("[data-res-deposits]");
    var interestEl = root.querySelector("[data-res-interest]");
    var goalStatusEl = root.querySelector("[data-res-goal]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var initAmt = CalcCore.readNumber(root.querySelector("#sav-init"), "Initial savings", { min: 0 });
      var monthly = CalcCore.readNumber(root.querySelector("#sav-monthly"), "Monthly deposit", { min: 0 });
      var apy = CalcCore.readNumber(root.querySelector("#sav-apy"), "Annual interest rate", { min: 0, max: 50 });
      var years = CalcCore.readNumber(root.querySelector("#sav-years"), "Time horizon", { gt: 0, max: 80 });
      var goal = CalcCore.readNumber(root.querySelector("#sav-goal"), "Savings goal", { min: 0, optional: true, defaultValue: 0 });

      var checks = [initAmt, monthly, apy, years, goal];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var months = Math.round(years.value * 12);
      var rMonthly = apy.value / 100 / 12;
      var bal = initAmt.value;
      var totalDep = initAmt.value;

      for (var m = 1; m <= months; m++) {
        bal = bal * (1 + rMonthly) + monthly.value;
        totalDep += monthly.value;
      }

      balanceEl.textContent = CalcCore.formatCurrency(bal, cur);
      depositsEl.textContent = CalcCore.formatCurrency(totalDep, cur);
      interestEl.textContent = CalcCore.formatCurrency(bal - totalDep, cur);
      if (goal.value > 0) {
        var pct = Math.min(999, (bal / goal.value) * 100);
        goalStatusEl.textContent = pct.toFixed(1) + "% of " + CalcCore.formatCurrency(goal.value, cur);
      } else {
        goalStatusEl.textContent = "No goal set";
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#sav-init").value = "2500";
      root.querySelector("#sav-monthly").value = "400";
      root.querySelector("#sav-apy").value = "4.25";
      root.querySelector("#sav-years").value = "5";
      root.querySelector("#sav-goal").value = "25000";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Projected Savings: " + balanceEl.textContent; });
    calculate();
  }

  /* 6. Investment Calculator */
  function initInvestmentCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#inv-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var finalEl = root.querySelector("[data-res-final]");
    var contribEl = root.querySelector("[data-res-contrib]");
    var gainEl = root.querySelector("[data-res-gain]");
    var multEl = root.querySelector("[data-res-mult]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var start = CalcCore.readNumber(root.querySelector("#inv-start"), "Starting amount", { min: 0 });
      var contrib = CalcCore.readNumber(root.querySelector("#inv-contrib"), "Monthly contribution", { min: 0 });
      var ret = CalcCore.readNumber(root.querySelector("#inv-return"), "Expected annual return", { min: -50, max: 100 });
      var years = CalcCore.readNumber(root.querySelector("#inv-years"), "Investment horizon", { gt: 0, max: 80 });

      var checks = [start, contrib, ret, years];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var months = Math.round(years.value * 12);
      var rAnnual = ret.value / 100;
      var rMonthly = rAnnual === 0 ? 0 : Math.pow(1 + rAnnual, 1 / 12) - 1;
      var bal = start.value;
      var totalIn = start.value;

      for (var m = 1; m <= months; m++) {
        bal = bal * (1 + rMonthly) + contrib.value;
        totalIn += contrib.value;
      }

      var gain = bal - totalIn;
      var mult = totalIn > 0 ? bal / totalIn : 0;

      finalEl.textContent = CalcCore.formatCurrency(bal, cur);
      contribEl.textContent = CalcCore.formatCurrency(totalIn, cur);
      gainEl.textContent = CalcCore.formatCurrency(gain, cur);
      multEl.textContent = mult.toFixed(2) + "x";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#inv-start").value = "15000";
      root.querySelector("#inv-contrib").value = "500";
      root.querySelector("#inv-return").value = "8";
      root.querySelector("#inv-years").value = "20";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Projected Portfolio: " + finalEl.textContent; });
    calculate();
  }

  /* 7. Salary Calculator */
  function initSalaryCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#sal-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var annualEl = root.querySelector("[data-res-annual]");
    var monthlyEl = root.querySelector("[data-res-monthly]");
    var biweeklyEl = root.querySelector("[data-res-biweekly]");
    var weeklyEl = root.querySelector("[data-res-weekly]");
    var dailyEl = root.querySelector("[data-res-daily]");
    var hourlyEl = root.querySelector("[data-res-hourly]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var amt = CalcCore.readNumber(root.querySelector("#sal-amount"), "Pay amount", { gt: 0 });
      var freq = root.querySelector("#sal-freq").value;
      var hoursPerWeek = CalcCore.readNumber(root.querySelector("#sal-hours"), "Hours per week", { gt: 0, max: 168 });
      var daysPerWeek = CalcCore.readNumber(root.querySelector("#sal-days"), "Days per week", { gt: 0, max: 7 });

      var checks = [amt, hoursPerWeek, daysPerWeek];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var annualHours = hoursPerWeek.value * 52;
      var annualDays = daysPerWeek.value * 52;
      var annual = 0;

      if (freq === "hourly") annual = amt.value * annualHours;
      else if (freq === "daily") annual = amt.value * annualDays;
      else if (freq === "weekly") annual = amt.value * 52;
      else if (freq === "biweekly") annual = amt.value * 26;
      else if (freq === "semimonthly") annual = amt.value * 24;
      else if (freq === "monthly") annual = amt.value * 12;
      else annual = amt.value;

      annualEl.textContent = CalcCore.formatCurrency(annual, cur);
      monthlyEl.textContent = CalcCore.formatCurrency(annual / 12, cur);
      biweeklyEl.textContent = CalcCore.formatCurrency(annual / 26, cur);
      weeklyEl.textContent = CalcCore.formatCurrency(annual / 52, cur);
      dailyEl.textContent = CalcCore.formatCurrency(annual / annualDays, cur);
      hourlyEl.textContent = CalcCore.formatCurrency(annual / annualHours, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#sal-amount").value = "35";
      root.querySelector("#sal-freq").value = "hourly";
      root.querySelector("#sal-hours").value = "40";
      root.querySelector("#sal-days").value = "5";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Annual Salary: " + annualEl.textContent + " (" + hourlyEl.textContent + "/hr)"; });
    calculate();
  }

  /* 7b. Hourly Pay Calculator */
  function initHourlyPayCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#hp-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var weeklyEl = root.querySelector("[data-res-weekly]");
    var subEl = root.querySelector("[data-res-sub]");
    var regularEl = root.querySelector("[data-res-regular]");
    var overtimeEl = root.querySelector("[data-res-overtime]");
    var biweeklyEl = root.querySelector("[data-res-biweekly]");
    var monthlyEl = root.querySelector("[data-res-monthly]");
    var annualEl = root.querySelector("[data-res-annual]");
    var netAnnualEl = root.querySelector("[data-res-net-annual]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var rate = CalcCore.readNumber(root.querySelector("#hp-rate"), "Hourly wage", { gt: 0, max: 100000 });
      var regHours = CalcCore.readNumber(root.querySelector("#hp-reg-hours"), "Regular hours per week", { min: 0, max: 168 });
      var otHours = CalcCore.readNumber(root.querySelector("#hp-ot-hours"), "Overtime hours per week", { min: 0, max: 168, optional: true, defaultValue: 0 });
      var otMult = CalcCore.readNumber(root.querySelector("#hp-ot-mult"), "Overtime multiplier", { min: 1, max: 5 });
      var weeks = CalcCore.readNumber(root.querySelector("#hp-weeks"), "Weeks per year", { gt: 0, max: 52 });
      var tax = CalcCore.readNumber(root.querySelector("#hp-tax"), "Estimated tax / deduction rate", { min: 0, max: 100, optional: true, defaultValue: 0 });

      var checks = [rate, regHours, otHours, otMult, weeks, tax];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      if (regHours.value + otHours.value <= 0) {
        return CalcCore.showError(alertEl, "Enter at least 1 regular or overtime hour per week.");
      }
      if (regHours.value + otHours.value > 168) {
        return CalcCore.showError(alertEl, "Total weekly hours cannot exceed 168 hours in a week.");
      }

      var cur = currencyEl.value;
      var regularPay = rate.value * regHours.value;
      var overtimePay = rate.value * otMult.value * otHours.value;
      var weeklyGross = regularPay + overtimePay;
      var biweeklyGross = weeklyGross * 2;
      var annualGross = weeklyGross * weeks.value;
      var monthlyGross = annualGross / 12;
      var netAnnual = annualGross * (1 - tax.value / 100);

      weeklyEl.textContent = CalcCore.formatCurrency(weeklyGross, cur);
      if (subEl) {
        subEl.textContent =
          CalcCore.formatNumber(regHours.value, 2) +
          " reg hrs + " +
          CalcCore.formatNumber(otHours.value, 2) +
          " OT hrs (" +
          otMult.value +
          "x) across " +
          CalcCore.formatNumber(weeks.value, 1) +
          " weeks/yr.";
      }
      regularEl.textContent = CalcCore.formatCurrency(regularPay, cur);
      overtimeEl.textContent = CalcCore.formatCurrency(overtimePay, cur);
      biweeklyEl.textContent = CalcCore.formatCurrency(biweeklyGross, cur);
      monthlyEl.textContent = CalcCore.formatCurrency(monthlyGross, cur);
      annualEl.textContent = CalcCore.formatCurrency(annualGross, cur);
      if (netAnnualEl) netAnnualEl.textContent = CalcCore.formatCurrency(netAnnual, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("#hp-ot-mult").addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#hp-rate").value = "28";
      root.querySelector("#hp-reg-hours").value = "40";
      root.querySelector("#hp-ot-hours").value = "6";
      root.querySelector("#hp-ot-mult").value = "1.5";
      root.querySelector("#hp-weeks").value = "52";
      root.querySelector("#hp-tax").value = "0";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () {
      return "Weekly Gross: " + weeklyEl.textContent + " | Annual Gross: " + annualEl.textContent;
    });
    calculate();
  }

  /* 8. Profit Margin Calculator */
  function initProfitMarginCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#pm-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var marginEl = root.querySelector("[data-res-margin]");
    var profitEl = root.querySelector("[data-res-profit]");
    var markupEl = root.querySelector("[data-res-markup]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var cost = CalcCore.readNumber(root.querySelector("#pm-cost"), "Cost", { gt: 0 });
      var rev = CalcCore.readNumber(root.querySelector("#pm-revenue"), "Selling price / revenue", { gt: 0 });
      if (!cost.ok) return CalcCore.showError(alertEl, cost.error);
      if (!rev.ok) return CalcCore.showError(alertEl, rev.error);

      var cur = currencyEl.value;
      var profit = rev.value - cost.value;
      var margin = (profit / rev.value) * 100;
      var markup = (profit / cost.value) * 100;

      marginEl.textContent = margin.toFixed(2) + "%";
      profitEl.textContent = CalcCore.formatCurrency(profit, cur);
      markupEl.textContent = markup.toFixed(2) + "%";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#pm-cost").value = "60";
      root.querySelector("#pm-revenue").value = "100";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Margin: " + marginEl.textContent + " | Profit: " + profitEl.textContent; });
    calculate();
  }

  /* 9. Discount Calculator */
  function initDiscountCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#disc-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var finalEl = root.querySelector("[data-res-final]");
    var savedEl = root.querySelector("[data-res-saved]");
    var effPctEl = root.querySelector("[data-res-eff]");
    var taxAmtEl = root.querySelector("[data-res-tax]");
    var totalTaxEl = root.querySelector("[data-res-total-tax]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var price = CalcCore.readNumber(root.querySelector("#disc-price"), "Original price", { gt: 0 });
      var d1 = CalcCore.readNumber(root.querySelector("#disc-pct1"), "Discount percentage", { min: 0, max: 100 });
      var d2 = CalcCore.readNumber(root.querySelector("#disc-pct2"), "Extra discount", { min: 0, max: 100, optional: true, defaultValue: 0 });
      var tax = CalcCore.readNumber(root.querySelector("#disc-tax"), "Sales tax", { min: 0, max: 100, optional: true, defaultValue: 0 });

      var checks = [price, d1, d2, tax];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var salePrice = price.value * (1 - d1.value / 100) * (1 - d2.value / 100);
      var savings = price.value - salePrice;
      var effDiscount = (savings / price.value) * 100;
      var taxAmount = salePrice * (tax.value / 100);
      var totalWithTax = salePrice + taxAmount;

      finalEl.textContent = CalcCore.formatCurrency(salePrice, cur);
      savedEl.textContent = CalcCore.formatCurrency(savings, cur);
      effPctEl.textContent = effDiscount.toFixed(2) + "%";
      taxAmtEl.textContent = CalcCore.formatCurrency(taxAmount, cur);
      totalTaxEl.textContent = CalcCore.formatCurrency(totalWithTax, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#disc-price").value = "120";
      root.querySelector("#disc-pct1").value = "25";
      root.querySelector("#disc-pct2").value = "10";
      root.querySelector("#disc-tax").value = "0";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Sale Price: " + finalEl.textContent; });
    calculate();
  }

  /* 10. Sales Tax Calculator */
  function initSalesTaxCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#st-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var totalEl = root.querySelector("[data-res-total]");
    var preEl = root.querySelector("[data-res-pre]");
    var taxEl = root.querySelector("[data-res-tax]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var amt = CalcCore.readNumber(root.querySelector("#st-amount"), "Price amount", { min: 0 });
      var rate = CalcCore.readNumber(root.querySelector("#st-rate"), "Sales tax rate", { min: 0, max: 100 });
      var mode = root.querySelector("#st-mode").value;

      if (!amt.ok) return CalcCore.showError(alertEl, amt.error);
      if (!rate.ok) return CalcCore.showError(alertEl, rate.error);

      var cur = currencyEl.value;
      var r = rate.value / 100;
      var preTax = mode === "add" ? amt.value : amt.value / (1 + r);
      var taxAmt = mode === "add" ? preTax * r : amt.value - preTax;
      var gross = preTax + taxAmt;

      totalEl.textContent = CalcCore.formatCurrency(gross, cur);
      preEl.textContent = CalcCore.formatCurrency(preTax, cur);
      taxEl.textContent = CalcCore.formatCurrency(taxAmt, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#st-amount").value = "100";
      root.querySelector("#st-rate").value = "8.25";
      root.querySelector("#st-mode").value = "add";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Total: " + totalEl.textContent + " (Tax: " + taxEl.textContent + ")"; });
    calculate();
  }

  /* 11. VAT Calculator */
  function initVatCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#vat-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var grossEl = root.querySelector("[data-res-gross]");
    var netEl = root.querySelector("[data-res-net]");
    var vatEl = root.querySelector("[data-res-vat]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var amt = CalcCore.readNumber(root.querySelector("#vat-amount"), "Amount", { min: 0 });
      var rate = CalcCore.readNumber(root.querySelector("#vat-rate"), "VAT / GST rate", { min: 0, max: 100 });
      var mode = root.querySelector("#vat-mode").value;

      if (!amt.ok) return CalcCore.showError(alertEl, amt.error);
      if (!rate.ok) return CalcCore.showError(alertEl, rate.error);

      var cur = currencyEl.value;
      var r = rate.value / 100;
      var net = mode === "add" ? amt.value : amt.value / (1 + r);
      var vat = mode === "add" ? net * r : amt.value - net;
      var gross = net + vat;

      grossEl.textContent = CalcCore.formatCurrency(gross, cur);
      netEl.textContent = CalcCore.formatCurrency(net, cur);
      vatEl.textContent = CalcCore.formatCurrency(vat, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#vat-amount").value = "250";
      root.querySelector("#vat-rate").value = "20";
      root.querySelector("#vat-mode").value = "add";
      currencyEl.value = "GBP";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Gross: " + grossEl.textContent + " | VAT: " + vatEl.textContent; });
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var map = {
      "calc-loan": initLoanCalculator,
      "calc-mortgage": initMortgageCalculator,
      "calc-simple-interest": initSimpleInterestCalculator,
      "calc-compound-interest": initCompoundInterestCalculator,
      "calc-savings": initSavingsCalculator,
      "calc-investment": initInvestmentCalculator,
      "calc-salary": initSalaryCalculator,
      "calc-hourly-pay": initHourlyPayCalculator,
      "calc-profit-margin": initProfitMarginCalculator,
      "calc-discount": initDiscountCalculator,
      "calc-sales-tax": initSalesTaxCalculator,
      "calc-vat": initVatCalculator
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) map[id](el);
    });
  });
})();

/* ==========================================================================
   CalcMaster Health Calculators (All 6 Tools)
   BMI, BMR, Daily Calorie (TDEE), Ideal Weight, Water Intake, Body Fat
   ========================================================================== */
(function () {
  "use strict";

  function getBmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity (Class I)";
    if (bmi < 40) return "Obesity (Class II)";
    return "Obesity (Class III)";
  }

  function readHeightWeight(root, unit) {
    if (unit === "metric") {
      var cm = CalcCore.readNumber(root.querySelector("[data-h-cm]"), "Height (cm)", { min: 50, max: 275 });
      var kg = CalcCore.readNumber(root.querySelector("[data-w-kg]"), "Weight (kg)", { min: 10, max: 500 });
      if (!cm.ok) return { ok: false, error: cm.error };
      if (!kg.ok) return { ok: false, error: kg.error };
      return { ok: true, cm: cm.value, kg: kg.value, inches: cm.value / 2.54, lbs: kg.value / 0.45359237 };
    }
    var ft = CalcCore.readNumber(root.querySelector("[data-h-ft]"), "Height (feet)", { min: 1, max: 9, integer: true });
    var inc = CalcCore.readNumber(root.querySelector("[data-h-in]"), "Height (inches)", { min: 0, max: 11.99, optional: true, defaultValue: 0 });
    var lbs = CalcCore.readNumber(root.querySelector("[data-w-lbs]"), "Weight (lbs)", { min: 20, max: 1100 });
    if (!ft.ok) return { ok: false, error: ft.error };
    if (!inc.ok) return { ok: false, error: inc.error };
    if (!lbs.ok) return { ok: false, error: lbs.error };
    var totalIn = ft.value * 12 + inc.value;
    if (totalIn <= 0) return { ok: false, error: "Height must be greater than zero." };
    return { ok: true, cm: totalIn * 2.54, kg: lbs.value * 0.45359237, inches: totalIn, lbs: lbs.value };
  }

  /* 1. BMI Calculator */
  function initBmiCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var unitBtns = root.querySelectorAll("[data-bmi-unit]");
    var metricFields = root.querySelector("[data-bmi-metric]");
    var imperialFields = root.querySelector("[data-bmi-imperial]");

    var bmiValEl = root.querySelector("[data-res-bmi]");
    var catEl = root.querySelector("[data-res-cat]");
    var rangeEl = root.querySelector("[data-res-range]");
    var primeEl = root.querySelector("[data-res-prime]");
    var copyBtn = root.querySelector("[data-copy-result]");
    var unit = "imperial";

    function switchUnit(nextUnit) {
      unit = nextUnit;
      CalcCore.clearError(alertEl, form);
      for (var i = 0; i < unitBtns.length; i++) {
        var active = unitBtns[i].getAttribute("data-bmi-unit") === unit;
        unitBtns[i].classList.toggle("is-active", active);
        unitBtns[i].setAttribute("aria-selected", String(active));
      }
      metricFields.hidden = unit !== "metric";
      imperialFields.hidden = unit !== "imperial";
      calculate();
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var heightMeters = 0, weightKg = 0;
      if (unit === "metric") {
        var cm = CalcCore.readNumber(root.querySelector("#bmi-cm"), "Height (cm)", { min: 50, max: 275 });
        var kg = CalcCore.readNumber(root.querySelector("#bmi-kg"), "Weight (kg)", { min: 10, max: 500 });
        if (!cm.ok) return CalcCore.showError(alertEl, cm.error);
        if (!kg.ok) return CalcCore.showError(alertEl, kg.error);
        heightMeters = cm.value / 100;
        weightKg = kg.value;
      } else {
        var ft = CalcCore.readNumber(root.querySelector("#bmi-ft"), "Height (feet)", { min: 1, max: 9, integer: true });
        var inc = CalcCore.readNumber(root.querySelector("#bmi-in"), "Height (inches)", { min: 0, max: 11.99, optional: true, defaultValue: 0 });
        var lbs = CalcCore.readNumber(root.querySelector("#bmi-lbs"), "Weight (lbs)", { min: 20, max: 1100 });
        if (!ft.ok) return CalcCore.showError(alertEl, ft.error);
        if (!inc.ok) return CalcCore.showError(alertEl, inc.error);
        if (!lbs.ok) return CalcCore.showError(alertEl, lbs.error);
        var totalInches = ft.value * 12 + inc.value;
        heightMeters = totalInches * 0.0254;
        weightKg = lbs.value * 0.45359237;
      }

      var bmi = weightKg / (heightMeters * heightMeters);
      var minHealthyKg = 18.5 * heightMeters * heightMeters;
      var maxHealthyKg = 24.9 * heightMeters * heightMeters;

      bmiValEl.textContent = bmi.toFixed(1);
      catEl.textContent = getBmiCategory(bmi);
      primeEl.textContent = (bmi / 25).toFixed(2);
      if (unit === "metric") {
        rangeEl.textContent = minHealthyKg.toFixed(1) + " – " + maxHealthyKg.toFixed(1) + " kg";
      } else {
        rangeEl.textContent = (minHealthyKg / 0.45359237).toFixed(1) + " – " + (maxHealthyKg / 0.45359237).toFixed(1) + " lbs";
      }
    }

    for (var i = 0; i < unitBtns.length; i++) {
      unitBtns[i].addEventListener("click", function () { switchUnit(this.getAttribute("data-bmi-unit")); });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#bmi-ft").value = "5";
      root.querySelector("#bmi-in").value = "9";
      root.querySelector("#bmi-lbs").value = "165";
      root.querySelector("#bmi-cm").value = "175";
      root.querySelector("#bmi-kg").value = "75";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "BMI: " + bmiValEl.textContent + " (" + catEl.textContent + ")"; });
    calculate();
  }

  /* 2. BMR Calculator (Mifflin-St Jeor) */
  function initBmrCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var unitBtns = root.querySelectorAll("[data-unit-btn]");
    var metricFields = root.querySelector("[data-unit-metric]");
    var imperialFields = root.querySelector("[data-unit-imperial]");

    var bmrEl = root.querySelector("[data-res-bmr]");
    var sedEl = root.querySelector("[data-res-sed]");
    var modEl = root.querySelector("[data-res-mod]");
    var copyBtn = root.querySelector("[data-copy-result]");
    var unit = "imperial";

    function switchUnit(next) {
      unit = next;
      for (var i = 0; i < unitBtns.length; i++) {
        var active = unitBtns[i].getAttribute("data-unit-btn") === unit;
        unitBtns[i].classList.toggle("is-active", active);
      }
      metricFields.hidden = unit !== "metric";
      imperialFields.hidden = unit !== "imperial";
      calculate();
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var age = CalcCore.readNumber(root.querySelector("#bmr-age"), "Age", { min: 15, max: 110, integer: true });
      var sex = root.querySelector("#bmr-sex").value;
      if (!age.ok) return CalcCore.showError(alertEl, age.error);

      var hw = readHeightWeight(root, unit);
      if (!hw.ok) return CalcCore.showError(alertEl, hw.error);

      var bmr = 10 * hw.kg + 6.25 * hw.cm - 5 * age.value + (sex === "male" ? 5 : -161);
      bmrEl.textContent = Math.round(bmr) + " kcal/day";
      sedEl.textContent = Math.round(bmr * 1.2) + " kcal/day";
      modEl.textContent = Math.round(bmr * 1.55) + " kcal/day";
    }

    for (var i = 0; i < unitBtns.length; i++) {
      unitBtns[i].addEventListener("click", function () { switchUnit(this.getAttribute("data-unit-btn")); });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#bmr-age").value = "30";
      root.querySelector("#bmr-sex").value = "male";
      root.querySelector("[data-h-ft]").value = "5";
      root.querySelector("[data-h-in]").value = "10";
      root.querySelector("[data-w-lbs]").value = "175";
      root.querySelector("[data-h-cm]").value = "178";
      root.querySelector("[data-w-kg]").value = "79";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "BMR: " + bmrEl.textContent; });
    calculate();
  }

  /* 3. Daily Calorie Calculator (TDEE) */
  function initDailyCalorieCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var unitBtns = root.querySelectorAll("[data-unit-btn]");
    var metricFields = root.querySelector("[data-unit-metric]");
    var imperialFields = root.querySelector("[data-unit-imperial]");

    var tdeeEl = root.querySelector("[data-res-tdee]");
    var mildLossEl = root.querySelector("[data-res-mild-loss]");
    var lossEl = root.querySelector("[data-res-loss]");
    var gainEl = root.querySelector("[data-res-gain]");
    var copyBtn = root.querySelector("[data-copy-result]");
    var unit = "imperial";

    function switchUnit(next) {
      unit = next;
      for (var i = 0; i < unitBtns.length; i++) {
        unitBtns[i].classList.toggle("is-active", unitBtns[i].getAttribute("data-unit-btn") === unit);
      }
      metricFields.hidden = unit !== "metric";
      imperialFields.hidden = unit !== "imperial";
      calculate();
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var age = CalcCore.readNumber(root.querySelector("#cal-age"), "Age", { min: 15, max: 110, integer: true });
      var sex = root.querySelector("#cal-sex").value;
      var activity = Number(root.querySelector("#cal-activity").value);
      if (!age.ok) return CalcCore.showError(alertEl, age.error);

      var hw = readHeightWeight(root, unit);
      if (!hw.ok) return CalcCore.showError(alertEl, hw.error);

      var bmr = 10 * hw.kg + 6.25 * hw.cm - 5 * age.value + (sex === "male" ? 5 : -161);
      var tdee = Math.round(bmr * activity);

      tdeeEl.textContent = CalcCore.formatNumber(tdee, 0) + " kcal/day";
      mildLossEl.textContent = CalcCore.formatNumber(Math.max(1200, tdee - 250), 0) + " kcal/day";
      lossEl.textContent = CalcCore.formatNumber(Math.max(1200, tdee - 500), 0) + " kcal/day";
      gainEl.textContent = CalcCore.formatNumber(tdee + 300, 0) + " kcal/day";
    }

    for (var i = 0; i < unitBtns.length; i++) {
      unitBtns[i].addEventListener("click", function () { switchUnit(this.getAttribute("data-unit-btn")); });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#cal-age").value = "30";
      root.querySelector("#cal-sex").value = "female";
      root.querySelector("#cal-activity").value = "1.55";
      root.querySelector("[data-h-ft]").value = "5";
      root.querySelector("[data-h-in]").value = "6";
      root.querySelector("[data-w-lbs]").value = "145";
      root.querySelector("[data-h-cm]").value = "168";
      root.querySelector("[data-w-kg]").value = "66";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Maintenance TDEE: " + tdeeEl.textContent; });
    calculate();
  }

  /* 4. Ideal Weight Calculator */
  function initIdealWeightCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var unitBtns = root.querySelectorAll("[data-unit-btn]");
    var metricFields = root.querySelector("[data-unit-metric]");
    var imperialFields = root.querySelector("[data-unit-imperial]");

    var bmiRangeEl = root.querySelector("[data-res-bmi-range]");
    var devineEl = root.querySelector("[data-res-devine]");
    var robinsonEl = root.querySelector("[data-res-robinson]");
    var millerEl = root.querySelector("[data-res-miller]");
    var hamwiEl = root.querySelector("[data-res-hamwi]");
    var copyBtn = root.querySelector("[data-copy-result]");
    var unit = "imperial";

    function switchUnit(next) {
      unit = next;
      for (var i = 0; i < unitBtns.length; i++) {
        unitBtns[i].classList.toggle("is-active", unitBtns[i].getAttribute("data-unit-btn") === unit);
      }
      metricFields.hidden = unit !== "metric";
      imperialFields.hidden = unit !== "imperial";
      calculate();
    }

    function fmtW(kg) {
      return unit === "metric" ? kg.toFixed(1) + " kg" : (kg / 0.45359237).toFixed(1) + " lbs";
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var sex = root.querySelector("#iw-sex").value;
      var cm = 0;
      if (unit === "metric") {
        var cmRes = CalcCore.readNumber(root.querySelector("#iw-cm"), "Height (cm)", { min: 120, max: 250 });
        if (!cmRes.ok) return CalcCore.showError(alertEl, cmRes.error);
        cm = cmRes.value;
      } else {
        var ft = CalcCore.readNumber(root.querySelector("#iw-ft"), "Height (feet)", { min: 4, max: 8, integer: true });
        var inc = CalcCore.readNumber(root.querySelector("#iw-in"), "Height (inches)", { min: 0, max: 11.99, optional: true, defaultValue: 0 });
        if (!ft.ok) return CalcCore.showError(alertEl, ft.error);
        if (!inc.ok) return CalcCore.showError(alertEl, inc.error);
        cm = (ft.value * 12 + inc.value) * 2.54;
      }

      var inchesOver60 = Math.max(0, cm / 2.54 - 60);
      var devine = (sex === "male" ? 50 : 45.5) + 2.3 * inchesOver60;
      var robinson = (sex === "male" ? 52 : 49) + (sex === "male" ? 1.9 : 1.7) * inchesOver60;
      var miller = (sex === "male" ? 56.2 : 53.1) + (sex === "male" ? 1.41 : 1.36) * inchesOver60;
      var hamwi = (sex === "male" ? 48 : 45.5) + (sex === "male" ? 2.7 : 2.2) * inchesOver60;

      var hM = cm / 100;
      var minKg = 18.5 * hM * hM;
      var maxKg = 24.9 * hM * hM;

      bmiRangeEl.textContent = fmtW(minKg) + " – " + fmtW(maxKg);
      devineEl.textContent = fmtW(devine);
      robinsonEl.textContent = fmtW(robinson);
      millerEl.textContent = fmtW(miller);
      if (hamwiEl) hamwiEl.textContent = fmtW(hamwi);
    }

    for (var i = 0; i < unitBtns.length; i++) {
      unitBtns[i].addEventListener("click", function () { switchUnit(this.getAttribute("data-unit-btn")); });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#iw-sex").value = "male";
      root.querySelector("#iw-ft").value = "5";
      root.querySelector("#iw-in").value = "9";
      root.querySelector("#iw-cm").value = "175";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Healthy Weight Range: " + bmiRangeEl.textContent; });
    calculate();
  }

  /* 5. Water Intake Calculator */
  function initWaterIntakeCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var litersEl = root.querySelector("[data-res-liters]");
    var ozEl = root.querySelector("[data-res-oz]");
    var cupsEl = root.querySelector("[data-res-cups]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var weight = CalcCore.readNumber(root.querySelector("#wat-weight"), "Body weight", { min: 20, max: 1000 });
      var unit = root.querySelector("#wat-unit").value;
      var exercise = CalcCore.readNumber(root.querySelector("#wat-ex"), "Daily exercise minutes", { min: 0, max: 480, optional: true, defaultValue: 0 });
      var climate = Number(root.querySelector("#wat-climate").value);

      if (!weight.ok) return CalcCore.showError(alertEl, weight.error);
      if (!exercise.ok) return CalcCore.showError(alertEl, exercise.error);

      var weightKg = unit === "lbs" ? weight.value * 0.45359237 : weight.value;
      var baseLiters = weightKg * 0.033;
      var exerciseLiters = (exercise.value / 30) * 0.35;
      var totalLiters = (baseLiters + exerciseLiters) * climate;
      var fluidOz = totalLiters * 33.814;
      var cups = totalLiters / 0.25;

      litersEl.textContent = totalLiters.toFixed(2) + " L/day";
      ozEl.textContent = Math.round(fluidOz) + " fl oz/day";
      cupsEl.textContent = cups.toFixed(1) + " cups (250 mL)";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#wat-weight").value = "160";
      root.querySelector("#wat-unit").value = "lbs";
      root.querySelector("#wat-ex").value = "30";
      root.querySelector("#wat-climate").value = "1";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Daily Hydration Target: " + litersEl.textContent + " (" + ozEl.textContent + ")"; });
    calculate();
  }

  /* 6. Body Fat Calculator (U.S. Navy Method) */
  function initBodyFatCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var sexEl = root.querySelector("#bf-sex");
    var unitEl = root.querySelector("#bf-unit");
    var hipWrap = root.querySelector("[data-bf-hip-wrap]");

    var pctEl = root.querySelector("[data-res-pct]");
    var catEl = root.querySelector("[data-res-cat]");
    var fatMassEl = root.querySelector("[data-res-fat]");
    var leanMassEl = root.querySelector("[data-res-lean]");
    var copyBtn = root.querySelector("[data-copy-result]");

    var lenUnitEls = root.querySelectorAll("[data-bf-len-unit]");
    var wtUnitEls = root.querySelectorAll("[data-bf-wt-unit]");

    function toggleHip() {
      hipWrap.hidden = sexEl.value !== "female";
    }

    function syncUnitLabels() {
      var isImp = unitEl.value === "imperial";
      for (var i = 0; i < lenUnitEls.length; i++) lenUnitEls[i].textContent = isImp ? "in" : "cm";
      for (var j = 0; j < wtUnitEls.length; j++) wtUnitEls[j].textContent = isImp ? "lbs" : "kg";
    }

    function getAceCategory(sex, bf) {
      if (sex === "female") {
        if (bf < 14) return "Essential Fat";
        if (bf < 21) return "Athletes";
        if (bf < 25) return "Fitness";
        if (bf < 32) return "Average";
        return "Above Average";
      }
      if (bf < 6) return "Essential Fat";
      if (bf < 14) return "Athletes";
      if (bf < 18) return "Fitness";
      if (bf < 25) return "Average";
      return "Above Average";
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var sex = sexEl.value;
      var unit = unitEl.value;
      var height = CalcCore.readNumber(root.querySelector("#bf-height"), "Height", { gt: 0 });
      var weight = CalcCore.readNumber(root.querySelector("#bf-weight"), "Weight", { gt: 0 });
      var neck = CalcCore.readNumber(root.querySelector("#bf-neck"), "Neck circumference", { gt: 0 });
      var waist = CalcCore.readNumber(root.querySelector("#bf-waist"), "Waist circumference", { gt: 0 });
      var hip = sex === "female"
        ? CalcCore.readNumber(root.querySelector("#bf-hip"), "Hip circumference", { gt: 0 })
        : { ok: true, value: 0 };

      var checks = [height, weight, neck, waist, hip];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var hCm = unit === "imperial" ? height.value * 2.54 : height.value;
      var neckCm = unit === "imperial" ? neck.value * 2.54 : neck.value;
      var waistCm = unit === "imperial" ? waist.value * 2.54 : waist.value;
      var hipCm = unit === "imperial" ? hip.value * 2.54 : hip.value;

      var bf = 0;
      if (sex === "male") {
        if (waistCm <= neckCm) return CalcCore.showError(alertEl, "Waist measurement must be larger than neck measurement.");
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(hCm)) - 450;
      } else {
        if (waistCm + hipCm <= neckCm) return CalcCore.showError(alertEl, "Waist + hip must be larger than neck measurement.");
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(hCm)) - 450;
      }

      bf = Math.max(2, Math.min(70, bf));
      var fatMass = weight.value * (bf / 100);
      var leanMass = weight.value - fatMass;
      var wLabel = unit === "imperial" ? " lbs" : " kg";

      pctEl.textContent = bf.toFixed(1) + "%";
      catEl.textContent = getAceCategory(sex, bf);
      fatMassEl.textContent = fatMass.toFixed(1) + wLabel;
      leanMassEl.textContent = leanMass.toFixed(1) + wLabel;
    }

    sexEl.addEventListener("change", function () { toggleHip(); calculate(); });
    unitEl.addEventListener("change", function () { syncUnitLabels(); calculate(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      sexEl.value = "male";
      unitEl.value = "imperial";
      root.querySelector("#bf-height").value = "70";
      root.querySelector("#bf-weight").value = "175";
      root.querySelector("#bf-neck").value = "15";
      root.querySelector("#bf-waist").value = "33";
      root.querySelector("#bf-hip").value = "38";
      toggleHip();
      syncUnitLabels();
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Estimated Body Fat: " + pctEl.textContent + " (" + catEl.textContent + ")"; });
    toggleHip();
    syncUnitLabels();
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var map = {
      "calc-bmi": initBmiCalculator,
      "calc-bmr": initBmrCalculator,
      "calc-daily-calorie": initDailyCalorieCalculator,
      "calc-ideal-weight": initIdealWeightCalculator,
      "calc-water-intake": initWaterIntakeCalculator,
      "calc-body-fat": initBodyFatCalculator
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) map[id](el);
    });
  });
})();

/* ==========================================================================
   CalcMaster Date & Time Calculators (All 6 Tools)
   Age, Date Difference, Days Between Dates, Time, Working Days, Hours
   ========================================================================== */
(function () {
  "use strict";

  function toISOInputString(dateObj) {
    var y = dateObj.getFullYear();
    var m = String(dateObj.getMonth() + 1).padStart(2, "0");
    var d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function calendarDiff(start, end) {
    var years = end.year - start.year;
    var months = end.month - start.month;
    var days = end.day - start.day;

    if (days < 0) {
      months -= 1;
      var prevMonth = end.month - 1;
      var prevYear = end.year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      days += CalcCore.daysInMonth(prevYear, prevMonth);
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    var totalDays = Math.round((end.utc.getTime() - start.utc.getTime()) / 86400000);
    return {
      years: years,
      months: months,
      days: days,
      totalDays: totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      remDays: totalDays % 7,
      totalMonths: years * 12 + months
    };
  }

  /* 1. Age Calculator */
  function initAgeCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var dobInput = root.querySelector("#age-dob");
    var targetInput = root.querySelector("#age-target");

    var mainResEl = root.querySelector("[data-res-age]");
    var subResEl = root.querySelector("[data-res-sub]");
    var daysEl = root.querySelector("[data-res-days]");
    var weeksEl = root.querySelector("[data-res-weeks]");
    var monthsEl = root.querySelector("[data-res-months]");
    var nextEl = root.querySelector("[data-res-next]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function setDefaults() {
      dobInput.value = "1995-06-15";
      targetInput.value = toISOInputString(new Date());
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var dob = CalcCore.parseISODate(dobInput.value);
      var target = CalcCore.parseISODate(targetInput.value);
      if (!dob) { dobInput.classList.add("is-invalid"); return CalcCore.showError(alertEl, "Please enter a valid Date of Birth."); }
      if (!target) { targetInput.classList.add("is-invalid"); return CalcCore.showError(alertEl, "Please enter a valid Target Date."); }
      if (dob.utc.getTime() > target.utc.getTime()) {
        dobInput.classList.add("is-invalid");
        return CalcCore.showError(alertEl, "Date of Birth must be earlier than or equal to the Target Date.");
      }

      var age = calendarDiff(dob, target);
      var nextYear = target.year;
      function getBday(y) {
        var m = dob.month, d = dob.day;
        if (m === 2 && d === 29 && !CalcCore.isLeapYear(y)) { m = 3; d = 1; }
        return Date.UTC(y, m - 1, d);
      }
      var nextMs = getBday(nextYear);
      if (nextMs <= target.utc.getTime()) nextMs = getBday(nextYear + 1);
      var daysUntilNext = Math.round((nextMs - target.utc.getTime()) / 86400000);

      mainResEl.textContent = age.years + " yrs, " + age.months + " mos, " + age.days + " days";
      subResEl.textContent = "Exact chronological age on " + targetInput.value + ".";
      daysEl.textContent = CalcCore.formatNumber(age.totalDays, 0) + " days";
      weeksEl.textContent = CalcCore.formatNumber(age.totalWeeks, 0) + " wks, " + age.remDays + " d";
      monthsEl.textContent = CalcCore.formatNumber(age.totalMonths, 0) + " mos, " + age.days + " d";
      var dayUnit = daysUntilNext === 1 ? " day" : " days";
      nextEl.textContent = daysUntilNext + dayUnit + " (turning " + (age.years + 1) + ")";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () { setDefaults(); calculate(); });
    CalcCore.bindCopyButton(copyBtn, function () { return "Age: " + mainResEl.textContent; });
    if (!targetInput.value) setDefaults();
    calculate();
  }

  /* 2. Date Difference Calculator */
  function initDateDiffCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var startEl = root.querySelector("#dd-start");
    var endEl = root.querySelector("#dd-end");
    var inclEl = root.querySelector("#dd-inclusive");

    var mainEl = root.querySelector("[data-res-main]");
    var daysEl = root.querySelector("[data-res-days]");
    var weeksEl = root.querySelector("[data-res-weeks]");
    var hoursEl = root.querySelector("[data-res-hours]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var s = CalcCore.parseISODate(startEl.value);
      var e = CalcCore.parseISODate(endEl.value);
      if (!s) return CalcCore.showError(alertEl, "Please enter a valid Start Date.");
      if (!e) return CalcCore.showError(alertEl, "Please enter a valid End Date.");

      var swapped = s.utc.getTime() > e.utc.getTime();
      var from = swapped ? e : s;
      var to = swapped ? s : e;

      if (inclEl && inclEl.checked) {
        var nextDayUtc = new Date(to.utc.getTime() + 86400000);
        to = {
          year: nextDayUtc.getUTCFullYear(),
          month: nextDayUtc.getUTCMonth() + 1,
          day: nextDayUtc.getUTCDate(),
          utc: nextDayUtc
        };
      }

      var diff = calendarDiff(from, to);
      mainEl.textContent = diff.years + " yrs, " + diff.months + " mos, " + diff.days + " days";
      daysEl.textContent = CalcCore.formatNumber(diff.totalDays, 0) + " days";
      weeksEl.textContent = CalcCore.formatNumber(diff.totalWeeks, 0) + " wks, " + diff.remDays + " d";
      hoursEl.textContent = CalcCore.formatNumber(diff.totalDays * 24, 0) + " hours";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    if (inclEl) inclEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      startEl.value = "2026-01-01";
      endEl.value = "2026-12-31";
      if (inclEl) inclEl.checked = false;
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return mainEl.textContent + " (" + daysEl.textContent + ")"; });
    calculate();
  }

  /* 3. Days Between Dates Calculator */
  function initDaysBetweenCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var startEl = root.querySelector("#dbd-start");
    var endEl = root.querySelector("#dbd-end");
    var inclEl = root.querySelector("#dbd-inclusive");

    var daysEl = root.querySelector("[data-res-days]");
    var weekdaysEl = root.querySelector("[data-res-weekdays]");
    var weekendsEl = root.querySelector("[data-res-weekends]");
    var weeksEl = root.querySelector("[data-res-weeks]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var s = CalcCore.parseISODate(startEl.value);
      var e = CalcCore.parseISODate(endEl.value);
      if (!s) return CalcCore.showError(alertEl, "Please enter a valid Start Date.");
      if (!e) return CalcCore.showError(alertEl, "Please enter a valid End Date.");

      var t1 = Math.min(s.utc.getTime(), e.utc.getTime());
      var t2 = Math.max(s.utc.getTime(), e.utc.getTime());
      var inclusive = inclEl && inclEl.checked;
      var totalDays = Math.round((t2 - t1) / 86400000) + (inclusive ? 1 : 0);

      var weekdays = 0, weekends = 0;
      var cur = t1;
      var endLoop = inclusive ? t2 : t2 - 86400000;
      while (cur <= endLoop) {
        var dow = new Date(cur).getUTCDay();
        if (dow === 0 || dow === 6) weekends++;
        else weekdays++;
        cur += 86400000;
      }

      daysEl.textContent = CalcCore.formatNumber(totalDays, 0) + " days";
      weekdaysEl.textContent = CalcCore.formatNumber(weekdays, 0);
      weekendsEl.textContent = CalcCore.formatNumber(weekends, 0);
      weeksEl.textContent = (totalDays / 7).toFixed(2) + " weeks";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    if (inclEl) inclEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      startEl.value = "2026-03-01";
      endEl.value = "2026-06-30";
      if (inclEl) inclEl.checked = false;
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return daysEl.textContent + " (" + weekdaysEl.textContent + " weekdays)"; });
    calculate();
  }

  /* 4. Time Calculator */
  function initTimeCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var mainEl = root.querySelector("[data-res-time]");
    var hoursEl = root.querySelector("[data-res-hours]");
    var minsEl = root.querySelector("[data-res-mins]");
    var secsEl = root.querySelector("[data-res-secs]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var h1 = CalcCore.readNumber(root.querySelector("#tm-h1"), "First hours", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var m1 = CalcCore.readNumber(root.querySelector("#tm-m1"), "First minutes", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var s1 = CalcCore.readNumber(root.querySelector("#tm-s1"), "First seconds", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var h2 = CalcCore.readNumber(root.querySelector("#tm-h2"), "Second hours", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var m2 = CalcCore.readNumber(root.querySelector("#tm-m2"), "Second minutes", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var s2 = CalcCore.readNumber(root.querySelector("#tm-s2"), "Second seconds", { min: 0, integer: true, optional: true, defaultValue: 0 });
      var op = root.querySelector("#tm-op").value;

      var checks = [h1, m1, s1, h2, m2, s2];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var totalSec1 = h1.value * 3600 + m1.value * 60 + s1.value;
      var totalSec2 = h2.value * 3600 + m2.value * 60 + s2.value;
      var resSec = op === "add" ? totalSec1 + totalSec2 : totalSec1 - totalSec2;
      var sign = resSec < 0 ? "-" : "";
      var absSec = Math.abs(resSec);

      var outH = Math.floor(absSec / 3600);
      var outM = Math.floor((absSec % 3600) / 60);
      var outS = absSec % 60;

      mainEl.textContent = sign + outH + "h " + String(outM).padStart(2, "0") + "m " + String(outS).padStart(2, "0") + "s";
      hoursEl.textContent = (resSec / 3600).toFixed(4) + " hrs";
      minsEl.textContent = (resSec / 60).toFixed(2) + " mins";
      secsEl.textContent = CalcCore.formatNumber(resSec, 0) + " secs";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#tm-h1").value = "2";
      root.querySelector("#tm-m1").value = "45";
      root.querySelector("#tm-s1").value = "30";
      root.querySelector("#tm-op").value = "add";
      root.querySelector("#tm-h2").value = "1";
      root.querySelector("#tm-m2").value = "35";
      root.querySelector("#tm-s2").value = "45";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return mainEl.textContent; });
    calculate();
  }

  /* 5. Working Days Calculator */
  function initWorkingDaysCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var startEl = root.querySelector("#wd-start");
    var endEl = root.querySelector("#wd-end");
    var inclEl = root.querySelector("#wd-inclusive");
    var holidaysEl = root.querySelector("#wd-holidays");

    var workEl = root.querySelector("[data-res-workdays]");
    var totalEl = root.querySelector("[data-res-total]");
    var weekendsEl = root.querySelector("[data-res-weekends]");
    var holCountEl = root.querySelector("[data-res-holidays]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var s = CalcCore.parseISODate(startEl.value);
      var e = CalcCore.parseISODate(endEl.value);
      if (!s) return CalcCore.showError(alertEl, "Please enter a valid Start Date.");
      if (!e) return CalcCore.showError(alertEl, "Please enter a valid End Date.");
      if (s.utc.getTime() > e.utc.getTime()) return CalcCore.showError(alertEl, "Start Date must be earlier than or equal to End Date.");

      var holidaySet = {};
      var rawHol = String(holidaysEl ? holidaysEl.value : "").trim();
      if (rawHol) {
        var items = rawHol.split(/[\s,;]+/).filter(Boolean);
        for (var i = 0; i < items.length; i++) {
          var parsed = CalcCore.parseISODate(items[i]);
          if (!parsed) return CalcCore.showError(alertEl, 'Invalid holiday date "' + items[i] + '". Use YYYY-MM-DD format.');
          holidaySet[parsed.utc.getTime()] = true;
        }
      }

      var inclusive = inclEl && inclEl.checked;
      var cur = s.utc.getTime();
      var endLoop = inclusive ? e.utc.getTime() : e.utc.getTime() - 86400000;
      var workdays = 0, weekends = 0, holidaysHit = 0, total = 0;

      while (cur <= endLoop) {
        total++;
        var dow = new Date(cur).getUTCDay();
        if (dow === 0 || dow === 6) {
          weekends++;
        } else if (holidaySet[cur]) {
          holidaysHit++;
        } else {
          workdays++;
        }
        cur += 86400000;
      }

      workEl.textContent = CalcCore.formatNumber(workdays, 0) + " working days";
      totalEl.textContent = CalcCore.formatNumber(total, 0);
      weekendsEl.textContent = CalcCore.formatNumber(weekends, 0);
      holCountEl.textContent = CalcCore.formatNumber(holidaysHit, 0);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    if (inclEl) inclEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      startEl.value = "2026-11-01";
      endEl.value = "2026-11-30";
      if (inclEl) inclEl.checked = true;
      if (holidaysEl) holidaysEl.value = "2026-11-26";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return workEl.textContent; });
    calculate();
  }

  /* 6. Hours Calculator (Work Shift) */
  function initHoursCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var startEl = root.querySelector("#hr-start");
    var endEl = root.querySelector("#hr-end");
    var breakEl = root.querySelector("#hr-break");
    var rateEl = root.querySelector("#hr-rate");

    var durEl = root.querySelector("[data-res-duration]");
    var decEl = root.querySelector("[data-res-decimal]");
    var payEl = root.querySelector("[data-res-pay]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function parseHHMM(val) {
      var parts = String(val || "").split(":");
      if (parts.length !== 2) return null;
      var h = Number(parts[0]), m = Number(parts[1]);
      if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
      return h * 60 + m;
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var startMins = parseHHMM(startEl.value);
      var endMins = parseHHMM(endEl.value);
      var breakRes = CalcCore.readNumber(breakEl, "Unpaid break (minutes)", { min: 0, max: 600, optional: true, defaultValue: 0 });
      var rateRes = CalcCore.readNumber(rateEl, "Hourly rate", { min: 0, optional: true, defaultValue: 0 });

      if (startMins === null) return CalcCore.showError(alertEl, "Please enter a valid Start Time.");
      if (endMins === null) return CalcCore.showError(alertEl, "Please enter a valid End Time.");
      if (!breakRes.ok) return CalcCore.showError(alertEl, breakRes.error);
      if (!rateRes.ok) return CalcCore.showError(alertEl, rateRes.error);

      var shiftMins = endMins >= startMins ? endMins - startMins : 1440 - startMins + endMins;
      var workedMins = shiftMins - breakRes.value;
      if (workedMins < 0) return CalcCore.showError(alertEl, "Break duration cannot exceed total shift length.");

      var hrs = Math.floor(workedMins / 60);
      var mins = Math.round(workedMins % 60);
      var decHrs = workedMins / 60;

      durEl.textContent = hrs + " hrs " + mins + " mins";
      decEl.textContent = decHrs.toFixed(2) + " hours";
      payEl.textContent = CalcCore.formatCurrency(decHrs * rateRes.value, "USD");
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      startEl.value = "09:00";
      endEl.value = "17:30";
      breakEl.value = "30";
      rateEl.value = "28";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return durEl.textContent + " (" + decEl.textContent + ")"; });
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var map = {
      "calc-age": initAgeCalculator,
      "calc-date-diff": initDateDiffCalculator,
      "calc-days-between": initDaysBetweenCalculator,
      "calc-time": initTimeCalculator,
      "calc-working-days": initWorkingDaysCalculator,
      "calc-hours": initHoursCalculator
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) map[id](el);
    });
  });
})();

/* ==========================================================================
   CalcMaster Unit Converters (All 8 Tools)
   Length, Weight, Temperature, Volume, Speed, Area, Data Storage, Pressure
   ========================================================================== */
(function () {
  "use strict";

  var UNIT_TABLES = {
    length: {
      mm: { label: "Millimeters (mm)", factor: 0.001 },
      cm: { label: "Centimeters (cm)", factor: 0.01 },
      m: { label: "Meters (m)", factor: 1 },
      km: { label: "Kilometers (km)", factor: 1000 },
      in: { label: "Inches (in)", factor: 0.0254 },
      ft: { label: "Feet (ft)", factor: 0.3048 },
      yd: { label: "Yards (yd)", factor: 0.9144 },
      mi: { label: "Miles (mi)", factor: 1609.344 },
      nmi: { label: "Nautical Miles (nmi)", factor: 1852 }
    },
    weight: {
      mg: { label: "Milligrams (mg)", factor: 0.000001 },
      g: { label: "Grams (g)", factor: 0.001 },
      kg: { label: "Kilograms (kg)", factor: 1 },
      t: { label: "Metric Tons (t)", factor: 1000 },
      oz: { label: "Ounces (oz)", factor: 0.028349523125 },
      lb: { label: "Pounds (lb)", factor: 0.45359237 },
      st: { label: "Stone (st)", factor: 6.35029318 },
      ust: { label: "US Short Tons (ton)", factor: 907.18474 }
    },
    volume: {
      ml: { label: "Milliliters (mL)", factor: 0.001 },
      l: { label: "Liters (L)", factor: 1 },
      m3: { label: "Cubic Meters (m³)", factor: 1000 },
      tsp: { label: "US Teaspoons (tsp)", factor: 0.00492892159375 },
      tbsp: { label: "US Tablespoons (tbsp)", factor: 0.01478676478125 },
      floz: { label: "US Fluid Ounces (fl oz)", factor: 0.0295735295625 },
      cup: { label: "US Cups (cup)", factor: 0.2365882365 },
      pt: { label: "US Pints (pt)", factor: 0.473176473 },
      qt: { label: "US Quarts (qt)", factor: 0.946352946 },
      gal: { label: "US Gallons (gal)", factor: 3.785411784 },
      impgal: { label: "Imperial Gallons (imp gal)", factor: 4.54609 }
    },
    speed: {
      mps: { label: "Meters/second (m/s)", factor: 1 },
      kmh: { label: "Kilometers/hour (km/h)", factor: 1 / 3.6 },
      mph: { label: "Miles/hour (mph)", factor: 0.44704 },
      fps: { label: "Feet/second (ft/s)", factor: 0.3048 },
      kn: { label: "Knots (kn)", factor: 1852 / 3600 },
      mach: { label: "Mach (std sea level)", factor: 340.29 }
    },
    area: {
      mm2: { label: "Square Millimeters (mm²)", factor: 0.000001 },
      cm2: { label: "Square Centimeters (cm²)", factor: 0.0001 },
      m2: { label: "Square Meters (m²)", factor: 1 },
      ha: { label: "Hectares (ha)", factor: 10000 },
      km2: { label: "Square Kilometers (km²)", factor: 1000000 },
      in2: { label: "Square Inches (in²)", factor: 0.00064516 },
      ft2: { label: "Square Feet (ft²)", factor: 0.09290304 },
      yd2: { label: "Square Yards (yd²)", factor: 0.83612736 },
      acre: { label: "Acres (ac)", factor: 4046.8564224 },
      mi2: { label: "Square Miles (mi²)", factor: 2589988.110336 }
    },
    pressure: {
      pa: { label: "Pascals (Pa)", factor: 1 },
      hpa: { label: "Hectopascals / mbar (hPa)", factor: 100 },
      kpa: { label: "Kilopascals (kPa)", factor: 1000 },
      mpa: { label: "Megapascals (MPa)", factor: 1000000 },
      bar: { label: "Bar (bar)", factor: 100000 },
      psi: { label: "Pounds per sq. inch (psi)", factor: 6894.757293168361 },
      atm: { label: "Standard Atmospheres (atm)", factor: 101325 },
      mmhg: { label: "Millimeters of Mercury (mmHg)", factor: 133.322387415 }
    }
  };

  function initFactorConverter(root, tableKey, defaults) {
    var table = UNIT_TABLES[tableKey];
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var valInput = root.querySelector("[data-conv-value]");
    var fromSelect = root.querySelector("[data-conv-from]");
    var toSelect = root.querySelector("[data-conv-to]");
    var swapBtn = root.querySelector("[data-swap-units]");

    var resEl = root.querySelector("[data-res-conv]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var allUnitsBody = root.querySelector("[data-all-units-body]") || document.querySelector("[data-all-units-body]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var numRes = CalcCore.readNumber(valInput, "Value to convert", { min: 0 });
      if (!numRes.ok) return CalcCore.showError(alertEl, numRes.error);

      var fromKey = fromSelect.value;
      var toKey = toSelect.value;
      var baseVal = numRes.value * table[fromKey].factor;
      var converted = CalcCore.cleanFloat(baseVal / table[toKey].factor);
      var factor = CalcCore.cleanFloat(table[fromKey].factor / table[toKey].factor);

      resEl.textContent = CalcCore.formatNumber(converted, 8) + " " + toKey;
      formulaEl.textContent = "1 " + fromKey + " = " + CalcCore.formatNumber(factor, 8) + " " + toKey;

      if (allUnitsBody) {
        allUnitsBody.innerHTML = "";
        Object.keys(table).forEach(function (k) {
          var val = CalcCore.cleanFloat(baseVal / table[k].factor);
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + table[k].label + "</td>" +
            '<td class="num">' + CalcCore.formatNumber(val, 6) + " " + k + "</td>";
          allUnitsBody.appendChild(tr);
        });
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    valInput.addEventListener("input", calculate);
    fromSelect.addEventListener("change", calculate);
    toSelect.addEventListener("change", calculate);
    if (swapBtn) {
      swapBtn.addEventListener("click", function () {
        var tmp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tmp;
        calculate();
      });
    }
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      valInput.value = defaults.val;
      fromSelect.value = defaults.from;
      toSelect.value = defaults.to;
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return valInput.value + " " + fromSelect.value + " = " + resEl.textContent; });
    calculate();
  }

  /* Temperature Converter */
  function initTemperatureConverter(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var valInput = root.querySelector("#temp-value");
    var fromSelect = root.querySelector("#temp-from");
    var toSelect = root.querySelector("#temp-to");
    var swapBtn = root.querySelector("[data-swap-units]");

    var resEl = root.querySelector("[data-res-temp]");
    var cEl = root.querySelector("[data-res-c]");
    var fEl = root.querySelector("[data-res-f]");
    var kEl = root.querySelector("[data-res-k]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var numRes = CalcCore.readNumber(valInput, "Temperature value");
      if (!numRes.ok) return CalcCore.showError(alertEl, numRes.error);

      var v = numRes.value;
      var from = fromSelect.value;
      var to = toSelect.value;
      var c = from === "C" ? v : from === "F" ? (v - 32) * (5 / 9) : v - 273.15;

      if (c < -273.15 - 1e-9) {
        return CalcCore.showError(alertEl, "Temperature cannot be below absolute zero (-273.15 °C / -459.67 °F / 0 K).");
      }

      var f = c * (9 / 5) + 32;
      var k = c + 273.15;
      var out = to === "C" ? c : to === "F" ? f : k;
      var unitLabel = to === "K" ? " K" : " °" + to;

      resEl.textContent = CalcCore.formatNumber(out, 4) + unitLabel;
      cEl.textContent = CalcCore.formatNumber(c, 4) + " °C";
      fEl.textContent = CalcCore.formatNumber(f, 4) + " °F";
      kEl.textContent = CalcCore.formatNumber(k, 4) + " K";
      formulaEl.textContent = "°F = (°C × 9/5) + 32 | K = °C + 273.15";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    valInput.addEventListener("input", calculate);
    fromSelect.addEventListener("change", calculate);
    toSelect.addEventListener("change", calculate);
    if (swapBtn) {
      swapBtn.addEventListener("click", function () {
        var tmp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tmp;
        calculate();
      });
    }
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      valInput.value = "100";
      fromSelect.value = "C";
      toSelect.value = "F";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resEl.textContent; });
    calculate();
  }

  /* Data Storage Converter (Decimal SI vs Binary IEC) */
  function initDataStorageConverter(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var valInput = root.querySelector("#ds-value");
    var fromSelect = root.querySelector("#ds-from");
    var toSelect = root.querySelector("#ds-to");
    var stdSelect = root.querySelector("#ds-standard");
    var swapBtn = root.querySelector("[data-swap-units]");

    var resEl = root.querySelector("[data-res-ds]");
    var formulaEl = root.querySelector("[data-res-formula]");
    var bodyEl = root.querySelector("[data-all-units-body]") || document.querySelector("[data-all-units-body]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function getFactors(base) {
      return {
        b: { label: "Bits (b)", factor: 0.125 },
        B: { label: "Bytes (B)", factor: 1 },
        KB: { label: base === 1024 ? "Kibibytes (KiB)" : "Kilobytes (KB)", factor: base },
        MB: { label: base === 1024 ? "Mebibytes (MiB)" : "Megabytes (MB)", factor: Math.pow(base, 2) },
        GB: { label: base === 1024 ? "Gibibytes (GiB)" : "Gigabytes (GB)", factor: Math.pow(base, 3) },
        TB: { label: base === 1024 ? "Tebibytes (TiB)" : "Terabytes (TB)", factor: Math.pow(base, 4) },
        PB: { label: base === 1024 ? "Pebibytes (PiB)" : "Petabytes (PB)", factor: Math.pow(base, 5) }
      };
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var numRes = CalcCore.readNumber(valInput, "Storage size", { min: 0 });
      if (!numRes.ok) return CalcCore.showError(alertEl, numRes.error);

      var base = Number(stdSelect.value);
      var units = getFactors(base);
      var fromKey = fromSelect.value;
      var toKey = toSelect.value;

      var bytes = numRes.value * units[fromKey].factor;
      var out = CalcCore.cleanFloat(bytes / units[toKey].factor);

      resEl.textContent = CalcCore.formatNumber(out, 8) + " " + toKey;
      formulaEl.textContent = base === 1024 ? "Binary (IEC): 1 KiB = 1,024 Bytes" : "Decimal (SI): 1 KB = 1,000 Bytes";

      if (bodyEl) {
        bodyEl.innerHTML = "";
        Object.keys(units).forEach(function (k) {
          var v = CalcCore.cleanFloat(bytes / units[k].factor);
          var tr = document.createElement("tr");
          tr.innerHTML = "<td>" + units[k].label + '</td><td class="num">' + CalcCore.formatNumber(v, 6) + "</td>";
          bodyEl.appendChild(tr);
        });
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    valInput.addEventListener("input", calculate);
    fromSelect.addEventListener("change", calculate);
    toSelect.addEventListener("change", calculate);
    stdSelect.addEventListener("change", calculate);
    if (swapBtn) {
      swapBtn.addEventListener("click", function () {
        var tmp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tmp;
        calculate();
      });
    }
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      valInput.value = "512";
      fromSelect.value = "GB";
      toSelect.value = "MB";
      stdSelect.value = "1000";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return resEl.textContent; });
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var len = document.getElementById("calc-length");
    if (len) initFactorConverter(len, "length", { val: "10", from: "km", to: "mi" });

    var wt = document.getElementById("calc-weight");
    if (wt) initFactorConverter(wt, "weight", { val: "75", from: "kg", to: "lb" });

    var vol = document.getElementById("calc-volume");
    if (vol) initFactorConverter(vol, "volume", { val: "5", from: "gal", to: "l" });

    var spd = document.getElementById("calc-speed");
    if (spd) initFactorConverter(spd, "speed", { val: "60", from: "mph", to: "kmh" });

    var area = document.getElementById("calc-area");
    if (area) initFactorConverter(area, "area", { val: "2", from: "acre", to: "ft2" });

    var temp = document.getElementById("calc-temperature");
    if (temp) initTemperatureConverter(temp);

    var ds = document.getElementById("calc-data-storage");
    if (ds) initDataStorageConverter(ds);

    var pres = document.getElementById("calc-pressure");
    if (pres) initFactorConverter(pres, "pressure", { val: "32", from: "psi", to: "kpa" });
  });
})();

/* ==========================================================================
   CalcMaster Education Calculators (All 5 Tools)
   GPA, Grade, Exam Score, Weighted Average, Final Exam
   ========================================================================== */
(function () {
  "use strict";

  var GRADE_POINTS = {
    "4.0": "A / A+",
    "3.7": "A-",
    "3.3": "B+",
    "3.0": "B",
    "2.7": "B-",
    "2.3": "C+",
    "2.0": "C",
    "1.7": "C-",
    "1.3": "D+",
    "1.0": "D",
    "0.0": "F"
  };

  function getLetterGrade(pct) {
    if (pct >= 93) return "A";
    if (pct >= 90) return "A-";
    if (pct >= 87) return "B+";
    if (pct >= 83) return "B";
    if (pct >= 80) return "B-";
    if (pct >= 77) return "C+";
    if (pct >= 73) return "C";
    if (pct >= 70) return "C-";
    if (pct >= 67) return "D+";
    if (pct >= 60) return "D";
    return "F";
  }

  /* 1. GPA Calculator */
  function initGpaCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var rowsContainer = root.querySelector("[data-gpa-rows]");
    var addBtn = root.querySelector("[data-add-row]");

    var gpaEl = root.querySelector("[data-res-gpa]");
    var cumEl = root.querySelector("[data-res-cum]");
    var creditsEl = root.querySelector("[data-res-credits]");
    var pointsEl = root.querySelector("[data-res-points]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function createRow(gradeVal, creditsVal) {
      var row = document.createElement("div");
      row.className = "form-grid";
      row.style.marginBottom = "0.75rem";
      var optionsHtml = Object.keys(GRADE_POINTS).map(function (pt) {
        return '<option value="' + pt + '"' + (pt === String(gradeVal) ? " selected" : "") + ">" + GRADE_POINTS[pt] + " (" + pt + ")</option>";
      }).join("");
      row.innerHTML =
        '<div class="form-group"><select class="form-control" data-gpa-grade aria-label="Course grade">' + optionsHtml + "</select></div>" +
        '<div class="form-group" style="display:flex;flex-direction:row;gap:0.5rem;">' +
        '<input type="number" step="0.5" class="form-control" data-gpa-credits value="' + creditsVal + '" aria-label="Course credits" placeholder="Credits" />' +
        '<button type="button" class="btn btn-secondary" data-remove-row aria-label="Remove course">&times;</button></div>';
      return row;
    }

    function seedRows() {
      rowsContainer.innerHTML = "";
      [["4.0", 3], ["3.7", 4], ["3.3", 3], ["3.0", 3]].forEach(function (item) {
        rowsContainer.appendChild(createRow(item[0], item[1]));
      });
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var gradeEls = rowsContainer.querySelectorAll("[data-gpa-grade]");
      var credEls = rowsContainer.querySelectorAll("[data-gpa-credits]");
      if (gradeEls.length === 0) return CalcCore.showError(alertEl, "Add at least one course.");

      var totalCredits = 0;
      var totalPoints = 0;
      for (var i = 0; i < gradeEls.length; i++) {
        var cRes = CalcCore.readNumber(credEls[i], "Course " + (i + 1) + " credits", { gt: 0, max: 30 });
        if (!cRes.ok) return CalcCore.showError(alertEl, cRes.error);
        var gp = Number(gradeEls[i].value);
        totalCredits += cRes.value;
        totalPoints += gp * cRes.value;
      }

      var priorGpaEl = root.querySelector("#gpa-prior");
      var priorCredEl = root.querySelector("#gpa-prior-cred");
      var priorGpa = CalcCore.readNumber(priorGpaEl, "Prior GPA", { min: 0, max: 4.0, optional: true, defaultValue: 0 });
      var priorCred = CalcCore.readNumber(priorCredEl, "Prior credits", { min: 0, optional: true, defaultValue: 0 });
      if (!priorGpa.ok) return CalcCore.showError(alertEl, priorGpa.error);
      if (!priorCred.ok) return CalcCore.showError(alertEl, priorCred.error);
      if (String(priorGpaEl.value || "").trim() === "" && priorCred.value > 0) {
        priorGpaEl.classList.add("is-invalid");
        return CalcCore.showError(alertEl, "Please enter your Prior Cumulative GPA when Prior Completed Credits is greater than zero.");
      }

      var semGpa = totalPoints / totalCredits;
      var cumCredits = totalCredits + priorCred.value;
      var cumPoints = totalPoints + priorGpa.value * priorCred.value;
      var cumGpa = cumCredits > 0 ? cumPoints / cumCredits : semGpa;

      gpaEl.textContent = semGpa.toFixed(2);
      cumEl.textContent = cumGpa.toFixed(2);
      creditsEl.textContent = CalcCore.formatNumber(totalCredits, 1);
      pointsEl.textContent = totalPoints.toFixed(2);
    }

    addBtn.addEventListener("click", function () {
      rowsContainer.appendChild(createRow("4.0", 3));
    });

    rowsContainer.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-remove-row") && rowsContainer.children.length > 1) {
        e.target.closest(".form-grid").remove();
        calculate();
      }
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      seedRows();
      root.querySelector("#gpa-prior").value = "";
      root.querySelector("#gpa-prior-cred").value = "";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Semester GPA: " + gpaEl.textContent + " | Cumulative GPA: " + cumEl.textContent; });
    seedRows();
    calculate();
  }

  /* 2. Weighted Grade Calculator */
  function initGradeCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var rowsContainer = root.querySelector("[data-grade-rows]");
    var addBtn = root.querySelector("[data-add-row]");

    var gradeEl = root.querySelector("[data-res-grade]");
    var letterEl = root.querySelector("[data-res-letter]");
    var weightEl = root.querySelector("[data-res-weight]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function createRow(score, weight) {
      var row = document.createElement("div");
      row.className = "form-grid";
      row.style.marginBottom = "0.75rem";
      row.innerHTML =
        '<div class="form-group"><input type="number" step="any" class="form-control" data-gr-score value="' + score + '" aria-label="Grade percent" placeholder="Score %" /></div>' +
        '<div class="form-group" style="display:flex;flex-direction:row;gap:0.5rem;">' +
        '<input type="number" step="any" class="form-control" data-gr-weight value="' + weight + '" aria-label="Weight percent" placeholder="Weight %" />' +
        '<button type="button" class="btn btn-secondary" data-remove-row aria-label="Remove item">&times;</button></div>';
      return row;
    }

    function seedRows() {
      rowsContainer.innerHTML = "";
      [[88, 25], [92, 25], [84, 30]].forEach(function (item) {
        rowsContainer.appendChild(createRow(item[0], item[1]));
      });
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var scores = rowsContainer.querySelectorAll("[data-gr-score]");
      var weights = rowsContainer.querySelectorAll("[data-gr-weight]");
      var totalW = 0, weightedSum = 0;

      for (var i = 0; i < scores.length; i++) {
        var sRes = CalcCore.readNumber(scores[i], "Item " + (i + 1) + " score", { min: 0, max: 200 });
        var wRes = CalcCore.readNumber(weights[i], "Item " + (i + 1) + " weight", { gt: 0, max: 100 });
        if (!sRes.ok) return CalcCore.showError(alertEl, sRes.error);
        if (!wRes.ok) return CalcCore.showError(alertEl, wRes.error);
        totalW += wRes.value;
        weightedSum += sRes.value * wRes.value;
      }

      var avg = weightedSum / totalW;
      gradeEl.textContent = avg.toFixed(2) + "%";
      letterEl.textContent = getLetterGrade(avg);
      weightEl.textContent = totalW.toFixed(1) + "%";
    }

    addBtn.addEventListener("click", function () { rowsContainer.appendChild(createRow(90, 20)); });
    rowsContainer.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-remove-row") && rowsContainer.children.length > 1) {
        e.target.closest(".form-grid").remove();
        calculate();
      }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () { seedRows(); calculate(); });
    CalcCore.bindCopyButton(copyBtn, function () { return "Course Grade: " + gradeEl.textContent + " (" + letterEl.textContent + ")"; });
    seedRows();
    calculate();
  }

  /* 3. Exam Score Calculator (Raw Test Score & Penalty Grading) */
  function initExamScoreCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var pctEl = root.querySelector("[data-res-pct]");
    var subEl = root.querySelector("[data-res-sub]");
    var letterEl = root.querySelector("[data-res-letter]");
    var pointsEl = root.querySelector("[data-res-points]");
    var wrongEl = root.querySelector("[data-res-wrong]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var total = CalcCore.readNumber(root.querySelector("#es-total"), "Total questions", { gt: 0, max: 10000 });
      var correct = CalcCore.readNumber(root.querySelector("#es-correct"), "Correct answers", { min: 0 });
      var penalty = CalcCore.readNumber(root.querySelector("#es-penalty"), "Wrong-answer penalty", { min: 0, max: 5, optional: true, defaultValue: 0 });
      var passMark = CalcCore.readNumber(root.querySelector("#es-pass"), "Passing grade %", { min: 0, max: 100, optional: true, defaultValue: 60 });

      var checks = [total, correct, penalty, passMark];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }
      if (correct.value > total.value) {
        return CalcCore.showError(alertEl, "Correct answers cannot exceed total questions.");
      }

      var wrongCount = total.value - correct.value;
      var netScore = Math.max(0, correct.value - wrongCount * penalty.value);
      var pct = (netScore / total.value) * 100;
      var status = pct >= passMark.value ? "Pass" : "Below pass mark";

      pctEl.textContent = pct.toFixed(2) + "%";
      if (subEl) subEl.textContent = CalcCore.formatNumber(netScore, 2) + " / " + CalcCore.formatNumber(total.value, 2) + " net points · " + status + " (" + passMark.value + "% min)";
      letterEl.textContent = getLetterGrade(pct);
      pointsEl.textContent = CalcCore.formatNumber(netScore, 2) + " / " + CalcCore.formatNumber(total.value, 2);
      wrongEl.textContent = CalcCore.formatNumber(wrongCount, 2);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#es-total").value = "50";
      root.querySelector("#es-correct").value = "43";
      root.querySelector("#es-penalty").value = "0";
      root.querySelector("#es-pass").value = "60";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Exam Score: " + pctEl.textContent + " (" + letterEl.textContent + ")"; });
    calculate();
  }

  /* 5. Final Exam Calculator (Minimum Score Needed) */
  function initFinalExamCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var reqEl = root.querySelector("[data-res-required]");
    var noteEl = root.querySelector("[data-res-note]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var current = CalcCore.readNumber(root.querySelector("#fe-current"), "Current grade", { min: 0, max: 200 });
      var target = CalcCore.readNumber(root.querySelector("#fe-target"), "Target grade", { min: 0, max: 200 });
      var weight = CalcCore.readNumber(root.querySelector("#fe-weight"), "Final exam weight", { gt: 0, max: 100 });

      if (!current.ok) return CalcCore.showError(alertEl, current.error);
      if (!target.ok) return CalcCore.showError(alertEl, target.error);
      if (!weight.ok) return CalcCore.showError(alertEl, weight.error);

      var w = weight.value / 100;
      var required = (target.value - current.value * (1 - w)) / w;
      reqEl.textContent = required.toFixed(2) + "%";

      if (required > 100) {
        noteEl.textContent = "Exceeds 100% — you would need extra credit to reach " + target.value + "%.";
      } else if (required <= 0) {
        noteEl.textContent = "You have already secured at least " + target.value + "% before taking the final exam.";
      } else {
        noteEl.textContent = "Achievable target: score at least " + required.toFixed(1) + "% on the final exam.";
      }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#fe-current").value = "84";
      root.querySelector("#fe-target").value = "90";
      root.querySelector("#fe-weight").value = "30";
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Required Final Exam Score: " + reqEl.textContent; });
    calculate();
  }

  /* 4. Weighted Average Calculator */
  function initWeightedAverageCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var rowsContainer = root.querySelector("[data-wa-rows]");
    var addBtn = root.querySelector("[data-add-row]");

    var resEl = root.querySelector("[data-res-wa]");
    var simpleEl = root.querySelector("[data-res-simple]");
    var weightsSumEl = root.querySelector("[data-res-weights]");
    var copyBtn = root.querySelector("[data-copy-result]");

    function createRow(val, wt) {
      var row = document.createElement("div");
      row.className = "form-grid";
      row.style.marginBottom = "0.75rem";
      row.innerHTML =
        '<div class="form-group"><input type="number" step="any" class="form-control" data-wa-val value="' + val + '" aria-label="Data value" placeholder="Value" /></div>' +
        '<div class="form-group" style="display:flex;flex-direction:row;gap:0.5rem;">' +
        '<input type="number" step="any" class="form-control" data-wa-wt value="' + wt + '" aria-label="Weight" placeholder="Weight" />' +
        '<button type="button" class="btn btn-secondary" data-remove-row aria-label="Remove row">&times;</button></div>';
      return row;
    }

    function seedRows() {
      rowsContainer.innerHTML = "";
      [[85, 2], [90, 3], [78, 1]].forEach(function (item) {
        rowsContainer.appendChild(createRow(item[0], item[1]));
      });
    }

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var vals = rowsContainer.querySelectorAll("[data-wa-val]");
      var wts = rowsContainer.querySelectorAll("[data-wa-wt]");
      var sumW = 0, sumVW = 0, sumV = 0;

      for (var i = 0; i < vals.length; i++) {
        var vRes = CalcCore.readNumber(vals[i], "Row " + (i + 1) + " value");
        var wRes = CalcCore.readNumber(wts[i], "Row " + (i + 1) + " weight", { min: 0 });
        if (!vRes.ok) return CalcCore.showError(alertEl, vRes.error);
        if (!wRes.ok) return CalcCore.showError(alertEl, wRes.error);
        sumW += wRes.value;
        sumVW += vRes.value * wRes.value;
        sumV += vRes.value;
      }

      if (sumW <= 0) return CalcCore.showError(alertEl, "Sum of weights must be greater than zero.");

      resEl.textContent = CalcCore.formatNumber(sumVW / sumW, 4);
      simpleEl.textContent = CalcCore.formatNumber(sumV / vals.length, 4);
      weightsSumEl.textContent = CalcCore.formatNumber(sumW, 4);
    }

    addBtn.addEventListener("click", function () { rowsContainer.appendChild(createRow(80, 1)); });
    rowsContainer.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-remove-row") && rowsContainer.children.length > 1) {
        e.target.closest(".form-grid").remove();
        calculate();
      }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    root.querySelector("[data-calc-reset]").addEventListener("click", function () { seedRows(); calculate(); });
    CalcCore.bindCopyButton(copyBtn, function () { return "Weighted Average: " + resEl.textContent; });
    seedRows();
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var map = {
      "calc-gpa": initGpaCalculator,
      "calc-grade": initGradeCalculator,
      "calc-exam-score": initExamScoreCalculator,
      "calc-weighted-average": initWeightedAverageCalculator,
      "calc-final-exam": initFinalExamCalculator
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) map[id](el);
    });
  });
})();

/* ==========================================================================
   CalcMaster Business & Marketing Calculators (All 6 Tools)
   ROI, ROAS, Break-Even, Revenue, Profit, Markup
   ========================================================================== */
(function () {
  "use strict";

  /* 1. ROI Calculator */
  function initRoiCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#roi-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var roiEl = root.querySelector("[data-res-roi]");
    var profitEl = root.querySelector("[data-res-profit]");
    var annEl = root.querySelector("[data-res-annualized]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var invested = CalcCore.readNumber(root.querySelector("#roi-cost"), "Amount invested", { gt: 0 });
      var returned = CalcCore.readNumber(root.querySelector("#roi-return"), "Amount returned", { min: 0 });
      var years = CalcCore.readNumber(root.querySelector("#roi-years"), "Investment length (years)", { gt: 0 });

      if (!invested.ok) return CalcCore.showError(alertEl, invested.error);
      if (!returned.ok) return CalcCore.showError(alertEl, returned.error);
      if (!years.ok) return CalcCore.showError(alertEl, years.error);

      var cur = currencyEl.value;
      var netProfit = returned.value - invested.value;
      var roi = (netProfit / invested.value) * 100;
      var annRoi = (Math.pow(returned.value / invested.value, 1 / years.value) - 1) * 100;

      roiEl.textContent = (roi > 0 ? "+" : "") + roi.toFixed(2) + "%";
      profitEl.textContent = CalcCore.formatCurrency(netProfit, cur);
      annEl.textContent = Number.isFinite(annRoi) ? annRoi.toFixed(2) + "% / yr" : "—";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#roi-cost").value = "10000";
      root.querySelector("#roi-return").value = "14500";
      root.querySelector("#roi-years").value = "2";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "ROI: " + roiEl.textContent + " (Net Profit: " + profitEl.textContent + ")"; });
    calculate();
  }

  /* 2. ROAS Calculator */
  function initRoasCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#roas-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var ratioEl = root.querySelector("[data-res-ratio]");
    var pctEl = root.querySelector("[data-res-pct]");
    var merEl = root.querySelector("[data-res-mer]");
    var beEl = root.querySelector("[data-res-be]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var spend = CalcCore.readNumber(root.querySelector("#roas-spend"), "Ad spend", { gt: 0 });
      var rev = CalcCore.readNumber(root.querySelector("#roas-rev"), "Ad revenue", { min: 0 });
      var margin = CalcCore.readNumber(root.querySelector("#roas-margin"), "Gross margin %", { gt: 0, max: 100, optional: true, defaultValue: 50 });

      if (!spend.ok) return CalcCore.showError(alertEl, spend.error);
      if (!rev.ok) return CalcCore.showError(alertEl, rev.error);
      if (!margin.ok) return CalcCore.showError(alertEl, margin.error);

      var roas = rev.value / spend.value;
      var roasPct = roas * 100;
      var acos = rev.value > 0 ? (spend.value / rev.value) * 100 : 0;
      var breakEvenRoas = 100 / margin.value;

      ratioEl.textContent = roas.toFixed(2) + "x (" + roas.toFixed(2) + ":1)";
      pctEl.textContent = roasPct.toFixed(0) + "%";
      merEl.textContent = acos.toFixed(2) + "%";
      beEl.textContent = breakEvenRoas.toFixed(2) + "x";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#roas-spend").value = "2500";
      root.querySelector("#roas-rev").value = "11250";
      root.querySelector("#roas-margin").value = "50";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "ROAS: " + ratioEl.textContent; });
    calculate();
  }

  /* 3. Break-Even Calculator */
  function initBreakEvenCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#be-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var unitsEl = root.querySelector("[data-res-units]");
    var revEl = root.querySelector("[data-res-rev]");
    var cmEl = root.querySelector("[data-res-cm]");
    var cmPctEl = root.querySelector("[data-res-cm-pct]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var fixed = CalcCore.readNumber(root.querySelector("#be-fixed"), "Fixed costs", { min: 0 });
      var price = CalcCore.readNumber(root.querySelector("#be-price"), "Unit selling price", { gt: 0 });
      var variable = CalcCore.readNumber(root.querySelector("#be-var"), "Variable cost per unit", { min: 0 });

      if (!fixed.ok) return CalcCore.showError(alertEl, fixed.error);
      if (!price.ok) return CalcCore.showError(alertEl, price.error);
      if (!variable.ok) return CalcCore.showError(alertEl, variable.error);

      var cm = price.value - variable.value;
      if (cm <= 0) {
        return CalcCore.showError(alertEl, "Selling price must be greater than variable cost per unit to reach break-even.");
      }

      var cur = currencyEl.value;
      var exactUnits = fixed.value / cm;
      var roundedUnits = Math.ceil(exactUnits);
      var beRevenue = exactUnits * price.value;
      var cmRatio = (cm / price.value) * 100;

      unitsEl.textContent = CalcCore.formatNumber(roundedUnits, 0) + " units (" + exactUnits.toFixed(1) + ")";
      revEl.textContent = CalcCore.formatCurrency(beRevenue, cur);
      cmEl.textContent = CalcCore.formatCurrency(cm, cur) + " / unit";
      cmPctEl.textContent = cmRatio.toFixed(2) + "%";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#be-fixed").value = "12000";
      root.querySelector("#be-price").value = "45";
      root.querySelector("#be-var").value = "20";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Break-Even: " + unitsEl.textContent + " | Revenue: " + revEl.textContent; });
    calculate();
  }

  /* 4. Revenue Calculator */
  function initRevenueCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#rev-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var netEl = root.querySelector("[data-res-net]");
    var grossEl = root.querySelector("[data-res-gross]");
    var discEl = root.querySelector("[data-res-disc]");
    var unitNetEl = root.querySelector("[data-res-unit]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var units = CalcCore.readNumber(root.querySelector("#rev-units"), "Units sold", { gt: 0 });
      var price = CalcCore.readNumber(root.querySelector("#rev-price"), "Unit price", { gt: 0 });
      var disc = CalcCore.readNumber(root.querySelector("#rev-disc"), "Average discount %", { min: 0, max: 100, optional: true, defaultValue: 0 });
      var refund = CalcCore.readNumber(root.querySelector("#rev-refund"), "Refund rate %", { min: 0, max: 100, optional: true, defaultValue: 0 });

      var checks = [units, price, disc, refund];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var gross = units.value * price.value;
      var discAmt = gross * (disc.value / 100);
      var afterDisc = gross - discAmt;
      var refundAmt = afterDisc * (refund.value / 100);
      var net = afterDisc - refundAmt;

      netEl.textContent = CalcCore.formatCurrency(net, cur);
      grossEl.textContent = CalcCore.formatCurrency(gross, cur);
      discEl.textContent = CalcCore.formatCurrency(discAmt + refundAmt, cur);
      unitNetEl.textContent = CalcCore.formatCurrency(net / units.value, cur);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#rev-units").value = "500";
      root.querySelector("#rev-price").value = "79";
      root.querySelector("#rev-disc").value = "10";
      root.querySelector("#rev-refund").value = "3";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Net Revenue: " + netEl.textContent; });
    calculate();
  }

  /* 5. Profit Calculator */
  function initProfitCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#prof-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var netEl = root.querySelector("[data-res-net]");
    var grossEl = root.querySelector("[data-res-gross]");
    var ebitEl = root.querySelector("[data-res-ebit]");
    var marginEl = root.querySelector("[data-res-margin]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var rev = CalcCore.readNumber(root.querySelector("#prof-rev"), "Total revenue", { gt: 0 });
      var cogs = CalcCore.readNumber(root.querySelector("#prof-cogs"), "Cost of goods sold", { min: 0 });
      var opex = CalcCore.readNumber(root.querySelector("#prof-opex"), "Operating expenses", { min: 0 });
      var tax = CalcCore.readNumber(root.querySelector("#prof-tax"), "Effective tax rate %", { min: 0, max: 100, optional: true, defaultValue: 0 });

      var checks = [rev, cogs, opex, tax];
      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].ok) return CalcCore.showError(alertEl, checks[i].error);
      }

      var cur = currencyEl.value;
      var gross = rev.value - cogs.value;
      var ebit = gross - opex.value;
      var taxAmt = ebit > 0 ? ebit * (tax.value / 100) : 0;
      var net = ebit - taxAmt;
      var netMargin = (net / rev.value) * 100;

      netEl.textContent = CalcCore.formatCurrency(net, cur);
      grossEl.textContent = CalcCore.formatCurrency(gross, cur);
      ebitEl.textContent = CalcCore.formatCurrency(ebit, cur);
      marginEl.textContent = netMargin.toFixed(2) + "%";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#prof-rev").value = "80000";
      root.querySelector("#prof-cogs").value = "32000";
      root.querySelector("#prof-opex").value = "22000";
      root.querySelector("#prof-tax").value = "21";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Net Profit: " + netEl.textContent + " (" + marginEl.textContent + ")"; });
    calculate();
  }

  /* 6. Markup Calculator */
  function initMarkupCalculator(root) {
    var form = root.querySelector("[data-calc-form]");
    var alertEl = root.querySelector("[data-calc-alert]");
    var currencyEl = root.querySelector("#mk-currency");
    var prefixEls = root.querySelectorAll("[data-currency-symbol]");

    var priceEl = root.querySelector("[data-res-price]");
    var profitEl = root.querySelector("[data-res-profit]");
    var marginEl = root.querySelector("[data-res-margin]");
    var copyBtn = root.querySelector("[data-copy-result]");

    CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);

    function calculate() {
      CalcCore.clearError(alertEl, form);
      var cost = CalcCore.readNumber(root.querySelector("#mk-cost"), "Unit cost", { gt: 0 });
      var pct = CalcCore.readNumber(root.querySelector("#mk-pct"), "Markup percentage", { min: 0, max: 10000 });

      if (!cost.ok) return CalcCore.showError(alertEl, cost.error);
      if (!pct.ok) return CalcCore.showError(alertEl, pct.error);

      var cur = currencyEl.value;
      var profit = cost.value * (pct.value / 100);
      var sellPrice = cost.value + profit;
      var grossMargin = (profit / sellPrice) * 100;

      priceEl.textContent = CalcCore.formatCurrency(sellPrice, cur);
      profitEl.textContent = CalcCore.formatCurrency(profit, cur);
      marginEl.textContent = grossMargin.toFixed(2) + "%";
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
    currencyEl.addEventListener("change", calculate);
    root.querySelector("[data-calc-reset]").addEventListener("click", function () {
      root.querySelector("#mk-cost").value = "40";
      root.querySelector("#mk-pct").value = "50";
      currencyEl.value = "USD";
      CalcCore.bindCurrencyPrefix(currencyEl, prefixEls);
      calculate();
    });
    CalcCore.bindCopyButton(copyBtn, function () { return "Selling Price: " + priceEl.textContent + " (Margin: " + marginEl.textContent + ")"; });
    calculate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var map = {
      "calc-roi": initRoiCalculator,
      "calc-roas": initRoasCalculator,
      "calc-break-even": initBreakEvenCalculator,
      "calc-revenue": initRevenueCalculator,
      "calc-profit": initProfitCalculator,
      "calc-markup": initMarkupCalculator
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) map[id](el);
    });
  });
})();
