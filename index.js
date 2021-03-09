const fs = require('fs');
const express = require('express');

const app = express();
const whitelist = [
    'http://localhost:3000/allowed',
];


function sendHtml(res, path) {
    res.header('Content-Type', 'text/html');
    res.send(fs.readFileSync(path));
}

function send404(res) {
    res
        .status(404)
        .send('Not found');
}

app.get('/', (req, res) => {
    sendHtml(res, 'html/index.html');
});

app.get('/blocked', (req, res) => {
    sendHtml(res, 'html/demo.html');
});

app.get('/allowed', (req, res) => {
    sendHtml(res, 'html/demo.html');
});

/*
  Content - as served by link app.
*/

function whitelisted(req) {
    const referrer = req.headers['referer'];
    console.log(referrer);
    return (whitelist.indexOf(referrer) !== -1);
}

function plainText(res) {
    // These two headers prevent the HTML from being rendered, instead it is displayed as text.
    res.header('Content-Type', 'text/plain');
    res.header('X-Content-Type-Options', 'nosniff')
}

function noCache(res) {
    res.header('Cache-Control', 'no-cache');
}

// Safely serve up HTML.
app.get('/html', (req, res) => {
    noCache(res);
    plainText(res);

    // NOTE: it is actually important to check the referrer here because we can support
    // multiple whitelisted domains, then control the content of the header, X-Frame-Options
    // can only list a single domain. Plus, this allow control by subdomain or path in addition
    // to just domain.
    if (!whitelisted(req)) {
        res.header('Content-Security-Policy', "frame-ancestors 'none'");
        res.header('X-Frame-Options', 'NONE');
    } else {
        res.header('Content-Security-Policy', `frame-ancestors ${whitelist[0]}`);
        res.header('X-Frame-Options', `ALLOW-FROM ${whitelist[0]}`);
    }

    res.send(fs.readFileSync('html/html.html'));
});

app.get('/kirby', (req, res) => {
    noCache(res);

    if (!whitelisted(req)) {
        return send404(res);
    }

    res.header('Content-Type', 'image/gif');
    res.send(fs.readFileSync('images/kirby.gif'));
});

app.get('/js', (req, res) => {
    noCache(res);

    if (!whitelisted(req)) {
        plainText(res);
    } else {
        res.header('Content-Type', 'text/javascript');
    }

    res.send(fs.readFileSync('js/script.js'));
});

app.get('/download', (req, res) => {
    if (!whitelisted(req)) {
        return send404(res);
    }

    res.header('Content-Type', 'applicaton/octet-stream');
    res.header('Content-Disposition', "attachment; filename=kirby.gif");
    res.send(fs.readFileSync('images/kirby.gif'));
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
