import DBHelper from './dbhelper';
// let restaurant;
// let newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

document.getElementById('submit-review').addEventListener('click', (evt) => {
  // console.log('evt', evt.target)
  const name = document.getElementById('reviewer-name');
  const comment = document.getElementById('review');
  if (name.value == '' || comment.value == '' || rating == -1) {
    alert('Please fill all the fields');
    return;
  }
  // if none of the fields are empty
  DBHelper.addNewReview(name.value, comment.value, rating, self.restaurant.id, (resp, err) => {
    if (err) {
      // console.log('Submit Review Failed')
      return;
    }
    // reset the form
    name.value = '';
    comment.value = '';
    for (var i = 0; i < stars.length; i++) {
      if (stars[i].classList.contains('star-fill')) {
        stars[i].classList.remove('star-fill');
      }
    }
  });
  // disable the button , to disallow multiple clicks
  evt.target.disabled = true;
  evt.target.style.cursor = 'not-allowed';
  // console.log('location', location)
  location.reload();
});

const stars = document.getElementsByClassName('star');
var rating = -1;
for (var i = 0; i < stars.length; i++) {
  stars[i].addEventListener('click', function(evt) {
    // console.log(evt.target.id)
    rating = evt.target.id;
    getRating(rating);
  });
}

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL()
    .then((restaurant) => {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer(
        'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}',
        {
          mapboxToken:
            'pk.eyJ1Ijoic2V2ZW5zaW5zMDIiLCJhIjoiY2pqMnAxNmN4MG5rMjN3cGQzdzF6ZGI4NyJ9.7rVXEYPzcNNLT8WaAPs3Dw',
          maxZoom: 18,
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: 'mapbox.streets'
        }
      ).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    })
    .catch((err) => console.error(err));
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  if (self.restaurant) {
    // restaurant already fetched!
    return self.restaurant;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    const error = 'No restaurant id in URL';
    return error;
  } else {
    return DBHelper.fetchRestaurantById(id).then((restaurant) => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      return restaurant;
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label', `Address ${restaurant.address}`);
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.setAttribute('alt', `Image of ${restaurant.name} restaurant`);
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const elem = document.getElementById('like');
  if (restaurant.isFavourite) elem.classList.add('heart-fill');
  else {
    elem.classList.remove('heart-fill');
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label', `Cuisine ${restaurant.cuisine_type}`);
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML(restaurant.id);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (const key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (id) => {
  DBHelper.fetchAllReviewsById(id, (reviews, error) => {
    if (error) return;
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    title.setAttribute('tabindex', '0');
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach((review) => {
      // console.log('REVIEW', review)
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  const contentDiv = document.createElement('div');
  const name = document.createElement('p');

  li.setAttribute('tabindex', '0');
  name.innerHTML = review.name;
  div.appendChild(name);

  const date = document.createElement('p');
  const millis = Date.now() - review.updatedAt;
  const time = Math.floor(millis / 1000);
  var mins = Math.floor(time / 60);
  var hrs = Math.floor(mins / 60);
  var days = Math.floor(hrs / 24);
  var months = Math.floor(days / 30);
  if (time === 0) date.innerHTML = 'Updated Recently';
  else if (months > 0) date.innerHTML = `Updated ${months} months ago`;
  else if (days > 0) date.innerHTML = `Updated ${days} days ago`;
  else if (hrs > 0) date.innerHTML = `Updated ${hrs} hours ago`;
  else if (mins > 0) date.innerHTML = `Updated ${mins} mins ago`;
  else date.innerHTML = `Updated ${time} seconds ago`;
  div.appendChild(date);
  div.classList.add('review-title');
  li.appendChild(div);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  contentDiv.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  contentDiv.appendChild(comments);
  contentDiv.classList.add('review-content');
  li.appendChild(contentDiv);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);

  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get Ratings
 */
function getRating(i) {
  var review = document.getElementById('review');
  switch (i) {
    case '0':
      review.innerHTML = 'Bad';
      break;
    case '1':
      review.innerHTML = 'Average';
      break;
    case '2':
      review.innerHTML = 'Good';
      break;
    case '3':
      review.innerHTML = 'Very Good';
      break;
    case '4':
      review.innerHTML = 'Excellent';
      break;
  }
  for (let k = 0; k <= stars.length; k++) {
    console.log(stars[k].classList);
    const elem = stars[k];
    const exists = elem.classList.contains('star-fill');
    if (k <= i && !exists) elem.classList.add('star-fill');
    else if (k > i && exists) {
      elem.classList.remove('star-fill');
    }
  }
}

const handleFavoriteClick = (id, newState) => {
  var elem = document.getElementById('like');
  if (newState) elem.classList.add('heart-fill');
  else {
    elem.classList.remove('heart-fill');
  }
  elem.onclick = () => handleFavoriteClick(id, !newState);
  DBHelper.handleFavoriteClick(id, newState);
};
