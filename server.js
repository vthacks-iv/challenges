const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Connect to the database
var pgp = require('pg-promise')();
var cn = {
    user: 'postgres',
    password: '1234',
    host: 'localhost',
    database: 'challenges',
};
var db = pgp(cn);

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

function checkProblemStatus(uuid, level) {
    return () => {
        return db.any(lineFormat `SELECT * FROM records
                    WHERE uuid=$1 AND level=$2
                    ORDER BY datetime ASC`,
                [uuid, level])
            .then((rows) => {

                let hasSolved = false;
                let timeSolved;
                let attempts = 0;

                rows.forEach((row) => {
                    if (!hasSolved) {
                        if (row.correct) {
                            hasSolved = true;
                            timeSolved = row.datetime;
                        } else {
                            attempts++;
                        }
                    }
                });

                return {
                    hasSolved,
                    timeSolved,
                    attempts
                };
            })
        }
}

// Host static files
app.use(express.static(__dirname + '/public'));

function lineFormat(literals, ...substs) {
    let interpolation = '';

    for (let i = 0; i < substs.length; i++) {
        interpolation += literals[i].replace('\n', '')  + substs[i];
    }
    interpolation += literals[literals.length - 1];

    return interpolation;
}

// Start the server
const server = app.listen(80, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});
