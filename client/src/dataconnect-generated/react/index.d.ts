import { ListAllCategoriesData, GetReportsByAuthorData, GetReportsByAuthorVariables, CreateNewReportData, CreateNewReportVariables, UpdateReportStatusData, UpdateReportStatusVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllCategories(options?: useDataConnectQueryOptions<ListAllCategoriesData>): UseDataConnectQueryResult<ListAllCategoriesData, undefined>;
export function useListAllCategories(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllCategoriesData>): UseDataConnectQueryResult<ListAllCategoriesData, undefined>;

export function useGetReportsByAuthor(vars: GetReportsByAuthorVariables, options?: useDataConnectQueryOptions<GetReportsByAuthorData>): UseDataConnectQueryResult<GetReportsByAuthorData, GetReportsByAuthorVariables>;
export function useGetReportsByAuthor(dc: DataConnect, vars: GetReportsByAuthorVariables, options?: useDataConnectQueryOptions<GetReportsByAuthorData>): UseDataConnectQueryResult<GetReportsByAuthorData, GetReportsByAuthorVariables>;

export function useCreateNewReport(options?: useDataConnectMutationOptions<CreateNewReportData, FirebaseError, CreateNewReportVariables>): UseDataConnectMutationResult<CreateNewReportData, CreateNewReportVariables>;
export function useCreateNewReport(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewReportData, FirebaseError, CreateNewReportVariables>): UseDataConnectMutationResult<CreateNewReportData, CreateNewReportVariables>;

export function useUpdateReportStatus(options?: useDataConnectMutationOptions<UpdateReportStatusData, FirebaseError, UpdateReportStatusVariables>): UseDataConnectMutationResult<UpdateReportStatusData, UpdateReportStatusVariables>;
export function useUpdateReportStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateReportStatusData, FirebaseError, UpdateReportStatusVariables>): UseDataConnectMutationResult<UpdateReportStatusData, UpdateReportStatusVariables>;
