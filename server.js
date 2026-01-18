import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Cargar variables de entorno desde .env
function loadEnv() {
  const envPath = join(import.meta.dir, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const env = {};
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        env[key.trim()] = valueParts.join("=").trim();
      }
    });
    return env;
  }
  return {};
}

const env = loadEnv();

// Configuración de las radios usando variables de entorno
const radiosConfig = {
  radios: [
    {
      id: "cadena-ser",
      name: "Cadena SER",
      streamUrl: env.CADENA_SER_URL || "",
      image: "images/cadena-ser.svg",
      color: "#e31837"
    },
    {
      id: "rne-radio1",
      name: "RNE Radio 1",
      streamUrl: env.RNE_RADIO1_URL || "",
      image: "images/rne-radio1.svg",
      color: "#1a5f7a"
    },
    {
      id: "rne-radio3",
      name: "RNE Radio 3",
      streamUrl: env.RNE_RADIO3_URL || "",
      image: "images/rne-radio3.svg",
      color: "#8b5cf6"
    },
    {
      id: "rne-radio5",
      name: "RNE Radio 5",
      streamUrl: env.RNE_RADIO5_URL || "",
      image: "images/rne-radio5.svg",
      color: "#059669"
    },
    {
      id: "rne-radioclasica",
      name: "Radio Clásica",
      streamUrl: env.RNE_RADIOCLASICA_URL || "",
      image: "images/rne-radioclasica.svg",
      color: "#b45309"
    },
    {
      id: "radio-marca",
      name: "Radio Marca",
      streamUrl: env.RADIO_MARCA_URL || "",
      image: "images/radio-marca.svg",
      color: "#dc2626"
    }
  ]
};

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json"
};

const BASE_PATH = "/radios";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Redirigir / a /radios/
    if (pathname === "/") {
      return Response.redirect(`${url.origin}${BASE_PATH}/`, 302);
    }

    // API endpoint para la configuración de radios
    if (pathname === `${BASE_PATH}/api/radios`) {
      return new Response(JSON.stringify(radiosConfig), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verificar que la ruta empiece con /radios
    if (!pathname.startsWith(BASE_PATH)) {
      return new Response("Not Found", { status: 404 });
    }

    // Quitar el prefijo /radios para buscar el archivo
    let filePath = pathname.slice(BASE_PATH.length) || "/";

    // Servir index.html para /radios/
    if (filePath === "/" || filePath === "") {
      filePath = "/index.html";
    }

    const fullPath = join(import.meta.dir, "src", filePath);

    try {
      const file = Bun.file(fullPath);
      const exists = await file.exists();

      if (exists) {
        const ext = filePath.substring(filePath.lastIndexOf("."));
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new Response(file, {
          headers: { "Content-Type": contentType }
        });
      }
    } catch (e) {
      // Archivo no encontrado
    }

    return new Response("Not Found", { status: 404 });
  }
});

console.log(`🎵 Servidor de desarrollo ejecutándose en http://localhost:${server.port}${BASE_PATH}/`);
