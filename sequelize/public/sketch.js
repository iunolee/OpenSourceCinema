var config = {
    apiKey: "AIzaSyANNXCX3qWs_hIaP8OU-JIpXYPBHYUQYzE",
    authDomain: "fir-c363f.firebaseapp.com",
    databaseURL: "https://fir-c363f.firebaseio.com",
    storageBucket: "fir-c363f.appspot.com",
    messagingSenderId: "647155671887"
};

firebase.initializeApp(config);

var database = firebase.database();
var sequelizeRef = database.ref('sequelize');

var sentences;
var chosensentence;

var searchButton = document.getElementById("searchButton");
var searchInput = document.getElementById("searchInput");
var nextButton = document.getElementById("next");
var saveButton = document.getElementById("save");

searchButton.addEventListener('click', getTweets)
nextButton.addEventListener('click', showSentence)
saveButton.addEventListener('click', saveSentence)


initialLoad();


function getTweets() {

    sentences = [];

    var query = searchInput.value;

    $.ajax({
        url: "http://67.205.153.66:8000/tweets/" + query,
        type: "GET",
        success: function(data) {
            for (var i = 0; i < data.length; i++) {
                var thisText = data[i]['text'];
                thisText = thisText.split('@')[0];
                thisText = thisText.split('rt')[0];
                thisText = thisText.split('RT')[0];
                thisText = thisText.split('http')[0];

                if (thisText !== "") {
                    sentences.push(thisText);
                }
            }
        },
        contentType: "application/json"
    });
    setTimeout(showSentence, 1000);
}


function showSentence() {

    $("#candidate").text("");

    var randomNumber = Math.floor(Math.random() * (sentences.length + 1));
    chosenSentence = sentences[randomNumber];

    document.getElementById("candidate").innerHTML = chosenSentence;

    console.log(chosenSentence);

}


function saveSentence() {
    var sentence = chosenSentence
    sequelizeRef.push(sentence);
    setTimeout(writeIt, 500);
}


function writeIt() {

    sequelizeRef.once('value').then(function(data) {

            var sequelizeData = data.val();
            var keys = Object.keys(sequelizeData);
            var finalsentence = sequelizeData[keys[keys.length - 1]];
            var newPara = document.createElement('p');
            newPara.innerHTML = finalsentence;
            $('#content').append(newPara);
        },

        function(err) {});
}


function initialLoad() {

    sequelizeRef.once('value').then(function(data) {

            var sequelizeData = data.val();
            var keys = Object.keys(sequelizeData);

            for (var i = 0; i < keys.length; i++) {
                var writtenSentences = sequelizeData[keys[i]];
                var newPara = document.createElement('p');
                newPara.innerHTML = writtenSentences;
                $('#content').append(newPara);
            }
        },
        function(err) {});
}
