import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveFieldFromSources } from './cms-variables-utils';

describe('resolveFieldFromSources', () => {
  it('prefers translated collection item data over stale layerDataMap values for collection bindings', () => {
    const fieldId = '0af1addc-c139-4b2c-86ac-5ce9d8c3def6';

    const result = resolveFieldFromSources(
      fieldId,
      'collection',
      { [fieldId]: 'EN testimonial text' },
      null,
      'sst-slide-item',
      { 'sst-slide-item': { [fieldId]: 'FR testimonial text' } },
    );

    assert.equal(result, 'EN testimonial text');
  });
});
