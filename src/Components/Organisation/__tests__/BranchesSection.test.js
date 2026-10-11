import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../../services/organizationService';

jest.mock('../../../config/api', () => ({
  apiFetch: jest.fn(),
  apiError: jest.fn((res, fallback) => {
    const err = new Error(res?.data?.message || fallback);
    err.status = res?.status;
    err.mapped = { message: res?.data?.message || fallback };
    return err;
  }),
  buildQuery: jest.fn(() => ''),
  authHeaders: jest.fn(() => ({})),
  getAuthToken: jest.fn(() => 'mock-token'),
  setBranchMismatchHandler: jest.fn(),
}));

const { apiFetch, buildQuery } = require('../../../config/api');

describe('Branch Service Alignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildQuery.mockReturnValue('');
  });

  it('fetchBranches calls canonical /branch endpoint', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { success: true, data: [] },
    });

    const res = await fetchBranches();
    expect(apiFetch).toHaveBeenCalledWith('/branch', { method: 'GET' });
    expect(res.success).toBe(true);
  });

  it('createBranch calls canonical POST /branch', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      data: { success: true, message: 'Branch created successfully' },
    });

    const payload = { branchName: 'Head Office', branchCode: 'HQ', branchType: 'HEAD_OFFICE' };
    const res = await createBranch(payload);
    expect(apiFetch).toHaveBeenCalledWith('/branch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(res.success).toBe(true);
  });

  it('deleteBranch calls canonical DELETE /branch/:id for soft deactivation', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { success: true, message: 'Branch deactivated successfully' },
    });

    const res = await deleteBranch('branch-123');
    expect(apiFetch).toHaveBeenCalledWith('/branch/branch-123', { method: 'DELETE' });
    expect(res.success).toBe(true);
  });
});
