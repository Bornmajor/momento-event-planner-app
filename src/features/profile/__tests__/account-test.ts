jest.mock('@/features/profile/data/sources/me-remote-source', () => ({
  meRemoteSource: { get: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/features/auth', () => ({ ...jest.requireActual('@/features/auth'), signOut: jest.fn() }));
jest.mock('@/core/calendar/device-calendar', () => ({ deleteCalendarEntry: jest.fn(async () => undefined) }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { deleteCalendarEntry } from '@/core/calendar/device-calendar';
// eslint-disable-next-line import/first
import { signOut } from '@/features/auth';
// eslint-disable-next-line import/first
import { useCalendarEntries } from '@/features/saved-events';
// eslint-disable-next-line import/first
import { deleteAccount } from '..';
// eslint-disable-next-line import/first
import { meRemoteSource } from '../data/sources/me-remote-source';
// eslint-disable-next-line import/first
import { profileSchema, toProfileChanges } from '../presentation/schemas';

describe('profile', () => {
  it('accepts an empty or international phone and clears an empty one', () => {
    expect(profileSchema.safeParse({ firstName: 'Ada', lastName: 'L', phone: '0712345678' }).success).toBe(false);
    expect(toProfileChanges({ firstName: ' Ada ', lastName: 'L', phone: '+254 712 345 678' })).toEqual({
      firstName: 'Ada',
      lastName: 'L',
      phone: '+254 712 345 678',
    });
    expect(toProfileChanges({ firstName: 'Ada', lastName: 'L', phone: ' ' }).phone).toBeNull();
  });

  it("deletes the account, then this user's calendar entries, then signs out", async () => {
    (meRemoteSource.delete as jest.Mock).mockResolvedValue(undefined);
    useCalendarEntries.getState().set('u1', 'A', 'cal-A');
    useCalendarEntries.getState().set('u2', 'B', 'cal-B');

    await deleteAccount('u1');

    expect(deleteCalendarEntry).toHaveBeenCalledWith('cal-A');
    expect(deleteCalendarEntry).not.toHaveBeenCalledWith('cal-B');
    expect(useCalendarEntries.getState().byUser).toEqual({ u2: { B: 'cal-B' } });
    expect(signOut).toHaveBeenCalled();
  });
});
