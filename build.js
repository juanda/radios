import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from "fs";
import { join } from "path";

const srcDir = join(import.meta.dir, "src");
const distDir = join(import.meta.dir, "dist");

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

// Configuración de las radios
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

// Crear directorio dist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copiar todos los archivos de src a dist
function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

copyDir(srcDir, distDir);

// Generar radios.json con la configuración
writeFileSync(
  join(distDir, "radios.json"),
  JSON.stringify(radiosConfig, null, 2)
);

console.log("✅ Build completado en ./dist");
console.log("📻 Configuración de radios generada en radios.json");
