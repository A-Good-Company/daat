const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

app.use(express.static(path.join(__dirname, 'public')));

// Route to edit a specific Markdown file
app.get('/edit/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'markdown', filename);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send("File not found");
            return;
        }
        // Render an HTML page with the Markdown content
        res.send(renderEditorPage(data));
    });
});


// Route to save edited Markdown content
app.post('/save/:filename', (req, res) => {
    const filename = req.params.filename;
    const content = req.body; // Now expecting raw text body due to bodyParser.text()
    const filepath = path.join(__dirname, 'markdown', filename);

    fs.writeFile(filepath, content, 'utf8', (err) => {
        if (err) {
            res.status(500).send("Error saving file");
            return;
        }
        res.send("File saved successfully");
    });
});

// Route for home page, redirecting to a default Markdown file
app.get('/', (req, res) => {
    res.redirect('/edit/default.md'); // replace 'default.md' with your default file name
});

function renderEditorPage(markdownContent) {
    const editorHtmlPath = path.join(__dirname, 'public', 'editor.html');
    let htmlContent = fs.readFileSync(editorHtmlPath, 'utf8');
    
    // Replace placeholder content or script tag with actual markdown content
    htmlContent = htmlContent.replace('<!--CONTENT-->', markdownContent);
    
    return htmlContent;
}


// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'markdown', 'res'));
    },
    filename: (req, file, cb) => {
        // You may want to include logic to prevent overwriting files with the same name
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the original filename
    }
});

const upload = multer({ storage: storage });

// Route to handle image/video uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    // Send back the relative path of the uploaded file which can be inserted into markdown
    const filePath = path.join('res', req.file.filename);
    res.json({ filePath: filePath });
});

app.listen(port, () => console.log(`Markdown editor server listening on port ${port}!`));