/**
 * Central API Error Mapper
 *
 * Normalizes HTTP error responses from HRMS_SERVER:
 * - 401: Unauthorized / expired token
 * - 403: Forbidden / scope restriction / cross-branch access denial
 * - 404: Resource not found / cross-tenant nondisclosure
 * - 409: Conflict (duplicate code/name, or active dependency blockers on deactivation)
 * - 422: Unprocessable entity (cross-branch relationship mismatch)
 * - 500: Server failure
 */

export const mapApiError = (res, defaultMessage = "An unexpected error occurred") => {
  const status = res?.status || 500;
  const data = res?.data || {};
  const rawMessage = data?.message || res?.message || defaultMessage;
  const blockers = data?.blockers || null;

  switch (status) {
    case 401:
      return {
        status,
        type: "UNAUTHORIZED",
        message: "Your session has expired or authentication is invalid. Please log in again.",
        rawMessage,
      };

    case 403: {
      const isCrossBranch =
        rawMessage.toLowerCase().includes("cross-branch") ||
        rawMessage.toLowerCase().includes("not authorized for the requested branch") ||
        rawMessage.toLowerCase().includes("does not belong to your organization");

      const isPlanLimit =
        rawMessage.toLowerCase().includes("plan") ||
        rawMessage.toLowerCase().includes("limit") ||
        rawMessage.toLowerCase().includes("subscription");

      return {
        status,
        type: isCrossBranch ? "CROSS_BRANCH_FORBIDDEN" : isPlanLimit ? "PLAN_LIMIT_REACHED" : "FORBIDDEN",
        message: rawMessage,
        isCrossBranch,
        isPlanLimit,
        rawMessage,
      };
    }

    case 404:
      return {
        status,
        type: "NOT_FOUND",
        message: rawMessage || "The requested resource could not be found.",
        rawMessage,
      };

    case 409: {
      // Deactivation blockers guard
      if (blockers && typeof blockers === "object") {
        const blockerItems = [];
        if (blockers.employees || blockers.users) {
          blockerItems.push(`${blockers.employees || blockers.users} active employee(s)`);
        }
        if (blockers.departments || blockers.childDepartments) {
          blockerItems.push(`${blockers.departments || blockers.childDepartments} active department(s)`);
        }
        if (blockers.teams) {
          blockerItems.push(`${blockers.teams} active team(s)`);
        }
        if (blockers.designations) {
          blockerItems.push(`${blockers.designations} active designation(s)`);
        }
        if (blockers.locations) {
          blockerItems.push(`${blockers.locations} active location(s)`);
        }
        if (blockers.shifts) {
          blockerItems.push(`${blockers.shifts} active shift(s)`);
        }
        if (blockers.workCalendars) {
          blockerItems.push(`${blockers.workCalendars} active work calendar(s)`);
        }
        if (blockers.holidayCalendars) {
          blockerItems.push(`${blockers.holidayCalendars} active holiday calendar(s)`);
        }
        if (blockers.financialYears) {
          blockerItems.push(`${blockers.financialYears} active financial year(s)`);
        }
        if (blockers.costCenters) {
          blockerItems.push(`${blockers.costCenters} active cost center(s)`);
        }

        const formattedSummary = blockerItems.length > 0
          ? `Cannot deactivate due to active dependents: ${blockerItems.join(", ")}. Please reassign or deactivate them first.`
          : rawMessage;

        return {
          status,
          type: "DEACTIVATION_BLOCKED",
          message: formattedSummary,
          blockers,
          blockerItems,
          rawMessage,
        };
      }

      // Unique code or name collision
      const isCodeClash =
        rawMessage.toLowerCase().includes("code") &&
        (rawMessage.toLowerCase().includes("already exists") || rawMessage.toLowerCase().includes("clash"));
      const isNameClash =
        rawMessage.toLowerCase().includes("name") &&
        rawMessage.toLowerCase().includes("already exists");
      const isHeadOfficeClash =
        rawMessage.toLowerCase().includes("head office");

      return {
        status,
        type: isHeadOfficeClash
          ? "HEAD_OFFICE_EXISTS"
          : isCodeClash
          ? "DUPLICATE_CODE"
          : isNameClash
          ? "DUPLICATE_NAME"
          : "CONFLICT",
        message: rawMessage,
        field: isCodeClash ? "code" : isNameClash ? "name" : null,
        rawMessage,
      };
    }

    case 422:
      return {
        status,
        type: "CROSS_BRANCH_MISMATCH",
        message: rawMessage || "Invalid cross-branch relationship. Selected parent, head, or cost center must belong to the same branch.",
        rawMessage,
      };

    default:
      return {
        status,
        type: "SERVER_ERROR",
        message: rawMessage || "A server error occurred. Please try again.",
        rawMessage,
      };
  }
};

export default mapApiError;
