import { expect, test } from 'bun:test';

import { parsePhoton } from './photon';

test('parses Photon features, keeps Pakistan only, builds subtitles', () => {
  const out = parsePhoton({
    features: [
      {
        geometry: { coordinates: [67.087, 24.835] },
        properties: { osm_type: 'N', osm_id: 1, osm_value: 'neighbourhood', name: 'Qayyumabad', city: 'Karachi', state: 'Sindh', countrycode: 'PK' },
      },
      {
        geometry: { coordinates: [67.09, 24.83] },
        properties: { osm_type: 'W', osm_id: 2, osm_value: 'residential', street: 'Korangi Road', housenumber: '12', district: 'Qayyumabad', city: 'Karachi', countrycode: 'PK' },
      },
      { geometry: { coordinates: [77.2, 28.6] }, properties: { osm_type: 'N', osm_id: 3, name: 'Delhi', countrycode: 'IN' } },
      { geometry: { coordinates: [67, 24] }, properties: { osm_type: 'N', osm_id: 1, name: 'Qayyumabad', countrycode: 'PK' } },
    ],
  });
  expect(out.map((p) => p.name)).toEqual(['Qayyumabad', '12 Korangi Road']);
  expect(out[0]).toMatchObject({ id: 'photon:N1', subtitle: 'Karachi, Sindh', latitude: 24.835, longitude: 67.087 });
  expect(out[1].subtitle).toBe('Qayyumabad, Karachi');
});
