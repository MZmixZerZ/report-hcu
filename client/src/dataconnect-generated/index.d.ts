import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateNewReportData {
  report_insert: Report_Key;
}

export interface CreateNewReportVariables {
  title: string;
  description: string;
  status: string;
  categoryId: UUIDString;
  dueDate?: DateString | null;
}

export interface GetReportsByAuthorData {
  reports: ({
    id: UUIDString;
    title: string;
    description: string;
    status: string;
    dueDate?: DateString | null;
    category?: {
      name: string;
    };
  } & Report_Key)[];
}

export interface GetReportsByAuthorVariables {
  authorId: UUIDString;
}

export interface ListAllCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & Category_Key)[];
}

export interface ReportFile_Key {
  id: UUIDString;
  __typename?: 'ReportFile_Key';
}

export interface ReportLog_Key {
  id: UUIDString;
  __typename?: 'ReportLog_Key';
}

export interface Report_Key {
  id: UUIDString;
  __typename?: 'Report_Key';
}

export interface UpdateReportStatusData {
  report_update?: Report_Key | null;
}

export interface UpdateReportStatusVariables {
  reportId: UUIDString;
  newStatus: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListAllCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCategoriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllCategoriesData, undefined>;
  operationName: string;
}
export const listAllCategoriesRef: ListAllCategoriesRef;

export function listAllCategories(): QueryPromise<ListAllCategoriesData, undefined>;
export function listAllCategories(dc: DataConnect): QueryPromise<ListAllCategoriesData, undefined>;

interface GetReportsByAuthorRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetReportsByAuthorVariables): QueryRef<GetReportsByAuthorData, GetReportsByAuthorVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetReportsByAuthorVariables): QueryRef<GetReportsByAuthorData, GetReportsByAuthorVariables>;
  operationName: string;
}
export const getReportsByAuthorRef: GetReportsByAuthorRef;

export function getReportsByAuthor(vars: GetReportsByAuthorVariables): QueryPromise<GetReportsByAuthorData, GetReportsByAuthorVariables>;
export function getReportsByAuthor(dc: DataConnect, vars: GetReportsByAuthorVariables): QueryPromise<GetReportsByAuthorData, GetReportsByAuthorVariables>;

interface CreateNewReportRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewReportVariables): MutationRef<CreateNewReportData, CreateNewReportVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewReportVariables): MutationRef<CreateNewReportData, CreateNewReportVariables>;
  operationName: string;
}
export const createNewReportRef: CreateNewReportRef;

export function createNewReport(vars: CreateNewReportVariables): MutationPromise<CreateNewReportData, CreateNewReportVariables>;
export function createNewReport(dc: DataConnect, vars: CreateNewReportVariables): MutationPromise<CreateNewReportData, CreateNewReportVariables>;

interface UpdateReportStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReportStatusVariables): MutationRef<UpdateReportStatusData, UpdateReportStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateReportStatusVariables): MutationRef<UpdateReportStatusData, UpdateReportStatusVariables>;
  operationName: string;
}
export const updateReportStatusRef: UpdateReportStatusRef;

export function updateReportStatus(vars: UpdateReportStatusVariables): MutationPromise<UpdateReportStatusData, UpdateReportStatusVariables>;
export function updateReportStatus(dc: DataConnect, vars: UpdateReportStatusVariables): MutationPromise<UpdateReportStatusData, UpdateReportStatusVariables>;

