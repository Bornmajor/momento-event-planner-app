import { ApiError, NetworkError } from '@/core/api/api-error';
import { NetworkFailure } from '@/core/failures';

jest.mock('@/features/events/data/sources/events-remote-source', () => ({
  eventsRemoteSource: { search: jest.fn(), categories: jest.fn(), get: jest.fn() },
}));

// eslint-disable-next-line import/first -- mocks must be registered first
import { eventsRepository } from '../data/events-repository';
// eslint-disable-next-line import/first
import { eventsRemoteSource } from '../data/sources/events-remote-source';
// eslint-disable-next-line import/first
import { EventNotFoundFailure } from '../domain/failures';

const dto = {
  id: 'E1',
  source: 'ticketmaster',
  title: 'Jazz Night',
  url: 'https://t.co/e1',
  imageUrl: null,
  start: { localDate: '2026-12-01', localTime: '19:30:00', dateTime: '2026-12-01T19:30:00Z', timezone: 'Europe/London' },
  status: 'onsale',
  category: { id: 'music', name: 'Music', extra: 'x' },
  genre: 'Jazz',
  venue: null,
  priceRange: null,
  description: 'Live jazz.',
  notes: null,
  internalScore: 42, // a field the app doesn't know
};

describe('eventsRepository', () => {
  it('maps the API event to the domain event, keeping only known fields', async () => {
    (eventsRemoteSource.get as jest.Mock).mockResolvedValue({ event: dto });

    const event = await eventsRepository.get('E1');

    expect(event).toMatchObject({ id: 'E1', title: 'Jazz Night', category: { id: 'music', name: 'Music' } });
    expect(event).not.toHaveProperty('internalScore');
    expect(event.category).not.toHaveProperty('extra');
  });

  it('turns NOT_FOUND into EventNotFoundFailure and other errors into shared failures', async () => {
    (eventsRemoteSource.get as jest.Mock).mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'gone'));
    await expect(eventsRepository.get('E1')).rejects.toBeInstanceOf(EventNotFoundFailure);

    (eventsRemoteSource.search as jest.Mock).mockRejectedValueOnce(new NetworkError());
    await expect(eventsRepository.search({ when: 'all', page: 0, size: 20 })).rejects.toBeInstanceOf(NetworkFailure);
  });
});
