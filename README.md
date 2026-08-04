<div align="center">

# 🦷 odontograma-render

**Microservice for server-side rendering of dental charts (odontograms) to PNG images**
*Microservicio de renderizado de odontogramas a imágenes PNG en el servidor*

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-24-40B5A4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![REST API](https://img.shields.io/badge/REST-API-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

</div>

---

## 🌐 English

### Overview

`odontograma-render` is a **dedicated microservice** that converts structured dental chart data (odontograms) into **high-fidelity PNG images**. It was built to serve as a rendering backend for a healthcare management system, enabling the generation of dental chart images for use in **medical history reports and clinical documents**.

The service exposes a simple REST API that accepts JSON payloads describing tooth conditions, damage types, and prosthetics, and returns pixel-perfect PNG images — either a single image or a batch — rendered by a headless Chromium browser via Puppeteer.

### ✨ Key Features

| Feature | Description |
|---|---|
| **Server-side rendering** | Uses Puppeteer + Headless Chromium to render complex SVG dental charts with pixel precision |
| **Single & batch rendering** | Supports rendering one or multiple odontograms in a single request with configurable concurrency |
| **Adult & pediatric dentition** | Automatically infers dentition type (adult 32 teeth / pediatric 20 teeth) from the incoming data |
| **Rich dental markings** | Supports partial fillings, caries circles, extractions, crowns, bridges, removable prosthetics, full prosthetics, and more |
| **Color-coded annotations** | Marks can be rendered in blue (planned/current treatment), red (past treatment), or mixed |
| **Dockerized** | Fully containerized with all Chromium dependencies pre-installed for reliable deployment |
| **Health check endpoint** | Built-in `/health` endpoint for container orchestration readiness probes |

### 🏗️ Architecture

```
Consumer (PHP / any HTTP client)
          │
          │  HTTP POST JSON
          ▼
┌─────────────────────────────┐
│      Express REST API        │
│        server.js             │
│  /render  /render-multiple   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│      Render Engine           │
│        render.js             │
│  Puppeteer + Chromium        │
│  (singleton browser instance)│
└────────────┬────────────────┘
             │  loads
             ▼
┌─────────────────────────────┐
│      template.html           │
│  SVG Dental Chart + jQuery   │
│  Applies damage markings     │
│  Signals render completion   │
└─────────────────────────────┘
             │  screenshot
             ▼
          PNG Image
```

### 🚀 Getting Started

#### Prerequisites

- **Node.js** 20+
- **npm**
- (Optional) **Docker** & Docker Compose

#### Local Installation

```bash
# Clone the repository
git clone https://github.com/Gusthere/odontograma-render.git
cd odontograma-render

# Install dependencies (Puppeteer will download Chromium automatically)
npm install

# Start the service
node server.js
```

The service will be available at `http://127.0.0.1:3001`

#### Docker Deployment (Recommended)

```bash
# Build and start the container
docker compose up -d

# Check health status
docker inspect --format='{{json .State.Health}}' odontograma_render
```

The container exposes port `3001` and includes a built-in health check that automatically restarts the service if it becomes unresponsive.

### 📡 API Reference

#### `GET /health`

Returns the service status. Used by Docker health checks and load balancers.

**Response:**
```json
{ "ok": true }
```

---

#### `POST /render`

Renders a single odontogram and returns a PNG image binary.

**Request Body:**
```json
{
  "data": [
    {
      "coordenada": "11",
      "ubicacion": "sup",
      "dano": "parcial_3",
      "color": "blue"
    },
    {
      "coordenada": "21",
      "ubicacion": "inf",
      "dano": "extraccion",
      "color": "red"
    }
  ]
}
```

**Field Reference:**

| Field | Description | Example Values |
|---|---|---|
| `coordenada` | Tooth number (FDI notation) | `"11"` to `"48"` (adult), `"51"` to `"85"` (pediatric) |
| `ubicacion` | Surface location | `"sup"`, `"inf"`, `"izq"`, `"der"`, `"cen"` |
| `dano` | Damage or condition type | `"parcial_3"`, `"caries_2"`, `"extraccion"`, `"corona_tot"`, `"puente_ini"`, `"outline"` |
| `color` | Annotation color | `"blue"` (current), `"red"` (past), `"mixed"` |

**Response:** Binary PNG (`Content-Type: image/png`)

---

#### `POST /render-multiple`

Renders multiple odontograms in parallel (concurrency: 3) and returns base64-encoded images.

**Request Body:**
```json
[
  [
    { "coordenada": "11", "ubicacion": "sup", "dano": "parcial_3", "color": "blue" }
  ],
  [
    { "coordenada": "21", "ubicacion": "inf", "dano": "outline", "color": "red" }
  ]
]
```

**Response:**
```json
{
  "success": true,
  "images": ["<base64_png_1>", "<base64_png_2>"]
}
```

### 🧪 Quick Test

**PowerShell:**
```powershell
$body = @{
  data = @(
    @{ coordenada = "11"; ubicacion = "sup"; dano = "parcial_3"; color = "blue" }
  )
} | ConvertTo-Json -Depth 5

Invoke-WebRequest `
  -Uri http://127.0.0.1:3001/render `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -OutFile .\test_odontogram.png
```

**cURL:**
```bash
curl -X POST http://127.0.0.1:3001/render \
  -H "Content-Type: application/json" \
  -d '{"data":[{"coordenada":"11","ubicacion":"sup","dano":"parcial_3","color":"blue"}]}' \
  --output test_odontogram.png
```

### 🔧 Technical Implementation Details

- **Singleton browser**: Puppeteer launches a single Chromium instance that persists for the lifetime of the service, avoiding the overhead of spawning a new browser per request.
- **Concurrent batch rendering**: `renderOdontogramasBatch` uses a worker pool pattern with configurable concurrency (default: 3 parallel renders) to efficiently process multiple odontograms.
- **Render signaling**: The `template.html` sets `window.__RENDER_DONE__ = true` when the dental chart has been fully painted, and `render.js` polls for this flag before taking the screenshot — ensuring no partial renders are captured.
- **Viewport & scale**: Pages are rendered at `1400×900` with `deviceScaleFactor: 2` (2× retina), producing crisp, high-resolution output.
- **Data injection**: Patient dental data is injected into the page via `page.evaluateOnNewDocument`, making it available before any script runs.

### 🐋 Docker Details

The `Dockerfile` is based on `node:20-bookworm-slim` and includes all system libraries required by Chromium (GTK, NSS, X11 libs, fonts, etc.) making it fully self-contained and portable.

### 🔗 Integration

This service is consumed by a **PHP-based EMR (Electronic Medical Records) system**. The PHP backend makes HTTP POST requests to `/render` or `/render-multiple`, passing the dental condition data retrieved from the database, and saves the resulting PNG images for embedding in patient reports and clinical documents.

### 🛠️ PM2 Deployment (Windows — without Docker)

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start server.js --name odontograma-render

# Enable auto-start on system boot
pm2 startup
pm2 save

# Useful commands
pm2 status                      # View running processes
pm2 logs odontograma-render     # Stream logs
pm2 restart odontograma-render  # Restart
pm2 stop odontograma-render     # Stop
pm2 delete odontograma-render   # Remove from PM2
```

### ⚠️ Troubleshooting

| Symptom | Likely Cause | Solution |
|---|---|---|
| Empty or blank PNG returned | Missing CSS files or template load failure | Ensure `odontograma.css` and `sb-admin-2.css` are present alongside `template.html` |
| Chromium fails to launch | Missing system libraries | Use the Docker image, which includes all dependencies |
| `ECONNREFUSED` from consumer | Service not running | Check `pm2 status` or `docker ps` |
| Slow first render | Browser cold start | Normal behavior; subsequent renders reuse the singleton browser instance |

---

## 🌐 Español

### Descripción General

`odontograma-render` es un **microservicio dedicado** que convierte datos estructurados de odontogramas en **imágenes PNG de alta fidelidad**. Fue construido como backend de renderizado para un sistema de gestión de salud, permitiendo la generación de imágenes de odontogramas para su uso en **reportes de historias médicas y documentos clínicos**.

El servicio expone una API REST simple que acepta payloads JSON describiendo condiciones dentales, tipos de daño y prótesis, y devuelve imágenes PNG con precisión de píxel — ya sea una sola imagen o un lote — renderizadas por un navegador Chromium headless mediante Puppeteer.

### ✨ Características Principales

| Característica | Descripción |
|---|---|
| **Renderizado en servidor** | Usa Puppeteer + Chromium headless para renderizar gráficos SVG dentales con precisión de píxel |
| **Renderizado individual y por lotes** | Soporta renderizar uno o múltiples odontogramas en una sola request con concurrencia configurable |
| **Dentición adulta y pediátrica** | Infiere automáticamente el tipo de dentición (adulto 32 piezas / niño 20 piezas) de los datos recibidos |
| **Marcas dentales completas** | Soporta rellenos parciales, círculos de caries, extracciones, coronas, puentes, prótesis removibles, prótesis totales y más |
| **Anotaciones con colores** | Las marcas pueden ser azules (tratamiento actual/planeado), rojas (tratamiento previo) o mixtas |
| **Dockerizado** | Completamente contenedorizado con todas las dependencias de Chromium pre-instaladas |
| **Health check integrado** | Endpoint `/health` incorporado para sondas de disponibilidad en orquestadores de contenedores |

### 🚀 Inicio Rápido

#### Prerrequisitos

- **Node.js** 20+
- **npm**
- (Opcional) **Docker** y Docker Compose

#### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/Gusthere/odontograma-render.git
cd odontograma-render

# Instalar dependencias (Puppeteer descargará Chromium automáticamente)
npm install

# Iniciar el servicio
node server.js
```

El servicio estará disponible en `http://127.0.0.1:3001`

#### Despliegue con Docker (Recomendado)

```bash
# Construir e iniciar el contenedor
docker compose up -d

# Verificar estado de salud
docker inspect --format='{{json .State.Health}}' odontograma_render
```

### 📡 Referencia de API

#### `GET /health`

Devuelve el estado del servicio.

**Respuesta:**
```json
{ "ok": true }
```

---

#### `POST /render`

Renderiza un odontograma individual y devuelve el binario PNG.

**Body:**
```json
{
  "data": [
    {
      "coordenada": "11",
      "ubicacion": "sup",
      "dano": "parcial_3",
      "color": "blue"
    }
  ]
}
```

**Referencia de campos:**

| Campo | Descripción | Valores de ejemplo |
|---|---|---|
| `coordenada` | Número de pieza (notación FDI) | `"11"` al `"48"` (adulto), `"51"` al `"85"` (niño) |
| `ubicacion` | Superficie de la pieza | `"sup"`, `"inf"`, `"izq"`, `"der"`, `"cen"` |
| `dano` | Tipo de daño o condición | `"parcial_3"`, `"caries_2"`, `"extraccion"`, `"corona_tot"`, `"puente_ini"`, `"outline"` |
| `color` | Color de la anotación | `"blue"` (actual), `"red"` (pasado), `"mixed"` |

**Respuesta:** PNG binario (`Content-Type: image/png`)

---

#### `POST /render-multiple`

Renderiza múltiples odontogramas en paralelo y devuelve imágenes en base64.

**Respuesta:**
```json
{
  "success": true,
  "images": ["<base64_png_1>", "<base64_png_2>"]
}
```

### 🔧 Detalles de Implementación Técnica

- **Navegador singleton**: Puppeteer lanza una única instancia de Chromium que persiste durante toda la vida del servicio, evitando el overhead de iniciar un nuevo navegador por cada request.
- **Renderizado concurrente**: `renderOdontogramasBatch` usa un patrón de worker pool con concurrencia configurable (por defecto: 3 renders paralelos) para procesar múltiples odontogramas eficientemente.
- **Señalización de render completo**: El `template.html` establece `window.__RENDER_DONE__ = true` cuando el gráfico dental ha sido completamente pintado, y `render.js` espera esta señal antes de capturar la pantalla, garantizando que nunca se capturen renders incompletos.
- **Viewport y escala**: Las páginas se renderizan a `1400×900` con `deviceScaleFactor: 2` (resolución 2× retina), produciendo imágenes nítidas y de alta resolución.
- **Inyección de datos**: Los datos dentales del paciente se inyectan en la página mediante `page.evaluateOnNewDocument`, disponibles antes de que cualquier script se ejecute.

### 🔗 Integración

Este servicio es consumido por un **sistema de Historia Clínica Electrónica (HCE) basado en PHP**. El backend PHP realiza peticiones HTTP POST a `/render` o `/render-multiple`, enviando los datos de condiciones dentales obtenidos de la base de datos, y guarda las imágenes PNG resultantes para incrustarlas en los reportes y documentos clínicos de los pacientes.

### 🛠️ Despliegue con PM2 (Windows — sin Docker)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el servicio
pm2 start server.js --name odontograma-render

# Habilitar inicio automático al arrancar el sistema
pm2 startup
pm2 save

# Comandos útiles
pm2 status                      # Ver procesos activos
pm2 logs odontograma-render     # Ver logs en tiempo real
pm2 restart odontograma-render  # Reiniciar
pm2 stop odontograma-render     # Detener
pm2 delete odontograma-render   # Eliminar de PM2
```

### ⚠️ Solución de Problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| PNG vacío o en blanco | Archivos CSS faltantes o fallo al cargar la plantilla | Asegúrate de que `odontograma.css` y `sb-admin-2.css` estén junto a `template.html` |
| Chromium no inicia | Librerías de sistema faltantes | Usar la imagen Docker que incluye todas las dependencias |
| `ECONNREFUSED` desde el consumidor | Servicio no está corriendo | Verificar con `pm2 status` o `docker ps` |
| Primer render lento | Arranque en frío del navegador | Comportamiento normal; los renders siguientes reutilizan la instancia singleton |

---

## 📄 License / Licencia

ISC

---

<div align="center">
  <p>Built for clinical dental documentation</p>
  <p>Construido para documentación clínica odontológica</p>
</div>
