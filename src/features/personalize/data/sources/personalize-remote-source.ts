import { api } from '@/core/api/http';

import type { PersonalizeRequestDto, PersonalizeResponseDto } from '../dto/personalize.dto';

/** `POST /events/:id/personalize`: DTOs in and out, raw errors. */
export const personalizeRemoteSource = {
  run: (eventId: string, body: PersonalizeRequestDto) =>
    api.post<PersonalizeResponseDto>(`/events/${encodeURIComponent(eventId)}/personalize`, body),
};
