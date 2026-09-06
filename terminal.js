(function () {
  "use strict";

  const app = document.getElementById("terminalApp");
  if (!app) return;

  const $ = (selector) => app.querySelector(selector);
  const $$ = (selector) => [...app.querySelectorAll(selector)];

  const markets = {
    BTCUSDT: {
      name: "BTC / USDT",
      price: 65000,
      decimals: 2,
      multiplier: 1
    },
    XAUUSD: {
      name: "Gold / USD",
      price: 3500,
      decimals: 2,
      multiplier: 1
    },
    XAGUSD: {
      name: "Silver / USD",
      price: 40,
      decimals: 3,
      multiplier: 10
    }
  };

  let selected = "BTCUSDT";
  let orderSide = "BUY";
  let position = null;
  let btcLivePrice = 65000;
  let candles = [];
  let mouseX = null;
  let mouseY = null;

  const saved = localStorage.getItem("tsr_demo_terminal");

  let state = saved
    ? JSON.parse(saved)
    : {
        balance: 5000,
        history: []
      };

  function saveState() {
    localStorage.setItem(
      "tsr_demo_terminal",
      JSON.stringify(state)
    );
  }

  function money(value) {
    return (
      "$" +
      Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function getPrice() {
    if (selected === "BTCUSDT") {
      return btcLivePrice;
    }

    const base = markets[selected].price;
    const t = Date.now() / 1000;

    return (
      base +
      Math.sin(t / 7) * base * 0.0015 +
      Math.sin(t / 17) * base * 0.0008
    );
  }

  function calculatePnL(pos, currentPrice) {
    const difference =
      pos.side === "BUY"
        ? currentPrice - pos.entry
        : pos.entry - currentPrice;

    return difference * pos.lot * pos.multiplier;
  }

  /* -----------------------------
     CHART
  ----------------------------- */

  const canvas = document.getElementById("priceCanvas");
  const ctx = canvas
    ? canvas.getContext("2d")
    : null;

  function makeCandles() {
    const base = getPrice();

    candles = [];

    let price = base * 0.995;

    for (let i = 0; i < 100; i++) {
      const change =
        Math.sin(i / 5) * base * 0.001 +
        Math.cos(i / 9) * base * 0.0007;

      price += change;

      candles.push({
        open: price,
        close: price + Math.sin(i) * base * 0.0005,
        high: price + base * 0.001,
        low: price - base * 0.001
      });
    }
  }

  function resizeCanvas() {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    drawChart();
  }

  function drawChart() {
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    if (width < 10 || height < 10) return;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    if (!candles.length) {
      makeCandles();
    }

    /* Background */

    ctx.fillStyle = "#070707";
    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    /* Grid */

    ctx.strokeStyle =
      "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;

    for (let y = 0; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let x = 0; x < width; x += 65) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const highs = candles.map(
      (c) => c.high
    );

    const lows = candles.map(
      (c) => c.low
    );

    const max = Math.max(...highs);
    const min = Math.min(...lows);

    const range = max - min || 1;

    const left = 15;
    const right = width - 15;
    const top = 20;
    const bottom = height - 25;

    const step =
      (right - left) /
      Math.max(candles.length - 1, 1);

    /* Candles */

    candles.forEach((candle, index) => {
      const x =
        left + index * step;

      const openY =
        bottom -
        ((candle.open - min) / range) *
          (bottom - top);

      const closeY =
        bottom -
        ((candle.close - min) / range) *
          (bottom - top);

      const highY =
        bottom -
        ((candle.high - min) / range) *
          (bottom - top);

      const lowY =
        bottom -
        ((candle.low - min) / range) *
          (bottom - top);

      const bullish =
        candle.close >= candle.open;

      /* Wick */

      ctx.strokeStyle = bullish
        ? "#18c78f"
        : "#ef5350";

      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      /* Body */

      const bodyTop =
        Math.min(openY, closeY);

      const bodyBottom =
        Math.max(openY, closeY);

      const bodyHeight = Math.max(
        bodyBottom - bodyTop,
        2
      );

      ctx.fillStyle = bullish
        ? "#18c78f"
        : "#ef5350";

      ctx.fillRect(
        x - Math.max(step * 0.3, 2),
        bodyTop,
        Math.max(step * 0.6, 3),
        bodyHeight
      );
    });

    /* Current price */

    const current = getPrice();

    const currentY =
      bottom -
      ((current - min) / range) *
        (bottom - top);

    ctx.strokeStyle =
      "rgba(214,179,90,0.7)";

    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#d6b35a";
    ctx.font =
      "bold 13px Arial";

    ctx.fillText(
      money(current),
      Math.max(width - 105, 5),
      Math.max(currentY - 7, 15)
    );

    /* Crosshair */

    if (
      mouseX !== null &&
      mouseY !== null
    ) {
      ctx.strokeStyle =
        "rgba(255,255,255,0.35)";

      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(mouseX, 0);
      ctx.lineTo(mouseX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, mouseY);
      ctx.lineTo(width, mouseY);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  }

  function updateChart() {
    if (!candles.length) {
      makeCandles();
    }

    const price = getPrice();

    const last =
      candles[candles.length - 1];

    if (last) {
      last.close = price;
      last.high = Math.max(
        last.high,
        price
      );
      last.low = Math.min(
        last.low,
        price
      );
    }

    drawChart();
  }

  if (canvas) {
    canvas.addEventListener(
      "mousemove",
      (event) => {
        const rect =
          canvas.getBoundingClientRect();

        mouseX =
          event.clientX - rect.left;

        mouseY =
          event.clientY - rect.top;

        drawChart();
      }
    );

    canvas.addEventListener(
      "mouseleave",
      () => {
        mouseX = null;
        mouseY = null;
        drawChart();
      }
    );

    canvas.addEventListener(
      "touchmove",
      (event) => {
        const touch =
          event.touches[0];

        if (!touch) return;

        const rect =
          canvas.getBoundingClientRect();

        mouseX =
          touch.clientX - rect.left;

        mouseY =
          touch.clientY - rect.top;

        drawChart();
      },
      { passive: true }
    );

    canvas.addEventListener(
      "touchend",
      () => {
        mouseX = null;
        mouseY = null;
        drawChart();
      }
    );
  }

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  /* -----------------------------
     MARKET SELECTION
  ----------------------------- */

  $$(".symbol-tab").forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        selected =
          button.dataset.symbol;

        $$(".symbol-tab").forEach(
          (item) =>
            item.classList.toggle(
              "active",
              item === button
            )
        );

        const market =
          markets[selected];

        if ($("#marketName")) {
          $("#marketName").textContent =
            market.name;
        }

        if ($("#quoteName")) {
          $("#quoteName").textContent =
            market.name;
        }

        if ($("#entryPrice")) {
          $("#entryPrice").value = "";
        }

        if ($("#exitPrice")) {
          $("#exitPrice").value = "";
        }

        candles = [];
        makeCandles();
        updateQuote();
      }
    );
  });

  /* -----------------------------
     TIMEFRAMES
  ----------------------------- */

  $$(".tf").forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        $$(".tf").forEach(
          (item) =>
            item.classList.toggle(
              "active",
              item === button
            )
        );

        candles = [];
        makeCandles();
        drawChart();

        if ($("#feedStatus")) {
          $("#feedStatus").textContent =
            "Demo chart · " +
            button.textContent;
        }
      }
    );
  });

  /* -----------------------------
     BUY / SELL
  ----------------------------- */

  $("#buyBtn")?.addEventListener(
    "click",
    () => {
      orderSide = "BUY";

      $("#buyBtn").classList.add(
        "active"
      );

      $("#sellBtn")?.classList.remove(
        "active"
      );

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "BUY selected · virtual demo only.";
      }
    }
  );

  $("#sellBtn")?.addEventListener(
    "click",
    () => {
      orderSide = "SELL";

      $("#sellBtn").classList.add(
        "active"
      );

      $("#buyBtn")?.classList.remove(
        "active"
      );

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "SELL selected · virtual demo only.";
      }
    }
  );

  /* -----------------------------
     LOT SIZE
  ----------------------------- */

  $("#lotInput")?.addEventListener(
    "input",
    (event) => {
      let value =
        Number(event.target.value);

      if (value > 0.2) {
        event.target.value =
          "0.20";
      }

      if (
        value < 0.01 &&
        event.target.value !== ""
      ) {
        event.target.value =
          "0.01";
      }
    }
  );

  /* -----------------------------
     OPEN ORDER
  ----------------------------- */

  $("#placeOrder")?.addEventListener(
    "click",
    () => {
      if (position) {
        $("#orderStatus").textContent =
          "Close the current position first.";
        return;
      }

      const lot =
        Number(
          $("#lotInput")?.value
        );

      if (
        !lot ||
        lot < 0.01 ||
        lot > 0.20
      ) {
        $("#orderStatus").textContent =
          "Lot size must be between 0.01 and 0.20.";
        return;
      }

      const price = getPrice();

      position = {
        side: orderSide,
        name: markets[selected].name,
        lot: lot,
        entry: price,
        multiplier:
          markets[selected].multiplier,
        pnl: 0
      };

      if ($("#entryPrice")) {
        $("#entryPrice").value =
          price.toFixed(
            markets[selected].decimals
          );
      }

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Virtual " +
          orderSide +
          " opened at " +
          money(price) +
          ".";
      }

      render();
    }
  );

  /* -----------------------------
     CLOSE ORDER
  ----------------------------- */

  $("#closePosition")?.addEventListener(
    "click",
    () => {
      if (!position) return;

      const price = getPrice();

      const pnl =
        calculatePnL(
          position,
          price
        );

      state.balance += pnl;

      state.history.unshift({
        side: position.side,
        name: position.name,
        pnl: pnl
      });

      if ($("#exitPrice")) {
        $("#exitPrice").value =
          price.toFixed(
            markets[selected].decimals
          );
      }

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Virtual position closed · P&L " +
          (pnl >= 0 ? "+" : "") +
          money(pnl);
      }

      position = null;

      saveState();
      render();
    }
  );

  /* -----------------------------
     RESET
  ----------------------------- */

  $("#resetTerminal")?.addEventListener(
    "click",
    () => {
      if (
        !confirm(
          "Reset demo balance and trade history?"
        )
      ) {
        return;
      }

      state = {
        balance: 5000,
        history: []
      };

      position = null;

      saveState();
      render();

      if ($("#orderStatus")) {
        $("#orderStatus").textContent =
          "Demo reset to $5,000.";
      }
    }
  );

  /* -----------------------------
     RENDER
  ----------------------------- */

  function render() {
    const openPnl =
      position
        ? position.pnl
        : 0;

    if ($("#balance")) {
      $("#balance").textContent =
        money(state.balance);
    }

    if ($("#equity")) {
      $("#equity").textContent =
        money(
          state.balance +
          openPnl
        );
    }

    if ($("#openPnl")) {
      $("#openPnl").textContent =
        (openPnl >= 0 ? "+" : "") +
        money(openPnl);
    }

    if ($("#positionEmpty")) {
      $("#positionEmpty").hidden =
        !!position;
    }

    if ($("#positionDetails")) {
      $("#positionDetails").hidden =
        !position;

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
          (position.pnl >= 0
            ? "+"
            : "") +
          money(position.pnl);
      }
    }

    if ($("#closePosition")) {
      $("#closePosition").disabled =
        !position;
    }

    if ($("#historyList")) {
      if (!state.history.length) {
        $("#historyList").textContent =
          "No trades yet.";
      } else {
        $("#historyList").innerHTML =
          state.history
            .slice(0, 10)
            .map(
              (trade) =>
                '<div class="history-row">' +
                "<b>" +
                trade.side +
                " " +
                trade.name +
                "</b>" +
                "<span>" +
                (trade.pnl >= 0
                  ? "+"
                  : "") +
                money(trade.pnl) +
                "</span>" +
                "</div>"
            )
            .join("");
      }
    }
  }

  /* -----------------------------
     FULLSCREEN
  ----------------------------- */

  function enterFullscreen() {
    app.classList.add(
      "immersive-fullscreen"
    );

    if (
      !document.fullscreenElement &&
      app.requestFullscreen
    ) {
      app.requestFullscreen().catch(
        () => {}
      );
    }

    setTimeout(
      resizeCanvas,
      400
    );
  }

  function exitFullscreen() {
    app.classList.remove(
      "immersive-fullscreen"
    );

    if (
      document.fullscreenElement &&
      document.exitFullscreen
    ) {
      document.exitFullscreen().catch(
        () => {}
      );
    }

    setTimeout(
      resizeCanvas,
      400
    );
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

      setTimeout(
        resizeCanvas,
        300
      );
    }
  );

  /* -----------------------------
     BTC PUBLIC PRICE
  ----------------------------- */

  try {
    const socket =
      new WebSocket(
        "wss://stream.binance.com:9443/ws/btcusdt@trade"
      );

    socket.onmessage = (event) => {
      try {
        const data =
          JSON.parse(
            event.data
          );

        if (data.p) {
          btcLivePrice =
            Number(data.p);

          if (
            selected ===
            "BTCUSDT"
          ) {
            updateQuote();
          }
        }
      } catch (error) {
        console.log(
          "BTC feed parse error"
        );
      }
    };
  } catch (error) {
    console.log(
      "BTC public feed unavailable"
    );
  }

  /* -----------------------------
     LIVE UPDATE
  ----------------------------- */

  function updateQuote() {
    const price = getPrice();

    if ($("#quotePrice")) {
      $("#quotePrice").textContent =
        money(price);
    }

    if ($("#quoteHint")) {
      $("#quoteHint").textContent =
        selected === "BTCUSDT"
          ? "BTC public price · virtual orders only"
          : "Demo market quote · virtual orders only";
    }

    if (position) {
      position.pnl =
        calculatePnL(
          position,
          price
        );

      render();
    }

    updateChart();
  }

  /* -----------------------------
     START
  ----------------------------- */

  render();
  makeCandles();

  setTimeout(
    resizeCanvas,
    100
  );

  setTimeout(
    resizeCanvas,
    500
  );

  updateQuote();

  setInterval(
    updateQuote,
    1000
  );
})();
