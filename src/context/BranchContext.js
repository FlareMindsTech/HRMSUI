import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { selectAuthUser, selectIsSystemAdmin, selectAuthStatus } from "../redux/slices/authSlice";
import { setBranchMismatchHandler } from "../config/api";
import { fetchMyOrganization, fetchBranchesDropdown, fetchBranches } from "../services/organizationService";

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const authStatus = useSelector(selectAuthStatus);

  const [organization, setOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read saved selectedBranchId from localStorage
  const [selectedBranchId, setSelectedBranchIdState] = useState(() => {
    return localStorage.getItem("selectedBranchId") || "";
  });

  // Determine user access properties
  // Stable identity for the signed-in user. The user object reference changes
  // on every auth sync (login.fulfilled then fetchAuth.fulfilled) even when
  // it is the same person — keying effects on the object re-fired
  // loadOrganization + loadBranches on every login.
  const userId = user?._id || user?.id || user?.email || null;
  const orgLoadedForRef = useRef(null);
  const branchesLoadedForRef = useRef(null);
  const isOwner = user?.roleCode === "OWNER" || user?.priority === 1;
  const rawAccessLevel = user?.accessLevel || (user?.primaryBranchId || (Array.isArray(user?.branchIds) && user.branchIds.length > 0) ? "BRANCH" : "ORGANIZATION");
  const accessLevel = isOwner ? "ORGANIZATION" : rawAccessLevel;

  const primaryBranchId = user?.primaryBranchId?._id || user?.primaryBranchId || null;
  const userBranchIds = useMemo(() => {
    if (!user?.branchIds || !Array.isArray(user.branchIds)) return [];
    return user.branchIds.map((b) => (typeof b === "object" && b !== null ? b._id || b.id : b)).filter(Boolean);
  }, [user]);

  // Load Organization
  const loadOrganization = useCallback(async () => {
    try {
      const org = await fetchMyOrganization(true);
      if (org && (org._id || org.id || org.organizationName || org.name)) {
        setOrganization(org);
        const orgId = org._id || org.id;
        if (orgId) {
          localStorage.setItem("organizationId", orgId);
          localStorage.setItem("tenantId", orgId);
        }
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.warn("BranchContext: Failed to load organization:", err.message);
      setOrganization(null);
    }
  }, []);

  // Load Branches
  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      let list = await fetchBranchesDropdown().catch(() => []);
      if (!list || list.length === 0) {
        const fullRes = await fetchBranches({ limit: 100, status: "ACTIVE" }).catch(() => null);
        list = fullRes?.data || [];
      }

      // Filter branches if user has BRANCH-specific access and is not Owner/SuperAdmin
      let accessible = list || [];
      if (!isOwner && !isSystemAdmin && accessLevel === "BRANCH" && userBranchIds.length > 0) {
        accessible = accessible.filter((b) => {
          const bId = String(b._id || b.id);
          return userBranchIds.some((ubId) => String(ubId) === bId);
        });
      }

      setBranches(accessible);

      // Auto-validate and select branch
      if (accessible.length === 1) {
        const singleId = String(accessible[0]._id || accessible[0].id);
        setSelectedBranchIdState(singleId);
        localStorage.setItem("selectedBranchId", singleId);
      } else if (accessible.length > 1) {
        const saved = localStorage.getItem("selectedBranchId");
        if (saved && saved !== "" && saved !== "all") {
          const isValid = accessible.some((b) => String(b._id || b.id) === String(saved));
          if (!isValid) {
            // Reset to primary branch or empty
            const fallback = primaryBranchId && accessible.some((b) => String(b._id || b.id) === String(primaryBranchId))
              ? String(primaryBranchId)
              : "";
            setSelectedBranchIdState(fallback);
            localStorage.setItem("selectedBranchId", fallback);
          }
        }
      }
    } catch (err) {
      console.warn("BranchContext: Failed to load branches:", err.message);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [accessLevel, isOwner, isSystemAdmin, userBranchIds, primaryBranchId]);

  // Organization does not depend on the access filter — load once per person.
  useEffect(() => {
    if (!userId) {
      orgLoadedForRef.current = null;
      setOrganization(null);
      return;
    }
    if (orgLoadedForRef.current === userId) return;
    orgLoadedForRef.current = userId;
    loadOrganization();
  }, [userId, loadOrganization]);

  // Keep authoritative React state in sync when apiFetch recovers from a
  // branch mismatch: it already cleared storage and retried without the
  // branch header, so mirror the reset here ("All branches") instead of
  // diverging until reload. Ownership stays in this context — apiFetch only
  // notifies; the state write below is the single writer.
  useEffect(() => {
    setBranchMismatchHandler(() => {
      setSelectedBranchIdState("");
    });
    return () => setBranchMismatchHandler(null);
  }, []);

  // Branches depend on the access filter, so reload when the filter inputs
  // actually change — but not mid-refresh (authStatus === 'loading' means the
  // enriched fetchAuth user is incoming) and not twice for the same filter.
  const branchIdsKey = Array.isArray(user?.branchIds)
    ? user.branchIds.map((b) => (typeof b === 'object' && b !== null ? b._id || b.id : b)).join(',')
    : '';
  const branchesFilterKey = `${userId || ''}|${accessLevel}|${branchIdsKey}`;
  useEffect(() => {
    if (!userId) {
      branchesLoadedForRef.current = null;
      setBranches([]);
      setLoading(false);
      return;
    }
    if (authStatus === 'loading') return;
    if (branchesLoadedForRef.current === branchesFilterKey) return;
    branchesLoadedForRef.current = branchesFilterKey;
    loadBranches();
    // loadBranches carries the access filter in its identity; branchIdsKey /
    // accessLevel are folded into branchesFilterKey above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authStatus, branchesFilterKey]);

  // Set Selected Branch with authorization check
  const setSelectedBranchId = useCallback(
    (branchId) => {
      if (!branchId || branchId === "all" || branchId === "") {
        if (accessLevel === "BRANCH" && branches.length === 1) {
          // If only 1 branch, keep that branch
          const singleId = String(branches[0]._id || branches[0].id);
          setSelectedBranchIdState(singleId);
          localStorage.setItem("selectedBranchId", singleId);
          return;
        }
        setSelectedBranchIdState("");
        localStorage.setItem("selectedBranchId", "");
        return;
      }

      // Verify branch is in accessible branches
      const isAllowed = isOwner || isSystemAdmin || accessLevel === "ORGANIZATION" || branches.some((b) => String(b._id || b.id) === String(branchId));
      if (!isAllowed) {
        console.warn("BranchContext: Blocked selection of unauthorized branch:", branchId);
        return;
      }

      const validId = String(branchId);
      setSelectedBranchIdState(validId);
      localStorage.setItem("selectedBranchId", validId);
    },
    [accessLevel, branches, isOwner, isSystemAdmin]
  );

  const isBranchAuthorized = useCallback(
    (branchId) => {
      if (!branchId) return true;
      if (isOwner || isSystemAdmin || accessLevel === "ORGANIZATION") return true;
      return branches.some((b) => String(b._id || b.id) === String(branchId));
    },
    [accessLevel, branches, isOwner, isSystemAdmin]
  );

  const selectedBranchObj = useMemo(() => {
    if (!selectedBranchId) return null;
    return branches.find((b) => String(b._id || b.id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  return (
    <BranchContext.Provider
      value={{
        organization,
        branches,
        accessLevel,
        primaryBranchId,
        branchIds: userBranchIds,
        selectedBranchId,
        selectedBranchObj,
        loading,
        setSelectedBranchId,
        isBranchAuthorized,
        refreshBranches: loadBranches,
        refreshOrganization: loadOrganization,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};

export default BranchContext;
