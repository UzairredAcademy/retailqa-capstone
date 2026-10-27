// FR-001 User Authentication & Session Management - P0
import { loginAndCheckSession } from '../../support/flows';

describe('User Authentication', () => {
  // FR-001-AC3
  it('T-UI-AUTH-003: Session persists across page navigation', () => {
    // Arrange + Act + Assert (log in, navigate every main page, refresh each one)
    loginAndCheckSession('customer1');
  });
});
