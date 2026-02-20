const express = require("express");
const bodyParser = require("body-parser");
const { renderOdontograma, renderOdontogramasBatch } = require("./render");

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.disable("x-powered-by");

app.post("/render", async (req, res) => {
  try {
    const data = req.body.data;

    const buffer = await renderOdontograma(data);

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error renderizando", details: error.message });
  }
});

app.post("/render-multiple", async (req, res) => {
  const odontogramas = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body?.data)
      ? req.body.data
      : [];

  try {
    if (!odontogramas.length) {
      return res.status(400).json({
        success: false,
        error: "Payload inválido",
        details: "Debe enviar un arreglo de odontogramas o { data: [...] }",
      });
    }

    const results = await renderOdontogramasBatch(odontogramas, { concurrency: 3 });

    res.json({
      success: true,
      images: results.map((b) => b.toString("base64")),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando imágenes", details: err.message });
  }
});

app.listen(3001, () => {
  console.log("Render service running on port 3001");
});
