export function createLocationProvider({ navigatorRef = navigator } = {}) {
  return {
    request() {
      if (!navigatorRef?.geolocation?.getCurrentPosition) return Promise.resolve({ status: 'unsupported' });
      return new Promise(resolve => navigatorRef.geolocation.getCurrentPosition(
        position => resolve({ status: 'granted', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
        error => resolve({ status: error?.code === 1 ? 'denied' : 'unavailable' }),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      ));
    }
  };
}
