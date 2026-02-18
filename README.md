# odontograma-render

Servicio Node.js para renderizar odontogramas a PNG usando Puppeteer.

## Requisitos

- Node.js 18+
- npm
- (Opcional) PM2 para ejecutar como servicio

> Nota: Puppeteer descarga Chromium en la primera instalacion. Asegura acceso a internet o un cache local.

## Instalacion

```bash
cd C:{ubicación del proyecto}\odontograma-render
npm install
```

## Ejecucion local

```bash
node server.js
```

El servicio queda escuchando en:

- http://127.0.0.1:3001

## Endpoints

### POST /render

Renderiza un odontograma y devuelve una imagen PNG.

Body (JSON):

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

Respuesta:

- `Content-Type: image/png`
- Body: PNG binario

### POST /render-multiple

Renderiza multiples odontogramas y devuelve base64.

Body (JSON):

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

Respuesta:

```json
{
  "success": true,
  "images": ["<base64>", "<base64>"]
}
```

## Probar rapidamente (PowerShell)

```powershell
$body = @{ data = @(@{ coordenada = "11"; ubicacion = "sup"; dano = "parcial_3"; color = "blue" }) } | ConvertTo-Json -Depth 5
Invoke-WebRequest -Uri http://127.0.0.1:3001/render -Method POST -ContentType "application/json" -Body $body -OutFile .\test.png
```

## Integracion con PHP

Ejemplo de consumo desde PHP (ya usado en el proyecto principal):

- POST a `http://127.0.0.1:3001/render`
- Envia JSON con `data` y guarda el binario como PNG.

## Deploy con PM2 (Windows)

Instalar PM2 (global):

```bash
npm install -g pm2
```

Iniciar servicio:

```bash
cd C:{ubicación del proyecto}\odontograma-render
pm2 start server.js --name odontograma-render
```

Ver estado:

```bash
pm2 status
```

Ver logs:

```bash
pm2 logs odontograma-render
```

Reiniciar:

```bash
pm2 restart odontograma-render
```

Detener y eliminar:

```bash
pm2 stop odontograma-render
pm2 delete odontograma-render
```

Arranque automatico (opcional):

```bash
pm2 startup
pm2 save
```

## Troubleshooting

- Si el render devuelve imagen vacia, revisa que `template.html` cargue los CSS y que Puppeteer pueda abrir el archivo local.
- Si falla Chromium, borra `node_modules` y reinstala:

```bash
rm -r node_modules
npm install
```
