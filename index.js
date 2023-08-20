require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const urlPaser = require("url");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// For parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Configuration
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define Schema
let urlSchema = mongoose.Schema(
  {
    original_url: String,
    short_url: Number
  },
  {
    collection: 'urls'
  }
);

let UrlModel = mongoose.model("UrlModel", urlSchema);

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  var originalUrl = req.body.url;
  // verify URL
  try {
    // verify hostname
    var originalUrlHostname = new URL(originalUrl).hostname;
    // verify ip
    dns.lookup(originalUrlHostname, (err) => {
      if (err) {
        res.json({ error: 'Invalid URL' });
      } else {
        // Url.
        UrlModel
          .findOne({ original_url: originalUrl })
          .then((data) => {
            if (data != null) {
              res.json({
                original_url: data.original_url,
                short_url: data.short_url
              });
            } else {
              UrlModel
                .find()
                .then((data) => {
                  let newUrlDoc = UrlModel({
                    original_url: originalUrl,
                    short_url: data.length + 1
                  });
                  newUrlDoc
                    .save()
                    .then(() => {
                      res.json({
                        original_url: originalUrl,
                        short_url: data.length + 1
                      });
                    });
                });
            }
          }).catch(() => {
            res.json({ "error": "Invalid URL" });
          });
      }
    });
  } catch (error) {
    res.json({ error: 'Invalid URL' });
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  UrlModel
    .findOne({
      short_url: parseInt(req.params.id)
    })
    .then((data) => {
      if (data) {
        res.redirect(data.original_url);
      } else {
        res.json({ "error": "No short URL found for the given input" });
      }
    })
    .catch(() => {
      res.json({ "error": "No short URL found for the given input" });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});