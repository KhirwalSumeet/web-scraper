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


// Scraping movie reviews from TOI

app.get('/scrape/toi',function(req, res){
    fetchdata(1,[],function (data) {
        scrapedetails(0,data,[],0,function(result){
            fs.writeFile('movies.json', JSON.stringify(result), function(err){
              console.log('File successfully written! - Check your project directory for the top250.json file');
            })
            
        });
    });
    res.send("Done");
});

function fetchdata(count,data,callback){
    url = 'http://www.timesofindia.indiatimes.com/moviereviewarticlelistlazy.cms?msid=2742919&curpg='+count;
    var options={};
    options.proxy="http://10.3.100.207:8080";
    request(url,options, function(error, response, html){
        if(!error){

            /* Loading HTML */

            var $ = cheerio.load(html);
            var left=1;
            $('.mr_listing_left').each(function(i, elem) {
                
                link=$(this).children().first().attr('href');
                if(link){
                    data.push(link);
                }
                else
                    left=0;
            });
            if(!left){
                $('.mr_listing_right').each(function(i, elem) {
                    link=$(this).children().first().children().first().attr('href');
                    data.push(link);
                });
            }
            if(count<63){
                console.log("count:"+count);
                fetchdata(count+1,data,callback);
            }else{
                callback(data);
            }
        }else{
            fetchdata(count,data,callback);
        }
    })
};

function scrapedetails(i,movies,moviesData,last,cb){
    console.log(i);
    url = 'http://www.timesofindia.indiatimes.com'+movies[i];
    var options={};
    options.proxy="http://10.3.100.207:8080";
    options.timeout=3000;
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
            $('.Normal').each(function(i, elem) {
                tag=$(this);
                review=tag.text();
                review=review.split(":");
                review=review[2];
                obj["Review"]=review;
                

            });
            moviesData.push(obj);
            //console.log(obj);
            
            if(i<movies.length){
                scrapedetails(i+1,movies,moviesData,0,cb);
            }else{
                cb(moviesData);
            }
        }else{
            if(last<3){
                scrapedetails(i,movies,moviesData,last+1,cb);
            }else{
                scrapedetails(i+1,movies,moviesData,0,cb);
            }
        }
    });
}

// Scraping Top India First day movies by year

app.get('/scrape/boi/firstday/start=:start&&end=:end',function(req, res){
    firstday(parseInt(req.params.start),parseInt(req.params.end),[],function (data) {
        fs.writeFile('moviesFirstDay.json', JSON.stringify(data), function(err){
          console.log('File successfully written! - Check your project directory for the top250.json file');
        })
    });
    res.send("Done");
});

function firstday(year,end,data,cb2){
    console.log(year);
    url = 'http://www.boxofficeindia.com/india-first-day.php?year='+year;
    var options={};
    options.proxy="http://10.3.100.207:8080";
    options.timeout=3000;
    request(url,options, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            
            $('.boi-listing-rows').each(function(i, elem) {
                var obj={};
                tag=$(this).children().first().next();
                obj["Name"]=tag.children().children().children().last().text();
                tag=tag.next();
                obj["Release Date"]=tag.text();
                tag=tag.next();
                obj["Screens"]=tag.text();
                tag=tag.next();
                obj["Nett Gross"]=tag.text();
                data.push(obj);
            });
            if(year<end){
                firstday(year+1,end,data,cb2);
            }else{
                cb2(data);
            }
        }else{
            firstday(year,end,data,cb2);
        }
    });
}

// Scraping Top India First Week movies by year

app.get('/scrape/boi/firstweek/start=:start&&end=:end',function(req, res){
    firstweek(parseInt(req.params.start),parseInt(req.params.end),[],function (data) {
        fs.writeFile('moviesFirstWeek.json', JSON.stringify(data), function(err){
          console.log('File successfully written! - Check your project directory for the top250.json file');
        })
    });
    res.send("Done");
});

function firstweek(year,end,data,cb2){
    console.log(year);
    url = 'http://www.boxofficeindia.com/india-first-week.php?year='+year;
    var options={};
    options.proxy="http://10.3.100.207:8080";
    options.timeout=3000;
    request(url,options, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            
            $('.boi-listing-rows').each(function(i, elem) {
                var obj={};
                tag=$(this).children().first().next();
                obj["Name"]=tag.children().children().children().last().text();
                tag=tag.next();
                obj["Release Date"]=tag.text();
                tag=tag.next();
                obj["Screens"]=tag.text();
                tag=tag.next();
                obj["Nett Gross"]=tag.text();
                data.push(obj);
            });
            if(year<end){
                firstday(year+1,end,data,cb2);
            }else{
                cb2(data);
            }
        }else{
            firstweek(year,end,data,cb2);
        }
    });
}

// Scraping Top India Net Grossing movies by year

app.get('/scrape/boi/net/start=:start&&end=:end',function(req, res){
    firstday(parseInt(req.params.start),parseInt(req.params.end),[],function (data) {
        fs.writeFile('netGrossers.json', JSON.stringify(data), function(err){
          console.log('File successfully written! - Check your project directory for the top250.json file');
        })
    });
    res.send("Done");
});

function firstday(year,end,data,cb2){
    console.log(year);
    url = 'http://www.boxofficeindia.com/india-total-nett-gross.php?year='+year;
    var options={};
    options.proxy="http://10.3.100.207:8080";
    options.timeout=3000;
    request(url,options, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            
            $('.boi-listing-rows').each(function(i, elem) {
                var obj={};
                tag=$(this).children().first().next();
                obj["Name"]=tag.children().children().children().last().text();
                tag=tag.next();
                obj["Release Date"]=tag.text();
                tag=tag.next();
                obj["Nett Gross"]=tag.text();
                data.push(obj);
            });
            if(year<end){
                firstday(year+1,end,data,cb2);
            }else{
                cb2(data);
            }
        }else{
            firstday(year,end,data,cb2);
        }
    });
}

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
