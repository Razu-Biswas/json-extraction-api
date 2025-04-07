const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Tesseract = require("tesseract.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Normalizes smart quotes, invisible chars, etc.
const cleanText = (text) => {
    return text
        .replace(/[“”]/g, '"')           // smart quotes
        .replace(/[‘’]/g, "'")           // smart apostrophes
        .replace(/[\u2013\u2014]/g, "-") // en/em dashes
        .replace(/[^\x00-\x7F]/g, "")    // non-ascii
        .replace(/\r/g, "")              // carriage return
        .trim();
};

// Extracts a key-value field from OCR text
const extractExactField = (text, label) => {
    const regex = new RegExp(`"${label}"\\s*:\\s*"([^"]+)"`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};

app.post("/extract-json", async (req, res) => {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({
            success: false,
            message: "Missing imageBase64 in request",
            data: {},
        });
    }

    try {
        const imageData = imageBase64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(imageData, "base64");

        const {
            data: { text: rawText },
        } = await Tesseract.recognize(buffer, "eng");

        const text = cleanText(rawText);

        // Strict field extraction from JSON-like OCR text
        const name = extractExactField(text, "name");
        const organization = extractExactField(text, "organization");
        const address = extractExactField(text, "address");
        const mobile = extractExactField(text, "mobile");

        const extracted = { name, organization, address, mobile };

        const allFieldsExist = Object.values(extracted).every(Boolean);

        if (!allFieldsExist) {
            return res.status(200).json({
                success: false,
                message: "Failed to extract all required fields from image",
                data: {},
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully extracted JSON from image",
            data: extracted,
        });

    } catch (error) {
        console.error("OCR or processing error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during OCR processing",
            data: {},
        });
    }
});


app.get("/", (req, res) => {
    res.send("✅ Server Running.......");
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
















// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const Tesseract = require("tesseract.js");

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(bodyParser.json({ limit: "10mb" }));

// app.post("/extract-json", async (req, res) => {
//     const { imageBase64 } = req.body;

//     if (!imageBase64) {
//         return res.status(400).json({
//             success: false,
//             message: "Missing imageBase64 in request",
//             data: {},
//         });
//     }

//     try {
//         const imageData = imageBase64.replace(/^data:image\/png;base64,/, "");
//         const buffer = Buffer.from(imageData, "base64");

//         const {
//             data: { text },
//         } = await Tesseract.recognize(buffer, "eng");

//         // Clean up OCR text
//         const lines = text
//             .split("\n")
//             .map((line) => line.trim())
//             .filter((line) => line.includes(":"));

//         const result = {};

//         for (const line of lines) {
//             const [keyRaw, ...valParts] = line.split(":");
//             const key = keyRaw.trim().toLowerCase();
//             const value = valParts.join(":").trim();

//             if (key.includes("name")) result.name = value;
//             else if (key.includes("organization")) result.organization = value;
//             else if (key.includes("address")) result.address = value;
//             else if (key.includes("mobile") || key.includes("phone")) result.mobile = value;
//         }

//         // Check all required fields
//         const requiredFields = ["name", "organization", "address", "mobile"];
//         const hasAllFields = requiredFields.every((field) => result[field]);

//         if (!hasAllFields) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Failed to extract all required fields from image",
//                 data: {},
//             });
//         }

//         // Success
//         return res.status(200).json({
//             success: true,
//             message: "Successfully extracted JSON from image",
//             data: {
//                 name: result.name,
//                 organization: result.organization,
//                 address: result.address,
//                 mobile: result.mobile,
//             },
//         });

//     } catch (error) {
//         console.error("OCR or extraction error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Server error during OCR processing",
//             data: {},
//         });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`✅ Server running at http://localhost:${PORT}`);
// });





