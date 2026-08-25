import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminAccount,
  createCopaTournament,
  deleteGalleryItem,
  createSeason,
  getAdminClubData,
  getPublicClubData,
  listAdminAccounts,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
  saveFootballEntity,
  saveGalleryItem,
  saveHighlight,
  saveMatch,
  savePlayer,
  postponeCopaTournament,
  resolveCopaFixture,
  setCopaTournamentStatus,
  updateCopaFixture,
  searchFootballBadge,
  setAdminAccountActive,
  uploadMedia,
} from "./amigosData";

const queryHook = (key: (input: any) => unknown[], fn: (input: any) => Promise<any>) => ({
  useQuery(input?: any, options?: any): any {
    return useQuery<any>({ queryKey: key(input), queryFn: () => fn(input), ...(options ?? {}) });
  },
});

const mutationHook = (fn: (input?: any) => Promise<any>) => ({
  useMutation(): any {
    return useMutation<any, Error, any>({ mutationFn: fn });
  },
});

export const trpc = {
  useUtils() {
    const client = useQueryClient();
    return {
      club: { publicData: { invalidate: () => client.invalidateQueries({ queryKey: ["club", "publicData"] }) } },
      admin: {
        data: { invalidate: () => client.invalidateQueries({ queryKey: ["admin", "data"] }) },
        access: { list: { invalidate: () => client.invalidateQueries({ queryKey: ["admin", "access", "list"] }) } },
      },
      adminAuth: {
        me: {
          invalidate: () => client.invalidateQueries({ queryKey: ["adminAuth", "me"] }),
          setData: (_input: unknown, data: unknown) => client.setQueryData(["adminAuth", "me"], data),
        },
      },
    };
  },
  club: { publicData: queryHook(() => ["club", "publicData"], () => getPublicClubData()) },
  adminAuth: {
    me: queryHook(() => ["adminAuth", "me"], () => requireAdmin()),
    login: mutationHook(loginAdmin),
    logout: mutationHook(() => logoutAdmin()),
  },
  admin: {
    data: queryHook(() => ["admin", "data"], () => getAdminClubData()),
    searchBadge: queryHook(input => ["admin", "searchBadge", input?.term], searchFootballBadge),
    saveEntity: mutationHook(saveFootballEntity),
    savePlayer: mutationHook(savePlayer),
    saveMatch: mutationHook(saveMatch),
    saveHighlight: mutationHook(saveHighlight),
    saveGalleryItem: mutationHook(saveGalleryItem),
    deleteGalleryItem: mutationHook(deleteGalleryItem),
    createSeason: mutationHook(createSeason),
    copa: {
      create: mutationHook(createCopaTournament),
      setStatus: mutationHook(setCopaTournamentStatus),
      updateFixture: mutationHook(updateCopaFixture),
      postpone: mutationHook(postponeCopaTournament),
      resolveFixture: mutationHook(resolveCopaFixture),
    },
    uploadMedia: mutationHook(uploadMedia),
    access: {
      list: queryHook(() => ["admin", "access", "list"], () => listAdminAccounts()),
      create: mutationHook(createAdminAccount),
      setActive: mutationHook(setAdminAccountActive),
    },
  },
};
