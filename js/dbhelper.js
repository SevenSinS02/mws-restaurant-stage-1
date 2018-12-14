import idb from 'idb';

/**
 * Common database helper functions.
 */

function _parseJson(resp) {
  return resp.json();
}

function _checkIdb() {
  return 'indexedDB' in window;
}

function _openIdb() {
  if (!_checkIdb()) return;
  return idb.open('restaurant-db', 1, (upgradeDb) => {
    upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
  });
}

function _insert(data) {
  const dbPromise = _openIdb();
  return dbPromise.then((db) => {
    const tx = db.transaction('restaurants', 'readwrite');
    const store = tx.objectStore('restaurants');
    data.map((restaurant) => store.put(restaurant));
    return tx.complete;
  });
}

function _read() {
  const dbPromise = _openIdb();
  return dbPromise.then((db) => {
    var tx = db.transaction('restaurants', 'readonly');
    var store = tx.objectStore('restaurants');
    return store.getAll();
  });
}

/*
 * Add Review to Indexeddb
 */
function _insertReview(review) {
  const dbPromise = _openIdb();
  return dbPromise.then((db) => {
    var tx = db.transaction('reviews', 'readwrite');
    var store = tx.objectStore('reviews');
    store.put(review);
    return tx.complete;
  });
}

/*
 * Fetch all Reviews for Restaurant ID
 */
function _readReview(id) {
  const dbPromise = _openIdb();
  return dbPromise
    .then((db) => {
      var tx = db.transaction('reviews', 'readonly');
      var store = tx.objectStore('reviews');
      return store.getAll();
    })
    .then((reviews) => {
      return reviews.filter((review) => review.restaurant_id === id);
    });
}

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Reviews URL.
   *
   */
  static get REVIEWS_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return _read().then((response) => {
      if (response.length > 0) {
        return response;
      } else {
        return fetch(DBHelper.DATABASE_URL, { method: 'get' })
          .then(_parseJson)
          .then((data) => {
            _insert(data);
            return data;
          });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants().then((restaurants) => {
      const restaurant = restaurants.find((r) => r.id == id);
      if (restaurant) {
        // Got the restaurant
        return restaurant;
      } else {
        // Restaurant does not exist in the database
        return 'Restaurant does not exist';
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants().then((restaurants) => {
      // Filter restaurants to have only given cuisine type
      const results = restaurants.filter((r) => r.cuisine_type == cuisine);
      return results;
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then((restaurants) => {
      // Filter restaurants to have only given neighborhood
      const results = restaurants.filter((r) => r.neighborhood == neighborhood);
      return results;
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
      let results = restaurants;
      if (cuisine != 'all') {
        // filter by cuisine
        results = results.filter((r) => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') {
        // filter by neighborhood
        results = results.filter((r) => r.neighborhood == neighborhood);
      }

      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      return uniqueCuisines;
    });
  }

  /**
   * Fetch all reviews for restaurant id
   */

  static fetchAllReviewsById(id, callback) {
    const currTime = Date.now();
    _readReview(id).then((resp) => {
      if (resp.length > 0) {
        resp.sort((a, b) => currTime - a.updatedAt - (currTime - b.updatedAt));
        callback(resp, null);
      } else {
        const URL = DBHelper.REVIEWS_URL + '?restaurant_id=' + id;
        // console.log('URL', URL)
        return fetch(URL, {
          method: 'get'
        })
          .then((resp) => resp.json())
          .then((data) => {
            data.sort((a, b) => currTime - a.updatedAt - (currTime - b.updatedAt));
            data.map((review) => _insertReview(review));
            callback(data, null);
          })
          .catch((err) => callback(null, err));
      }
    });
  }

  /**
   *  Add New Review
   */
  static addNewReview(name, comment, rating, id, callback) {
    let body = {
      id: Date.now(),
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comment,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    // update reviews indexeDB
    _insertReview(body);
    //add review to db
    DBHelper.sendReviewToDatabase(DBHelper.REVIEWS_URL, 'POST', body);

    callback(null, null);
  }

  static sendReviewToDatabase(url = '', method, body) {
    fetch(url, {
      method: 'post',
      body: JSON.stringify(body)
    })
      .then((resp) => {
        console.log('POST resp', resp);
      })
      .catch((err) => {
        /* console.log('post request failed', err) */
      });
  }

  /**
   * Update Favorite Restaurant
   */

  static onFavouriteSelected(id, newState) {
    // update cached restaurant data
    const dbPromise = DBHelper.openIdb();
    // get the cache restaurant data
    dbPromise
      .then((db) => {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        return store.get(id);
      })
      .then((rest) => {
        if (!rest) {
          console.log('No such data exists in cache');
          return;
        }
        // update the cache restaurant data
        rest.isFavourite = newState;
        dbPromise
          .then((db) => {
            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            store.put(rest);
            return tx.complete;
          })
          .then(() => {
            console.log('cache data updated');
          });
      });
    // Update the original data
  }

  /**
   * Update Favorite Restaurant
   */
  static handleFavoriteClick(id, newState) {
    // console.log('DB', id, newState)
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${newState}`, {
      method: 'put'
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `dist/img/${restaurant.photograph}.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}

export default DBHelper;
