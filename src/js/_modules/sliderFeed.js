'use strict';
var SliderFeed = function($target) {
    var self = this;
    self.$el = $target;
    self.$sliderHolder = self.$el.querySelector('.ed--module-slider-holder');
    self.$itemCount = parseInt(self.$sliderHolder.dataset.items);
    self.$feedUrl = self.$sliderHolder.dataset.feed;
    self.$ctaText = self.$sliderHolder.dataset.itemcta;
    self.$includeDesc = self.$sliderHolder.dataset.includedesc;
    if (self.$includeDesc === 'no') {
        self.$includeDesc = false
    } else {
        self.$includeDesc = true
    }
    self.$swiperContainer = self.$el.querySelector('.swiper-container');
    self.$slidesHolder = self.$el.querySelector('.swiper-wrapper');
    self.$products = [];

    if (self.$el.classList.contains('multiFeed')){
        // if it's multifeed and an array of feeds has been set
        self.feedArray = JSON.parse(self.$feedUrl);
        self.feedArray.forEach(function(itemUrl,i){
            getFeed(itemUrl).then(function(response) {
                var item = response.Products.List.slice(0,1);
                self.$products.push(item[0]);
                if (self.$products.length === self.feedArray.length) {
                    // if all the items have been added to the products array, init the swiper
                    self.initSwiper(self.$products);
                }
            }, function(error) {
                console.error(error);
            });
        })
    } else {
        // get feed
        getFeed(self.$feedUrl).then(function(response) {
            // grab the specified amount of items from the response, then init the swiper
            self.$products = response.Products.List.slice(0,self.$itemCount);
            self.initSwiper(self.$products);
        }, function(error) {
            console.error(error);
        });
    }
}

SliderFeed.prototype.initSwiper = function($items){
    var self = this;

    // create the slides
    $items.forEach(function(item){
        var slide = document.createElement('div');
        slide.className = 'swiper-slide';

        var slideImage = document.createElement('div');
        slideImage.className = 'slideImage';
        if (item.ImageMain.endsWith('_255.jpg')) {
            var hiRes = item.ImageMain.replace('_255.jpg','_480.jpg');
        } else {
            var hiRes = item.ImageMain;
        }
        slideImage.style.backgroundImage = 'url('+hiRes+')';
        slide.append(slideImage)

        if (self.$includeDesc) {
            var itemBrand = document.createElement('h3');
            itemBrand.className = 'itemBrand';
        } else {
            var itemBrand = document.createElement('h3');
            itemBrand.className = 'itemBrand styled';
        }
        itemBrand.innerHTML = item.DesignerName;
        slide.append(itemBrand)

        if (self.$includeDesc) {
            var itemDesc = document.createElement('p');
            itemDesc.className = 'itemDesc';
            itemDesc.innerHTML = item.Description;
            slide.append(itemDesc);
        }

        var itemLink = document.createElement('a');
        itemLink.className = 'itemLink bold';
        itemLink.innerHTML = self.$ctaText;
        itemLink.href = item.ProductUrl;
        slide.append(itemLink);

        self.$slidesHolder.append(slide)
    })

    // init swiper
    var swiper = new Swiper(self.$swiperContainer, {
        slidesPerView: 'auto',
        loop: true,
        loopedSlides:4,
        centeredSlides: true,
        roundLengths: true,
        pagination: {
            el: '.swiper-pagination',
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

module.exports = SliderFeed;
