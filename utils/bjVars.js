const bjReviewSelect = '-__v';
const bjBeerSelect =
    '_id beerName brewery style degrees abv bi logo logoId description averageRating totalNumberOfRatings';
const bjTempBeerSelect = bjBeerSelect + ' tempBeer tempBrewery';
const bjBrewerySelect = '-__v -sumOfAllBeerRatings -dateCreated';

module.exports = { bjReviewSelect, bjBeerSelect, bjTempBeerSelect, bjBrewerySelect };
