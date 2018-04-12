const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

//scraping tools
const axios = require("axios");
const cheerio = require("cheerio");

//require models
const db = require("./models");

const app = express();

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));


//connect to mlab
mongoose.connect("mongodb://admin:password@ds243059.mlab.com:43059/scraped");

app.get("/scrape", function(req, res) {

    axios.get("http://www.nytimes.com/").then(function(response) {

    let $ = cheerio.load(response.data);

    $("article h2").each(function(i, element) {

        let result = {};

        result.title = $(this)
            .children("a")
            .attr("href");

        db.Article.create(result)
            .then(function(dbArticle) {

                console.log(dbArticle);
            })
            .catch(function(err) {
                return res.json(err);
            });
    });

    res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {

    db.Article.find({})
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.get("articles/:id", function(req, res) {

    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function(dbArticle) {

            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.post("/articles/:id", function(req, res) {

    db.Note.create(req.body)
        .then(function(dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new:true });
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

const PORT = process.env.PORT || 3000

app.listen(PORT, function() {
    console.log("Running on port " + PORT + "!");

});