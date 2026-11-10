jest.mock('@/api/endpoints', () => ({ meApi: { update: jest.fn(), delete: jest.fn() }, savedEventsApi: {} }));
jest.mock('@/features/auth', () => ({ onSessionEnd: jest.fn(), signOut: jest.fn() }));
jest.mock('@/core/calendar/device-calendar', () => ({ deleteCalendarEntry: jest.fn(async () => undefined) }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { meApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { signOut } from '@/features/auth';
// eslint-disable-next-line import/first
import { useCalendarEntries } from '@/features/saved-events';
// eslint-disable-next-line import/first
import { deleteCalendarEntry } from '@/core/calendar/device-calendar';
// eslint-disable-next-line import/first
import { deleteAccount, profileSchema, toUpdateRequest } from '../account';

describe('profile', () => {
  it('accepts an empty or international phone and clears an empty one', () => {
    expect(profileSchema.safeParse({ firstName: 'Ada', lastName: 'L', phone: '0712345678' }).success).toBe(false);
    expect(toUpdateRequest({ firstName: ' Ada ', lastName: 'L', phone: '+254 712 345 678' })).toEqual({
      firstName: 'Ada',
      lastName: 'L',
      phone: '+254 712 345 678',
    });
    expect(toUpdateRequest({ firstName: 'Ada', lastName: 'L', phone: ' ' }).phone).toBeNull();
  });

  it("deletes the account, then this user's calendar entries, then signs out", async () => {
    (meApi.delete as jest.Mock).mockResolvedValue(undefined);
    useCalendarEntries.getState().set('u1', 'A', 'cal-A');
    useCalendarEntries.getState().set('u2', 'B', 'cal-B');

    await deleteAccount('u1');

    expect(deleteCalendarEntry).toHaveBeenCalledWith('cal-A');
    expect(deleteCalendarEntry).not.toHaveBeenCalledWith('cal-B');
    expect(useCalendarEntries.getState().byUser).toEqual({ u2: { B: 'cal-B' } });
    expect(signOut).toHaveBeenCalled();
  });
});
