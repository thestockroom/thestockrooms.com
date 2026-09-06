(function () {
  const app = document.getElementById("terminalApp");
  if (!app) return;

  const $ = (s) => document.querySelector(s);

  const tabs = [...document.querySelectorAll(".symbol-tab")];
  const tfs = [...document.querySelectorAll(".tf")];

  const names = {
    BTCUSDT: "BTC / USDT",
    XAUUSD: "Gold / USD",
    XAGUSD: "Silver / USD"
  };

  const basePrices = {
    BTCUSDT: 65000,
    XAUUSD: 3500,
    XAGUSD: 40
  };

  let selected = "BTCUSDT";
  let side = "BUY";
  let position = null;
  let btcPrice = basePrices.BTCUSDT;

  let state = JSON.parse(
    localStorage.getItem("tsr_demo_terminal") || "null"
  ) || {
    balance: 5000,
    history: []
  };

  function money(value) {
    return "$" + Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function save() {
    localStorage.setItem(
      "tsr_demo_terminal",
      JSON.stringify(state)
    );
  }

  function quote() {
    if (selected === "BTCUSDT") {
      return btcPrice;
    }

    const base = basePrices[selected];
    const t = Date.now() / 1000;

    return base +
      Math.sin(t / 8) * base * 0.0015 +
      Math.sin(t / 21) * base * 0.0008;
  }

  function calculatePnL(pos, price) {
    const difference =
      pos.side === "BUY"
        ? price - pos.entry
        : pos.entry - price;

    return difference * pos.lot * pos.mult;
  }

  function render() {
    if ($("#balance")) {
      $("#balance").textContent = money(state.balance);
    }

    const pnl = position ? position.pnl : 0;

    if ($("#equity")) {
      $("#equity").textContent =
        money(state.balance + pnl);
    }

    if ($("#openPnl")) {
      $("#openPnl").textContent =
        (pnl >= 0 ? "+" : "") + money(pnl);
    }

    if ($("#positionEmpty")) {
      $("#positionEmpty").hidden = !!position;
    }

    if ($("#positionDetails")) {
      $("#positionDetails").hidden = !position;

      if (position) {
        $("#positionDetails").innerHTML =
          "<b>" +
          position.side +
          " " +
          position.name +
          "</b><br>" +
          "Lot: " +
          position.lot.toFixed(2) +
          "<br>" +
          "Entry: " +
          money(position.entry) +
          "<br>" +
          "Live P&L: " +
          (position.pnl >= 0 ? "+" : "") +
          money(position.pnl);
      }
    }

    if ($("#closePosition")) {
      $("#closePosition").disabled = !position;
    }

    if ($("#historyList")) {
      if (!state.history.length) {
        $("#historyList").innerHTML =
          "No trades yet.";
      } else {
        $("#historyList").innerHTML =
          state.history
            .slice(0, 8)
            .map(
              (x) =>
                '<div class="history-row">' +
                "<b>" +
                x.side +
                " " +
                x.name +
                "</b>" +
                "<span>" +
                (x.pnl >= 0 ? "+" : "") +
                money(x.pnl) +
                "</span>" +
                "</div>"
            )
            .join("");
      }
    }
  }

  /* ---------------- CHART ---------------- */

  const canvas = document.getElementById("priceCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  let candles = [];

  function generateChartData() {
    const base = quote();
    candles = [];

    for (let i = 0; i < 80; i++) {
      const wave =
        Math.sin(i / 5) * base * 0.002 +
        Math.sin(i / 11) * base * 0.001;

      candles.push({
        value: base + wave
      });
    }
  }

  function drawChart() {
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    /* Grid */

    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;

    for (let y = 30; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let x = 0; x < width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (!candles.length) {
      generateChartData();
    }

    const values = candles.map((c) => c.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.beginPath();

    values.forEach((value, i) => {
      const x =
        (i / (values.length - 1)) *
        (width - 20) +
        10;

      const y =
        height -
        ((value - min) / range) *
          (height - 40) -
        20;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "#d6b35a";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Current price */

    const price = quote();

    ctx.fillStyle = "#d6b35a";
    ctx.font = "bold 13px Arial";

    ctx.fillText(
      money(price),
      width - 110,
      25
    );
  }

  function updateChart() {
    if (!candles.length) {
      generateChartData();
    }

    const current = quote();

    candles.push({
      value: current
    });

    if (candles.length > 100) {
      candles.shift();
    }

    drawChart();
  }

  window.addEventListener("resize", drawChart);

  /* ---------------- SYMBOLS ---------------- */

  function selectSymbol(tab) {
    selected =
      tab.dataset.symbol || "BTCUSDT";

    tabs.forEach((x) =>
      x.classList.toggle("active", x === tab)
    );

    if ($("#marketName")) {
      $("#marketName").textContent =
        tab.dataset.name || names[selected];
    }

    if ($("#quoteName")) {
      $("#quoteName").textContent =
        tab.dataset.name || names[selected];
    }

    if ($("#entryPrice")) {
      $("#entryPrice").value = "";
    }

    if ($("#exitPrice")) {
      $("#exitPrice").value = "";
    }

    candles = [];
    generateChartData();
    drawChart();
    updateQuote();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      selectSymbol(tab);
    });
  });

  /* ---------------- TIMEFRAMES ---------------- */

  tfs.forEach((tf) => {
    tf.addEventListener("click", () => {
      tfs.forEach((x) =>
        x.classList.remove("active")
      );

      tf.classList.add("active");

      candles = [];
      generateChartData();
      drawChart();
    });
  });

  /* ---------------- BUY / SELL ---------------- */

  if ($("#buyBtn")) {
    $("#buyBtn").addEventListener("click", () => {
      side = "BUY";

      $("#buyBtn").classList.add("active");
      $("#sellBtn")?.classList.remove("active");

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "BUY selected — virtual demo order.";
      }
    });
  }

  if ($("#sellBtn")) {
    $("#sellBtn").addEventListener("click", () => {
      side = "SELL";

      $("#sellBtn").classList.add("active");
      $("#buyBtn")?.classList.remove("active");

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "SELL selected — virtual demo order.";
      }
    });
  }

  /* ---------------- LOT SIZE ---------------- */

  $("#lotInput")?.addEventListener(
    "input",
    (e) => {
      let value = Number(e.target.value);

      if (value > 0.20) {
        e.target.value = "0.20";
      }

      if (value < 0.01 && e.target.value !== "") {
        e.target.value = "0.01";
      }
    }
  );

  /* ---------------- OPEN ORDER ---------------- */

  $("#placeOrder")?.addEventListener(
    "click",
    () => {
      if (position) {
        $("#orderStatus").textContent =
          "Close the current position first.";
        return;
      }

      const lot =
        Number($("#lotInput")?.value || 0);

      if (lot < 0.01 || lot > 0.20) {
        $("#orderStatus").textContent =
          "Lot size must be between 0.01 and 0.20.";
        return;
      }

      const price = quote();

      position = {
        side: side,
        name: names[selected],
        lot: lot,
        entry: price,

        /* Demo calculation only */
        mult:
          selected === "XAGUSD"
            ? 10
            : 1,

        pnl: 0
      };

      if ($("#entryPrice")) {
        $("#entryPrice").value =
          price.toFixed(2);
      }

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Virtual " +
          side +
          " opened at " +
          money(price) +
          ".";
      }

      render();
    }
  );

  /* ---------------- CLOSE ORDER ---------------- */

  $("#closePosition")?.addEventListener(
    "click",
    () => {
      if (!position) return;

      const price = quote();

      const pnl =
        calculatePnL(position, price);

      state.balance += pnl;

      state.history.unshift({
        side: position.side,
        name: position.name,
        pnl: pnl
      });

      if ($("#exitPrice")) {
        $("#exitPrice").value =
          price.toFixed(2);
      }

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Virtual position closed. P&L: " +
          (pnl >= 0 ? "+" : "") +
          money(pnl);
      }

      position = null;

      save();
      render();
    }
  );

  /* ---------------- RESET ---------------- */

  $("#resetTerminal")?.addEventListener(
    "click",
    () => {
      const ok = confirm(
        "Reset demo balance and trade history?"
      );

      if (!ok) return;

      state = {
        balance: 5000,
        history: []
      };

      position = null;

      save();
      render();

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Demo reset to $5,000.";
      }
    }
  );

  /* ---------------- FULL SCREEN ---------------- */

  function enterFullscreen() {
    app.classList.add(
      "immersive-fullscreen"
    );

    if (!document.fullscreenElement) {
      app.requestFullscreen?.().catch(() => {});
    }

    setTimeout(drawChart, 300);
  }

  function exitFullscreen() {
    app.classList.remove(
      "immersive-fullscreen"
    );

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    setTimeout(drawChart, 300);
  }

  $("#fullscreenBtn")?.addEventListener(
    "click",
    () => {
      if (
        app.classList.contains(
          "immersive-fullscreen"
        )
      ) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    }
  );

  $("#chartFullscreen")?.addEventListener(
    "click",
    enterFullscreen
  );

  document.addEventListener(
    "fullscreenchange",
    () => {
      if (!document.fullscreenElement) {
        app.classList.remove(
          "immersive-fullscreen"
        );
      }

      setTimeout(drawChart, 300);
    }
  );

  /* ---------------- BTC PUBLIC PRICE ---------------- */

  try {
    const socket = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@trade"
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.p) {
        btcPrice = Number(data.p);

        if (selected === "BTCUSDT") {
          updateQuote();
          updateChart();
        }
      }
    };
  } catch (error) {
    console.log(
      "BTC public feed unavailable."
    );
  }

  /* ---------------- QUOTE / P&L ---------------- */

  function updateQuote() {
    const price = quote();

    if ($("#quotePrice")) {
      $("#quotePrice").textContent =
        money(price);
    }

    if ($("#quoteHint")) {
      $("#quoteHint").textContent =
        selected === "BTCUSDT"
          ? "BTC public market feed · demo orders only"
          : "Demo quote · virtual trading only";
    }

    if (position) {
      position.pnl =
        calculatePnL(
          position,
          price
        );

      render();
    }

    drawChart();
  }

  /* ---------------- START ---------------- */

  render();
  generateChartData();
  drawChart();
  updateQuote();

  setInterval(updateQuote, 1000);
})();
