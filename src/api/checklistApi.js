// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// export const checklistApi = createApi({
//   reducerPath: "checklistApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: "http://localhost:5000/api",
//     prepareHeaders: (headers, { getState }) => {
//       const token = getState().auth.token;
//       if (token) headers.set("authorization", `Bearer ${token}`);
//       return headers;
//     },
//   }),
//   tagTypes: ["Checklist", "Document", "Notification", "Customer", "Comment", "Deferral"],

//   endpoints: (builder) => ({
//     /* ================= CO-CREATOR ================= */

//     getAllCoCreatorChecklists: builder.query({
//       query: () => "cocreatorChecklist",
//       providesTags: ["Checklist"],
//     }),

//     getAllChecklists: builder.query({
//       query: () => "cocreatorChecklist/dcls",
//       providesTags: ["Checklist"],
//     }),

//     // ⭐ NEW QUERY ENDPOINT: Fetch comments for a specific checklist
//     getChecklistComments: builder.query({
//       query: (checklistId) => `/cocreatorChecklist/${checklistId}/comments`,
//       providesTags: (result, error, checklistId) => [
//         { type: "Comment", id: checklistId },
//       ],
//     }),

//     getCoCreatorChecklistById: builder.query({
//       query: (id) => `cocreatorChecklist/${id}`,
//       providesTags: ["Checklist"],
//     }),

//     getAllDcls: builder.query({
//       query: () => "/cocreatorChecklist/all",
//     }),

//     getCoCreatorChecklistByDclNo: builder.query({
//       query: (dclNo) => `cocreatorChecklist/dcl/${dclNo}`,
//       providesTags: ["Checklist"],
//     }),

//     getSpecificChecklistsByCreator: builder.query({
//       query: (creatorId) => `cocreatorChecklist/creator/${creatorId}`,
//       providesTags: ["Checklist"],
//     }),

//     getCoCreatorActiveChecklists: builder.query({
//       query: () => "cocreatorChecklist/cocreator/active",
//       providesTags: ["Checklist"],
//     }),

//     createCoCreatorChecklist: builder.mutation({
//       query: (data) => ({
//         url: "cocreatorChecklist",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     // update status

//     updateChecklistStatus: builder.mutation({
//       query: (payload) => ({
//         url: "/cocreatorChecklist/update-status",
//         method: "PATCH",
//         body: payload,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     updateCheckerStatus: builder.mutation({
//       query: (payload) => {
//         console.log(
//           "RTK Query: Sending payload to updateCheckerStatus:",
//           payload
//         );

//         return {
//           url: "checkerChecklist/update-status",
//           method: "PATCH",
//           body: payload, // The payload should contain { id: '...', action: '...' }
//         };
//       },
//       invalidatesTags: ["Checklist"],
//     }),

//     updateCoCreatorChecklist: builder.mutation({
//       query: ({ id, data }) => ({
//         url: `cocreatorChecklist/${id}`,
//         method: "PUT",
//         body: data,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     getChecklistsByCreator: builder.query({
//       query: (creatorId) => `/cocreatorChecklist/creator/${creatorId}`,
//       providesTags: ["Checklist"],
//     }),

//     // revived checklists
//     getRevivedChecklists: builder.query({
//       query: ({ page = 1, limit = 10, search = '', sortBy = 'revivedAt', sortOrder = 'desc' }) => ({
//         url: '/checklists/revived',
//         params: {
//           page,
//           limit,
//           search,
//           sortBy,
//           sortOrder,
//         },
//       }),
//       providesTags: ['Checklist'],
//       transformResponse: (response) => ({
//         checklists: response.data,
//         pagination: response.pagination,
//       }),
//     }),

//     // Get single revived checklist details
//     getRevivedChecklistDetails: builder.query({
//       query: (id) => `/checklists/revived/${id}`,
//       providesTags: ['Checklist'],
//     }),

//     // Get revived checklists for a specific creator
//     getRevivedChecklistsByCreator: builder.query({
//       query: (creatorId) => `/cocreatorChecklist/revived/${creatorId}`,
//       providesTags: ["Checklist"],
//     }),

//     // Get revival history for a checklist
//     getRevivalHistory: builder.query({
//       query: (dclNo) => `/checklists/revival-history/${dclNo}`,
//       providesTags: ['Checklist'],
//     }),

//     submitChecklistToRM: builder.mutation({
//       query: ({ id, body }) => ({
//         url: `cocreatorChecklist/${id}/submit-to-rm`,
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     submitChecklistToCoChecker: builder.mutation({
//       query: ({ id }) => ({
//         url: `cocreatorChecklist/${id}/submit-to-cochecker`,
//         method: "POST",
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     saveChecklistDraft: builder.mutation({
//       query: (payload) => ({
//         url: "cocreatorChecklist/save-draft",
//         method: "POST",
//         body: payload,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     reviveChecklist: builder.mutation({
//       query: (id) => ({
//         url: `cocreatorChecklist/${id}/revive`,
//         method: "POST",
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     reviveChecklistWithCreator: builder.mutation({
//       query: ({ checklistId, creatorId }) => ({
//         url: `cocreatorChecklist/${checklistId}/revive`,
//         method: "POST",
//         body: { creatorId },
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     addDocument: builder.mutation({
//       query: ({ id, data }) => ({
//         url: `cocreatorChecklist/${id}/documents`,
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: ["Document"],
//     }),

//     updateDocument: builder.mutation({
//       query: ({ id, docId, data }) => ({
//         url: `cocreatorChecklist/${id}/documents/${docId}`,
//         method: "PATCH",
//         body: data,
//       }),
//       invalidatesTags: ["Document"],
//     }),

//     deleteDocument: builder.mutation({
//       query: ({ id, docId }) => ({
//         url: `cocreatorChecklist/${id}/documents/${docId}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Document"],
//     }),

//     searchCustomer: builder.query({
//       query: (q) => ({
//         url: "cocreatorChecklist/search/customer",
//         params: { q },
//       }),
//       providesTags: ["Customer"],
//     }),

//     getRejectedDeferrals: builder.query({
//       query: () => "/deferrals/rejected",
//     }),

//     /* ================= CHECKER ================= */

//     getCheckerActiveDCLs: builder.query({
//       query: () => "checkerChecklist/active-dcls",
//       providesTags: ["Checklist"],
//     }),

//     getCheckerMyQueue: builder.query({
//       query: (checkerId) => `checkerChecklist/my-queue/${checkerId}`,
//       providesTags: ["Checklist"],
//     }),

//     getCompletedDCLsForChecker: builder.query({
//       query: (checkerId) => `checkerChecklist/completed/${checkerId}`,
//       providesTags: ["Checklist"],
//     }),

//     getCheckerDclById: builder.query({
//       query: (id) => `checkerChecklist/dcl/${id}`,
//       providesTags: ["Checklist"],
//     }),

//     updateCheckerDclStatus: builder.mutation({
//       query: ({ id, data }) => ({
//         url: `checkerChecklist/dcl/${id}`,
//         method: "PUT",
//         body: data,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     approveCheckerDcl: builder.mutation({
//       query: (id) => ({
//         url: `checkerChecklist/approve/${id}`,
//         method: "PATCH",
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     rejectCheckerDcl: builder.mutation({
//       query: (id) => ({
//         url: `checkerChecklist/reject/${id}`,
//         method: "PATCH",
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     /* ================= RM ================= */

//     getRMQueue: builder.query({
//       query: (rmId) => `rmChecklist/${rmId}/myqueue`,
//       providesTags: ["Checklist"],
//     }),

//     getChecklistByIdRM: builder.query({
//       query: (id) => `rmChecklist/${id}`,
//       providesTags: ["Checklist"],
//     }),

//     getCompletedDclsForRm: builder.query({
//       query: (rmId) => `rmChecklist/completed/rm/${rmId}`,
//       providesTags: ["Checklist"],
//     }),

//     rmSubmitChecklistToCoCreator: builder.mutation({
//       query: (payload) => ({
//         url: "rmChecklist/rm-submit-to-co-creator",
//         method: "POST",
//         body: payload,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     deleteDocumentFileRM: builder.mutation({
//       query: ({ checklistId, documentId }) => ({
//         url: `rmChecklist/${checklistId}/document/${documentId}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Document"],
//     }),

//     getRmNotifications: builder.query({
//       query: (params) => ({
//         url: "rmChecklist/notifications/rm",
//         params,
//       }),
//       providesTags: ["Notification"],
//     }),

//     getDeferrals: builder.query({
//       query: (status) => ({
//         url: "/deferrals",
//         params: status ? { status } : {},
//       }),
//       providesTags: ["Deferral"],
//     }),

//     // save checklist

//     saveChecklistDraft: builder.mutation({
//       query: (draftData) => ({
//         url: "/cocreatorChecklist/save-draft",
//         method: "POST",
//         body: draftData,
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     reviveChecklist: builder.mutation({
//       query: (checklistId) => ({
//         url: `/cocreatorChecklist/${checklistId}/revive`,
//         method: "POST",
//       }),
//       invalidatesTags: ["Checklist"],
//     }),

//     markRmNotificationAsRead: builder.mutation({
//       query: ({ notificationId }) => ({
//         url: `rmChecklist/notifications/rm/${notificationId}`,
//         method: "PUT",
//       }),
//       invalidatesTags: ["Notification"],
//     }),
//   }),
// });

// export const {
//   // CO-CREATOR
//   useGetAllCoCreatorChecklistsQuery,
//   useGetCoCreatorChecklistByIdQuery,
//   useGetCoCreatorChecklistByDclNoQuery,
//   useGetSpecificChecklistsByCreatorQuery,
//   useGetCoCreatorActiveChecklistsQuery,
//   useCreateCoCreatorChecklistMutation,
//   useUpdateCoCreatorChecklistMutation,
//   useSubmitChecklistToRMMutation,
//   useSubmitChecklistToCoCheckerMutation,
//   useAddDocumentMutation,
//   useUpdateDocumentMutation,
//   useDeleteDocumentMutation,
//   useSearchCustomerQuery,
//   useGetChecklistCommentsQuery,
//   useGetAllDclsQuery, // ⭐ Exported hook
//   useGetRejectedDeferralsQuery,
//   useGetDeferralsQuery,
//   useGetChecklistsByCreatorQuery,
//   useSaveChecklistDraftMutation,
//   useReviveChecklistMutation,
//   useReviveChecklistWithCreatorMutation,

//   // Revived checklists
//   useGetRevivedChecklistsByCreatorQuery,
//   useGetRevivedChecklistsQuery,
//   useGetRevivedChecklistDetailsQuery,
//   useGetRevivalHistoryQuery,

//   useUpdateChecklistStatusMutation,

//   // CHECKER
//   useGetCheckerActiveDCLsQuery,
//   useGetCheckerMyQueueQuery,
//   useGetCompletedDCLsForCheckerQuery,
//   useGetCheckerDclByIdQuery,
//   useUpdateCheckerDclStatusMutation,
//   useApproveCheckerDclMutation,
//   useRejectCheckerDclMutation,
//   useUpdateCheckerStatusMutation,
//   useGetAllChecklistsQuery,

//   // RM
//   useGetRMQueueQuery,
//   useGetChecklistByIdRMQuery,
//   useGetCompletedDclsForRmQuery,
//   useRmSubmitChecklistToCoCreatorMutation,
//   useDeleteDocumentFileRMMutation,
//   useGetRmNotificationsQuery,
//   useMarkRmNotificationAsReadMutation,
// } = checklistApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const checklistApi = createApi({
  reducerPath: "checklistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Checklist",
    "Document",
    "Notification",
    "Customer",
    "Comment",
    "Deferral",
  ],

  endpoints: (builder) => ({
    /* ================= CO-CREATOR ================= */

    getAllCoCreatorChecklists: builder.query({
      query: () => "cocreatorChecklist",
      providesTags: ["Checklist"],
    }),

    getAllChecklists: builder.query({
      query: () => "cocreatorChecklist/dcls",
      providesTags: ["Checklist"],
    }),

    // ⭐ NEW QUERY ENDPOINT: Fetch comments for a specific checklist
    getChecklistComments: builder.query({
      query: (checklistId) => `/cocreatorChecklist/${checklistId}/comments`,
      providesTags: (result, error, checklistId) => [
        { type: "Comment", id: checklistId },
      ],
      // Refetch every 10 seconds to show new comments quickly
      pollingInterval: 10000,
      // Also refetch when component remounts or window regains focus
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }),

    getCoCreatorChecklistById: builder.query({
      query: (id) => `cocreatorChecklist/${id}`,
      providesTags: ["Checklist"],
    }),

    getAllDcls: builder.query({
      query: () => "/cocreatorChecklist/all",
    }),

    getCoCreatorChecklistByDclNo: builder.query({
      query: (dclNo) => `cocreatorChecklist/dcl/${dclNo}`,
      providesTags: ["Checklist"],
    }),

    getSpecificChecklistsByCreator: builder.query({
      query: (creatorId) => `cocreatorChecklist/creator/${creatorId}`,
      providesTags: ["Checklist"],
    }),

    getCoCreatorActiveChecklists: builder.query({
      query: () => "cocreatorChecklist/cocreator/active",
      providesTags: ["Checklist"],
    }),

    createCoCreatorChecklist: builder.mutation({
      query: (data) => ({
        url: "cocreatorChecklist",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Checklist"],
    }),

    // update status

    updateChecklistStatus: builder.mutation({
      query: (payload) => ({
        url: "/cocreatorChecklist/update-status",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Checklist", "Comment"],
    }),

    updateCheckerStatus: builder.mutation({
      query: (payload) => {
        console.log(
          "RTK Query: Sending payload to updateCheckerStatus:",
          payload,
        );

        return {
          url: "checkerChecklist/update-status",
          method: "PATCH",
          body: payload, // The payload should contain { id: '...', action: '...' }
        };
      },
      invalidatesTags: ["Checklist", "Comment"],
    }),

    updateCoCreatorChecklist: builder.mutation({
      query: ({ id, data }) => ({
        url: `cocreatorChecklist/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Checklist"],
    }),

    getChecklistsByCreator: builder.query({
      query: (creatorId) => `/cocreatorChecklist/creator/${creatorId}`,
      providesTags: ["Checklist"],
    }),

    // revived checklists
    getRevivedChecklists: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        sortBy = "revivedAt",
        sortOrder = "desc",
      }) => ({
        url: "/checklists/revived",
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      }),
      providesTags: ["Checklist"],
      transformResponse: (response) => ({
        checklists: response.data,
        pagination: response.pagination,
      }),
    }),

    // Get single revived checklist details
    getRevivedChecklistDetails: builder.query({
      query: (id) => `/checklists/revived/${id}`,
      providesTags: ["Checklist"],
    }),

    // Get revived checklists for a specific creator
    getRevivedChecklistsByCreator: builder.query({
      query: (creatorId) => `/cocreatorChecklist/revived/${creatorId}`,
      providesTags: ["Checklist"],
    }),

    // Get revival history for a checklist
    getRevivalHistory: builder.query({
      query: (dclNo) => `/checklists/revival-history/${dclNo}`,
      providesTags: ["Checklist"],
    }),

    submitChecklistToRM: builder.mutation({
      query: ({ id, body }) => ({
        url: `cocreatorChecklist/${id}/submit-to-rm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Checklist"],
    }),

    submitChecklistToCoChecker: builder.mutation({
      query: ({ id }) => ({
        url: `cocreatorChecklist/${id}/submit-to-cochecker`,
        method: "POST",
      }),
      invalidatesTags: ["Checklist"],
    }),

    saveChecklistDraft: builder.mutation({
      query: (payload) => ({
        url: "cocreatorChecklist/save-draft",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Checklist"],
    }),

    reviveChecklist: builder.mutation({
      query: (id) => ({
        url: `cocreatorChecklist/${id}/revive`,
        method: "POST",
      }),
      invalidatesTags: ["Checklist"],
    }),

    reviveChecklistWithCreator: builder.mutation({
      query: ({ checklistId, creatorId }) => ({
        url: `cocreatorChecklist/${checklistId}/revive`,
        method: "POST",
        body: { creatorId },
      }),
      invalidatesTags: ["Checklist"],
    }),

    addDocument: builder.mutation({
      query: ({ id, data }) => ({
        url: `cocreatorChecklist/${id}/documents`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Document"],
    }),

    updateDocument: builder.mutation({
      query: ({ id, docId, data }) => ({
        url: `cocreatorChecklist/${id}/documents/${docId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Document"],
    }),

    deleteDocument: builder.mutation({
      query: ({ id, docId }) => ({
        url: `cocreatorChecklist/${id}/documents/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    searchCustomer: builder.query({
      query: (q) => ({
        url: "cocreatorChecklist/search/customer",
        params: { q },
      }),
      providesTags: ["Customer"],
    }),

    getRejectedDeferrals: builder.query({
      query: () => "/deferrals/rejected",
    }),

    /* ================= CHECKER ================= */

    getCheckerActiveDCLs: builder.query({
      query: () => "checkerChecklist/active-dcls",
      providesTags: ["Checklist"],
    }),

    getCheckerMyQueue: builder.query({
      query: (checkerId) => `checkerChecklist/my-queue/${checkerId}`,
      providesTags: ["Checklist"],
    }),

    getCompletedDCLsForChecker: builder.query({
      query: (checkerId) => `checkerChecklist/completed/${checkerId}`,
      providesTags: ["Checklist"],
    }),

    getCheckerDclById: builder.query({
      query: (id) => `checkerChecklist/dcl/${id}`,
      providesTags: ["Checklist"],
    }),

    updateCheckerDclStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `checkerChecklist/dcl/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Checklist"],
    }),

    approveCheckerDcl: builder.mutation({
      query: (id) => ({
        url: `checkerChecklist/approve/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Checklist", "Comment"],
    }),

    rejectCheckerDcl: builder.mutation({
      query: (id) => ({
        url: `checkerChecklist/reject/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Checklist", "Comment"],
    }),

    /* ================= RM ================= */

    getRMQueue: builder.query({
      query: (rmId) => `rmChecklist/${rmId}/myqueue`,
      providesTags: ["Checklist"],
    }),

    getChecklistByIdRM: builder.query({
      query: (id) => `rmChecklist/${id}`,
      providesTags: ["Checklist"],
    }),

    getCompletedDclsForRm: builder.query({
      query: (rmId) => `rmChecklist/completed/rm/${rmId}`,
      providesTags: ["Checklist"],
    }),

    rmSubmitChecklistToCoCreator: builder.mutation({
      query: (payload) => ({
        url: "rmChecklist/rm-submit-to-co-creator",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Checklist", "Comment"],
    }),

    deleteDocumentFileRM: builder.mutation({
      query: ({ checklistId, documentId }) => ({
        url: `rmChecklist/${checklistId}/document/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    getRmNotifications: builder.query({
      query: (params) => ({
        url: "rmChecklist/notifications/rm",
        params,
      }),
      providesTags: ["Notification"],
    }),

    getDeferrals: builder.query({
      query: (status) => ({
        url: "/deferrals",
        params: status ? { status } : {},
      }),
      providesTags: ["Deferral"],
    }),

    // save checklist

    saveChecklistDraft: builder.mutation({
      query: (draftData) => ({
        url: "/cocreatorChecklist/save-draft",
        method: "POST",
        body: draftData,
      }),
      invalidatesTags: ["Checklist"],
    }),

    reviveChecklist: builder.mutation({
      query: (checklistId) => ({
        url: `/cocreatorChecklist/${checklistId}/revive`,
        method: "POST",
      }),
      invalidatesTags: ["Checklist"],
    }),

    markRmNotificationAsRead: builder.mutation({
      query: ({ notificationId }) => ({
        url: `rmChecklist/notifications/rm/${notificationId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  // CO-CREATOR
  useGetAllCoCreatorChecklistsQuery,
  useGetCoCreatorChecklistByIdQuery,
  useGetCoCreatorChecklistByDclNoQuery,
  useGetSpecificChecklistsByCreatorQuery,
  useGetCoCreatorActiveChecklistsQuery,
  useCreateCoCreatorChecklistMutation,
  useUpdateCoCreatorChecklistMutation,
  useSubmitChecklistToRMMutation,
  useSubmitChecklistToCoCheckerMutation,
  useAddDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useSearchCustomerQuery,
  useGetChecklistCommentsQuery,
  useGetAllDclsQuery, // ⭐ Exported hook
  useGetRejectedDeferralsQuery,
  useGetDeferralsQuery,
  useGetChecklistsByCreatorQuery,
  useSaveChecklistDraftMutation,
  useReviveChecklistMutation,
  useReviveChecklistWithCreatorMutation,

  // Revived checklists
  useGetRevivedChecklistsByCreatorQuery,
  useGetRevivedChecklistsQuery,
  useGetRevivedChecklistDetailsQuery,
  useGetRevivalHistoryQuery,

  useUpdateChecklistStatusMutation,

  // CHECKER
  useGetCheckerActiveDCLsQuery,
  useGetCheckerMyQueueQuery,
  useGetCompletedDCLsForCheckerQuery,
  useGetCheckerDclByIdQuery,
  useUpdateCheckerDclStatusMutation,
  useApproveCheckerDclMutation,
  useRejectCheckerDclMutation,
  useUpdateCheckerStatusMutation,
  useGetAllChecklistsQuery,

  // RM
  useGetRMQueueQuery,
  useGetChecklistByIdRMQuery,
  useGetCompletedDclsForRmQuery,
  useRmSubmitChecklistToCoCreatorMutation,
  useDeleteDocumentFileRMMutation,
  useGetRmNotificationsQuery,
  useMarkRmNotificationAsReadMutation,
} = checklistApi;
