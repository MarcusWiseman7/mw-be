const bjReviewSelect = '-__v';
const bjBeerSelect =
    '_id beerName brewery style degrees abv bi logo logoId description averageRating totalNumberOfRatings';
const bjTempBeerSelect = bjBeerSelect + ' tempBeer tempBrewery';
const bjBrewerySelect = '-__v -sumOfAllBeerRatings -dateCreated';

const averageRound = (a, b, c) => {
    const x = Math.pow(10, c || 0);
    return Math.round((a / b) * x) / x;
};

module.exports = { bjReviewSelect, bjBeerSelect, bjTempBeerSelect, bjBrewerySelect, averageRound };
