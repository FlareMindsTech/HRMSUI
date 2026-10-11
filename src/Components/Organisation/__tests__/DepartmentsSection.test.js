import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchDepartmentsDropdown,
} from '../../../services/organizationService';

jest.mock('../../../config/api', () => {
  const actual = jest.requireActual('../../../config/api');
  return {
    apiFetch: jest.fn(),
    apiError: jest.fn((res, fallback) => {
      const err = new Error(res?.data?.message || fallback);
      err.status = res?.status;
      err.mapped = { message: res?.data?.message || fallback, blockers: res?.data?.blockers };
      return err;
    }),
    buildQuery: actual.buildQuery,
    authHeaders: jest.fn(() => ({})),
    getAuthToken: jest.fn(() => 'mock-token'),
    setBranchMismatchHandler: jest.fn(),
  };
});

const { apiFetch } = require('../../../config/api');

describe('Department Service Contract & Alignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchDepartments calls canonical /departments with query string', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { success: true, data: [{ _id: 'dept-1', departmentName: 'Engineering' }] },
    });

    const res = await fetchDepartments({ page: 1, limit: 10, branchId: 'br-1' });
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/departments\?page=1&limit=10&branchId=br-1/),
      { method: 'GET' }
    );
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it('fetchDepartments supports limit 1000 for unpaginated hierarchy tree', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        success: true,
        data: [
          { _id: 'parent-1', departmentName: 'HQ Eng', parentDepartmentId: null },
          { _id: 'child-1', departmentName: 'QA', parentDepartmentId: 'parent-1' },
        ],
      },
    });

    const res = await fetchDepartments({ page: 1, limit: 1000, status: 'ACTIVE' });
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/departments\?page=1&limit=1000&status=ACTIVE/),
      { method: 'GET' }
    );
    expect(res.data).toHaveLength(2);
  });

  it('createDepartment calls canonical POST /departments with scoped branch', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      data: { success: true, message: 'Department created successfully' },
    });

    const payload = {
      departmentName: 'Product',
      departmentCode: 'PROD',
      branchId: 'br-1',
      parentDepartmentId: null,
      status: 'ACTIVE',
    };
    const res = await createDepartment(payload);
    expect(apiFetch).toHaveBeenCalledWith('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(res.success).toBe(true);
  });

  it('deleteDepartment calls canonical DELETE /departments/:id for soft deactivation', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { success: true, message: 'Department deactivated successfully' },
    });

    const res = await deleteDepartment('dept-123');
    expect(apiFetch).toHaveBeenCalledWith('/departments/dept-123', { method: 'DELETE' });
    expect(res.success).toBe(true);
  });

  it('fetchDepartmentsDropdown calls canonical /departments/dropdown with optional branch scope', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { success: true, data: [] },
    });

    await fetchDepartmentsDropdown({ branchId: 'br-123' });
    expect(apiFetch).toHaveBeenCalledWith('/departments/dropdown?branchId=br-123', { method: 'GET' });
  });
});
