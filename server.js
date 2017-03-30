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

  /* Fetching data from main page */

  request(url,options, function(error, response, html){
      if(!error){

        /* Loading HTML */

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
        var movieId=[];
        var movieReviews=[];
        /* Scrapping data */

        $('.lister-item-content').each(function(i, elem) {
            data=$(this).children().first();
            movieTitle[i] = data.children().first().next().text();
            id=data.children().first().next().attr('href');
            id=id.split("/");
            movieId[i]=id[2];
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

        // function(count){
        //     if(count<movieId.length){
        //         url="http://www.imdb.com/title/"+movieId[count++]+"/review"
        //         request(url,options, function(error, response, html){
        //             $ = cheerio.load(html);
        //             $('.tn15content').each(function(i, elem) {
        //                 data=$(this).children().first().next().next().next();
        //             });
        //         });
        //     }
        // }
        // Creating json object

        var data=[];
        var obj={};
        for(i=0;i<movieYear.length;i++){
          obj={};
          obj.id=movieId[i];
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

app.get('/scrape/toi',function(req, res){
    fetchdata(1,[],function (data) {
        scrapedetails(0,data,[],function(result){
            fs.writeFile('movies.json', JSON.stringify(result), function(err){
              console.log('File successfully written! - Check your project directory for the top250.json file');
            })
            res.json(result);
        });
    });
    
});

function fetchdata(count,data,callback){
    url = 'http://www.timesofindia.indiatimes.com/moviereviewarticlelistlazy.cms?msid=2742919&curpg='+count;
    var options={};
    options.proxy="http://10.3.100.207:8080";
    request(url,options, function(error, response, html){
        if(!error){

            /* Loading HTML */

            var $ = cheerio.load(html);

            $('.mr_listing_left').each(function(i, elem) {

                link=$(this).children().first().attr('href');
                data.push(link);
            });
            if(count<2){
                fetchdata(count+1,data,callback);
            }else{
                callback(data);
            }
        }else{
            fetchdata(count,data,callback);
        }
    })
};

function scrapedetails(i,movies,moviesData,cb){
    console.log(i);
    url = 'http://www.timesofindia.indiatimes.com'+movies[i];
    var options={};
    options.proxy="http://10.3.100.207:8080";
    request(url,options, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            var obj={};
            $('.flmcasting').each(function(i, elem) {

                tag=$(this).children().first();

                // Fetching name

                nm=tag.text();
                nm=nm.replace(" Movie Review", "");;
                obj["Name"]=nm;
                tag=tag.next()
                // Fetch Movie time
                rel=tag.text();
                rel=rel.split(",");
                rel=rel[rel.length-3]+rel[rel.length-2];
                rel=rel.replace("Updated: ","").trim();
                obj["Release Time"]=rel;
                tag=tag.next();

                //Fetch Rating
                obj["Critic rating"]=tag.children().last().prev().text();
                tag=tag.next();
                //obj["Average Reader's rating"]=tag.children().first().next().children().first().next().text();
                tag=tag.next().next().next();

                //Fetch Cast
                obj["Cast"]=tag.children().last().text();
                tag=tag.next().next();

                //Fetch Director
                obj["Director"]=tag.children().last().text();
                tag=tag.next();

                //Fetch Genre and duration
                obj["Genre"]=tag.children().first().children().last().text();
                obj["Duration"]=tag.children().last().children().last().text();



            });
            //console.log(obj);
            moviesData.push(obj);
            if(i<movies.length){
                scrapedetails(i+1,movies,moviesData,cb);
            }else{
                cb(moviesData);
            }
        }else{
            scrapedetails(i,movies,moviesData,cb);
        }
    });
}
app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
