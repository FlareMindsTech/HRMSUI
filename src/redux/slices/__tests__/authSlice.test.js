import authReducer, {
  selectAuthScope,
  selectAuthAccessLevel,
  selectHasPermission,
  login,
} from '../authSlice';

describe('authSlice', () => {
  it('handles login with nested data.data.user structure', () => {
    const initialState = {
      user: null,
      tenant: null,
      role: null,
      menus: [],
      permissions: [],
      tokenPresent: false,
      isAuthenticated: false,
      status: 'idle',
      error: null,
    };

    const action = {
      type: login.fulfilled.type,
      payload: {
        user: {
          id: 'user-123',
          email: 'owner@example.com',
          roleCode: 'OWNER',
          priority: 1,
          scope: 'ORGANIZATION',
        },
        token: 'sample-jwt-token',
        menus: ['ORGANIZATION', 'BRANCHES'],
        permissions: ['*'],
        fetchedAt: Date.now(),
      },
    };

    const nextState = authReducer(initialState, action);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user.email).toBe('owner@example.com');
    expect(nextState.user.roleCode).toBe('OWNER');

    const state = { auth: nextState };
    expect(selectAuthScope(state)).toBe('ORGANIZATION');
    expect(selectAuthAccessLevel(state)).toBe('ORGANIZATION');
    expect(selectHasPermission(state, 'branch.create')).toBe(true);
  });

  it('evaluates branch user permissions and scope correctly', () => {
    const branchUserState = {
      auth: {
        user: {
          id: 'user-456',
          email: 'manager@example.com',
          roleCode: 'BRANCH_MANAGER',
          priority: 3,
          scope: 'BRANCH',
          branchId: 'branch-1',
          assignedBranchIds: ['branch-1'],
        },
        tenant: {
          accessLevel: 'BRANCH',
        },
        permissions: ['branch.view', 'department.view'],
      },
    };

    expect(selectAuthScope(branchUserState)).toBe('BRANCH');
    expect(selectAuthAccessLevel(branchUserState)).toBe('BRANCH');
    expect(selectHasPermission(branchUserState, 'branch.view')).toBe(true);
    expect(selectHasPermission(branchUserState, 'branch.create')).toBe(false);
  });
});
