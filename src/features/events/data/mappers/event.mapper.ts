import type { Category, Event, EventPage, EventSummary } from '../../domain/models/event';
import type { CategoryDto, EventDto, EventPageDto, EventSummaryDto } from '../dto/event.dto';

/** API event → domain event. Picks the known fields, so extra API fields never leak into the app. */
export function toEventSummary(dto: EventSummaryDto): EventSummary {
  return {
    id: dto.id,
    source: dto.source,
    title: dto.title,
    url: dto.url,
    imageUrl: dto.imageUrl,
    start: {
      localDate: dto.start.localDate,
      localTime: dto.start.localTime,
      dateTime: dto.start.dateTime,
      timezone: dto.start.timezone,
    },
    status: dto.status,
    category: dto.category ? toCategory(dto.category) : null,
    genre: dto.genre,
    venue: dto.venue
      ? { name: dto.venue.name, city: dto.venue.city, country: dto.venue.country, address: dto.venue.address }
      : null,
    priceRange: dto.priceRange
      ? { min: dto.priceRange.min, max: dto.priceRange.max, currency: dto.priceRange.currency }
      : null,
  };
}

export function toEvent(dto: EventDto): Event {
  return { ...toEventSummary(dto), description: dto.description, notes: dto.notes };
}

export function toCategory(dto: CategoryDto): Category {
  return { id: dto.id, name: dto.name };
}

export function toEventPage(dto: EventPageDto): EventPage {
  return {
    items: dto.items.map(toEventSummary),
    page: dto.page,
    size: dto.size,
    totalPages: dto.totalPages,
    totalItems: dto.totalItems,
  };
}
