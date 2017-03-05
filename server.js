const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

// Cookie handling logic
app.use(cookieParser());

// Set UUID if nonexistant
const uuidgen = require('node-uuid');
app.use((req, res, next) => {
    let uuid = req.cookies.uuid;

    if (uuid === undefined) {
        uuid = uuidgen.v4();
        res.cookie('uuid', uuid, { maxAge: 900000, httpOnly: true });
    }

    console.log(`[${req.method}]\t${req.url}\t${uuid}`);
    res.locals.uuid = uuid;
    next();
});

// Host static files
app.use(express.static(__dirname + '/public'));

// Start the server
const server = app.listen(80, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});
