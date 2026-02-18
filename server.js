const express = require("express");
const bodyParser = require("body-parser");
const renderOdontograma = require("./render");
const path = require("path");
const fs = require("fs");

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
  const odontogramas = req.body; // array

  try {
    const results = await Promise.all(
      odontogramas.map((o) => renderOdontograma(o)),
    );

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
