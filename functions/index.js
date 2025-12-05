const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const app = express();

app.get('/sitemap.xml', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('storyboards').get();
    let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    snapshot.forEach(doc => {
      const storyboard = doc.data();
      const url = `https://${req.hostname}/editor/${doc.id}`;
      const lastMod = storyboard.lastEdited ? new Date(storyboard.lastEdited.seconds * 1000).toISOString() : new Date().toISOString();
      xml += `<url><loc>${url}</loc><lastmod>${lastMod}</lastmod></url>`;
    });
    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    res.status(500).send("Error generating sitemap.");
  }
});

app.get('/*', async (req, res) => {
  const host = req.hostname;
  const url = req.path;

  // Default metadata
  let title = "CinemaGrid - Create & Share Storyboards";
  let description = "The ultimate tool for filmmakers and content creators to visualize their stories. Create, collaborate, and share your storyboards with ease.";
  let imageUrl = `https://${host}/og-image.png`; // A default OG image
  let jsonLd = {};

  // Fetch data for a specific storyboard if the path matches
  if (url.startsWith('/editor/')) {
    const storyboardId = url.split('/')[2];
    if (storyboardId) {
      try {
        const doc = await admin.firestore().collection('storyboards').doc(storyboardId).get();
        if (doc.exists) {
          const data = doc.data();
          title = `${data.title} - CinemaGrid`;
          description = `A storyboard by ${data.author || 'a CinemaGrid user'}`;
          imageUrl = data.thumbnailUrl || imageUrl; // Use a thumbnail if available
          jsonLd = {
            "@context": "http://schema.org",
            "@type": "CreativeWork",
            "name": data.title,
            "author": data.author || "Anonymous",
            "datePublished": new Date(data.createdAt.seconds * 1000).toISOString(),
          };
        }
      } catch (error) {
        console.error('Error fetching storyboard:', error);
      }
    }
  }

  fs.readFile(path.resolve(__dirname, '../dist/index.html'), 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading page');
    }

    let finalHtml = htmlData
      .replace(/__TITLE__/g, title)
      .replace(/__DESCRIPTION__/g, description)
      .replace(/__OG_TITLE__/g, title)
      .replace(/__OG_DESCRIPTION__/g, description)
      .replace(/__OG_IMAGE__/g, imageUrl);

    if (Object.keys(jsonLd).length > 0) {
        finalHtml = finalHtml.replace('<script id="json-ld"></script>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(finalHtml);
  });
});

exports.app = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(app);
