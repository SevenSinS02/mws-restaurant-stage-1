import DBHelper from './dbhelper';

// let restaurants;
// let neighborhoods;
// let cuisines;
// let newMap;
// const markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods()
    .then((neighborhoods) => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch((err) => {
      console.error(err);
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  select.addEventListener('change', updateRestaurants);
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines()
    .then((cuisines) => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch((err) => {
      console.error(err);
    });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  select.addEventListener('change', updateRestaurants);
  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken:
      'pk.eyJ1Ijoic2V2ZW5zaW5zMDIiLCJhIjoiY2pqMnAxNmN4MG5rMjN3cGQzdzF6ZGI4NyJ9.7rVXEYPzcNNLT8WaAPs3Dw',
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
  updateRestaurants();
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then((restaurants) => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    })
    .catch((err) => console.error(err));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach((marker) => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  const outerDiv = document.createElement('div');
  const titleDiv = document.createElement('div');
  const addressDiv = document.createElement('div');
  // no need to use picture element as the default images are sufficient
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image of ${restaurant.name} restaurant`;
  outerDiv.append(image);

  const name = document.createElement('h2');
  name.textContent = restaurant.name;
  titleDiv.classList.add('restaurant-title');
  titleDiv.append(name);
  div.append(titleDiv);

  const neighborhood = document.createElement('p');
  neighborhood.textContent = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement('p');
  address.textContent = restaurant.address;
  addressDiv.append(address);
  addressDiv.classList.add('address');
  div.append(addressDiv);

  const more = document.createElement('a');
  more.textContent = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `View details for ${restaurant.name}`);
  div.append(more);
  outerDiv.append(div);
  li.append(outerDiv);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
