# Radios de España

Aplicación web progresiva (PWA) para escuchar emisoras de radio españolas en streaming.

## Características

- Interfaz con cards para seleccionar emisoras
- Reproducción de audio en streaming (MP3 y HLS)
- Soporte HLS mediante [hls.js](https://github.com/video-dev/hls.js/) para streams de RTVE
- PWA instalable en dispositivos móviles y escritorio
- Funciona offline (interfaz cacheada)
- Integración con Media Session API (controles del sistema)
- Diseño responsive

## Emisoras incluidas

- Cadena SER
- RNE Radio 1
- RNE Radio 3
- RNE Radio 5
- Radio Clásica (RNE)
- Radio Marca

## Requisitos

- [Bun](https://bun.sh/) v1.0 o superior

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd radios

# Configurar las URLs de streaming
cp .env.example .env
# Editar .env con las URLs correctas
```

## Configuración

Edita el archivo `.env` con las URLs de streaming de cada emisora:

```env
CADENA_SER_URL=https://...
RNE_RADIO1_URL=https://...
RNE_RADIO3_URL=https://...
RNE_RADIO5_URL=https://...
```

Las URLs de streaming pueden cambiar. Para obtener las actuales:

1. **Cadena SER**: Inspeccionar el reproductor en https://cadenaser.com/
2. **RNE**: Inspeccionar el reproductor en https://www.rtve.es/radio/

## Uso

### Desarrollo

```bash
bun run dev
```

Abre http://localhost:3000 en el navegador.

### Producción

```bash
bun run build
```

Genera la carpeta `dist/` con los archivos estáticos listos para desplegar.

## Estructura del proyecto

```
radios/
├── .env                    # URLs de streaming
├── package.json
├── server.js               # Servidor de desarrollo
├── build.js                # Script de build
└── src/
    ├── index.html          # Página principal
    ├── styles.css          # Estilos
    ├── app.js              # Lógica de reproducción
    ├── sw.js               # Service Worker
    ├── manifest.webmanifest
    └── images/             # Logos de emisoras
```

## Despliegue

La carpeta `dist/` generada puede desplegarse en cualquier servidor de archivos estáticos.

### GitHub Pages (automático)

El proyecto incluye un workflow de GitHub Actions que despliega automáticamente a GitHub Pages.

1. En tu repositorio, ve a **Settings > Pages**
2. En "Build and deployment", selecciona **GitHub Actions**
3. Ve a **Settings > Secrets and variables > Actions**
4. Añade estos secrets con las URLs de streaming:
   - `CADENA_SER_URL`
   - `RNE_RADIO1_URL`
   - `RNE_RADIO3_URL`
   - `RNE_RADIO5_URL`
   - `RNE_RADIOCLASICA_URL`
   - `RADIO_MARCA_URL`

5. Haz push a la rama `main` y el despliegue se ejecutará automáticamente

### Otros servicios

- Netlify
- Vercel
- Servidor Apache/Nginx

## Notas

- Los streams de audio requieren conexión a internet
- Algunas emisoras pueden tener restricciones geográficas
- Para una PWA completa, genera iconos PNG de 192x192 y 512x512 píxeles

## Licencia

MIT
