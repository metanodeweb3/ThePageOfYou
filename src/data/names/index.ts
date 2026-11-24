import { PersonNameData } from '../../types';
import { POPULAR_GROUP_1 } from './popularGroup1';
import { POPULAR_GROUP_2 } from './popularGroup2';
import { CURATED_BATCH_1 } from './curatedBatch1';
import { CURATED_BATCH_2 } from './curatedBatch2';
import { CURATED_BATCH_3 } from './curatedBatch3';
import { CURATED_BATCH_4 } from './curatedBatch4';

export const POPULAR_NAMES_DATA: Record<string, PersonNameData> = {
  ...POPULAR_GROUP_1,
  ...POPULAR_GROUP_2,
  ...CURATED_BATCH_1,
  ...CURATED_BATCH_2,
  ...CURATED_BATCH_3,
  ...CURATED_BATCH_4,
};
