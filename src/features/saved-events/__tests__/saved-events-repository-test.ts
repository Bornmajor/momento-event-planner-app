import { ApiError } from '@/core/api/api-error';

jest.mock('@/features/saved-events/data/sources/saved-events-remote-source', () => ({
  savedEventsRemoteSource: { list: jest.fn(), save: jest.fn(), remove: jest.fn() },
}));

// eslint-disable-next-line import/first -- mocks must be registered first
import { EventNotFoundFailure } from '@/features/events';
// eslint-disable-next-line import/first
import { savedEventsRepository } from '../data/saved-events-repository';
// eslint-disable-next-line import/first
import { savedEventsRemoteSource } from '../data/sources/saved-events-remote-source';
// eslint-disable-next-line import/first
import { SavedLimitFailure } from '../domain/failures';

const saved = (eventId: string) => ({ eventId, savedAt: '2026-11-09T10:00:00Z', available: false, event: null });

describe('savedEventsRepository', () => {
  it('reads both pages when there are more than 50 saved events', async () => {
    (savedEventsRemoteSource.list as jest.Mock)
      .mockResolvedValueOnce({ items: [saved('A')], page: 0, size: 50, totalItems: 51 })
      .mockResolvedValueOnce({ items: [saved('B')], page: 1, size: 50, totalItems: 51 });

    expect((await savedEventsRepository.list()).map((s) => s.eventId)).toEqual(['A', 'B']);
    expect(savedEventsRemoteSource.list).toHaveBeenCalledWith(1, 50);
  });

  it('turns its error codes into domain failures', async () => {
    (savedEventsRemoteSource.save as jest.Mock).mockRejectedValueOnce(new ApiError(409, 'SAVED_LIMIT_REACHED', 'full'));
    await expect(savedEventsRepository.save('E1')).rejects.toBeInstanceOf(SavedLimitFailure);

    (savedEventsRemoteSource.save as jest.Mock).mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'gone'));
    await expect(savedEventsRepository.save('E1')).rejects.toBeInstanceOf(EventNotFoundFailure);
  });
});
