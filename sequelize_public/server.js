var Twit = require('twit')
// var RiTa = require('rita').RiTa;
var express = require('express');

var T = new Twit({
    consumer_key: "",
    consumer_secret: "",
    access_token: "",
    access_token_secret: "",
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

var app = express();
var server = app.listen(process.env.PORT || 8000, listen);

function listen() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('listening at http://' + host + ':' + port);
}

app.use(express.static('public'));

app.get('/tweets/:query', getTweets);

function getTweets(req, res) {

    var sentences = [];
    var query = req.params.query;

    T.get('search/tweets', {
        q: query,
        lang: 'en',
        count: 100
    }, gotData);


    function gotData(err, data) {

        var tweets = data.statuses;

        res.send(tweets);

        console.log("sent");

    };
}
