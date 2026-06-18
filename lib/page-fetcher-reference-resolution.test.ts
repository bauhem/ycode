import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mergeNestedReferenceValues } from './page-fetcher-reference-utils';

describe('mergeNestedReferenceValues', () => {
  it('does not let nested reference values overwrite current item values', () => {
    const currentItemValues: Record<string, string> = {
      slug: 'developpement-applications-assiste-ia-v2',
      title: 'Passer d’une idée à une application utile',
      'service.slug': 'developpement-applications-assiste-ia-v2',
    };

    const nestedReferenceValues: Record<string, string> = {
      slug: 'design-branding',
      title: 'Clarifier votre offre et votre marque',
      'service.category.slug': 'applications-ia',
    };

    mergeNestedReferenceValues(currentItemValues, nestedReferenceValues, 'service');

    assert.equal(currentItemValues.slug, 'developpement-applications-assiste-ia-v2');
    assert.equal(currentItemValues.title, 'Passer d’une idée à une application utile');
    assert.equal(currentItemValues['service.category.slug'], 'applications-ia');
    assert.equal(currentItemValues['service.slug'], 'developpement-applications-assiste-ia-v2');
  });
});
