const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

app.post("/api/summarize", upload.single("audio"), async (req, res) => {
  const audioPath = req.file.path;
  try {
    const transcript = await openai.createTranscription(
      fs.createReadStream(audioPath),
      "whisper-1"
    );
    const text = transcript.data.text;
    const summary = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Summarize this: ${text}` }],
    });
    res.json({ summary: summary.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  } finally {
    fs.unlinkSync(audioPath);
  }
});

app.listen(3001, () => console.log("API running on port 3001"));
