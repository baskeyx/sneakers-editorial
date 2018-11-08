"use strict";
// vanilla ajax call
window.getFeed = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function() {
            if (xhr.status == 200) {
                resolve(JSON.parse(xhr.response));
            } else {
                reject(Error(xhr.statusText));
            }
        };
        xhr.onerror = function() {
            reject(Error("Network Error"));
        };
        xhr.send();
    });
}
// deps
window.Swiper = require('swiper');
// modules
window.SliderFeed = require('./_modules/sliderFeed');
window.CategorySingleFeed = require('./_modules/categorySingleFeed');
// init
(function(){
    // init sliderFeeds
    var sliderFeeds = document.querySelectorAll('.ed--module-slider-feed');
    if (sliderFeeds.length) {
        for (var i = 0; i < sliderFeeds.length; i++) {
            new SliderFeed(sliderFeeds[i]);
        }
    }
    // init category single product pull from feed
    var categoryFeeds = document.querySelectorAll('.ed--module-category-single');
    if (categoryFeeds.length) {
        for (var i = 0; i < categoryFeeds.length; i++) {
            new CategorySingleFeed(categoryFeeds[i]);
        }
    }

    // set bg image on hero
    var heroImage = document.querySelectorAll('.ed--module-hero-image')[0];
    var heroImageUrl = heroImage.dataset.bgimage;
    heroImage.style.backgroundImage = 'url('+heroImageUrl+')';
})();
