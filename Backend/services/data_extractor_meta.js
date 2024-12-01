const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const outputDir = path.join(__dirname, "output_dataset");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
async function fetchAds(
  searchTerms,
  audienceSizeMin,
  audienceSizeMax,
  region,
  adType,
  mediaType,
  platform,
  searchType
) {
  const accessToken = process.env.ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v21.0/ads_archive?search_terms=${searchTerms}&audience_size_min=${audienceSizeMin}&audience_size_max=${audienceSizeMax}&region=${region}&ad_type=${adType}&media_type=${mediaType}&platform=${platform}&search_type=${searchType}&access_token=${accessToken}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching ads:", error);
    throw error;
  }
}
function saveAdVisuals(adData) {
  adData.ads.forEach((ad) => {
    const imageUrl = ad.image_url;
    const filePath = path.join(outputDir, `${ad.id}.jpg`);

    axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
    })
      .then((response) => {
        response.data.pipe(fs.createWriteStream(filePath));
      })
      .catch((err) => {
        console.error("Error saving image:", err);
      });
  });
}

app.post("/fetch-ads", async (req, res) => {
  const {
    searchTerms,
    audienceSizeMin,
    audienceSizeMax,
    region,
    adType,
    mediaType,
    platform,
    searchType,
  } = req.body;

  try {
    const adData = await fetchAds(
      searchTerms,
      audienceSizeMin,
      audienceSizeMax,
      region,
      adType,
      mediaType,
      platform,
      searchType
    );
    saveAdVisuals(adData);
    if (adType === "political_and_issue") {
      const additionalData = {
        age: adData.age,
        country: adData.country,
        gender: adData.gender,
        reach_breakdown: adData.reach_breakdown,
        ROI: adData.ROI,
        impressions: adData.impressions,
        demographic_distributions: adData.demographic_distributions,
        amount_spent: adData.amount_spent,
        estimated_audience_size: adData.estimated_audience_size,
      };
      res.json({ ads: adData.ads, additionalData });
    } else {
      res.json({ ads: adData.ads });
    }
  } catch (error) {
    res.status(500).send("Error fetching ads");
  }
});
