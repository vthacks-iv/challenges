const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
import { oneLine } from 'common-tags';

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
        return db.any(oneLine `SELECT * FROM records
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


    }

}

// Handle problem submission
app.post('/submit', (req, res) => {
    let uuid = req.cookies.uuid;
    let submission = req.body.submission;
    let level = req.body.level;

    let {correct, message} = handleProblem(level, submission);

    db.none(oneLine `INSERT INTO records
                (uuid, datetime, level, submission, correct)
                VALUES ($1, $2, $3, $4, $5)`,
            [uuid, new Date(), level, submission, correct]
        )
        .then(checkProblemStatus(uuid, level))
        .then(({hasSolved, timeSolved, attempts}) => {
            res.send(message);
        })

});
// Start the server
const server = app.listen(80, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});
