import { toEvent } from '@/features/events';

import type { SavedEvent } from '../../domain/models/saved-event';
import type { SavedEventDto } from '../dto/saved-event.dto';

/** API saved event → domain saved event (the event itself uses the events feature's mapper). */
export function toSavedEvent(dto: SavedEventDto): SavedEvent {
  return {
    eventId: dto.eventId,
    savedAt: dto.savedAt,
    available: dto.available,
    event: dto.event ? toEvent(dto.event) : null,
  };
}
