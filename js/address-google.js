(() => {
  const key = window.addressConfig?.apiKey?.trim();
  if (!key) return;
  let loading;
  const sessions = new WeakMap();
  const BIAS = { center: { lat: 37.7397, lng: -121.4252 }, radius: 50000 };

  function library() {
    if (window.google?.maps?.importLibrary) return window.google.maps.importLibrary('places');
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      const timeout = setTimeout(() => finish(new Error('Address service unavailable')), 15000);
      function finish(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else window.google.maps.importLibrary('places').then(resolve, reject);
      }
      window.googlePlacesReady = () => finish();
      script.onerror = () => finish(new Error('Address service unavailable'));
      script.src = 'https://maps.googleapis.com/maps/api/js?' + new URLSearchParams({ key, v: 'weekly', loading: 'async', libraries: 'places', callback: 'googlePlacesReady' });
      script.async = true;
      document.head.append(script);
    });
    return loading;
  }

  window.addressProvider = {
    attribution: 'Google Maps',

    async suggest(query, input) {
      const { AutocompleteSuggestion, AutocompleteSessionToken } = await library();
      let token = sessions.get(input);
      if (!token) { token = new AutocompleteSessionToken(); sessions.set(input, token); }
      const town = input.dataset.addressKind === 'town';
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken: token,
        includedRegionCodes: ['us'],
        includedPrimaryTypes: town ? ['(cities)'] : ['street_address', 'premise', 'subpremise'],
        locationBias: BIAS,
      });
      return suggestions.filter(s => s.placePrediction).map(s => ({
        label: s.placePrediction.text.toString().replace(/, USA$/, ''),
        prediction: s.placePrediction,
        session: token,
      }));
    },

    async resolve(item, input) {
      try {
        if (input.dataset.addressKind === 'town') return { label: item.label };
        const place = item.prediction.toPlace();
        await place.fetchFields({ fields: ['formattedAddress'] });
        return { label: (place.formattedAddress || item.label).replace(/, USA$/, '') };
      } finally {
        if (sessions.get(input) === item.session) sessions.delete(input);
      }
    },
  };
})();
