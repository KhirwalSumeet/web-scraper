var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape/imdb/top250', function(req, res){
  url = 'http://www.imdb.com/chart/top';
  var options={};
  options.proxy="http://10.3.100.207:8080";
  request(url,options, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
      var data;
      var info;
      var movieTitle=[];
      var movieYear=[];
      var movieRating=[];
        $('.titleColumn').each(function(i, elem) {
          movieTitle[i] = $(this).children().first().text();
          movieYear[i] = $(this).children().last().text();
        });
        $('.imdbRating').each(function(i, elem) {
          movieRating[i] = $(this).children().first().text();
        });
      // Creating json object
      var data=[];
      var obj={};
      for(i=0;i<movieYear.length;i++){
        obj={};
        obj.title=movieTitle[i];
        obj.year=movieYear[i];
        obj.rating=movieRating[i];
        data.push(obj);
      }
    }

    fs.writeFile('top250.json', JSON.stringify(data), function(err){
      console.log('File successfully written! - Check your project directory for the top250.json file');
    })
    res.json(data);
  })
})


app.get('/scrape/imdb/genre=:genre&&page=:page', function(req, res){
  url = 'http://www.imdb.com/search/title?genres='+req.params.genre+'&page='+req.params.page;
  console.log(url);
  var options={};
  options.proxy="http://10.3.100.207:8080";
  request(url,options, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
      var data;
      var info;
      var movieTitle=[];
      var movieYear=[];
      var movieRating=[];
      var movieGenre=[];
      var movieDesc=[];
      var movieStars=[];
      var movieDirector=[];
        $('.lister-item-content').each(function(i, elem) {
          data=$(this).children().first();
          movieTitle[i] = data.children().first().next().text();
          movieYear[i] = data.children().last().text();
          data=data.next();

          if(data.hasClass('text-muted')){
            movieGenre[i] =data.find($('.genre')).text().trim();
            data=data.next();
          }
          if(data.hasClass('ratings-bar')){
            movieRating[i]=data.children().first().children().first().next().text().trim();
            data=data.next();
          }
          movieDesc[i]=data.text().trim();
          data=data.next();
          movieStars[i]=data.text().trim();
          //movieStars[i]= movieStars[i].replace("Stars:", "");
          var n = movieStars[i].indexOf("Director");
          if(n==-1){
            movieStars[i]= movieStars[i].replace("Stars:", "");
            movieStars[i]= movieStars[i].replace(/(\r\n|\n|\r)/gm, "");
            movieDirector[i]=null;
          }else{
            x=movieStars[i].indexOf("|");
            dir= movieStars[i].slice(0, x-1);
            stars= movieStars[i].slice(x+1, movieStars[i].length);
            movieStars[i]= stars.replace("Stars:", "");
            movieStars[i]= movieStars[i].replace(/(\r\n|\n|\r)/gm, "").trim();
            movieDirector[i]= dir.replace("Director:", "");
            movieDirector[i]= movieDirector[i].replace("Directors:", "");
            movieDirector[i]=movieDirector[i].replace(/(\r\n|\n|\r)/gm, "").trim();
          }
        });

      // Creating json object
      var data=[];
      var obj={};
      for(i=0;i<movieYear.length;i++){
        obj={};
        obj.title=movieTitle[i];
        obj.year=movieYear[i];
        obj.rating=movieRating[i];
        obj.genres=movieGenre[i];
        obj.description=movieDesc[i];
        obj.stars=movieStars[i];
        obj.directors=movieDirector[i];
        data.push(obj);
      }
    }

    fs.writeFile('genre.json', JSON.stringify(data), function(err){
      console.log('File successfully written! - Check your project directory for the top250.json file');
    })
    res.json(data);
  })
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
