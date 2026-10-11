import { mapApiError } from '../apiErrorMapper';

describe('apiErrorMapper', () => {
  it('maps 401 unauthorized error', () => {
    const error = mapApiError({ status: 401 });
    expect(error.status).toBe(401);
    expect(error.type).toBe('UNAUTHORIZED');
  });

  it('maps 403 cross-branch error', () => {
    const error = mapApiError({
      status: 403,
      data: { message: 'Cross-branch access forbidden. You do not have access to this branch.' },
    });
    expect(error.status).toBe(403);
    expect(error.type).toBe('CROSS_BRANCH_FORBIDDEN');
    expect(error.isCrossBranch).toBe(true);
  });

  it('maps 409 code collision error', () => {
    const error = mapApiError({
      status: 409,
      data: { message: "Department with code 'ENG' already exists in this branch/organization" },
    });
    expect(error.status).toBe(409);
    expect(error.type).toBe('DUPLICATE_CODE');
    expect(error.field).toBe('code');
  });

  it('maps 409 deactivation blockers', () => {
    const error = mapApiError({
      status: 409,
      data: {
        message: 'Cannot deactivate department',
        blockers: { users: 3, childDepartments: 2 },
      },
    });
    expect(error.status).toBe(409);
    expect(error.type).toBe('DEACTIVATION_BLOCKED');
    expect(error.blockerItems).toContain('3 active employee(s)');
    expect(error.blockerItems).toContain('2 active department(s)');
  });

  it('maps 422 cross-branch relationship error', () => {
    const error = mapApiError({
      status: 422,
      data: { message: 'Parent department belongs to another branch. Departments can only nest within the same branch.' },
    });
    expect(error.status).toBe(422);
    expect(error.type).toBe('CROSS_BRANCH_MISMATCH');
  });
});
