import { ApiError } from '@/core/api/api-error';
import { mapApiError } from '@/core/failures';

import { AiLimitFailure } from '../domain/failures';
import type { PersonalizeRepository } from '../domain/ports';
import type { PersonalizeResponseDto } from './dto/personalize.dto';
import { personalizeRemoteSource } from './sources/personalize-remote-source';

function toPersonalization(dto: PersonalizeResponseDto) {
  return {
    title: dto.title,
    description: dto.description,
    facts: { dateTimeText: dto.facts.dateTimeText, venueText: dto.facts.venueText, url: dto.facts.url },
    cached: dto.cached,
  };
}

/** AI personalization: maps the response to the domain model and AI_LIMIT_REACHED to AiLimitFailure. */
export const personalizeRepository: PersonalizeRepository = {
  async personalize(eventId, options) {
    try {
      const body = { shorten: options.shorten, ...(options.translateTo ? { translateTo: options.translateTo } : {}) };
      return toPersonalization(await personalizeRemoteSource.run(eventId, body));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'AI_LIMIT_REACHED') throw new AiLimitFailure();
      throw mapApiError(error);
    }
  },
};
