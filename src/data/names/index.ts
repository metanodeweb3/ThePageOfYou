import { PersonNameData } from '../../types';
import { POPULAR_GROUP_1 } from './popularGroup1';
import { POPULAR_GROUP_2 } from './popularGroup2';

export const POPULAR_NAMES_DATA: Record<string, PersonNameData> = {
  ...POPULAR_GROUP_1,
  ...POPULAR_GROUP_2,
};
