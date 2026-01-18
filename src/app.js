class RadioPlayer {
  constructor() {
    this.audio = document.getElementById("audio-player");
    this.container = document.getElementById("radios-container");
    this.nowPlaying = document.getElementById("now-playing");
    this.currentStation = document.getElementById("current-station");
    this.stopBtn = document.getElementById("stop-btn");

    this.radios = [];
    this.currentRadio = null;
    this.hls = null;

    this.init();
  }

  async init() {
    await this.loadRadios();
    this.renderCards();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  async loadRadios() {
    try {
      // En desarrollo usa /radios/api/radios, en producción usa radios.json
      const isDev = window.location.hostname === "localhost";
      const url = isDev ? "/radios/api/radios" : "radios.json";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error cargando configuración");

      const config = await response.json();
      this.radios = config.radios;
    } catch (error) {
      console.error("Error cargando radios:", error);
      this.container.innerHTML = `
        <div class="error-message">
          <p>Error cargando las emisoras</p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  renderCards() {
    this.container.innerHTML = this.radios.map(radio => `
      <article
        class="radio-card"
        data-id="${radio.id}"
        style="--card-color: ${radio.color}"
        role="button"
        tabindex="0"
        aria-label="Reproducir ${radio.name}"
      >
        <img
          src="${radio.image}"
          alt="Logo de ${radio.name}"
          class="radio-image"
          loading="lazy"
        >
        <h2 class="radio-name">${radio.name}</h2>
        <span class="radio-status"></span>
      </article>
    `).join("");
  }

  setupEventListeners() {
    // Click en cards
    this.container.addEventListener("click", (e) => {
      const card = e.target.closest(".radio-card");
      if (card) {
        this.playRadio(card.dataset.id);
      }
    });

    // Teclado en cards
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".radio-card");
        if (card) {
          e.preventDefault();
          this.playRadio(card.dataset.id);
        }
      }
    });

    // Botón detener
    this.stopBtn.addEventListener("click", () => this.stop());

    // Eventos del audio
    this.audio.addEventListener("playing", () => this.onPlaying());
    this.audio.addEventListener("waiting", () => this.onLoading());
    this.audio.addEventListener("error", (e) => this.onError(e));
    this.audio.addEventListener("ended", () => this.stop());

    // Media Session API para controles del sistema
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("stop", () => this.stop());
      navigator.mediaSession.setActionHandler("pause", () => this.stop());
    }
  }

  async playRadio(radioId) {
    const radio = this.radios.find(r => r.id === radioId);
    if (!radio) return;

    // Si es la misma radio, la detenemos
    if (this.currentRadio?.id === radioId && !this.audio.paused) {
      this.stop();
      return;
    }

    // Detener reproducción anterior
    this.destroyHls();

    // Actualizar UI
    this.setActiveCard(radioId);
    this.setCardLoading(radioId, true);
    this.currentRadio = radio;

    // Reproducir
    try {
      const isHls = radio.streamUrl.includes(".m3u8");

      if (isHls && typeof Hls !== "undefined" && Hls.isSupported()) {
        // Usar hls.js para streams HLS
        this.hls = new Hls();
        this.hls.loadSource(radio.streamUrl);
        this.hls.attachMedia(this.audio);
        this.hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          try {
            await this.audio.play();
            this.updateMediaSession(radio);
          } catch (e) {
            console.error("Error reproduciendo HLS:", e);
            this.setCardStatus(radioId, "Error al reproducir");
            this.setCardLoading(radioId, false);
          }
        });
        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("Error HLS fatal:", data);
            this.setCardStatus(radioId, "Error de conexión");
            this.setCardLoading(radioId, false);
          }
        });
      } else if (isHls && this.audio.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari soporta HLS nativamente
        this.audio.src = radio.streamUrl;
        await this.audio.play();
        this.updateMediaSession(radio);
      } else {
        // Stream MP3 directo
        this.audio.src = radio.streamUrl;
        await this.audio.play();
        this.updateMediaSession(radio);
      }
    } catch (error) {
      console.error("Error reproduciendo:", error);
      this.setCardStatus(radioId, "Error al reproducir");
      this.setCardLoading(radioId, false);
    }
  }

  destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  stop() {
    this.destroyHls();
    this.audio.pause();
    this.audio.src = "";

    if (this.currentRadio) {
      this.setCardStatus(this.currentRadio.id, "");
      this.removeActiveCard();
    }

    this.currentRadio = null;
    this.nowPlaying.classList.add("hidden");

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }
  }

  onPlaying() {
    if (!this.currentRadio) return;

    this.setCardLoading(this.currentRadio.id, false);
    this.setCardStatus(this.currentRadio.id, "En directo");
    this.currentStation.textContent = this.currentRadio.name;
    this.nowPlaying.classList.remove("hidden");

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  }

  onLoading() {
    if (!this.currentRadio) return;
    this.setCardLoading(this.currentRadio.id, true);
    this.setCardStatus(this.currentRadio.id, "Cargando...");
  }

  onError(e) {
    console.error("Error de audio:", e);
    if (this.currentRadio) {
      this.setCardLoading(this.currentRadio.id, false);
      this.setCardStatus(this.currentRadio.id, "Error de conexión");
    }
  }

  setActiveCard(radioId) {
    document.querySelectorAll(".radio-card").forEach(card => {
      card.classList.remove("active");
    });
    const card = document.querySelector(`[data-id="${radioId}"]`);
    if (card) card.classList.add("active");
  }

  removeActiveCard() {
    document.querySelectorAll(".radio-card").forEach(card => {
      card.classList.remove("active");
    });
  }

  setCardLoading(radioId, loading) {
    const card = document.querySelector(`[data-id="${radioId}"]`);
    if (card) {
      card.classList.toggle("loading", loading);
    }
  }

  setCardStatus(radioId, status) {
    const card = document.querySelector(`[data-id="${radioId}"]`);
    if (card) {
      const statusEl = card.querySelector(".radio-status");
      if (statusEl) statusEl.textContent = status;
    }
  }

  updateMediaSession(radio) {
    if ("mediaSession" in navigator) {
      const basePath = new URL(".", import.meta.url).href;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: radio.name,
        artist: "En directo",
        album: "Radios de España",
        artwork: [
          { src: new URL(radio.image, basePath).href, sizes: "96x96", type: "image/svg+xml" }
        ]
      });
    }
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const basePath = new URL(".", import.meta.url).pathname;
        await navigator.serviceWorker.register("sw.js", { scope: basePath });
        console.log("Service Worker registrado");
      } catch (error) {
        console.log("Service Worker no registrado:", error);
      }
    }
  }
}

// Iniciar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  new RadioPlayer();
});
